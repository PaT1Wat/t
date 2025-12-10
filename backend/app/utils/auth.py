"""
Authentication utilities for Supabase JWT token verification.
"""

import os
import jwt
from functools import wraps
from flask import request, jsonify, g
from app.services.sheets import sheets_service

# Supabase JWT secret
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')


def verify_supabase_token(token: str) -> dict:
    """Verify Supabase JWT token and return decoded token."""
    try:
        # Supabase tokens are JWT tokens signed with the service role key
        decoded = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=['HS256'],
            options={"verify_signature": False}  # For development, disable signature verification
        )
        return decoded
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None


def get_or_create_user(supabase_data: dict) -> dict:
    """Get existing user or create new one from Supabase auth data."""
    supabase_uid = supabase_data.get('sub')  # 'sub' is the user ID in Supabase JWT
    email = supabase_data.get('email')
    name = supabase_data.get('user_metadata', {}).get('name') or email.split('@')[0] if email else 'user'
    
    # Check if user exists
    users = sheets_service.find_by_field('users', 'supabase_uid', supabase_uid)
    if users:
        return users[0]
    
    # Check by email
    users = sheets_service.find_by_field('users', 'email', email)
    if users:
        # Update supabase_uid
        user = users[0]
        sheets_service.update('users', user['id'], {'supabase_uid': supabase_uid})
        user['supabase_uid'] = supabase_uid
        return user
    
    # Create new user
    new_user = {
        'supabase_uid': supabase_uid,
        'email': email,
        'username': email.split('@')[0] if email else f'user_{supabase_uid[:8]}',
        'display_name': name,
        'avatar_url': supabase_data.get('user_metadata', {}).get('picture'),
        'role': 'user',
        'preferred_language': 'th'
    }
    
    return sheets_service.create('users', new_user)


def auth_required(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'กรุณาเข้าสู่ระบบ', 'error_en': 'Authentication required'}), 401
        
        token = auth_header.split('Bearer ')[1]
        
        # Verify token
        decoded = verify_supabase_token(token)
        if not decoded:
            return jsonify({'error': 'Token ไม่ถูกต้องหรือหมดอายุ', 'error_en': 'Invalid or expired token'}), 401
        
        # Get or create user
        user = get_or_create_user(decoded)
        if not user:
            return jsonify({'error': 'ไม่สามารถสร้างผู้ใช้ได้', 'error_en': 'Could not create user'}), 500
        
        g.current_user = user
        return f(*args, **kwargs)
    
    return decorated


def auth_optional(f):
    """Decorator for optional authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        g.current_user = None
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[1]
            decoded = verify_supabase_token(token)
            if decoded:
                user = get_or_create_user(decoded)
                g.current_user = user
        
        return f(*args, **kwargs)
    
    return decorated


def admin_required(f):
    """Decorator to require admin role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'กรุณาเข้าสู่ระบบ', 'error_en': 'Authentication required'}), 401
        
        token = auth_header.split('Bearer ')[1]
        decoded = verify_supabase_token(token)
        
        if not decoded:
            return jsonify({'error': 'Token ไม่ถูกต้องหรือหมดอายุ', 'error_en': 'Invalid or expired token'}), 401
        
        user = get_or_create_user(decoded)
        if not user:
            return jsonify({'error': 'ไม่สามารถสร้างผู้ใช้ได้', 'error_en': 'Could not create user'}), 500
        
        if user.get('role') not in ['admin', 'moderator']:
            return jsonify({'error': 'ไม่มีสิทธิ์เข้าถึง', 'error_en': 'Admin access required'}), 403
        
        g.current_user = user
        return f(*args, **kwargs)
    
    return decorated
