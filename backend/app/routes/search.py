"""Search and recommendation routes."""

from flask import Blueprint, request, jsonify
from app.services import search_service, recommendation_service
from app.utils import optional_auth, authenticate, get_current_user, get_pagination, validate_uuid

bp = Blueprint('search', __name__)


@bp.route('/', methods=['GET'])
@optional_auth
def search_books():
    """Search books with filters."""
    pagination = get_pagination()
    
    query = request.args.get('q', '')
    filters = {
        'type': request.args.get('type'),
        'genres': request.args.getlist('genres'),
        'tags': request.args.getlist('tags'),
        'status': request.args.get('status'),
        'author_id': request.args.get('author_id'),
        'publisher_id': request.args.get('publisher_id'),
        'min_rating': request.args.get('min_rating'),
        'from_year': request.args.get('from_year'),
        'to_year': request.args.get('to_year'),
        'sort_by': request.args.get('sort_by'),
        'include_nsfw': request.args.get('include_nsfw') == 'true'
    }
    
    # Remove empty filters
    filters = {k: v for k, v in filters.items() if v}
    
    results = search_service.search_books(query, filters, pagination['page'], pagination['limit'])
    
    # Save search history for logged-in users
    user = get_current_user()
    if user and query:
        search_service.save_search_history(user.id, query, filters, results['pagination']['total'])
    
    return jsonify(results)


@bp.route('/autocomplete', methods=['GET'])
def autocomplete():
    """Get autocomplete suggestions."""
    query = request.args.get('q', '')
    limit = min(20, int(request.args.get('limit', 10)))
    
    suggestions = search_service.get_autocomplete_suggestions(query, limit)
    
    return jsonify(suggestions)


@bp.route('/filters', methods=['GET'])
def get_filters():
    """Get available filter options."""
    filters = search_service.get_available_filters()
    
    return jsonify({'filters': filters})


@bp.route('/recommendations', methods=['GET'])
@optional_auth
def get_recommendations():
    """Get personalized recommendations."""
    user = get_current_user()
    limit = min(50, int(request.args.get('limit', 20)))
    
    user_id = user.id if user else None
    recommendations = recommendation_service.get_recommendations(user_id, limit)
    
    return jsonify({'recommendations': recommendations})


@bp.route('/similar/<book_id>', methods=['GET'])
def get_similar_books(book_id):
    """Get similar books using content-based filtering."""
    if not validate_uuid(book_id):
        return jsonify({'error': 'Invalid ID', 'message': 'รหัสไม่ถูกต้อง'}), 400
    
    limit = min(20, int(request.args.get('limit', 10)))
    
    recommendation_service.initialize()
    similar_books = recommendation_service.get_content_based_recommendations(book_id, limit)
    
    return jsonify({'similar_books': similar_books})


@bp.route('/popular', methods=['GET'])
def get_popular():
    """Get popular books."""
    limit = min(50, int(request.args.get('limit', 20)))
    
    books = recommendation_service.get_popular_recommendations(limit)
    
    return jsonify({'books': books})


@bp.route('/popular-searches', methods=['GET'])
def get_popular_searches():
    """Get popular search queries."""
    from app.models import SearchHistory
    from sqlalchemy import func
    from app import db
    
    limit = min(20, int(request.args.get('limit', 10)))
    
    results = db.session.query(
        SearchHistory.query,
        func.count(SearchHistory.id).label('count')
    ).group_by(SearchHistory.query)\
     .order_by(func.count(SearchHistory.id).desc())\
     .limit(limit)\
     .all()
    
    return jsonify({
        'searches': [{'query': q, 'count': c} for q, c in results]
    })


@bp.route('/recent-searches', methods=['GET'])
@authenticate
def get_recent_searches():
    """Get user's recent searches."""
    user = get_current_user()
    limit = min(20, int(request.args.get('limit', 10)))
    
    searches = search_service.get_recent_searches(user.id, limit)
    
    return jsonify({'searches': searches})
