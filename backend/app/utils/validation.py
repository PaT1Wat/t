"""
Validation utilities for request data.
"""

from functools import wraps
from flask import request, jsonify


def validate_required_fields(fields):
    """Decorator to validate required fields in request JSON."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            data = request.get_json()
            if not data:
                return jsonify({
                    'error': 'กรุณาส่งข้อมูล JSON',
                    'error_en': 'JSON body required'
                }), 400
            
            missing = [field for field in fields if field not in data or data[field] is None]
            if missing:
                return jsonify({
                    'error': f'ข้อมูลไม่ครบถ้วน: {", ".join(missing)}',
                    'error_en': f'Missing required fields: {", ".join(missing)}'
                }), 400
            
            return f(*args, **kwargs)
        return decorated
    return decorator


def validate_rating(f):
    """Decorator to validate rating value."""
    @wraps(f)
    def decorated(*args, **kwargs):
        data = request.get_json()
        if data and 'rating' in data:
            rating = data['rating']
            if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
                return jsonify({
                    'error': 'คะแนนต้องอยู่ระหว่าง 1-5',
                    'error_en': 'Rating must be between 1 and 5'
                }), 400
        return f(*args, **kwargs)
    return decorated


def validate_pagination(f):
    """Decorator to validate pagination parameters."""
    @wraps(f)
    def decorated(*args, **kwargs):
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        
        if page < 1:
            page = 1
        if limit < 1:
            limit = 1
        if limit > 100:
            limit = 100
        
        request.pagination = {'page': page, 'limit': limit}
        return f(*args, **kwargs)
    return decorated
