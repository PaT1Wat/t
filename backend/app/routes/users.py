"""
User routes for authentication and profile management.
"""

from flask import Blueprint, request, jsonify, g
from app.services.sheets import sheets_service
from app.utils.auth import auth_required, auth_optional

bp = Blueprint('users', __name__)


@bp.route('/me', methods=['GET'])
@auth_required
def get_current_user():
    """Get current authenticated user."""
    return jsonify(g.current_user)


@bp.route('/me', methods=['PUT'])
@auth_required
def update_current_user():
    """Update current user profile."""
    data = request.get_json()
    
    allowed_fields = ['display_name', 'avatar_url', 'preferred_language']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        return jsonify({
            'error': 'ไม่มีข้อมูลที่จะอัพเดท',
            'error_en': 'No valid fields to update'
        }), 400
    
    updated = sheets_service.update('users', g.current_user['id'], update_data)
    
    if updated:
        return jsonify(updated)
    
    return jsonify({
        'error': 'ไม่สามารถอัพเดทข้อมูลได้',
        'error_en': 'Could not update user'
    }), 500


@bp.route('/<user_id>', methods=['GET'])
@auth_optional
def get_user(user_id):
    """Get user by ID (public profile)."""
    user = sheets_service.get_by_id('users', user_id)
    
    if not user:
        return jsonify({
            'error': 'ไม่พบผู้ใช้',
            'error_en': 'User not found'
        }), 404
    
    # Return public profile only
    public_profile = {
        'id': user['id'],
        'username': user.get('username'),
        'display_name': user.get('display_name'),
        'avatar_url': user.get('avatar_url'),
        'created_at': user.get('created_at')
    }
    
    return jsonify(public_profile)


@bp.route('/<user_id>/reviews', methods=['GET'])
def get_user_reviews(user_id):
    """Get reviews by user."""
    reviews = sheets_service.find_by_field('reviews', 'user_id', user_id)
    
    # Filter only approved reviews
    approved_reviews = [r for r in reviews if r.get('is_approved', True)]
    
    # Enrich with book info
    books = {b['id']: b for b in sheets_service.get_all('books')}
    
    for review in approved_reviews:
        book = books.get(review.get('book_id'), {})
        review['book_title'] = book.get('title')
        review['book_title_thai'] = book.get('title_thai')
        review['book_cover'] = book.get('cover_image_url')
    
    return jsonify(approved_reviews)


@bp.route('/<user_id>/favorites', methods=['GET'])
def get_user_favorites(user_id):
    """Get favorites by user."""
    favorites = sheets_service.find_by_field('favorites', 'user_id', user_id)
    
    # Enrich with book info
    books = {b['id']: b for b in sheets_service.get_all('books')}
    
    result = []
    for fav in favorites:
        book = books.get(fav.get('book_id'), {})
        if book:
            result.append({
                'id': fav['id'],
                'book_id': fav['book_id'],
                'created_at': fav.get('created_at'),
                'book': book
            })
    
    return jsonify(result)
