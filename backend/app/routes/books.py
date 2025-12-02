"""Book routes for CRUD operations."""

from flask import Blueprint, request, jsonify
from app.models import Book, ReadingHistory
from app import db
from app.utils import authenticate, optional_auth, require_admin, get_current_user, get_pagination, validate_uuid
from app.services import recommendation_service

bp = Blueprint('books', __name__)


@bp.route('/', methods=['GET'])
def get_all_books():
    """Get all books with pagination."""
    pagination = get_pagination()
    
    total = Book.query.count()
    books = Book.query.order_by(Book.created_at.desc())\
        .offset(pagination['offset'])\
        .limit(pagination['limit'])\
        .all()
    
    return jsonify({
        'books': [b.to_dict() for b in books],
        'pagination': {
            'total': total,
            'page': pagination['page'],
            'limit': pagination['limit'],
            'total_pages': (total + pagination['limit'] - 1) // pagination['limit']
        }
    })


@bp.route('/<book_id>', methods=['GET'])
@optional_auth
def get_book(book_id):
    """Get a single book by ID."""
    if not validate_uuid(book_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    book = Book.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found', 'message': 'ไม่พบหนังสือ'}), 404
    
    # Track viewing for logged-in users
    user = get_current_user()
    if user:
        history = ReadingHistory.query.filter_by(user_id=user.id, book_id=book_id).first()
        if history:
            history.view_count += 1
        else:
            history = ReadingHistory(user_id=user.id, book_id=book_id)
            db.session.add(history)
        db.session.commit()
    
    # Get similar books
    similar_books = recommendation_service.get_content_based_recommendations(book_id, 6)
    
    return jsonify({
        'book': book.to_dict(),
        'similar_books': similar_books
    })


@bp.route('/type/<book_type>', methods=['GET'])
def get_books_by_type(book_type):
    """Get books by type."""
    valid_types = ['manga', 'novel', 'light_novel', 'webtoon']
    if book_type not in valid_types:
        return jsonify({'error': 'Invalid type', 'message': 'ประเภทหนังสือไม่ถูกต้อง'}), 400
    
    pagination = get_pagination()
    
    total = Book.query.filter_by(type=book_type).count()
    books = Book.query.filter_by(type=book_type)\
        .order_by(Book.created_at.desc())\
        .offset(pagination['offset'])\
        .limit(pagination['limit'])\
        .all()
    
    return jsonify({
        'books': [b.to_dict() for b in books],
        'pagination': {
            'total': total,
            'page': pagination['page'],
            'limit': pagination['limit'],
            'total_pages': (total + pagination['limit'] - 1) // pagination['limit']
        }
    })


@bp.route('/top-rated', methods=['GET'])
def get_top_rated():
    """Get top rated books."""
    limit = min(50, int(request.args.get('limit', 10)))
    
    books = Book.query.filter(Book.total_reviews >= 5)\
        .order_by(Book.average_rating.desc(), Book.total_reviews.desc())\
        .limit(limit)\
        .all()
    
    return jsonify({'books': [b.to_dict() for b in books]})


@bp.route('/recent', methods=['GET'])
def get_recent():
    """Get recently added books."""
    limit = min(50, int(request.args.get('limit', 10)))
    
    books = Book.query.order_by(Book.created_at.desc()).limit(limit).all()
    
    return jsonify({'books': [b.to_dict() for b in books]})


@bp.route('/', methods=['POST'])
@authenticate
@require_admin
def create_book():
    """Admin: Create a new book."""
    data = request.get_json() or {}
    
    title = data.get('title')
    if not title:
        return jsonify({'errors': ['ต้องระบุชื่อหนังสือ']}), 400
    
    book = Book(
        title=title,
        title_thai=data.get('title_thai'),
        description=data.get('description'),
        description_thai=data.get('description_thai'),
        cover_image_url=data.get('cover_image_url'),
        type=data.get('type'),
        status=data.get('status', 'ongoing'),
        publication_year=data.get('publication_year'),
        total_chapters=data.get('total_chapters'),
        total_volumes=data.get('total_volumes'),
        author_id=data.get('author_id'),
        publisher_id=data.get('publisher_id'),
        tags=data.get('tags', []),
        genres=data.get('genres', []),
        is_nsfw=data.get('is_nsfw', False)
    )
    
    db.session.add(book)
    db.session.commit()
    
    return jsonify({'book': book.to_dict(), 'message': 'เพิ่มหนังสือสำเร็จ'}), 201


@bp.route('/<book_id>', methods=['PUT'])
@authenticate
@require_admin
def update_book(book_id):
    """Admin: Update a book."""
    if not validate_uuid(book_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    book = Book.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found', 'message': 'ไม่พบหนังสือ'}), 404
    
    data = request.get_json() or {}
    
    field_mappings = {
        'title': 'title',
        'title_thai': 'title_thai',
        'description': 'description',
        'description_thai': 'description_thai',
        'cover_image_url': 'cover_image_url',
        'type': 'type',
        'status': 'status',
        'publication_year': 'publication_year',
        'total_chapters': 'total_chapters',
        'total_volumes': 'total_volumes',
        'author_id': 'author_id',
        'publisher_id': 'publisher_id',
        'tags': 'tags',
        'genres': 'genres',
        'is_nsfw': 'is_nsfw'
    }
    
    for key, attr in field_mappings.items():
        if key in data:
            setattr(book, attr, data[key])
    
    db.session.commit()
    
    return jsonify({'book': book.to_dict(), 'message': 'อัพเดทหนังสือสำเร็จ'})


@bp.route('/<book_id>', methods=['DELETE'])
@authenticate
@require_admin
def delete_book(book_id):
    """Admin: Delete a book."""
    if not validate_uuid(book_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    book = Book.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found', 'message': 'ไม่พบหนังสือ'}), 404
    
    db.session.delete(book)
    db.session.commit()
    
    return jsonify({'message': 'ลบหนังสือสำเร็จ'})
