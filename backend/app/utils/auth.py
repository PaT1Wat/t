"""Authentication utilities for Firebase token verification."""

import os
import json
from functools import wraps
from flask import request, jsonify, g
# import firebase_admin
# from firebase_admin import credentials, auth

from app.models import User
from app import db


# Initialize Firebase (commented out for demo - enable with actual credentials)
# firebase_initialized = False

# def init_firebase():
#     global firebase_initialized
#     if not firebase_initialized:
#         service_account = os.getenv('FIREBASE_SERVICE_ACCOUNT')
#         if service_account:
#             cred = credentials.Certificate(json.loads(service_account))
#             firebase_admin.initialize_app(cred)
#         else:
#             firebase_admin.initialize_app()
#         firebase_initialized = True


def get_current_user():
    """Get the current authenticated user from the request."""
    return getattr(g, 'current_user', None)


def authenticate(f):
    """
    Decorator to require authentication.
    Verifies Firebase token and attaches user to request.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Unauthorized',
                'message': 'ไม่พบ token การยืนยันตัวตน'
            }), 401
        
        token = auth_header.split('Bearer ')[1]
        
        if not token:
            return jsonify({
                'error': 'Unauthorized',
                'message': 'token ไม่ถูกต้อง'
            }), 401
        
        try:
            # In production, verify with Firebase
            # init_firebase()
            # decoded_token = auth.verify_id_token(token)
            # firebase_uid = decoded_token['uid']
            
            # For demo/development, use a simple token scheme
            # Token format: "demo:{user_id}" or actual Firebase token
            if token.startswith('demo:'):
                user_id = token.split('demo:')[1]
                user = User.query.get(user_id)
            else:
                # Try to find user by firebase_uid
                user = User.query.filter_by(firebase_uid=token).first()
            
            if not user:
                return jsonify({
                    'error': 'Unauthorized',
                    'message': 'ไม่พบผู้ใช้'
                }), 401
            
            g.current_user = user
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"Auth error: {e}")
            return jsonify({
                'error': 'Unauthorized',
                'message': 'การยืนยันตัวตนล้มเหลว'
            }), 401
    
    return decorated


def optional_auth(f):
    """
    Decorator for optional authentication.
    Attaches user to request if token is valid, but doesn't fail if not.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split('Bearer ')[1]
            
            try:
                if token.startswith('demo:'):
                    user_id = token.split('demo:')[1]
                    user = User.query.get(user_id)
                else:
                    user = User.query.filter_by(firebase_uid=token).first()
                
                if user:
                    g.current_user = user
            except Exception:
                pass
        
        return f(*args, **kwargs)
    
    return decorated


def require_admin(f):
    """Decorator to require admin role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user or user.role != 'admin':
            return jsonify({
                'error': 'Forbidden',
                'message': 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้'
            }), 403
        return f(*args, **kwargs)
    return decorated


def require_moderator(f):
    """Decorator to require admin or moderator role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user or user.role not in ['admin', 'moderator']:
            return jsonify({
                'error': 'Forbidden',
                'message': 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้'
            }), 403
        return f(*args, **kwargs)
    return decorated
