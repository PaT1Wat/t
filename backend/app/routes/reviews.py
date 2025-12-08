"""
Review routes for book reviews and ratings.
"""

from flask import Blueprint, request, jsonify, g
from app.services.sheets import sheets_service
from app.utils.auth import auth_required, admin_required
from app.utils.validation import validate_required_fields, validate_rating, validate_pagination

bp = Blueprint('reviews', __name__)


def update_book_rating(book_id):
    """Recalculate and update book's average rating."""
    reviews = sheets_service.find_by_field('reviews', 'book_id', book_id)
    approved_reviews = [r for r in reviews if r.get('is_approved', True)]
    
    if approved_reviews:
        total_rating = sum(r.get('rating', 0) for r in approved_reviews)
        avg_rating = total_rating / len(approved_reviews)
        sheets_service.update('books', book_id, {
            'average_rating': round(avg_rating, 2),
            'total_reviews': len(approved_reviews)
        })
    else:
        sheets_service.update('books', book_id, {
            'average_rating': 0,
            'total_reviews': 0
        })


@bp.route('/book/<book_id>', methods=['GET'])
@validate_pagination
def get_book_reviews(book_id):
    """Get reviews for a book."""
    page = request.pagination['page']
    limit = request.pagination['limit']
    
    reviews = sheets_service.find_by_field('reviews', 'book_id', book_id)
    approved_reviews = [r for r in reviews if r.get('is_approved', True)]
    
    # Enrich with user info
    users = {u['id']: u for u in sheets_service.get_all('users')}
    for review in approved_reviews:
        user = users.get(review.get('user_id'), {})
        review['username'] = user.get('username')
        review['display_name'] = user.get('display_name')
        review['avatar_url'] = user.get('avatar_url')
    
    # Sort by created_at descending
    approved_reviews.sort(key=lambda r: r.get('created_at', ''), reverse=True)
    
    # Pagination
    total = len(approved_reviews)
    start = (page - 1) * limit
    end = start + limit
    paginated = approved_reviews[start:end]
    
    # Rating distribution
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for review in approved_reviews:
        rating = review.get('rating', 0)
        if 1 <= rating <= 5:
            distribution[rating] = distribution.get(rating, 0) + 1
    
    return jsonify({
        'results': paginated,
        'total': total,
        'page': page,
        'limit': limit,
        'total_pages': (total + limit - 1) // limit if limit > 0 else 0,
        'rating_distribution': distribution
    })


@bp.route('', methods=['POST'])
@auth_required
@validate_required_fields(['book_id', 'rating'])
@validate_rating
def create_review():
    """Create or update a review."""
    data = request.get_json()
    user_id = g.current_user['id']
    book_id = data['book_id']
    
    # Check if book exists
    book = sheets_service.get_by_id('books', book_id)
    if not book:
        return jsonify({
            'error': 'ไม่พบหนังสือ',
            'error_en': 'Book not found'
        }), 404
    
    # Check for existing review
    existing_reviews = sheets_service.find_by_field('reviews', 'user_id', user_id)
    existing = next((r for r in existing_reviews if r.get('book_id') == book_id), None)
    
    if existing:
        # Update existing review
        update_data = {
            'rating': data['rating'],
            'content': data.get('content'),
            'is_spoiler': data.get('is_spoiler', False)
        }
        review = sheets_service.update('reviews', existing['id'], update_data)
    else:
        # Create new review
        review_data = {
            'user_id': user_id,
            'book_id': book_id,
            'rating': data['rating'],
            'content': data.get('content'),
            'is_spoiler': data.get('is_spoiler', False),
            'is_approved': True,
            'helpful_count': 0
        }
        review = sheets_service.create('reviews', review_data)
    
    if review:
        update_book_rating(book_id)
        return jsonify(review), 201 if not existing else 200
    
    return jsonify({
        'error': 'ไม่สามารถบันทึกรีวิวได้',
        'error_en': 'Could not save review'
    }), 500


