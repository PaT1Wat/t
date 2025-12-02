const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateAuthor, validatePagination, validateUUID } = require('../middleware/validation');

// Public routes
router.get('/', validatePagination, authorController.getAllAuthors);
router.get('/:id', validateUUID('id'), authorController.getAuthorById);

// Admin routes
router.post('/', authenticate, requireAdmin, validateAuthor, authorController.createAuthor);
router.put('/:id', authenticate, requireAdmin, validateUUID('id'), authorController.updateAuthor);
router.delete('/:id', authenticate, requireAdmin, validateUUID('id'), authorController.deleteAuthor);

module.exports = router;
