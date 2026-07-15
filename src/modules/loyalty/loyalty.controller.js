const Loyalty = require('./loyalty.model');
const { validationResult } = require('express-validator');

// @desc    Get loyalty details for a customer
// @route   GET /api/loyalty/customer/:customerId
// @access  Private
const getLoyaltyByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const loyalty = await Loyalty.getWithCustomer(customerId);
    if (!loyalty) {
      return res.status(404).json({ message: 'Loyalty record not found for this customer' });
    }

    res.status(200).json({
      success: true,
      data: loyalty
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all loyalty records
// @route   GET /api/loyalty
// @access  Private/Admin
const getLoyaltyRecords = async (req, res) => {
  try {
    const { restaurant_id, tier, min_points, search, limit, offset } = req.query;
    
    const records = await Loyalty.findAll({
      restaurant_id,
      tier,
      min_points,
      search,
      limit: limit || 100,
      offset: offset || 0
    });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get loyalty tier statistics
// @route   GET /api/loyalty/stats/tiers
// @access  Private/Admin
const getTierStats = async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    const stats = await Loyalty.getTierStats(restaurant_id);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get overall loyalty statistics
// @route   GET /api/loyalty/stats
// @access  Private/Admin
const getLoyaltyStats = async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    const stats = await Loyalty.getStats(restaurant_id);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getLoyaltyByCustomer,
  getLoyaltyRecords,
  getTierStats,
  getLoyaltyStats
};