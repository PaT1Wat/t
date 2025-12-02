"""User routes for authentication and profile management."""

from flask import Blueprint, request, jsonify
from app.models import User
from app import db
from app.utils import authenticate, require_admin, get_current_user, get_pagination

bp = Blueprint('users', __name__)


@bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json() or {}
    
    firebase_uid = data.get('firebase_uid')
    email = data.get('email')
    username = data.get('username')
    display_name = data.get('display_name', username)
    preferred_language = data.get('preferred_language', 'th')
    
    if not email or not username:
        return jsonify({
            'error': 'Missing fields',
            'message': 'ต้องระบุอีเมลและชื่อผู้ใช้'
        }), 400
    
    # Check existing user
    existing = User.query.filter(
        (User.firebase_uid == firebase_uid) | 
        (User.email == email) | 
        (User.username == username)
    ).first()
    
    if existing:
        if existing.firebase_uid == firebase_uid:
            return jsonify({'user': existing.to_dict(), 'message': 'ผู้ใช้มีอยู่แล้วในระบบ'})
        if existing.email == email:
            return jsonify({'error': 'Email already exists', 'message': 'อีเมลนี้ถูกใช้งานแล้ว'}), 400
        if existing.username == username:
            return jsonify({'error': 'Username already exists', 'message': 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว'}), 400
    
    # Create new user
    user = User(
        firebase_uid=firebase_uid,
        email=email,
        username=username,
        display_name=display_name,
        preferred_language=preferred_language
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'user': user.to_dict(), 'message': 'ลงทะเบียนสำเร็จ'}), 201


@bp.route('/profile', methods=['GET'])
@authenticate
def get_profile():
    """Get current user's profile."""
    user = get_current_user()
    return jsonify({'user': user.to_dict()})


@bp.route('/profile', methods=['PUT'])
@authenticate
def update_profile():
    """Update current user's profile."""
    user = get_current_user()
    data = request.get_json() or {}
    
    if 'display_name' in data:
        user.display_name = data['display_name']
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    if 'preferred_language' in data:
        user.preferred_language = data['preferred_language']
    
    db.session.commit()
    
    return jsonify({'user': user.to_dict(), 'message': 'อัพเดทข้อมูลสำเร็จ'})


@bp.route('/stats', methods=['GET'])
@authenticate
def get_stats():
    """Get current user's statistics."""
    from app.models import Favorite, Review, SearchHistory
    
    user = get_current_user()
    
    favorites_count = Favorite.query.filter_by(user_id=user.id).count()
    reviews = Review.query.filter_by(user_id=user.id).all()
    reviews_count = len(reviews)
    avg_rating = sum(r.rating for r in reviews) / reviews_count if reviews_count > 0 else 0
    searches_count = SearchHistory.query.filter_by(user_id=user.id).count()
    
    return jsonify({
        'stats': {
            'total_favorites': favorites_count,
            'total_reviews': reviews_count,
            'average_rating': round(avg_rating, 2),
            'total_searches': searches_count
        }
    })


@bp.route('/', methods=['GET'])
@authenticate
@require_admin
def get_all_users():
    """Admin: Get all users."""
    pagination = get_pagination()
    
    total = User.query.count()
    users = User.query.order_by(User.created_at.desc())\
        .offset(pagination['offset'])\
        .limit(pagination['limit'])\
        .all()
    
    return jsonify({
        'users': [u.to_dict() for u in users],
        'pagination': {
            'total': total,
            'page': pagination['page'],
            'limit': pagination['limit'],
            'total_pages': (total + pagination['limit'] - 1) // pagination['limit']
        }
    })


@bp.route('/<user_id>/role', methods=['PUT'])
@authenticate
@require_admin
def update_user_role(user_id):
    """Admin: Update a user's role."""
    data = request.get_json() or {}
    role = data.get('role')
    
    valid_roles = ['user', 'admin', 'moderator']
    if role not in valid_roles:
        return jsonify({'error': 'Invalid role', 'message': 'บทบาทไม่ถูกต้อง'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found', 'message': 'ไม่พบผู้ใช้'}), 404
    
    user.role = role
    db.session.commit()
    
    return jsonify({'user': user.to_dict(), 'message': 'อัพเดทบทบาทสำเร็จ'})
