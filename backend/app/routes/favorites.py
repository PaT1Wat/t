"""Favorite routes for managing user favorites."""

from flask import Blueprint, jsonify
from app.models import Favorite, Book
from app import db
from app.utils import authenticate, get_current_user, get_pagination, validate_uuid

bp = Blueprint('favorites', __name__)


@bp.route('/', methods=['GET'])
@authenticate
def get_favorites():
    """Get current user's favorites."""
    user = get_current_user()
    pagination = get_pagination()
    
    total = Favorite.query.filter_by(user_id=user.id).count()
    favorites = Favorite.query.filter_by(user_id=user.id)\
        .order_by(Favorite.created_at.desc())\
        .offset(pagination['offset'])\
        .limit(pagination['limit'])\
        .all()
    
    # Get book details for each favorite
    favorites_with_books = []
    for fav in favorites:
        if fav.book:
            book_dict = fav.book.to_dict()
            book_dict['favorite_id'] = fav.id
            book_dict['favorited_at'] = fav.created_at.isoformat() if fav.created_at else None
            favorites_with_books.append(book_dict)
    
    return jsonify({
        'favorites': favorites_with_books,
        'pagination': {
            'total': total,
            'page': pagination['page'],
            'limit': pagination['limit'],
            'total_pages': (total + pagination['limit'] - 1) // pagination['limit']
        }
    })


@bp.route('/<book_id>', methods=['POST'])
@authenticate
def add_favorite(book_id):
    """Add a book to favorites."""
    if not validate_uuid(book_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    user = get_current_user()
    
    # Check if book exists
    book = Book.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found', 'message': 'ไม่พบหนังสือ'}), 404
    
    # Check if already favorited
    existing = Favorite.query.filter_by(user_id=user.id, book_id=book_id).first()
    if existing:
        return jsonify({'error': 'Already in favorites', 'message': 'หนังสือนี้อยู่ในรายการโปรดแล้ว'}), 400
    
    favorite = Favorite(user_id=user.id, book_id=book_id)
    db.session.add(favorite)
    db.session.commit()
    
    return jsonify({
        'favorite': favorite.to_dict(),
        'book': book.to_dict(),
        'message': 'เพิ่มในรายการโปรดสำเร็จ'
    }), 201


@bp.route('/<book_id>', methods=['DELETE'])
@authenticate
def remove_favorite(book_id):
    """Remove a book from favorites."""
    if not validate_uuid(book_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    user = get_current_user()
    
    favorite = Favorite.query.filter_by(user_id=user.id, book_id=book_id).first()
    if not favorite:
        return jsonify({'error': 'Favorite not found', 'message': 'ไม่พบในรายการโปรด'}), 404
    
    db.session.delete(favorite)
    db.session.commit()
    
    return jsonify({'message': 'ลบออกจากรายการโปรดสำเร็จ'})


@bp.route('/check/<book_id>', methods=['GET'])
@authenticate
def check_favorite(book_id):
    """Check if a book is in user's favorites."""
    if not validate_uuid(book_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    user = get_current_user()
    
    favorite = Favorite.query.filter_by(user_id=user.id, book_id=book_id).first()
    
    return jsonify({
        'is_favorite': favorite is not None,
        'favorite': favorite.to_dict() if favorite else None
    })


@bp.route('/count/<book_id>', methods=['GET'])
def get_favorite_count(book_id):
    """Get the number of users who favorited a book."""
    if not validate_uuid(book_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    count = Favorite.query.filter_by(book_id=book_id).count()
    
    return jsonify({'count': count})
