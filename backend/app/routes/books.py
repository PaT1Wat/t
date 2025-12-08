"""
Book routes for CRUD operations.
"""

from flask import Blueprint, request, jsonify, g
from app.services.sheets import sheets_service
from app.services.recommendation import recommendation_service
from app.utils.auth import auth_required, auth_optional, admin_required
from app.utils.validation import validate_required_fields, validate_pagination

bp = Blueprint('books', __name__)


@bp.route('', methods=['GET'])
@validate_pagination
def get_books():
    """Get all books with pagination."""
    page = request.pagination['page']
    limit = request.pagination['limit']
    
    books = sheets_service.get_all('books')
    authors = {a['id']: a for a in sheets_service.get_all('authors')}
    publishers = {p['id']: p for p in sheets_service.get_all('publishers')}
    
    # Enrich with author/publisher info
    for book in books:
        author = authors.get(book.get('author_id'), {})
        publisher = publishers.get(book.get('publisher_id'), {})
        book['author_name'] = author.get('name')
        book['author_name_thai'] = author.get('name_thai')
        book['publisher_name'] = publisher.get('name')
        book['publisher_name_thai'] = publisher.get('name_thai')
    
    # Pagination
    total = len(books)
    start = (page - 1) * limit
    end = start + limit
    paginated = books[start:end]
    
    return jsonify({
        'results': paginated,
        'total': total,
        'page': page,
        'limit': limit,
        'total_pages': (total + limit - 1) // limit if limit > 0 else 0
    })


@bp.route('/<book_id>', methods=['GET'])
@auth_optional
def get_book(book_id):
    """Get book by ID."""
    book = sheets_service.get_by_id('books', book_id)
    
    if not book:
        return jsonify({
            'error': 'ไม่พบหนังสือ',
            'error_en': 'Book not found'
        }), 404
    
    # Enrich with author/publisher
    if book.get('author_id'):
        author = sheets_service.get_by_id('authors', book['author_id'])
        if author:
            book['author'] = author
            book['author_name'] = author.get('name')
            book['author_name_thai'] = author.get('name_thai')
    
    if book.get('publisher_id'):
        publisher = sheets_service.get_by_id('publishers', book['publisher_id'])
        if publisher:
            book['publisher'] = publisher
            book['publisher_name'] = publisher.get('name')
            book['publisher_name_thai'] = publisher.get('name_thai')
    
    # Get reviews
    reviews = sheets_service.find_by_field('reviews', 'book_id', book_id)
    approved_reviews = [r for r in reviews if r.get('is_approved', True)]
    book['reviews'] = approved_reviews[:10]  # Last 10 reviews
    
    # Record reading history if user is logged in
    if g.current_user:
        user_id = g.current_user['id']
        history = sheets_service.find_by_field('reading_history', 'user_id', user_id)
        existing = next((h for h in history if h.get('book_id') == book_id), None)
        
        if existing:
            sheets_service.update('reading_history', existing['id'], {
                'view_count': (existing.get('view_count', 0) or 0) + 1
            })
        else:
            sheets_service.create('reading_history', {
                'user_id': user_id,
                'book_id': book_id,
                'view_count': 1
            })
    
    return jsonify(book)


@bp.route('', methods=['POST'])
@admin_required
@validate_required_fields(['title'])
def create_book():
    """Create a new book (admin only)."""
    data = request.get_json()
    
    book_data = {
        'title': data['title'],
        'title_thai': data.get('title_thai'),
        'description': data.get('description'),
        'description_thai': data.get('description_thai'),
        'cover_image_url': data.get('cover_image_url'),
        'type': data.get('type', 'manga'),
        'status': data.get('status', 'ongoing'),
        'publication_year': data.get('publication_year'),
        'total_chapters': data.get('total_chapters'),
        'total_volumes': data.get('total_volumes'),
        'author_id': data.get('author_id'),
        'publisher_id': data.get('publisher_id'),
        'average_rating': 0,
        'total_reviews': 0,
        'tags': data.get('tags', []),
        'genres': data.get('genres', []),
        'is_nsfw': data.get('is_nsfw', False)
    }
    
    book = sheets_service.create('books', book_data)
    
    if book:
        return jsonify(book), 201
    
    return jsonify({
        'error': 'ไม่สามารถสร้างหนังสือได้',
        'error_en': 'Could not create book'
    }), 500


@bp.route('/<book_id>', methods=['PUT'])
@admin_required
def update_book(book_id):
    """Update a book (admin only)."""
    data = request.get_json()
    
    existing = sheets_service.get_by_id('books', book_id)
    if not existing:
        return jsonify({
            'error': 'ไม่พบหนังสือ',
            'error_en': 'Book not found'
        }), 404
    
    allowed_fields = [
        'title', 'title_thai', 'description', 'description_thai',
        'cover_image_url', 'type', 'status', 'publication_year',
        'total_chapters', 'total_volumes', 'author_id', 'publisher_id',
        'tags', 'genres', 'is_nsfw'
    ]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    updated = sheets_service.update('books', book_id, update_data)
    
    if updated:
        return jsonify(updated)
    
    return jsonify({
        'error': 'ไม่สามารถอัพเดทหนังสือได้',
        'error_en': 'Could not update book'
    }), 500


@bp.route('/<book_id>', methods=['DELETE'])
@admin_required
def delete_book(book_id):
    """Delete a book (admin only)."""
    existing = sheets_service.get_by_id('books', book_id)
    if not existing:
        return jsonify({
            'error': 'ไม่พบหนังสือ',
            'error_en': 'Book not found'
        }), 404
    
    if sheets_service.delete('books', book_id):
        return jsonify({'message': 'ลบหนังสือเรียบร้อยแล้ว', 'message_en': 'Book deleted successfully'})
    
    return jsonify({
        'error': 'ไม่สามารถลบหนังสือได้',
        'error_en': 'Could not delete book'
    }), 500


@bp.route('/<book_id>/similar', methods=['GET'])
def get_similar_books(book_id):
    """Get similar books using content-based recommendations."""
    limit = request.args.get('limit', 10, type=int)
    
    similar = recommendation_service.get_content_based_recommendations(book_id, limit)
    
    return jsonify(similar)


@bp.route('/recommendations', methods=['GET'])
@auth_optional
def get_recommendations():
    """Get personalized recommendations."""
    limit = request.args.get('limit', 20, type=int)
    user_id = g.current_user['id'] if g.current_user else None
    
    recommendations = recommendation_service.get_recommendations(user_id, limit)
    
    return jsonify(recommendations)
