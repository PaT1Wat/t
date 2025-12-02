"""Publisher routes for CRUD operations."""

from flask import Blueprint, request, jsonify
from app.models import Publisher, Book
from app import db
from app.utils import authenticate, require_admin, get_pagination, validate_uuid

bp = Blueprint('publishers', __name__)


@bp.route('/', methods=['GET'])
def get_all_publishers():
    """Get all publishers with pagination."""
    pagination = get_pagination()
    
    total = Publisher.query.count()
    publishers = Publisher.query.order_by(Publisher.name.asc())\
        .offset(pagination['offset'])\
        .limit(pagination['limit'])\
        .all()
    
    return jsonify({
        'publishers': [p.to_dict() for p in publishers],
        'pagination': {
            'total': total,
            'page': pagination['page'],
            'limit': pagination['limit'],
            'total_pages': (total + pagination['limit'] - 1) // pagination['limit']
        }
    })


@bp.route('/<publisher_id>', methods=['GET'])
def get_publisher(publisher_id):
    """Get a single publisher by ID with their books."""
    if not validate_uuid(publisher_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    publisher = Publisher.query.get(publisher_id)
    if not publisher:
        return jsonify({'error': 'Publisher not found', 'message': 'ไม่พบสำนักพิมพ์'}), 404
    
    books = Book.query.filter_by(publisher_id=publisher_id).order_by(Book.created_at.desc()).all()
    
    return jsonify({
        'publisher': publisher.to_dict(),
        'books': [b.to_dict() for b in books]
    })


@bp.route('/', methods=['POST'])
@authenticate
@require_admin
def create_publisher():
    """Admin: Create a new publisher."""
    data = request.get_json() or {}
    
    name = data.get('name')
    if not name:
        return jsonify({'errors': ['ต้องระบุชื่อสำนักพิมพ์']}), 400
    
    publisher = Publisher(
        name=name,
        name_thai=data.get('name_thai'),
        description=data.get('description'),
        description_thai=data.get('description_thai'),
        website_url=data.get('website_url'),
        logo_url=data.get('logo_url')
    )
    
    db.session.add(publisher)
    db.session.commit()
    
    return jsonify({'publisher': publisher.to_dict(), 'message': 'เพิ่มสำนักพิมพ์สำเร็จ'}), 201


@bp.route('/<publisher_id>', methods=['PUT'])
@authenticate
@require_admin
def update_publisher(publisher_id):
    """Admin: Update a publisher."""
    if not validate_uuid(publisher_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    publisher = Publisher.query.get(publisher_id)
    if not publisher:
        return jsonify({'error': 'Publisher not found', 'message': 'ไม่พบสำนักพิมพ์'}), 404
    
    data = request.get_json() or {}
    
    if 'name' in data:
        publisher.name = data['name']
    if 'name_thai' in data:
        publisher.name_thai = data['name_thai']
    if 'description' in data:
        publisher.description = data['description']
    if 'description_thai' in data:
        publisher.description_thai = data['description_thai']
    if 'website_url' in data:
        publisher.website_url = data['website_url']
    if 'logo_url' in data:
        publisher.logo_url = data['logo_url']
    
    db.session.commit()
    
    return jsonify({'publisher': publisher.to_dict(), 'message': 'อัพเดทสำนักพิมพ์สำเร็จ'})


@bp.route('/<publisher_id>', methods=['DELETE'])
@authenticate
@require_admin
def delete_publisher(publisher_id):
    """Admin: Delete a publisher."""
    if not validate_uuid(publisher_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    publisher = Publisher.query.get(publisher_id)
    if not publisher:
        return jsonify({'error': 'Publisher not found', 'message': 'ไม่พบสำนักพิมพ์'}), 404
    
    db.session.delete(publisher)
    db.session.commit()
    
    return jsonify({'message': 'ลบสำนักพิมพ์สำเร็จ'})