@bp.route('/<review_id>', methods=['PUT'])
@auth_required
@validate_rating
def update_review(review_id):
    """Update own review."""
    data = request.get_json()
    user_id = g.current_user['id']
    
    review = sheets_service.get_by_id('reviews', review_id)
    if not review:
        return jsonify({
            'error': 'ไม่พบรีวิว',
            'error_en': 'Review not found'
        }), 404
    
    if review.get('user_id') != user_id:
        return jsonify({
            'error': 'ไม่มีสิทธิ์แก้ไขรีวิวนี้',
            'error_en': 'Not authorized to edit this review'
        }), 403
    
    allowed_fields = ['rating', 'content', 'is_spoiler']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    updated = sheets_service.update('reviews', review_id, update_data)
    
    if updated:
        update_book_rating(review['book_id'])
        return jsonify(updated)
    
    return jsonify({
        'error': 'ไม่สามารถอัพเดทรีวิวได้',
        'error_en': 'Could not update review'
    }), 500


@bp.route('/<review_id>', methods=['DELETE'])
@auth_required
def delete_review(review_id):
    """Delete own review."""
    user_id = g.current_user['id']
    
    review = sheets_service.get_by_id('reviews', review_id)
    if not review:
        return jsonify({
            'error': 'ไม่พบรีวิว',
            'error_en': 'Review not found'
        }), 404
    
    # Allow user to delete own review or admin to delete any
    if review.get('user_id') != user_id and g.current_user.get('role') not in ['admin', 'moderator']:
        return jsonify({
            'error': 'ไม่มีสิทธิ์ลบรีวิวนี้',
            'error_en': 'Not authorized to delete this review'
        }), 403
    
    book_id = review['book_id']
    
    if sheets_service.delete('reviews', review_id):
        update_book_rating(book_id)
        return jsonify({'message': 'ลบรีวิวเรียบร้อยแล้ว', 'message_en': 'Review deleted successfully'})
    
    return jsonify({
        'error': 'ไม่สามารถลบรีวิวได้',
        'error_en': 'Could not delete review'
    }), 500


@bp.route('/<review_id>/helpful', methods=['POST'])
@auth_required
def mark_helpful(review_id):
    """Mark a review as helpful."""
    review = sheets_service.get_by_id('reviews', review_id)
    if not review:
        return jsonify({
            'error': 'ไม่พบรีวิว',
            'error_en': 'Review not found'
        }), 404
    
    updated = sheets_service.update('reviews', review_id, {
        'helpful_count': (review.get('helpful_count', 0) or 0) + 1
    })
    
    if updated:
        return jsonify(updated)
    
    return jsonify({
        'error': 'ไม่สามารถอัพเดทได้',
        'error_en': 'Could not update'
    }), 500


@bp.route('/pending', methods=['GET'])
@admin_required
@validate_pagination
def get_pending_reviews():
    """Get pending reviews for moderation (admin only)."""
    page = request.pagination['page']
    limit = request.pagination['limit']
    
    reviews = sheets_service.get_all('reviews')
    pending = [r for r in reviews if not r.get('is_approved', True)]
    
    # Pagination
    total = len(pending)
    start = (page - 1) * limit
    end = start + limit
    paginated = pending[start:end]
    
    return jsonify({
        'results': paginated,
        'total': total,
        'page': page,
        'limit': limit,
        'total_pages': (total + limit - 1) // limit if limit > 0 else 0
    })


@bp.route('/<review_id>/approve', methods=['POST'])
@admin_required
def approve_review(review_id):
    """Approve a review (admin only)."""
    review = sheets_service.get_by_id('reviews', review_id)
    if not review:
        return jsonify({
            'error': 'ไม่พบรีวิว',
            'error_en': 'Review not found'
        }), 404
    
    updated = sheets_service.update('reviews', review_id, {'is_approved': True})
    
    if updated:
        update_book_rating(review['book_id'])
        return jsonify(updated)
    
    return jsonify({
        'error': 'ไม่สามารถอนุมัติรีวิวได้',
        'error_en': 'Could not approve review'
    }), 500


@bp.route('/<review_id>/reject', methods=['POST'])
@admin_required
def reject_review(review_id):
    """Reject a review (admin only)."""
    review = sheets_service.get_by_id('reviews', review_id)
    if not review:
        return jsonify({
            'error': 'ไม่พบรีวิว',
            'error_en': 'Review not found'
        }), 404
    
    updated = sheets_service.update('reviews', review_id, {'is_approved': False})
    
    if updated:
        update_book_rating(review['book_id'])
        return jsonify(updated)
    
    return jsonify({
        'error': 'ไม่สามารถปฏิเสธรีวิวได้',
        'error_en': 'Could not reject review'
    }), 500
