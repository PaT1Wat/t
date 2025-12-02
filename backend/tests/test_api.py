"""Basic API tests."""

import pytest
import os
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import create_app, db


@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'


def test_root_endpoint(client):
    """Test root endpoint."""
    response = client.get('/')
    assert response.status_code == 200
    assert response.json['name'] == 'Manga/Novel Recommendation API'
    assert response.json['language'] == 'Python/Flask'


def test_invalid_uuid(client):
    """Test invalid UUID handling."""
    response = client.get('/api/books/invalid-uuid')
    assert response.status_code == 400
    assert 'error' in response.json


def test_book_not_found(client):
    """Test book not found handling."""
    response = client.get('/api/books/12345678-1234-1234-1234-123456789012')
    assert response.status_code == 404


def test_get_all_books_empty(client):
    """Test getting all books when empty."""
    response = client.get('/api/books/')
    assert response.status_code == 200
    assert 'books' in response.json
    assert 'pagination' in response.json
