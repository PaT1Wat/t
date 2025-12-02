"""Review routes for managing book reviews."""

from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app.models import Review, Book
from app import db
from app.utils import authenticate, require_moderator, get_current_user, get_pagination, validate_uuid

bp = Blueprint('reviews', __name__)


@bp.route('/book/<book_id>', methods=['GET'])
def get_book_reviews(book_id):
    """Get reviews for a book."""
    if not validate_uuid(book_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    pagination = get_pagination()
    sort_by = request.args.get('sort_by', 'newest')
    
    query = Review.query.filter_by(book_id=book_id, is_approved=True)
    
    if sort_by == 'rating_high':
        query = query.order_by(Review.rating.desc(), Review.created_at.desc())
    elif sort_by == 'rating_low':
        query = query.order_by(Review.rating.asc(), Review.created_at.desc())
    elif sort_by == 'helpful':
        query = query.order_by(Review.helpful_count.desc(), Review.created_at.desc())
    else:  # newest
        query = query.order_by(Review.created_at.desc())
    
    total = query.count()
    reviews = query.offset(pagination['offset']).limit(pagination['limit']).all()
    
    # Get rating distribution
    distribution = db.session.query(
        Review.rating, func.count(Review.id)
    ).filter_by(book_id=book_id, is_approved=True).group_by(Review.rating).all()
    
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating, count in distribution:
        rating_distribution[rating] = count
    
    return jsonify({
        'reviews': [r.to_dict() for r in reviews],
        'rating_distribution': rating_distribution,
        'pagination': {
            'total': total,
            'page': pagination['page'],
            'limit': pagination['limit'],
            'total_pages': (total + pagination['limit'] - 1) // pagination['limit']
        }
    })


@bp.route('/book/<book_id>', methods=['POST'])
@authenticate
def create_review(book_id):
    """Create a review for a book."""
    if not validate_uuid(book_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    user = get_current_user()
    data = request.get_json() or {}
    
    rating = data.get('rating')
    if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({'errors': ['คะแนนต้องอยู่ระหว่าง 1-5']}), 400
    
    # Check if book exists
    book = Book.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found', 'message': 'ไม่พบหนังสือ'}), 404
    
    # Check if already reviewed
    existing = Review.query.filter_by(user_id=user.id, book_id=book_id).first()
    if existing:
        return jsonify({'error': 'Already reviewed', 'message': 'คุณได้รีวิวหนังสือนี้แล้ว'}), 400
    
    review = Review(
        user_id=user.id,
        book_id=book_id,
        rating=rating,
        content=data.get('content'),
        is_spoiler=data.get('is_spoiler', False)
    )
    
    db.session.add(review)
    
    # Update book's average rating
    _update_book_rating(book)
    
    db.session.commit()
    
    return jsonify({'review': review.to_dict(), 'message': 'เพิ่มรีวิวสำเร็จ'}), 201


@bp.route('/<review_id>', methods=['PUT'])
@authenticate
def update_review(review_id):
    """Update a review."""
    if not validate_uuid(review_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    user = get_current_user()
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({'error': 'Review not found', 'message': 'ไม่พบรีวิว'}), 404
    
    if review.user_id != user.id and user.role != 'admin':
        return jsonify({'error': 'Forbidden', 'message': 'คุณไม่มีสิทธิ์แก้ไขรีวิวนี้'}), 403
    
    data = request.get_json() or {}
    
    if 'rating' in data:
        rating = data['rating']
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'errors': ['คะแนนต้องอยู่ระหว่าง 1-5']}), 400
        review.rating = rating
    
    if 'content' in data:
        review.content = data['content']
    
    if 'is_spoiler' in data:
        review.is_spoiler = data['is_spoiler']
    
    # Update book's average rating
    book = Book.query.get(review.book_id)
    if book:
        _update_book_rating(book)
    
    db.session.commit()
    
    return jsonify({'review': review.to_dict(), 'message': 'อัพเดทรีวิวสำเร็จ'})


@bp.route('/<review_id>', methods=['DELETE'])
@authenticate
def delete_review(review_id):
    """Delete a review."""
    if not validate_uuid(review_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    user = get_current_user()
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({'error': 'Review not found', 'message': 'ไม่พบรีวิว'}), 404
    
    if review.user_id != user.id and user.role != 'admin':
        return jsonify({'error': 'Forbidden', 'message': 'คุณไม่มีสิทธิ์ลบรีวิวนี้'}), 403
    
    book_id = review.book_id
    db.session.delete(review)
    
    # Update book's average rating
    book = Book.query.get(book_id)
    if book:
        _update_book_rating(book)
    
    db.session.commit()
    
    return jsonify({'message': 'ลบรีวิวสำเร็จ'})


@bp.route('/my-reviews', methods=['GET'])
@authenticate
def get_user_reviews():
    """Get current user's reviews."""
    user = get_current_user()
    pagination = get_pagination()
    
    total = Review.query.filter_by(user_id=user.id).count()
    reviews = Review.query.filter_by(user_id=user.id)\
        .order_by(Review.created_at.desc())\
        .offset(pagination['offset'])\
        .limit(pagination['limit'])\
        .all()
    
    # Add book info to reviews
    reviews_with_books = []
    for review in reviews:
        review_dict = review.to_dict()
        if review.book:
            review_dict['book_title'] = review.book.title
            review_dict['book_title_thai'] = review.book.title_thai
            review_dict['book_cover'] = review.book.cover_image_url
        reviews_with_books.append(review_dict)
    
    return jsonify({
        'reviews': reviews_with_books,
        'pagination': {
            'total': total,
            'page': pagination['page'],
            'limit': pagination['limit'],
            'total_pages': (total + pagination['limit'] - 1) // pagination['limit']
        }
    })


@bp.route('/<review_id>/helpful', methods=['POST'])
@authenticate
def mark_helpful(review_id):
    """Mark a review as helpful."""
    if not validate_uuid(review_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    review = Review.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found', 'message': 'ไม่พบรีวิว'}), 404
    
    review.helpful_count += 1
    db.session.commit()
    
    return jsonify({'review': review.to_dict(), 'message': 'ขอบคุณสำหรับความคิดเห็น'})


@bp.route('/pending', methods=['GET'])
@authenticate
@require_moderator
def get_pending_reviews():
    """Moderator: Get pending reviews for moderation."""
    pagination = get_pagination()
    
    total = Review.query.filter_by(is_approved=False).count()
    reviews = Review.query.filter_by(is_approved=False)\
        .order_by(Review.created_at.asc())\
        .offset(pagination['offset'])\
        .limit(pagination['limit'])\
        .all()
    
    # Add book and user info
    reviews_with_info = []
    for review in reviews:
        review_dict = review.to_dict()
        if review.book:
            review_dict['book_title'] = review.book.title
            review_dict['book_title_thai'] = review.book.title_thai
        reviews_with_info.append(review_dict)
    
    return jsonify({
        'reviews': reviews_with_info,
        'pagination': {
            'total': total,
            'page': pagination['page'],
            'limit': pagination['limit'],
            'total_pages': (total + pagination['limit'] - 1) // pagination['limit']
        }
    })


@bp.route('/<review_id>/moderate', methods=['PUT'])
@authenticate
@require_moderator
def moderate_review(review_id):
    """Moderator: Approve or reject a review."""
    if not validate_uuid(review_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    data = request.get_json() or {}
    is_approved = data.get('is_approved', False)
    
    review = Review.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found', 'message': 'ไม่พบรีวิว'}), 404
    
    review.is_approved = is_approved
    
    # Update book's stats
    book = Book.query.get(review.book_id)
    if book:
        _update_book_rating(book)
    
    db.session.commit()
    
    message = 'อนุมัติรีวิวสำเร็จ' if is_approved else 'ปฏิเสธรีวิวสำเร็จ'
    return jsonify({'review': review.to_dict(), 'message': message})


def _update_book_rating(book):
    """Helper to update a book's average rating and total reviews."""
    reviews = Review.query.filter_by(book_id=book.id, is_approved=True).all()
    book.total_reviews = len(reviews)
    if reviews:
        book.average_rating = sum(r.rating for r in reviews) / len(reviews)
    else:
        book.average_rating = 0
