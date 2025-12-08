"""Basic API tests."""

import pytest
from app import create_app


@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app()
    app.config['TESTING'] = True
    yield app


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
    assert response.json['data_source'] == 'Google Sheets'


def test_get_all_books(client):
    """Test getting all books."""
    response = client.get('/api/books')
    assert response.status_code == 200
    assert 'results' in response.json
    assert 'total' in response.json


def test_search_endpoint(client):
    """Test search endpoint."""
    response = client.get('/api/search?q=test')
    assert response.status_code == 200
    assert 'results' in response.json


def test_autocomplete_endpoint(client):
    """Test autocomplete endpoint."""
    response = client.get('/api/search/autocomplete?q=test')
    assert response.status_code == 200
    assert isinstance(response.json, list)


def test_genres_endpoint(client):
    """Test genres endpoint."""
    response = client.get('/api/search/genres')
    assert response.status_code == 200
    assert isinstance(response.json, list)
