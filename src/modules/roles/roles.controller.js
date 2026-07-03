const Role = require('./roles.model');
const Permission = require('../permissions/permissions.model');
const { validationResult } = require('express-validator');

// @desc    Create a role
// @route   POST /api/roles
// @access  Private/Admin
const createRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { restaurant_id, name, description, is_system } = req.body;

    // Check if role already exists
    const existing = await Role.findByName(restaurant_id, name);
    if (existing) {
      return res.status(400).json({ message: 'Role already exists in this restaurant' });
    }

    const result = await Role.create({ restaurant_id, name, description, is_system });
    const role = await Role.findById(result.insertId);

    res.status(201).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private
const getRoles = async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    const roles = await Role.findAll({ restaurant_id });
    
    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private
const getRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const permissions = await Role.getPermissions(req.params.id);
    const users = await Role.getUsers(req.params.id);

    res.status(200).json({
      success: true,
      data: {
        ...role,
        permissions,
        users
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private/Admin
const updateRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Don't allow updating system roles
    if (role.is_system) {
      return res.status(400).json({ message: 'System roles cannot be modified' });
    }

    await Role.update(req.params.id, req.body);
    const updatedRole = await Role.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedRole
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Don't allow deleting system roles
    if (role.is_system) {
      return res.status(400).json({ message: 'System roles cannot be deleted' });
    }

    await Role.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Assign permission to role
// @route   POST /api/roles/:id/permissions
// @access  Private/Admin
const assignPermission = async (req, res) => {
  try {
    const { permission_id } = req.body;
    
    if (!permission_id) {
      return res.status(400).json({ message: 'Permission ID is required' });
    }

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const permission = await Permission.findById(permission_id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    await Role.assignPermission(req.params.id, permission_id);

    const permissions = await Role.getPermissions(req.params.id);

    res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error(error);
    // Handle duplicate entry
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Permission already assigned to this role' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove permission from role
// @route   DELETE /api/roles/:id/permissions/:permissionId
// @access  Private/Admin
const removePermission = async (req, res) => {
  try {
    const { id, permissionId } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    await Role.removePermission(id, permissionId);

    const permissions = await Role.getPermissions(id);

    res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
  assignPermission,
  removePermission
};