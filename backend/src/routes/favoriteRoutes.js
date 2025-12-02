const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/auth');
const { validatePagination, validateUUID } = require('../middleware/validation');

// Protected routes (require authentication)
router.get('/', authenticate, validatePagination, favoriteController.getFavorites);
router.post('/:bookId', authenticate, validateUUID('bookId'), favoriteController.addFavorite);
router.delete('/:bookId', authenticate, validateUUID('bookId'), favoriteController.removeFavorite);
router.get('/check/:bookId', authenticate, validateUUID('bookId'), favoriteController.checkFavorite);

// Public route
router.get('/count/:bookId', validateUUID('bookId'), favoriteController.getBookFavoriteCount);

module.exports = router;
