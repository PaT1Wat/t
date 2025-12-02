require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const { initializeFirebase } = require('./config/firebase');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase
if (process.env.NODE_ENV !== 'test') {
  initializeFirebase();
}

// API Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Manga/Novel Recommendation API',
    version: '1.0.0',
    description: 'API สำหรับระบบแนะนำมังงะและนิยาย',
    endpoints: {
      health: '/api/health',
      books: '/api/books',
      authors: '/api/authors',
      publishers: '/api/publishers',
      reviews: '/api/reviews',
      favorites: '/api/favorites',
      search: '/api/search',
      users: '/api/users'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'ไม่พบเส้นทางที่ร้องขอ'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์'
  });
});

module.exports = app;
