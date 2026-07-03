const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getUserStats
} = require('./users.controller');
const { protect, authorize } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

// Validation rules
const updateUserValidation = [
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('role_id').optional().notEmpty().withMessage('Role ID is required'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
];

// Routes
router.get('/stats', protect, authorize('admin'), getUserStats);
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, authorize('admin'), getUser);
router.put('/:id', protect, authorize('admin'), upload.single('profileImage'), updateUserValidation, updateUser);
router.patch('/:id/status', protect, authorize('admin'), updateUserStatus);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
