"""
Recommendation Service using TF-IDF, Cosine Similarity, KNN, and SVD.
Implements hybrid recommendation combining content-based and collaborative filtering.
Uses Google Sheets as data source.
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors
from sklearn.decomposition import TruncatedSVD
from app.services.sheets import sheets_service


class RecommendationService:
    """Service for generating book recommendations using hybrid AI approach."""
    
    def __init__(self):
        self.tfidf_vectorizer = None
        self.tfidf_matrix = None
        self.books_data = []
        self.book_id_to_idx = {}
        self.user_item_matrix = None
        self.svd_model = None
        self.knn_model = None
        self.last_update = None
        self.authors_cache = {}
        self.publishers_cache = {}
    
    def initialize(self):
        """Initialize or refresh the recommendation models."""
        # Load all books
        books = sheets_service.get_all('books')
        self.books_data = books
        self.book_id_to_idx = {book['id']: idx for idx, book in enumerate(books)}
        
        # Load authors and publishers for enrichment
        authors = sheets_service.get_all('authors')
        publishers = sheets_service.get_all('publishers')
        self.authors_cache = {a['id']: a for a in authors}
        self.publishers_cache = {p['id']: p for p in publishers}
        
        if len(books) > 0:
            self._build_tfidf_model()
            self._build_collaborative_model()
    
    def _enrich_book(self, book):
        """Add author and publisher info to book."""
        book_copy = dict(book)
        author_id = book.get('author_id')
        publisher_id = book.get('publisher_id')
        
        if author_id and author_id in self.authors_cache:
            author = self.authors_cache[author_id]
            book_copy['author_name'] = author.get('name')
            book_copy['author_name_thai'] = author.get('name_thai')
        else:
            book_copy['author_name'] = None
            book_copy['author_name_thai'] = None
            
        if publisher_id and publisher_id in self.publishers_cache:
            publisher = self.publishers_cache[publisher_id]
            book_copy['publisher_name'] = publisher.get('name')
            book_copy['publisher_name_thai'] = publisher.get('name_thai')
        else:
            book_copy['publisher_name'] = None
            book_copy['publisher_name_thai'] = None
        
        return book_copy
    
    def _build_tfidf_model(self):
        """Build TF-IDF model for content-based filtering."""
        # Create text corpus from book metadata
        corpus = []
        for book in self.books_data:
            author_id = book.get('author_id')
            author = self.authors_cache.get(author_id, {})
            
            text_parts = [
                book.get('title') or '',
                book.get('title_thai') or '',
                book.get('description') or '',
                book.get('description_thai') or '',
                book.get('type') or '',
                ' '.join(book.get('tags') or []),
                ' '.join(book.get('genres') or []),
                author.get('name') or '',
                author.get('name_thai') or ''
            ]
            corpus.append(' '.join(text_parts).lower())
        
        # Build TF-IDF vectorizer
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(corpus)
    
    def _build_collaborative_model(self):
        """Build collaborative filtering model using user-item interactions."""
        # Get all user interactions
        reviews = sheets_service.get_all('reviews')
        favorites = sheets_service.get_all('favorites')
        history = sheets_service.get_all('reading_history')
        
        if not reviews and not favorites and not history:
            return
        
        # Collect all users and books
        user_ids = set()
        for r in reviews:
            user_ids.add(r.get('user_id'))
        for f in favorites:
            user_ids.add(f.get('user_id'))
        for h in history:
            user_ids.add(h.get('user_id'))
        
        user_ids = list(filter(None, user_ids))
        book_ids = [b['id'] for b in self.books_data]
        
        if len(user_ids) == 0 or len(book_ids) == 0:
            return
        
        user_to_idx = {uid: idx for idx, uid in enumerate(user_ids)}
        book_to_idx = {bid: idx for idx, bid in enumerate(book_ids)}
        
        # Build user-item matrix
        n_users = len(user_ids)
        n_books = len(book_ids)
        self.user_item_matrix = np.zeros((n_users, n_books))
        
        # Fill with ratings
        for review in reviews:
            user_id = review.get('user_id')
            book_id = review.get('book_id')
            rating = review.get('rating', 0)
            if user_id in user_to_idx and book_id in book_to_idx:
                u_idx = user_to_idx[user_id]
                b_idx = book_to_idx[book_id]
                self.user_item_matrix[u_idx, b_idx] = rating
        
        # Fill with favorites (implicit rating of 4)
        for fav in favorites:
            user_id = fav.get('user_id')
            book_id = fav.get('book_id')
            if user_id in user_to_idx and book_id in book_to_idx:
                u_idx = user_to_idx[user_id]
                b_idx = book_to_idx[book_id]
                if self.user_item_matrix[u_idx, b_idx] == 0:
                    self.user_item_matrix[u_idx, b_idx] = 4
        
        # Fill with reading history (implicit rating based on view count)
        for hist in history:
            user_id = hist.get('user_id')
            book_id = hist.get('book_id')
            view_count = hist.get('view_count', 1)
            if user_id in user_to_idx and book_id in book_to_idx:
                u_idx = user_to_idx[user_id]
                b_idx = book_to_idx[book_id]
                if self.user_item_matrix[u_idx, b_idx] == 0:
                    self.user_item_matrix[u_idx, b_idx] = min(view_count, 3)
        
        self.user_idx_to_id = {idx: uid for uid, idx in user_to_idx.items()}
        self.book_idx_to_id = {idx: bid for bid, idx in book_to_idx.items()}
        self.user_id_to_idx = user_to_idx
        self.book_id_to_idx_collab = book_to_idx
        
        # Apply SVD for dimensionality reduction
        if n_users > 1 and n_books > 1:
            n_components = min(50, n_users - 1, n_books - 1)
            if n_components > 0:
                self.svd_model = TruncatedSVD(n_components=n_components)
                self.user_features = self.svd_model.fit_transform(self.user_item_matrix)
                self.book_features = self.svd_model.components_.T
                
                # Build KNN model on user features
                n_neighbors = min(5, n_users)
                self.knn_model = NearestNeighbors(n_neighbors=n_neighbors, metric='cosine')
                self.knn_model.fit(self.user_features)
    
    def get_content_based_recommendations(self, book_id: str, limit: int = 10) -> list:
        """Get content-based recommendations using TF-IDF and Cosine Similarity."""
        if self.tfidf_matrix is None or book_id not in self.book_id_to_idx:
            return []
        
        book_idx = self.book_id_to_idx[book_id]
        
        # Calculate cosine similarity
        book_vector = self.tfidf_matrix[book_idx]
        similarities = cosine_similarity(book_vector, self.tfidf_matrix).flatten()
        
        # Get top similar books (excluding itself)
        similar_indices = similarities.argsort()[::-1][1:limit+1]
        
        recommendations = []
        for idx in similar_indices:
            if similarities[idx] > 0:
                book = self._enrich_book(self.books_data[idx])
                book['similarity_score'] = float(similarities[idx])
                book['recommendation_type'] = 'content_based'
                recommendations.append(book)
        
        return recommendations
    
    def get_collaborative_recommendations(self, user_id: str, limit: int = 10) -> list:
        """Get collaborative filtering recommendations using KNN and SVD."""
        if (self.user_item_matrix is None or 
            self.knn_model is None or 
            not hasattr(self, 'user_id_to_idx') or
            user_id not in self.user_id_to_idx):
            return []
        
        user_idx = self.user_id_to_idx[user_id]
        user_vector = self.user_features[user_idx].reshape(1, -1)
        
        # Find similar users using KNN
        distances, indices = self.knn_model.kneighbors(user_vector)
        similar_users = indices[0][1:]  # Exclude self
        
        # Aggregate ratings from similar users
        book_scores = {}
        for similar_user_idx in similar_users:
            similarity = 1 - distances[0][list(indices[0]).index(similar_user_idx)]
            for book_idx in range(len(self.books_data)):
                rating = self.user_item_matrix[similar_user_idx, book_idx]
                if rating > 0 and self.user_item_matrix[user_idx, book_idx] == 0:
                    book_id = self.book_idx_to_id.get(book_idx)
                    if book_id:
                        if book_id not in book_scores:
                            book_scores[book_id] = {'score': 0, 'count': 0}
                        book_scores[book_id]['score'] += rating * similarity
                        book_scores[book_id]['count'] += 1
        
        # Calculate predicted ratings
        predictions = []
        for book_id, data in book_scores.items():
            if data['count'] > 0:
                predictions.append({
                    'book_id': book_id,
                    'predicted_rating': data['score'] / data['count']
                })
        
        # Sort by predicted rating
        predictions.sort(key=lambda x: x['predicted_rating'], reverse=True)
        
        # Get book details
        recommendations = []
        for pred in predictions[:limit]:
            book = sheets_service.get_by_id('books', pred['book_id'])
            if book:
                book = self._enrich_book(book)
                book['predicted_rating'] = pred['predicted_rating']
                book['recommendation_type'] = 'collaborative'
                recommendations.append(book)
        
        return recommendations
    
    def get_hybrid_recommendations(self, user_id: str, limit: int = 20) -> list:
        """Get hybrid recommendations combining content-based and collaborative filtering."""
        self.initialize()
        
        content_based = []
        collaborative = []
        
        # Get user's interacted books for content-based recommendations
        favorites = sheets_service.find_by_field('favorites', 'user_id', user_id)
        reviews = [r for r in sheets_service.find_by_field('reviews', 'user_id', user_id) if r.get('rating', 0) >= 4]
        history = sheets_service.find_by_field('reading_history', 'user_id', user_id)[:5]
        
        user_book_ids = set()
        for f in favorites:
            user_book_ids.add(f.get('book_id'))
        for r in reviews:
            user_book_ids.add(r.get('book_id'))
        for h in history:
            user_book_ids.add(h.get('book_id'))
        
        # Get content-based recommendations from user's books
        for book_id in list(user_book_ids)[:5]:
            content_recs = self.get_content_based_recommendations(book_id, 5)
            content_based.extend(content_recs)
        
        # Get collaborative recommendations
        collaborative = self.get_collaborative_recommendations(user_id, limit)
        
        # Combine and deduplicate
        seen_ids = set()
        combined = []
        
        # Interleave results
        max_len = max(len(content_based), len(collaborative))
        for i in range(max_len):
            if i < len(collaborative):
                book = collaborative[i]
                if book['id'] not in seen_ids and book['id'] not in user_book_ids:
                    seen_ids.add(book['id'])
                    book['source'] = 'collaborative'
                    combined.append(book)
            if i < len(content_based):
                book = content_based[i]
                if book['id'] not in seen_ids and book['id'] not in user_book_ids:
                    seen_ids.add(book['id'])
                    book['source'] = 'content'
                    combined.append(book)
        
        return combined[:limit]
    
    def get_popular_recommendations(self, limit: int = 20) -> list:
        """Get popular books as fallback recommendations."""
        books = sheets_service.get_all('books')
        
        # Sort by rating and reviews
        def score(book):
            rating = book.get('average_rating', 0) or 0
            reviews = book.get('total_reviews', 0) or 0
            return rating * 0.4 + reviews * 0.01
        
        sorted_books = sorted(books, key=score, reverse=True)
        
        result = []
        for book in sorted_books[:limit]:
            enriched = self._enrich_book(book)
            enriched['recommendation_type'] = 'popular'
            result.append(enriched)
        
        return result
    
    def get_recommendations(self, user_id: str = None, limit: int = 20) -> list:
        """Get personalized recommendations for a user."""
        if not user_id:
            return self.get_popular_recommendations(limit)
        
        try:
            hybrid_recs = self.get_hybrid_recommendations(user_id, limit)
            
            if len(hybrid_recs) < limit:
                # Fill with popular books
                popular = self.get_popular_recommendations(limit - len(hybrid_recs))
                existing_ids = {r['id'] for r in hybrid_recs}
                additional = [p for p in popular if p['id'] not in existing_ids]
                hybrid_recs.extend(additional[:limit - len(hybrid_recs)])
            
            return hybrid_recs
        except Exception as e:
            print(f"Error getting recommendations: {e}")
            return self.get_popular_recommendations(limit)


# Singleton instance
recommendation_service = RecommendationService()
