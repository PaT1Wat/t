# MangaRec - ระบบแนะนำมังงะและนิยาย

ระบบแนะนำหนังสือมังงะและนิยายอัจฉริยะ พัฒนาด้วย AI ที่เข้าใจรสนิยมของผู้ใช้

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
- **Content-Based Filtering** - TF-IDF + Cosine Similarity สำหรับหาหนังสือที่คล้ายกัน
- **Collaborative Filtering** - KNN + SVD สำหรับแนะนำจากพฤติกรรมผู้ใช้
- **Hybrid Approach** - ผสมผสานทั้งสองวิธีเพื่อคำแนะนำที่แม่นยำ

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - RESTful API
- **PostgreSQL** - Database
- **Firebase Admin SDK** - Authentication
- **Natural.js** - TF-IDF และ Text Processing
- **ml-knn** - K-Nearest Neighbors

### Frontend
- **React** + **TypeScript** - UI Framework
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Firebase** - Authentication
- **Axios** - HTTP Client

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Database & Firebase config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth & Validation
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (Recommendations, Search)
│   │   ├── app.js          # Express app
│   │   └── server.js       # Entry point
│   ├── tests/              # API tests
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Page components
    │   ├── services/       # API & Firebase services
    │   ├── context/        # React Context (Auth)
    │   ├── types/          # TypeScript types
    │   └── App.tsx         # Main app component
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Firebase Project (for authentication)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/manga_recommendation
FIREBASE_PROJECT_ID=your-firebase-project-id
CORS_ORIGIN=http://localhost:3000
```

5. Initialize database (tables are auto-created on first run):
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure Firebase:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

5. Start development server:
```bash
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

### Books
- `GET /api/books` - List all books
- `GET /api/books/:id` - Get book details
- `GET /api/books/type/:type` - Get books by type
- `GET /api/books/top-rated` - Get top rated books
- `GET /api/books/recent` - Get recently added books

### Search & Recommendations
- `GET /api/search` - Search books with filters
- `GET /api/search/autocomplete` - Autocomplete suggestions
- `GET /api/search/recommendations` - Personalized recommendations
- `GET /api/search/similar/:bookId` - Similar books
- `GET /api/search/filters` - Available filter options

### Reviews
- `GET /api/reviews/book/:bookId` - Get book reviews
- `POST /api/reviews/book/:bookId` - Create review
- `PUT /api/reviews/:reviewId` - Update review
- `DELETE /api/reviews/:reviewId` - Delete review

### Favorites
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites/:bookId` - Add to favorites
- `DELETE /api/favorites/:bookId` - Remove from favorites

## 🗄️ Database Schema

### Tables
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
npm test

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