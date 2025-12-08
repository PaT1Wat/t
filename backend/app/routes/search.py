"""
Search routes for books, authors, and publishers.
"""

from flask import Blueprint, request, jsonify, g
from app.services.search import search_service
from app.utils.auth import auth_optional
from app.utils.validation import validate_pagination

bp = Blueprint('search', __name__)


@bp.route('', methods=['GET'])
@auth_optional
@validate_pagination
def search():
    """Search books with filters."""
    query = request.args.get('q', '')
    page = request.pagination['page']
    limit = request.pagination['limit']
    
    # Build filters
    filters = {}
    if request.args.get('type'):
        filters['type'] = request.args.get('type')
    if request.args.get('status'):
        filters['status'] = request.args.get('status')
    if request.args.get('genre'):
        filters['genre'] = request.args.get('genre')
    if request.args.get('min_rating'):
        filters['min_rating'] = float(request.args.get('min_rating'))
    if request.args.get('max_rating'):
        filters['max_rating'] = float(request.args.get('max_rating'))
    if request.args.get('is_nsfw') is not None:
        filters['is_nsfw'] = request.args.get('is_nsfw').lower() == 'true'
    
    results = search_service.search_books(query, filters if filters else None, page, limit)
    
    # Record search history
    if g.current_user and query:
        search_service.record_search(
            g.current_user['id'],
            query,
            filters,
            results['total']
        )
    
    return jsonify(results)


@bp.route('/autocomplete', methods=['GET'])
def autocomplete():
    """Get autocomplete suggestions."""
    query = request.args.get('q', '')
    limit = request.args.get('limit', 10, type=int)
    
    suggestions = search_service.get_autocomplete_suggestions(query, limit)
    
    return jsonify(suggestions)


@bp.route('/genres', methods=['GET'])
def get_genres():
    """Get all available genres."""
    genres = search_service.get_genres()
    return jsonify(genres)


@bp.route('/tags', methods=['GET'])
def get_tags():
    """Get all available tags."""
    tags = search_service.get_tags()
    return jsonify(tags)
