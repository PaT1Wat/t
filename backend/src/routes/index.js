const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const bookRoutes = require('./bookRoutes');
const authorRoutes = require('./authorRoutes');
const publisherRoutes = require('./publisherRoutes');
const reviewRoutes = require('./reviewRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const searchRoutes = require('./searchRoutes');

// API Routes
router.use('/users', userRoutes);
router.use('/books', bookRoutes);
router.use('/authors', authorRoutes);
router.use('/publishers', publisherRoutes);
router.use('/reviews', reviewRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/search', searchRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
