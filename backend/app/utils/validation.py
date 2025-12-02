"""Validation utilities."""

import re
from functools import wraps
from flask import request, jsonify


def validate_uuid(value):
    """Check if string is a valid UUID."""
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    return bool(uuid_pattern.match(value)) if value else False


def get_pagination():
    """Get pagination parameters from request."""
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 20))))
    except (ValueError, TypeError):
        page = 1
        limit = 20
    
    return {
        'page': page,
        'limit': limit,
        'offset': (page - 1) * limit
    }


def validate_book_data(f):
    """Decorator to validate book creation/update data."""
    @wraps(f)
    def decorated(*args, **kwargs):
        data = request.get_json() or {}
        errors = []
        
        title = data.get('title')
        if not title or not isinstance(title, str) or not title.strip():
            errors.append('ต้องระบุชื่อหนังสือ (title)')
        
        if title and len(title) > 500:
            errors.append('ชื่อหนังสือต้องไม่เกิน 500 ตัวอักษร')
        
        book_type = data.get('type')
        valid_types = ['manga', 'novel', 'light_novel', 'webtoon']
        if book_type and book_type not in valid_types:
            errors.append('ประเภทหนังสือไม่ถูกต้อง')
        
        if errors:
            return jsonify({'errors': errors}), 400
        
        return f(*args, **kwargs)
    
    return decorated


def validate_review_data(f):
    """Decorator to validate review creation/update data."""
    @wraps(f)
    def decorated(*args, **kwargs):
        data = request.get_json() or {}
        errors = []
        
        rating = data.get('rating')
        if rating is None or not isinstance(rating, int) or rating < 1 or rating > 5:
            errors.append('คะแนนต้องอยู่ระหว่าง 1-5')
        
        content = data.get('content')
        if content and len(content) > 5000:
            errors.append('เนื้อหารีวิวต้องไม่เกิน 5000 ตัวอักษร')
        
        if errors:
            return jsonify({'errors': errors}), 400
        
        return f(*args, **kwargs)
    
    return decorated


def validate_author_data(f):
    """Decorator to validate author creation/update data."""
    @wraps(f)
    def decorated(*args, **kwargs):
        data = request.get_json() or {}
        errors = []
        
        name = data.get('name')
        if not name or not isinstance(name, str) or not name.strip():
            errors.append('ต้องระบุชื่อผู้แต่ง')
        
        if name and len(name) > 255:
            errors.append('ชื่อผู้แต่งต้องไม่เกิน 255 ตัวอักษร')
        
        if errors:
            return jsonify({'errors': errors}), 400
        
        return f(*args, **kwargs)
    
    return decorated


def validate_publisher_data(f):
    """Decorator to validate publisher creation/update data."""
    @wraps(f)
    def decorated(*args, **kwargs):
        data = request.get_json() or {}
        errors = []
        
        name = data.get('name')
        if not name or not isinstance(name, str) or not name.strip():
            errors.append('ต้องระบุชื่อสำนักพิมพ์')
        
        if name and len(name) > 255:
            errors.append('ชื่อสำนักพิมพ์ต้องไม่เกิน 255 ตัวอักษร')
        
        if errors:
            return jsonify({'errors': errors}), 400
        
        return f(*args, **kwargs)
    
    return decorated
