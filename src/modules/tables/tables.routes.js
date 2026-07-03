const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createTable,
  getTables,
  getTable,
  getTablesByRestaurant,
  getAvailableTables,
  updateTable,
  updateTableStatus,
  deleteTable
} = require('./tables.controller');
const { protect, authorize } = require('../../middleware/auth');


// Validation rules
const tableValidation = [
  body('restaurant_id').notEmpty().withMessage('Restaurant ID is required'),
  body('table_number').notEmpty().withMessage('Table number is required'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer')
];

// Routes
router.route('/')
  .post(protect, authorize('admin'), tableValidation, createTable)
  .get(protect, getTables);

router.get('/available/:restaurantId', protect, getAvailableTables);
router.get('/restaurant/:restaurantId', protect, getTablesByRestaurant);

router.route('/:id')
  .get(protect, getTable)
  .put(protect, authorize('admin'), tableValidation, updateTable)
  .delete(protect, authorize('admin'), deleteTable);

router.patch('/:id/status', protect, updateTableStatus);

module.exports = router;
