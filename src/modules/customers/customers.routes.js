const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createCustomer,
  getCustomers,
  getCustomer,
  searchCustomer,
  updateCustomer,
  addLoyaltyPoints,
  redeemPoints,
  getLoyaltySummary,
  updatePreferences,
  getCustomerStats,
  deleteCustomer
} = require('./customers.controller');
const { protect, authorize } = require('../../middleware/auth');

// Validation rules
const createCustomerValidation = [
  body('restaurant_id').notEmpty().withMessage('Restaurant ID is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('first_name').optional().isString(),
  body('last_name').optional().isString(),
  body('birth_date').optional().isDate().withMessage('Invalid date format'),
  body('dietary_preferences').optional().isObject()
];

const updateCustomerValidation = [
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('first_name').optional().isString(),
  body('last_name').optional().isString()
];

const pointsValidation = [
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('amount_spent').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('order_id').optional().isString(),
  body('description').optional().isString()
];

// Public routes (no auth required for customer creation/search)
router.post('/', createCustomerValidation, createCustomer);
router.get('/search', searchCustomer);

// Protected routes
router.get('/stats', protect, authorize('admin', 'manager'), getCustomerStats);
router.get('/', protect, getCustomers);
router.get('/:id', protect, getCustomer);
router.get('/:id/loyalty', protect, getLoyaltySummary);
router.put('/:id', protect, updateCustomerValidation, updateCustomer);
router.put('/:id/preferences', protect, updatePreferences);
router.post('/:id/loyalty/earn', protect, pointsValidation, addLoyaltyPoints);
router.post('/:id/loyalty/redeem', protect, pointsValidation, redeemPoints);
router.delete('/:id', protect, authorize('admin'), deleteCustomer);

module.exports = router;