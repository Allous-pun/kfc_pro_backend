const Restaurant = require('./restaurants.model');
const { validationResult } = require('express-validator');

// @desc    Create a restaurant
// @route   POST /api/restaurants
// @access  Private/Admin
const createRestaurant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const restaurant = await Restaurant.create(req.body);
    const newRestaurant = await Restaurant.findById(restaurant.insertId);

    res.status(201).json({
      success: true,
      data: newRestaurant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Private
const getRestaurants = async (req, res) => {
  try {
    const { status } = req.query;
    const restaurants = await Restaurant.findAll({ status });
    
    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Private
const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private/Admin
const updateRestaurant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    await Restaurant.update(req.params.id, req.body);
    const updatedRestaurant = await Restaurant.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedRestaurant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private/Admin
const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    await Restaurant.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createRestaurant,
  getRestaurants,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant
};
