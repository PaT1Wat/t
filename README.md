# MangaRec - ระบบแนะนำมังงะและนิยาย

ระบบแนะนำหนังสือมังงะและนิยายอัจฉริยะ พัฒนาด้วย **Python Backend** + **React Frontend** + **Google Sheets** สำหรับจัดเก็บข้อมูล

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
- **Google Sheets API** - Data Storage (gspread)
- **Firebase Admin SDK** - Authentication
- **scikit-learn** - TF-IDF, Cosine Similarity, KNN, SVD
- **pandas/numpy** - Data Processing

### Frontend (React + JavaScript + CSS)
- **React 18** - UI Library
- **React Router** - Navigation
- **TailwindCSS** - Styling (via CDN)
- **Axios** - HTTP Client
- **Firebase SDK** - Authentication

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── routes/           # API route blueprints
│   │   ├── services/         # Google Sheets, Recommendation & Search
│   │   ├── utils/            # Auth & Validation helpers
│   │   └── __init__.py       # Flask app factory
│   ├── tests/                # pytest tests
│   ├── requirements.txt
│   └── run.py                # Entry point
│
└── frontend/
    ├── public/               # Static assets
    ├── src/
    │   ├── components/       # React components
    │   ├── pages/            # Page components
    │   ├── services/         # API & Firebase services
    │   ├── context/          # Auth context
    │   ├── styles/           # CSS styles
    │   └── App.js            # Main app component
    ├── package.json
    └── .env.example
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+ & npm
- Google Cloud Project with Sheets API enabled
- Firebase Project (for authentication)

### Google Sheets Setup

1. Create a new Google Spreadsheet
2. Enable Google Sheets API in Google Cloud Console
3. Create a Service Account and download JSON credentials
4. Share the spreadsheet with the service account email

The system will automatically create these sheets:
- Users, Books, Authors, Publishers, Reviews, Favorites, SearchHistory, ReadingHistory

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
# Google Sheets
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}
# Or use file path:
GOOGLE_CREDENTIALS_FILE=./credentials.json
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id

# Firebase
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}

# App
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000
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

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure Firebase:
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

5. Run the development server:
```bash
npm start
```

The web UI will be available at `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile

### Books
- `GET /api/books` - List all books
- `GET /api/books/<id>` - Get book details
- `GET /api/books/<id>/similar` - Get similar books
- `GET /api/books/recommendations` - Personalized recommendations
- `POST /api/books` - Create book (admin)
- `PUT /api/books/<id>` - Update book (admin)
- `DELETE /api/books/<id>` - Delete book (admin)

### Search
- `GET /api/search?q=query` - Search books with filters
- `GET /api/search/autocomplete?q=query` - Autocomplete suggestions
- `GET /api/search/genres` - Available genres
- `GET /api/search/tags` - Available tags

### Reviews
- `GET /api/reviews/book/<book_id>` - Get book reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/<id>` - Update review
- `DELETE /api/reviews/<id>` - Delete review

### Favorites
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/<book_id>` - Remove from favorites

## 🗄️ Data Schema (Google Sheets)

### Sheets
- **Users** - User accounts (id, firebase_uid, email, username, display_name, role, ...)
- **Books** - Book information (id, title, title_thai, description, type, status, genres, tags, ...)
- **Authors** - Author information (id, name, name_thai, bio, ...)
- **Publishers** - Publisher information
- **Reviews** - User reviews and ratings
- **Favorites** - User favorite books
- **SearchHistory** - Search history for recommendations
- **ReadingHistory** - Reading behavior tracking

## 🌐 Thai Language Support

- Full-text search supports Thai characters
- All UI text in Thai
- Thai fonts (Noto Sans Thai) for better readability
- Dual language support for book titles and descriptions

## 🧪 Testing

```bash
# Backend tests
cd backend
pip install pytest
pytest

# Frontend tests
cd frontend
npm test
```

## 📝 License

ISC License

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request