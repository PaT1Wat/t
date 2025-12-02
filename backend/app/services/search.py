"""
Search Service with full-text search and autocomplete support.
Supports both Thai and English text.
"""

from sqlalchemy import or_, func
from app.models import Book, Author, SearchHistory
from app import db


class SearchService:
    """Service for searching books with filters and autocomplete."""
    
    def search_books(self, query: str = None, filters: dict = None, page: int = 1, limit: int = 20):
        """
        Full-text search with filters.
        
        Args:
            query: Search query string
            filters: Dict with type, genres, tags, status, author_id, publisher_id, min_rating, etc.
            page: Page number for pagination
            limit: Results per page
        
        Returns:
            Dict with books list and pagination info
        """
        filters = filters or {}
        offset = (page - 1) * limit
        
        # Base query
        base_query = Book.query
        
        # Apply text search
        if query and query.strip():
            search_term = f"%{query.strip()}%"
            base_query = base_query.filter(
                or_(
                    Book.title.ilike(search_term),
                    Book.title_thai.ilike(search_term),
                    Book.description.ilike(search_term),
                    Book.description_thai.ilike(search_term)
                )
            )
        
        # Apply filters
        if filters.get('type'):
            base_query = base_query.filter(Book.type == filters['type'])
        
        if filters.get('status'):
            base_query = base_query.filter(Book.status == filters['status'])
        
        if filters.get('author_id'):
            base_query = base_query.filter(Book.author_id == filters['author_id'])
        
        if filters.get('publisher_id'):
            base_query = base_query.filter(Book.publisher_id == filters['publisher_id'])
        
        if filters.get('min_rating'):
            base_query = base_query.filter(Book.average_rating >= float(filters['min_rating']))
        
        if filters.get('from_year'):
            base_query = base_query.filter(Book.publication_year >= int(filters['from_year']))
        
        if filters.get('to_year'):
            base_query = base_query.filter(Book.publication_year <= int(filters['to_year']))
        
        if not filters.get('include_nsfw'):
            base_query = base_query.filter(or_(Book.is_nsfw == False, Book.is_nsfw == None))
        
        # Note: For JSON columns, we filter in Python for SQLite compatibility
        # For PostgreSQL, you would use JSONB operators
        
        # Sorting
        sort_by = filters.get('sort_by', 'newest')
        if sort_by == 'rating':
            base_query = base_query.order_by(Book.average_rating.desc())
        elif sort_by == 'reviews':
            base_query = base_query.order_by(Book.total_reviews.desc())
        elif sort_by == 'title':
            base_query = base_query.order_by(Book.title.asc())
        elif sort_by == 'oldest':
            base_query = base_query.order_by(Book.created_at.asc())
        else:  # newest
            base_query = base_query.order_by(Book.created_at.desc())
        
        # Get total count
        total = base_query.count()
        
        # Get paginated results
        books = base_query.offset(offset).limit(limit).all()
        
        return {
            'books': [book.to_dict() for book in books],
            'pagination': {
                'total': total,
                'page': page,
                'limit': limit,
                'total_pages': (total + limit - 1) // limit
            }
        }
    
    def get_autocomplete_suggestions(self, query: str, limit: int = 10):
        """
        Get autocomplete suggestions for search.
        
        Returns books, authors, tags, and genres matching the query.
        """
        if not query or len(query.strip()) < 2:
            return {'books': [], 'authors': [], 'tags': [], 'genres': []}
        
        search_term = f"%{query.strip()}%"
        
        # Get book suggestions
        books = Book.query.filter(
            or_(
                Book.title.ilike(search_term),
                Book.title_thai.ilike(search_term)
            )
        ).order_by(Book.total_reviews.desc()).limit(limit).all()
        
        # Get author suggestions
        authors = Author.query.filter(
            or_(
                Author.name.ilike(search_term),
                Author.name_thai.ilike(search_term)
            )
        ).limit(limit).all()
        
        # Get matching tags and genres
        all_books = Book.query.all()
        matching_tags = set()
        matching_genres = set()
        
        for book in all_books:
            if book.tags:
                for tag in book.tags:
                    if query.lower() in tag.lower():
                        matching_tags.add(tag)
            if book.genres:
                for genre in book.genres:
                    if query.lower() in genre.lower():
                        matching_genres.add(genre)
        
        return {
            'books': [{
                'id': b.id,
                'title': b.title,
                'title_thai': b.title_thai,
                'cover_image_url': b.cover_image_url,
                'type': b.type
            } for b in books],
            'authors': [{
                'id': a.id,
                'name': a.name,
                'name_thai': a.name_thai,
                'image_url': a.image_url
            } for a in authors],
            'tags': list(matching_tags)[:limit],
            'genres': list(matching_genres)[:limit]
        }
    
    def save_search_history(self, user_id: str, query: str, filters: dict, results_count: int):
        """Save search history for a user."""
        if not user_id or not query:
            return
        
        try:
            history = SearchHistory(
                user_id=user_id,
                query=query,
                filters=filters,
                results_count=results_count
            )
            db.session.add(history)
            db.session.commit()
        except Exception as e:
            print(f"Error saving search history: {e}")
            db.session.rollback()
    
    def get_recent_searches(self, user_id: str, limit: int = 10):
        """Get user's recent searches."""
        searches = SearchHistory.query.filter_by(user_id=user_id)\
            .order_by(SearchHistory.created_at.desc())\
            .limit(limit)\
            .all()
        
        return [{
            'query': s.query,
            'filters': s.filters,
            'created_at': s.created_at.isoformat() if s.created_at else None
        } for s in searches]
    
    def get_available_filters(self):
        """Get all available filter options."""
        all_books = Book.query.all()
        
        types = set()
        genres = set()
        tags = set()
        statuses = set()
        
        for book in all_books:
            if book.type:
                types.add(book.type)
            if book.status:
                statuses.add(book.status)
            if book.genres:
                genres.update(book.genres)
            if book.tags:
                tags.update(book.tags)
        
        return {
            'types': sorted(list(types)),
            'genres': sorted(list(genres)),
            'tags': sorted(list(tags)),
            'statuses': sorted(list(statuses))
        }


# Singleton instance
search_service = SearchService()
