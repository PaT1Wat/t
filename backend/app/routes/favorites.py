"""
Favorites routes for managing user's favorite books.
"""

from flask import Blueprint, request, jsonify, g
from app.services.sheets import sheets_service
from app.utils.auth import auth_required
from app.utils.validation import validate_pagination

bp = Blueprint('favorites', __name__)


@bp.route('', methods=['GET'])
@auth_required
@validate_pagination
def get_favorites():
    """Get current user's favorites."""
    page = request.pagination['page']
    limit = request.pagination['limit']
    user_id = g.current_user['id']
    
    favorites = sheets_service.find_by_field('favorites', 'user_id', user_id)
    
    # Enrich with book info
    books = {b['id']: b for b in sheets_service.get_all('books')}
    authors = {a['id']: a for a in sheets_service.get_all('authors')}
    
    result = []
    for fav in favorites:
        book = books.get(fav.get('book_id'), {})
        if book:
            author = authors.get(book.get('author_id'), {})
            result.append({
                'id': fav['id'],
                'book_id': fav['book_id'],
                'created_at': fav.get('created_at'),
                'book': {
                    **book,
                    'author_name': author.get('name'),
                    'author_name_thai': author.get('name_thai')
                }
            })
    
    # Sort by created_at descending
    result.sort(key=lambda f: f.get('created_at', ''), reverse=True)
    
    # Pagination
    total = len(result)
    start = (page - 1) * limit
    end = start + limit
    paginated = result[start:end]
    
    return jsonify({
        'results': paginated,
        'total': total,
        'page': page,
        'limit': limit,
        'total_pages': (total + limit - 1) // limit if limit > 0 else 0
    })


@bp.route('', methods=['POST'])
@auth_required
def add_favorite():
    """Add a book to favorites."""
    data = request.get_json()
    user_id = g.current_user['id']
    book_id = data.get('book_id')
    
    if not book_id:
        return jsonify({
            'error': 'กรุณาระบุ book_id',
            'error_en': 'book_id is required'
        }), 400
    
    # Check if book exists
    book = sheets_service.get_by_id('books', book_id)
    if not book:
        return jsonify({
            'error': 'ไม่พบหนังสือ',
            'error_en': 'Book not found'
        }), 404
    
    # Check for existing favorite
    existing_favorites = sheets_service.find_by_field('favorites', 'user_id', user_id)
    existing = next((f for f in existing_favorites if f.get('book_id') == book_id), None)
    
    if existing:
        return jsonify({
            'error': 'หนังสือนี้อยู่ในรายการโปรดแล้ว',
            'error_en': 'Book already in favorites'
        }), 409
    
    favorite = sheets_service.create('favorites', {
        'user_id': user_id,
        'book_id': book_id
    })
    
    if favorite:
        return jsonify(favorite), 201
    
    return jsonify({
        'error': 'ไม่สามารถเพิ่มรายการโปรดได้',
        'error_en': 'Could not add favorite'
    }), 500


@bp.route('/<book_id>', methods=['DELETE'])
@auth_required
def remove_favorite(book_id):
    """Remove a book from favorites."""
    user_id = g.current_user['id']
    
    # Find the favorite
    favorites = sheets_service.find_by_field('favorites', 'user_id', user_id)
    favorite = next((f for f in favorites if f.get('book_id') == book_id), None)
    
    if not favorite:
        return jsonify({
            'error': 'ไม่พบรายการโปรดนี้',
            'error_en': 'Favorite not found'
        }), 404
    
    if sheets_service.delete('favorites', favorite['id']):
        return jsonify({'message': 'ลบออกจากรายการโปรดแล้ว', 'message_en': 'Removed from favorites'})
    
    return jsonify({
        'error': 'ไม่สามารถลบรายการโปรดได้',
        'error_en': 'Could not remove favorite'
    }), 500


@bp.route('/check/<book_id>', methods=['GET'])
@auth_required
def check_favorite(book_id):
    """Check if a book is in user's favorites."""
    user_id = g.current_user['id']
    
    favorites = sheets_service.find_by_field('favorites', 'user_id', user_id)
    is_favorite = any(f.get('book_id') == book_id for f in favorites)
    
    return jsonify({'is_favorite': is_favorite})
