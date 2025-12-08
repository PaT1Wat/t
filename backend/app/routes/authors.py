"""
Author routes for CRUD operations.
"""

from flask import Blueprint, request, jsonify
from app.services.sheets import sheets_service
from app.utils.auth import admin_required
from app.utils.validation import validate_required_fields, validate_pagination

bp = Blueprint('authors', __name__)


@bp.route('', methods=['GET'])
@validate_pagination
def get_authors():
    """Get all authors with pagination."""
    page = request.pagination['page']
    limit = request.pagination['limit']
    
    authors = sheets_service.get_all('authors')
    
    # Calculate book count for each author
    books = sheets_service.get_all('books')
    book_counts = {}
    for book in books:
        author_id = book.get('author_id')
        if author_id:
            book_counts[author_id] = book_counts.get(author_id, 0) + 1
    
    for author in authors:
        author['book_count'] = book_counts.get(author['id'], 0)
    
    # Pagination
    total = len(authors)
    start = (page - 1) * limit
    end = start + limit
    paginated = authors[start:end]
    
    return jsonify({
        'results': paginated,
        'total': total,
        'page': page,
        'limit': limit,
        'total_pages': (total + limit - 1) // limit if limit > 0 else 0
    })


@bp.route('/<author_id>', methods=['GET'])
def get_author(author_id):
    """Get author by ID."""
    author = sheets_service.get_by_id('authors', author_id)
    
    if not author:
        return jsonify({
            'error': 'ไม่พบผู้แต่ง',
            'error_en': 'Author not found'
        }), 404
    
    # Get author's books
    books = sheets_service.find_by_field('books', 'author_id', author_id)
    author['books'] = books
    author['book_count'] = len(books)
    
    return jsonify(author)


@bp.route('', methods=['POST'])
@admin_required
@validate_required_fields(['name'])
def create_author():
    """Create a new author (admin only)."""
    data = request.get_json()
    
    author_data = {
        'name': data['name'],
        'name_thai': data.get('name_thai'),
        'bio': data.get('bio'),
        'bio_thai': data.get('bio_thai'),
        'image_url': data.get('image_url')
    }
    
    author = sheets_service.create('authors', author_data)
    
    if author:
        return jsonify(author), 201
    
    return jsonify({
        'error': 'ไม่สามารถสร้างผู้แต่งได้',
        'error_en': 'Could not create author'
    }), 500


@bp.route('/<author_id>', methods=['PUT'])
@admin_required
def update_author(author_id):
    """Update an author (admin only)."""
    data = request.get_json()
    
    existing = sheets_service.get_by_id('authors', author_id)
    if not existing:
        return jsonify({
            'error': 'ไม่พบผู้แต่ง',
            'error_en': 'Author not found'
        }), 404
    
    allowed_fields = ['name', 'name_thai', 'bio', 'bio_thai', 'image_url']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    updated = sheets_service.update('authors', author_id, update_data)
    
    if updated:
        return jsonify(updated)
    
    return jsonify({
        'error': 'ไม่สามารถอัพเดทผู้แต่งได้',
        'error_en': 'Could not update author'
    }), 500


@bp.route('/<author_id>', methods=['DELETE'])
@admin_required
def delete_author(author_id):
    """Delete an author (admin only)."""
    existing = sheets_service.get_by_id('authors', author_id)
    if not existing:
        return jsonify({
            'error': 'ไม่พบผู้แต่ง',
            'error_en': 'Author not found'
        }), 404
    
    if sheets_service.delete('authors', author_id):
        return jsonify({'message': 'ลบผู้แต่งเรียบร้อยแล้ว', 'message_en': 'Author deleted successfully'})
    
    return jsonify({
        'error': 'ไม่สามารถลบผู้แต่งได้',
        'error_en': 'Could not delete author'
    }), 500
