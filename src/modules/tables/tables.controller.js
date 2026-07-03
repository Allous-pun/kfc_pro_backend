const Table = require('./tables.model');
const { validationResult } = require('express-validator');

// @desc    Create a table
// @route   POST /api/tables
// @access  Private/Admin
const createTable = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const table = await Table.create(req.body);
    const newTable = await Table.findById(table.insertId);

    res.status(201).json({
      success: true,
      data: newTable
    });
  } catch (error) {
    console.error(error);
    // Handle duplicate table_number error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        message: 'Table number already exists in this restaurant' 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private
const getTables = async (req, res) => {
  try {
    const { restaurant_id, status } = req.query;
    const tables = await Table.findAll({ restaurant_id, status });
    
    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Private
const getTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.status(200).json({
      success: true,
      data: table
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get tables by restaurant
// @route   GET /api/tables/restaurant/:restaurantId
// @access  Private
const getTablesByRestaurant = async (req, res) => {
  try {
    const tables = await Table.findByRestaurant(req.params.restaurantId);
    
    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get available tables
// @route   GET /api/tables/available/:restaurantId
// @access  Private
const getAvailableTables = async (req, res) => {
  try {
    const tables = await Table.findAvailable(req.params.restaurantId);
    
    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Private/Admin
const updateTable = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    await Table.update(req.params.id, req.body);
    const updatedTable = await Table.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedTable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update table status
// @route   PATCH /api/tables/:id/status
// @access  Private
const updateTableStatus = async (req, res) => {
  try {
    const { status, order_id } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    await Table.updateStatus(req.params.id, status, order_id);
    const updatedTable = await Table.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedTable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private/Admin
const deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    await Table.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTable,
  getTables,
  getTable,
  getTablesByRestaurant,
  getAvailableTables,
  updateTable,
  updateTableStatus,
  deleteTable
};
