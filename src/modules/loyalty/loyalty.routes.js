const express = require('express');
const router = express.Router();
const {
  getLoyaltyByCustomer,
  getLoyaltyRecords,
  getTierStats,
  getLoyaltyStats
} = require('./loyalty.controller');
const { protect, authorize } = require('../../middleware/auth');

// Protected routes
router.get('/stats', protect, authorize('admin', 'manager'), getLoyaltyStats);
router.get('/stats/tiers', protect, authorize('admin', 'manager'), getTierStats);
router.get('/', protect, authorize('admin', 'manager'), getLoyaltyRecords);
router.get('/customer/:customerId', protect, getLoyaltyByCustomer);

module.exports = router;