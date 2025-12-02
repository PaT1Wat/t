const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const { validateBook, validatePagination, validateUUID } = require('../middleware/validation');

// Public routes
router.get('/', validatePagination, bookController.getAllBooks);
router.get('/top-rated', bookController.getTopRatedBooks);
router.get('/recent', bookController.getRecentBooks);
router.get('/type/:type', validatePagination, bookController.getBooksByType);
router.get('/:id', optionalAuth, validateUUID('id'), bookController.getBookById);

// Admin routes
router.post('/', authenticate, requireAdmin, validateBook, bookController.createBook);
router.put('/:id', authenticate, requireAdmin, validateUUID('id'), bookController.updateBook);
router.delete('/:id', authenticate, requireAdmin, validateUUID('id'), bookController.deleteBook);

module.exports = router;
