const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validatePagination, validateUUID } = require('../middleware/validation');

// Public routes
router.get('/', optionalAuth, validatePagination, searchController.searchBooks);
router.get('/autocomplete', searchController.getAutocomplete);
router.get('/popular-searches', searchController.getPopularSearches);
router.get('/filters', searchController.getFilters);

// Recommendation routes
router.get('/recommendations', optionalAuth, searchController.getRecommendations);
router.get('/similar/:bookId', validateUUID('bookId'), searchController.getSimilarBooks);
router.get('/popular', searchController.getPopularBooks);

// Protected routes
router.get('/recent-searches', authenticate, searchController.getRecentSearches);

module.exports = router;
