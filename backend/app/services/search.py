"""
Search Service for books, authors, and publishers.
Supports full-text search with Thai language support.
"""

from app.services.sheets import sheets_service


class SearchService:
    """Service for searching books with various filters."""
    
    def search_books(self, query: str = None, filters: dict = None, page: int = 1, limit: int = 20) -> dict:
        """
        Search books with full-text search and filters.
        
        Args:
            query: Search query string
            filters: Dict with type, status, genre, min_rating, max_rating, is_nsfw
            page: Page number (1-indexed)
            limit: Results per page
            
        Returns:
            Dict with results, total, page, limit, total_pages
        """
        books = sheets_service.get_all('books')
        authors = {a['id']: a for a in sheets_service.get_all('authors')}
        publishers = {p['id']: p for p in sheets_service.get_all('publishers')}
        
        results = []
        
        for book in books:
            # Text search
            if query:
                query_lower = query.lower()
                searchable = ' '.join([
                    book.get('title') or '',
                    book.get('title_thai') or '',
                    book.get('description') or '',
                    book.get('description_thai') or '',
                    ' '.join(book.get('tags') or []),
                    ' '.join(book.get('genres') or [])
                ]).lower()
                
                # Also search in author name
                author = authors.get(book.get('author_id'), {})
                searchable += ' ' + (author.get('name') or '') + ' ' + (author.get('name_thai') or '')
                searchable = searchable.lower()
                
                if query_lower not in searchable:
                    continue
            
            # Apply filters
            if filters:
                # Type filter
                if filters.get('type') and book.get('type') != filters['type']:
                    continue
                    
                # Status filter
                if filters.get('status') and book.get('status') != filters['status']:
                    continue
                    
                # Genre filter
                if filters.get('genre'):
                    genres = book.get('genres') or []
                    if filters['genre'] not in genres:
                        continue
                
                # Rating filter
                rating = book.get('average_rating', 0) or 0
                if filters.get('min_rating') and rating < filters['min_rating']:
                    continue
                if filters.get('max_rating') and rating > filters['max_rating']:
                    continue
                    
                # NSFW filter
                if 'is_nsfw' in filters:
                    if book.get('is_nsfw') != filters['is_nsfw']:
                        continue
            
            # Enrich with author/publisher info
            author = authors.get(book.get('author_id'), {})
            publisher = publishers.get(book.get('publisher_id'), {})
            
            book_result = dict(book)
            book_result['author_name'] = author.get('name')
            book_result['author_name_thai'] = author.get('name_thai')
            book_result['publisher_name'] = publisher.get('name')
            book_result['publisher_name_thai'] = publisher.get('name_thai')
            
            results.append(book_result)
        
        # Sort by relevance (simple: rating * reviews count)
        def score(b):
            rating = b.get('average_rating', 0) or 0
            reviews = b.get('total_reviews', 0) or 0
            return rating * 0.4 + reviews * 0.01
        
        results.sort(key=score, reverse=True)
        
        # Pagination
        total = len(results)
        start = (page - 1) * limit
        end = start + limit
        paginated = results[start:end]
        
        return {
            'results': paginated,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit if limit > 0 else 0
        }
    
    def get_autocomplete_suggestions(self, query: str, limit: int = 10) -> list:
        """Get autocomplete suggestions for search."""
        if not query or len(query) < 2:
            return []
        
        books = sheets_service.get_all('books')
        authors = sheets_service.get_all('authors')
        
        suggestions = []
        query_lower = query.lower()
        
        # Search in book titles
        for book in books:
            title = book.get('title') or ''
            title_thai = book.get('title_thai') or ''
            
            if query_lower in title.lower():
                suggestions.append({
                    'type': 'book',
                    'id': book['id'],
                    'text': title,
                    'text_thai': title_thai,
                    'cover_image_url': book.get('cover_image_url')
                })
            elif query_lower in title_thai.lower():
                suggestions.append({
                    'type': 'book',
                    'id': book['id'],
                    'text': title,
                    'text_thai': title_thai,
                    'cover_image_url': book.get('cover_image_url')
                })
            
            if len(suggestions) >= limit:
                break
        
        # Search in author names
        if len(suggestions) < limit:
            for author in authors:
                name = author.get('name') or ''
                name_thai = author.get('name_thai') or ''
                
                if query_lower in name.lower() or query_lower in name_thai.lower():
                    suggestions.append({
                        'type': 'author',
                        'id': author['id'],
                        'text': name,
                        'text_thai': name_thai,
                        'image_url': author.get('image_url')
                    })
                
                if len(suggestions) >= limit:
                    break
        
        return suggestions[:limit]
    
    def get_genres(self) -> list:
        """Get all unique genres."""
        books = sheets_service.get_all('books')
        genres = set()
        
        for book in books:
            book_genres = book.get('genres') or []
            genres.update(book_genres)
        
        return sorted(list(genres))
    
    def get_tags(self) -> list:
        """Get all unique tags."""
        books = sheets_service.get_all('books')
        tags = set()
        
        for book in books:
            book_tags = book.get('tags') or []
            tags.update(book_tags)
        
        return sorted(list(tags))
    
    def record_search(self, user_id: str, query: str, filters: dict = None, results_count: int = 0):
        """Record search history for recommendations."""
        if user_id and query:
            sheets_service.create('search_history', {
                'user_id': user_id,
                'query': query,
                'filters': filters or {},
                'results_count': results_count
            })


# Singleton instance
search_service = SearchService()
