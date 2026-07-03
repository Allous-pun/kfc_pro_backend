const Permission = require('./permissions.model');
const { validationResult } = require('express-validator');

// @desc    Create a permission
// @route   POST /api/permissions
// @access  Private/Admin
const createPermission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, resource, action, description } = req.body;

    // Check if permission already exists
    const existing = await Permission.findByResourceAction(resource, action);
    if (existing) {
      return res.status(400).json({ message: 'Permission already exists for this resource and action' });
    }

    const result = await Permission.create({ name, resource, action, description });
    const permission = await Permission.findById(result.insertId);

    res.status(201).json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all permissions
// @route   GET /api/permissions
// @access  Private
const getPermissions = async (req, res) => {
  try {
    const { resource } = req.query;
    const permissions = await Permission.findAll({ resource });
    
    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single permission
// @route   GET /api/permissions/:id
// @access  Private
const getPermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    const roles = await Permission.getRoles(req.params.id);

    res.status(200).json({
      success: true,
      data: {
        ...permission,
        roles
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update permission
// @route   PUT /api/permissions/:id
// @access  Private/Admin
const updatePermission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    await Permission.update(req.params.id, req.body);
    const updatedPermission = await Permission.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedPermission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete permission
// @route   DELETE /api/permissions/:id
// @access  Private/Admin
const deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    await Permission.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all resources
// @route   GET /api/permissions/resources
// @access  Private
const getResources = async (req, res) => {
  try {
    const resources = await Permission.getResources();
    
    res.status(200).json({
      success: true,
      data: resources
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPermission,
  getPermissions,
  getPermission,
  updatePermission,
  deletePermission,
  getResources
};