"""Author routes for CRUD operations."""

from flask import Blueprint, request, jsonify
from app.models import Author, Book
from app import db
from app.utils import authenticate, require_admin, get_pagination, validate_uuid

bp = Blueprint('authors', __name__)


@bp.route('/', methods=['GET'])
def get_all_authors():
    """Get all authors with pagination."""
    pagination = get_pagination()
    
    total = Author.query.count()
    authors = Author.query.order_by(Author.name.asc())\
        .offset(pagination['offset'])\
        .limit(pagination['limit'])\
        .all()
    
    return jsonify({
        'authors': [a.to_dict() for a in authors],
        'pagination': {
            'total': total,
            'page': pagination['page'],
            'limit': pagination['limit'],
            'total_pages': (total + pagination['limit'] - 1) // pagination['limit']
        }
    })


@bp.route('/<author_id>', methods=['GET'])
def get_author(author_id):
    """Get a single author by ID with their books."""
    if not validate_uuid(author_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    author = Author.query.get(author_id)
    if not author:
        return jsonify({'error': 'Author not found', 'message': 'ไม่พบผู้แต่ง'}), 404
    
    books = Book.query.filter_by(author_id=author_id).order_by(Book.created_at.desc()).all()
    
    return jsonify({
        'author': author.to_dict(),
        'books': [b.to_dict() for b in books]
    })


@bp.route('/', methods=['POST'])
@authenticate
@require_admin
def create_author():
    """Admin: Create a new author."""
    data = request.get_json() or {}
    
    name = data.get('name')
    if not name:
        return jsonify({'errors': ['ต้องระบุชื่อผู้แต่ง']}), 400
    
    author = Author(
        name=name,
        name_thai=data.get('name_thai'),
        bio=data.get('bio'),
        bio_thai=data.get('bio_thai'),
        image_url=data.get('image_url')
    )
    
    db.session.add(author)
    db.session.commit()
    
    return jsonify({'author': author.to_dict(), 'message': 'เพิ่มผู้แต่งสำเร็จ'}), 201


@bp.route('/<author_id>', methods=['PUT'])
@authenticate
@require_admin
def update_author(author_id):
    """Admin: Update an author."""
    if not validate_uuid(author_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    author = Author.query.get(author_id)
    if not author:
        return jsonify({'error': 'Author not found', 'message': 'ไม่พบผู้แต่ง'}), 404
    
    data = request.get_json() or {}
    
    if 'name' in data:
        author.name = data['name']
    if 'name_thai' in data:
        author.name_thai = data['name_thai']
    if 'bio' in data:
        author.bio = data['bio']
    if 'bio_thai' in data:
        author.bio_thai = data['bio_thai']
    if 'image_url' in data:
        author.image_url = data['image_url']
    
    db.session.commit()
    
    return jsonify({'author': author.to_dict(), 'message': 'อัพเดทผู้แต่งสำเร็จ'})


@bp.route('/<author_id>', methods=['DELETE'])
@authenticate
@require_admin
def delete_author(author_id):
    """Admin: Delete an author."""
    if not validate_uuid(author_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    author = Author.query.get(author_id)
    if not author:
        return jsonify({'error': 'Author not found', 'message': 'ไม่พบผู้แต่ง'}), 404
    
    db.session.delete(author)
    db.session.commit()
    
    return jsonify({'message': 'ลบผู้แต่งสำเร็จ'})
