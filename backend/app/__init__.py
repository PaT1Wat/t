import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # Initialize CORS
    CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))
    
    # Register blueprints
    from app.routes import users, books, authors, publishers, reviews, favorites, search
    
    app.register_blueprint(users.bp, url_prefix='/api/users')
    app.register_blueprint(books.bp, url_prefix='/api/books')
    app.register_blueprint(authors.bp, url_prefix='/api/authors')
    app.register_blueprint(publishers.bp, url_prefix='/api/publishers')
    app.register_blueprint(reviews.bp, url_prefix='/api/reviews')
    app.register_blueprint(favorites.bp, url_prefix='/api/favorites')
    app.register_blueprint(search.bp, url_prefix='/api/search')
    
    # Health check endpoint
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'API is running'}
    
    # Root endpoint
    @app.route('/')
    def index():
        return {
            'name': 'Manga/Novel Recommendation API',
            'version': '2.0.0',
            'description': 'API สำหรับระบบแนะนำมังงะและนิยาย (Google Sheets Backend)',
            'language': 'Python/Flask',
            'data_source': 'Google Sheets'
        }
    
    return app
