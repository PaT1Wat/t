"""
Publisher routes for CRUD operations.
"""

from flask import Blueprint, request, jsonify
from app.services.sheets import sheets_service
from app.utils.auth import admin_required
from app.utils.validation import validate_required_fields, validate_pagination

bp = Blueprint('publishers', __name__)


@bp.route('', methods=['GET'])
@validate_pagination
def get_publishers():
    """Get all publishers with pagination."""
    page = request.pagination['page']
    limit = request.pagination['limit']
    
    publishers = sheets_service.get_all('publishers')
    
    # Calculate book count for each publisher
    books = sheets_service.get_all('books')
    book_counts = {}
    for book in books:
        publisher_id = book.get('publisher_id')
        if publisher_id:
            book_counts[publisher_id] = book_counts.get(publisher_id, 0) + 1
    
    for publisher in publishers:
        publisher['book_count'] = book_counts.get(publisher['id'], 0)
    
    # Pagination
    total = len(publishers)
    start = (page - 1) * limit
    end = start + limit
    paginated = publishers[start:end]
    
    return jsonify({
        'results': paginated,
        'total': total,
        'page': page,
        'limit': limit,
        'total_pages': (total + limit - 1) // limit if limit > 0 else 0
    })


@bp.route('/<publisher_id>', methods=['GET'])
def get_publisher(publisher_id):
    """Get publisher by ID."""
    publisher = sheets_service.get_by_id('publishers', publisher_id)
    
    if not publisher:
        return jsonify({
            'error': 'ไม่พบสำนักพิมพ์',
            'error_en': 'Publisher not found'
        }), 404
    
    # Get publisher's books
    books = sheets_service.find_by_field('books', 'publisher_id', publisher_id)
    publisher['books'] = books
    publisher['book_count'] = len(books)
    
    return jsonify(publisher)


@bp.route('', methods=['POST'])
@admin_required
@validate_required_fields(['name'])
def create_publisher():
    """Create a new publisher (admin only)."""
    data = request.get_json()
    
    publisher_data = {
        'name': data['name'],
        'name_thai': data.get('name_thai'),
        'description': data.get('description'),
        'description_thai': data.get('description_thai'),
        'website_url': data.get('website_url'),
        'logo_url': data.get('logo_url')
    }
    
    publisher = sheets_service.create('publishers', publisher_data)
    
    if publisher:
        return jsonify(publisher), 201
    
    return jsonify({
        'error': 'ไม่สามารถสร้างสำนักพิมพ์ได้',
        'error_en': 'Could not create publisher'
    }), 500


@bp.route('/<publisher_id>', methods=['PUT'])
@admin_required
def update_publisher(publisher_id):
    """Update a publisher (admin only)."""
    data = request.get_json()
    
    existing = sheets_service.get_by_id('publishers', publisher_id)
    if not existing:
        return jsonify({
            'error': 'ไม่พบสำนักพิมพ์',
            'error_en': 'Publisher not found'
        }), 404
    
    allowed_fields = ['name', 'name_thai', 'description', 'description_thai', 'website_url', 'logo_url']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    updated = sheets_service.update('publishers', publisher_id, update_data)
    
    if updated:
        return jsonify(updated)
    
    return jsonify({
        'error': 'ไม่สามารถอัพเดทสำนักพิมพ์ได้',
        'error_en': 'Could not update publisher'
    }), 500


@bp.route('/<publisher_id>', methods=['DELETE'])
@admin_required
def delete_publisher(publisher_id):
    """Delete a publisher (admin only)."""
    existing = sheets_service.get_by_id('publishers', publisher_id)
    if not existing:
        return jsonify({
            'error': 'ไม่พบสำนักพิมพ์',
            'error_en': 'Publisher not found'
        }), 404
    
    if sheets_service.delete('publishers', publisher_id):
        return jsonify({'message': 'ลบสำนักพิมพ์เรียบร้อยแล้ว', 'message_en': 'Publisher deleted successfully'})
    
    return jsonify({
        'error': 'ไม่สามารถลบสำนักพิมพ์ได้',
        'error_en': 'Could not delete publisher'
    }), 500
