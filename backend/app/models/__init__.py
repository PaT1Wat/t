from datetime import datetime
from app import db
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class User(db.Model):
    """User model for authentication and profile."""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    firebase_uid = db.Column(db.String(128), unique=True, nullable=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(100), unique=True, nullable=False)
    display_name = db.Column(db.String(255))
    avatar_url = db.Column(db.Text)
    role = db.Column(db.String(20), default='user')  # user, admin, moderator
    preferred_language = db.Column(db.String(10), default='th')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reviews = db.relationship('Review', backref='user', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'firebase_uid': self.firebase_uid,
            'email': self.email,
            'username': self.username,
            'display_name': self.display_name,
            'avatar_url': self.avatar_url,
            'role': self.role,
            'preferred_language': self.preferred_language,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Author(db.Model):
    """Author model."""
    __tablename__ = 'authors'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    name_thai = db.Column(db.String(255))
    bio = db.Column(db.Text)
    bio_thai = db.Column(db.Text)
    image_url = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    books = db.relationship('Book', backref='author', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'name_thai': self.name_thai,
            'bio': self.bio,
            'bio_thai': self.bio_thai,
            'image_url': self.image_url,
            'book_count': len(self.books) if self.books else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Publisher(db.Model):
    """Publisher model."""
    __tablename__ = 'publishers'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    name_thai = db.Column(db.String(255))
    description = db.Column(db.Text)
    description_thai = db.Column(db.Text)
    website_url = db.Column(db.Text)
    logo_url = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    books = db.relationship('Book', backref='publisher', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'name_thai': self.name_thai,
            'description': self.description,
            'description_thai': self.description_thai,
            'website_url': self.website_url,
            'logo_url': self.logo_url,
            'book_count': len(self.books) if self.books else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Book(db.Model):
    """Book model for manga/novels."""
    __tablename__ = 'books'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    title = db.Column(db.String(500), nullable=False)
    title_thai = db.Column(db.String(500))
    description = db.Column(db.Text)
    description_thai = db.Column(db.Text)
    cover_image_url = db.Column(db.Text)
    type = db.Column(db.String(20))  # manga, novel, light_novel, webtoon
    status = db.Column(db.String(20), default='ongoing')  # ongoing, completed, hiatus, cancelled
    publication_year = db.Column(db.Integer)
    total_chapters = db.Column(db.Integer)
    total_volumes = db.Column(db.Integer)
    author_id = db.Column(db.String(36), db.ForeignKey('authors.id'))
    publisher_id = db.Column(db.String(36), db.ForeignKey('publishers.id'))
    average_rating = db.Column(db.Float, default=0)
    total_reviews = db.Column(db.Integer, default=0)
    tags = db.Column(db.JSON, default=[])  # JSON for SQLite compatibility
    genres = db.Column(db.JSON, default=[])  # JSON for SQLite compatibility
    is_nsfw = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reviews = db.relationship('Review', backref='book', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='book', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'title_thai': self.title_thai,
            'description': self.description,
            'description_thai': self.description_thai,
            'cover_image_url': self.cover_image_url,
            'type': self.type,
            'status': self.status,
            'publication_year': self.publication_year,
            'total_chapters': self.total_chapters,
            'total_volumes': self.total_volumes,
            'author_id': self.author_id,
            'publisher_id': self.publisher_id,
            'author_name': self.author.name if self.author else None,
            'author_name_thai': self.author.name_thai if self.author else None,
            'publisher_name': self.publisher.name if self.publisher else None,
            'publisher_name_thai': self.publisher.name_thai if self.publisher else None,
            'average_rating': self.average_rating,
            'total_reviews': self.total_reviews,
            'tags': self.tags or [],
            'genres': self.genres or [],
            'is_nsfw': self.is_nsfw,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Review(db.Model):
    """Review model for book ratings and comments."""
    __tablename__ = 'reviews'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    book_id = db.Column(db.String(36), db.ForeignKey('books.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text)
    is_spoiler = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=True)
    helpful_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'book_id', name='unique_user_book_review'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'book_id': self.book_id,
            'rating': self.rating,
            'content': self.content,
            'is_spoiler': self.is_spoiler,
            'is_approved': self.is_approved,
            'helpful_count': self.helpful_count,
            'username': self.user.username if self.user else None,
            'display_name': self.user.display_name if self.user else None,
            'avatar_url': self.user.avatar_url if self.user else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Favorite(db.Model):
    """Favorite model for user's saved books."""
    __tablename__ = 'favorites'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    book_id = db.Column(db.String(36), db.ForeignKey('books.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'book_id', name='unique_user_book_favorite'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'book_id': self.book_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class SearchHistory(db.Model):
    """Search history for recommendation improvements."""
    __tablename__ = 'search_history'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    query = db.Column(db.Text, nullable=False)
    filters = db.Column(db.JSON)
    results_count = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ReadingHistory(db.Model):
    """Reading history for collaborative filtering."""
    __tablename__ = 'reading_history'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    book_id = db.Column(db.String(36), db.ForeignKey('books.id'), nullable=False)
    view_count = db.Column(db.Integer, default=1)
    last_viewed_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'book_id', name='unique_user_book_history'),
    )
