const express = require('express');
const router = express.Router();
const publisherController = require('../controllers/publisherController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validatePublisher, validatePagination, validateUUID } = require('../middleware/validation');

// Public routes
router.get('/', validatePagination, publisherController.getAllPublishers);
router.get('/:id', validateUUID('id'), publisherController.getPublisherById);

// Admin routes
router.post('/', authenticate, requireAdmin, validatePublisher, publisherController.createPublisher);
router.put('/:id', authenticate, requireAdmin, validateUUID('id'), publisherController.updatePublisher);
router.delete('/:id', authenticate, requireAdmin, validateUUID('id'), publisherController.deletePublisher);

module.exports = router;
