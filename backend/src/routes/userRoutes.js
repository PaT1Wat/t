const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validatePagination, validateUUID } = require('../middleware/validation');

// Public routes
router.post('/register', userController.registerUser);

// Protected routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.get('/stats', authenticate, userController.getUserStats);

// Admin routes
router.get('/', authenticate, requireAdmin, validatePagination, userController.getAllUsers);
router.put('/:userId/role', authenticate, requireAdmin, validateUUID('userId'), userController.updateUserRole);

module.exports = router;
