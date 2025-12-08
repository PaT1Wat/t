"""
Authentication utilities for Firebase token verification.
"""

import os
from functools import wraps
from flask import request, jsonify, g
import firebase_admin
from firebase_admin import credentials, auth
from app.services.sheets import sheets_service

# Initialize Firebase Admin SDK
firebase_app = None


def initialize_firebase():
    """Initialize Firebase Admin SDK."""
    global firebase_app
    if firebase_app:
        return firebase_app
    
    try:
        credentials_json = os.getenv('FIREBASE_CREDENTIALS_JSON')
        credentials_file = os.getenv('FIREBASE_CREDENTIALS_FILE')
        
        if credentials_json:
            import json
            cred_dict = json.loads(credentials_json)
            cred = credentials.Certificate(cred_dict)
        elif credentials_file and os.path.exists(credentials_file):
            cred = credentials.Certificate(credentials_file)
        else:
            # No credentials available
            print("Warning: No Firebase credentials found. Auth will be mocked.")
            return None
        
        firebase_app = firebase_admin.initialize_app(cred)
        return firebase_app
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None


def verify_firebase_token(token: str) -> dict:
    """Verify Firebase ID token and return decoded token."""
    try:
        initialize_firebase()
        if firebase_app:
            decoded = auth.verify_id_token(token)
            return decoded
        return None
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None


def get_or_create_user(firebase_data: dict) -> dict:
    """Get existing user or create new one from Firebase data."""
    firebase_uid = firebase_data.get('uid')
    email = firebase_data.get('email')
    name = firebase_data.get('name') or email.split('@')[0] if email else 'user'
    
    # Check if user exists
    users = sheets_service.find_by_field('users', 'firebase_uid', firebase_uid)
    if users:
        return users[0]
    
    # Check by email
    users = sheets_service.find_by_field('users', 'email', email)
    if users:
        # Update firebase_uid
        user = users[0]
        sheets_service.update('users', user['id'], {'firebase_uid': firebase_uid})
        user['firebase_uid'] = firebase_uid
        return user
    
    # Create new user
    new_user = {
        'firebase_uid': firebase_uid,
        'email': email,
        'username': email.split('@')[0] if email else f'user_{firebase_uid[:8]}',
        'display_name': name,
        'avatar_url': firebase_data.get('picture'),
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
        decoded = verify_firebase_token(token)
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
            decoded = verify_firebase_token(token)
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
        decoded = verify_firebase_token(token)
        
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
