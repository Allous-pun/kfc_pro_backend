const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createRestaurant,
  getRestaurants,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant
} = require('./restaurants.controller');
const { protect, authorize } = require('../../middleware/auth');

// Validation rules
const restaurantValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isString().withMessage('Phone must be a string')
];

// Routes
router.route('/')
  .post(protect, authorize('admin'), restaurantValidation, createRestaurant)
  .get(protect, getRestaurants);

router.route('/:id')
  .get(protect, getRestaurant)
  .put(protect, authorize('admin'), restaurantValidation, updateRestaurant)
  .delete(protect, authorize('admin'), deleteRestaurant);

module.exports = router;
