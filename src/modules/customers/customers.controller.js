const Customer = require('./customers.model');
const { validationResult } = require('express-validator');

// @desc    Create a new customer (auto-creates loyalty record)
const createCustomer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { restaurant_id, phone, email, first_name, last_name, birth_date, dietary_preferences } = req.body;

    // Check if customer already exists by phone
    if (phone) {
      const existing = await Customer.findByPhone(restaurant_id, phone);
      if (existing) {
        return res.status(400).json({ 
          message: 'Customer already exists with this phone number',
          customer: existing 
        });
      }
    }

    // Check if customer already exists by email
    if (email) {
      const existing = await Customer.findByEmail(restaurant_id, email);
      if (existing) {
        return res.status(400).json({ 
          message: 'Customer already exists with this email',
          customer: existing 
        });
      }
    }

    const result = await Customer.create({
      restaurant_id,
      phone,
      email,
      first_name,
      last_name,
      birth_date,
      dietary_preferences
    });

    const customer = await Customer.getWithLoyalty(result.insertId);

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all customers
const getCustomers = async (req, res) => {
  try {
    const { restaurant_id, loyalty_tier, search, min_spent, limit, offset } = req.query;
    const customers = await Customer.findAll({ 
      restaurant_id, 
      loyalty_tier, 
      search, 
      min_spent,
      limit: limit || 100,
      offset: offset || 0
    });
    
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get customer by ID with full loyalty data
const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.getWithLoyalty(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const orders = await Customer.getOrderHistory(req.params.id);
    const transactions = await Customer.getLoyaltyTransactions(req.params.id);

    res.status(200).json({
      success: true,
      data: {
        ...customer,
        orders,
        loyalty_transactions: transactions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Find customer by phone/email/search
const searchCustomer = async (req, res) => {
  try {
    const { phone, email, search } = req.query;
    const { restaurant_id } = req.query;

    if (!restaurant_id) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    let customer = null;
    if (phone) {
      customer = await Customer.findByPhone(restaurant_id, phone);
    } else if (email) {
      customer = await Customer.findByEmail(restaurant_id, email);
    } else if (search) {
      const results = await Customer.search(restaurant_id, search);
      return res.status(200).json({
        success: true,
        count: results.length,
        data: results
      });
    }

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update customer
const updateCustomer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await Customer.update(req.params.id, req.body);
    const updatedCustomer = await Customer.getWithLoyalty(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedCustomer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add loyalty points (earn)
const addLoyaltyPoints = async (req, res) => {
  try {
    const { points, amount_spent, order_id, description } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({ message: 'Valid points amount is required' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const loyalty = await Customer.addLoyaltyPoints(
      req.params.id, 
      points, 
      amount_spent || 0, 
      order_id || null,
      description || `Earned ${points} loyalty points`
    );

    const updatedCustomer = await Customer.getWithLoyalty(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedCustomer,
      loyalty: loyalty,
      message: `Added ${points} loyalty points`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Redeem loyalty points
const redeemPoints = async (req, res) => {
  try {
    const { points, order_id, description } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({ message: 'Valid points amount is required' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const loyalty = await Customer.redeemPoints(
      req.params.id, 
      points, 
      order_id || null,
      description || `Redeemed ${points} loyalty points`
    );

    const updatedCustomer = await Customer.getWithLoyalty(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedCustomer,
      loyalty: loyalty,
      message: `Redeemed ${points} loyalty points`
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get loyalty summary
const getLoyaltySummary = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const summary = await Customer.getLoyaltySummary(req.params.id);
    const transactions = await Customer.getLoyaltyTransactions(req.params.id, 20);

    res.status(200).json({
      success: true,
      data: {
        summary,
        recent_transactions: transactions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update customer preferences
const updatePreferences = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await Customer.upsertPreferences(req.params.id, req.body);
    const updatedCustomer = await Customer.getWithPreferences(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedCustomer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get customer statistics
const getCustomerStats = async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    const stats = await Customer.getStats(restaurant_id);
    const tierDistribution = await Customer.getTierDistribution(restaurant_id);

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        tier_distribution: tierDistribution
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await Customer.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Customer and associated loyalty data deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
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
};