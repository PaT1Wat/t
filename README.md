# MangaRec - ระบบแนะนำมังงะและนิยาย

ระบบแนะนำหนังสือมังงะและนิยายอัจฉริยะ พัฒนาด้วย **Python** + AI ที่เข้าใจรสนิยมของผู้ใช้

## 🌟 Features

### User Features
- 🔐 **Authentication** - เข้าสู่ระบบด้วย Email หรือ Google (Firebase Auth)
- 🔍 **Search** - ค้นหาแบบ Full-text พร้อม Autocomplete รองรับภาษาไทย
- 🏷️ **Filters** - กรองตามประเภท, หมวดหมู่, แท็ก, คะแนน และอื่นๆ
- 📖 **Book Details** - ดูรายละเอียดหนังสือ, รีวิว และหนังสือที่คล้ายกัน
- ❤️ **Favorites** - บันทึกหนังสือที่ชอบ
- ⭐ **Reviews** - เขียนรีวิวและให้คะแนน
- 🎯 **Recommendations** - รับคำแนะนำหนังสือที่ตรงใจจาก AI

### Admin Features
- 📚 **Book Management** - เพิ่ม/แก้ไข/ลบหนังสือ
- 👤 **Author Management** - จัดการข้อมูลผู้แต่ง
- 🏢 **Publisher Management** - จัดการข้อมูลสำนักพิมพ์
- 🛡️ **Review Moderation** - ตรวจสอบและอนุมัติรีวิว

### AI Recommendation System
- **Content-Based Filtering** - TF-IDF + Cosine Similarity สำหรับหาหนังสือที่คล้ายกัน (scikit-learn)
- **Collaborative Filtering** - KNN + SVD สำหรับแนะนำจากพฤติกรรมผู้ใช้ (scikit-learn)
- **Hybrid Approach** - ผสมผสานทั้งสองวิธีเพื่อคำแนะนำที่แม่นยำ

## 🛠️ Tech Stack

### Backend (Python)
- **Flask** - Web Framework
- **Flask-SQLAlchemy** - ORM for PostgreSQL
- **PostgreSQL** - Database
- **Firebase Admin SDK** - Authentication
- **scikit-learn** - TF-IDF, Cosine Similarity, KNN, SVD
- **pandas/numpy** - Data Processing

### Frontend (Python + HTML/JS)
- **Flask** - Web Templates
- **TailwindCSS** - Styling (via CDN)
- **Vanilla JavaScript** - Interactivity

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── models/           # SQLAlchemy models
│   │   ├── routes/           # API route blueprints
│   │   ├── services/         # Recommendation & Search services
│   │   ├── utils/            # Auth & Validation helpers
│   │   └── __init__.py       # Flask app factory
│   ├── tests/                # pytest tests
│   ├── requirements.txt
│   └── run.py                # Entry point
│
└── frontend/
    ├── templates/            # Jinja2 templates
    │   ├── base.html
    │   ├── home.html
    │   ├── search.html
    │   ├── book_detail.html
    │   └── ...
    ├── static/               # CSS & JS files
    ├── requirements.txt
    └── app.py                # Frontend Flask app
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- PostgreSQL 14+
- Firebase Project (for authentication)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file from example:
```bash
cp .env.example .env
```

5. Configure environment variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/manga_recommendation
FIREBASE_PROJECT_ID=your-firebase-project-id
SECRET_KEY=your-secret-key
```

6. Run the server:
```bash
python run.py
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the frontend:
```bash
python app.py
```

The web UI will be available at `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

### Books
- `GET /api/books` - List all books
- `GET /api/books/<id>` - Get book details
- `GET /api/books/type/<type>` - Get books by type
- `GET /api/books/top-rated` - Get top rated books
- `GET /api/books/recent` - Get recently added books

### Search & Recommendations
- `GET /api/search/` - Search books with filters
- `GET /api/search/autocomplete` - Autocomplete suggestions
- `GET /api/search/recommendations` - Personalized recommendations
- `GET /api/search/similar/<book_id>` - Similar books
- `GET /api/search/filters` - Available filter options

### Reviews
- `GET /api/reviews/book/<book_id>` - Get book reviews
- `POST /api/reviews/book/<book_id>` - Create review
- `PUT /api/reviews/<review_id>` - Update review
- `DELETE /api/reviews/<review_id>` - Delete review

### Favorites
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites/<book_id>` - Add to favorites
- `DELETE /api/favorites/<book_id>` - Remove from favorites

## 🗄️ Database Schema

### Tables (SQLAlchemy Models)
- **users** - User accounts
- **books** - Book information
- **authors** - Author information
- **publishers** - Publisher information
- **reviews** - User reviews and ratings
- **favorites** - User favorite books
- **search_history** - Search history for recommendations
- **reading_history** - Reading behavior tracking

## 🌐 Thai Language Support

- Full-text search supports Thai characters
- All UI text in Thai
- Thai fonts (Sarabun) for better readability
- Dual language support for book titles and descriptions

## 🧪 Testing

```bash
# Backend tests
cd backend
pip install pytest
pytest
```

## 📝 License

ISC License

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request