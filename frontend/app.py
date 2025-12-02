"""
Frontend Flask application with templates.
Serves the web UI for the manga/novel recommendation system.
"""

import os
from flask import Flask, render_template, request, redirect, url_for
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

# API URL for backend
API_URL = os.getenv('API_URL', 'http://localhost:5000/api')


@app.route('/')
def home():
    """Home page with recommendations."""
    return render_template('home.html', api_url=API_URL)


@app.route('/search')
def search():
    """Search page with filters."""
    query = request.args.get('q', '')
    return render_template('search.html', query=query, api_url=API_URL)


@app.route('/book/<book_id>')
def book_detail(book_id):
    """Book detail page."""
    return render_template('book_detail.html', book_id=book_id, api_url=API_URL)


@app.route('/login')
def login():
    """Login page."""
    return render_template('login.html', api_url=API_URL)


@app.route('/register')
def register():
    """Register page."""
    return render_template('register.html', api_url=API_URL)


@app.route('/favorites')
def favorites():
    """User favorites page."""
    return render_template('favorites.html', api_url=API_URL)


@app.route('/profile')
def profile():
    """User profile page."""
    return render_template('profile.html', api_url=API_URL)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)
