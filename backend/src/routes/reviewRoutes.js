const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate, requireModerator } = require('../middleware/auth');
const { validateReview, validatePagination, validateUUID } = require('../middleware/validation');

// Public routes
router.get('/book/:bookId', validateUUID('bookId'), validatePagination, reviewController.getBookReviews);

// Protected routes
router.post('/book/:bookId', authenticate, validateUUID('bookId'), validateReview, reviewController.createReview);
router.get('/my-reviews', authenticate, validatePagination, reviewController.getUserReviews);
router.put('/:reviewId', authenticate, validateUUID('reviewId'), reviewController.updateReview);
router.delete('/:reviewId', authenticate, validateUUID('reviewId'), reviewController.deleteReview);
router.post('/:reviewId/helpful', authenticate, validateUUID('reviewId'), reviewController.markReviewHelpful);

// Moderator routes
router.get('/pending', authenticate, requireModerator, validatePagination, reviewController.getPendingReviews);
router.put('/:reviewId/moderate', authenticate, requireModerator, validateUUID('reviewId'), reviewController.moderateReview);

module.exports = router;
