const User = require('./users.model');
const Auth = require('../auth/auth.model');
const { validationResult } = require('express-validator');
const cloudinary = require('../../config/cloudinary');
const fs = require('fs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { restaurant_id, role_id, status, search } = req.query;
    const users = await User.findAll({ restaurant_id, role_id, status, search });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const permissions = await Auth.getUserPermissions(req.params.id);

    res.status(200).json({
      success: true,
      data: {
        ...user,
        permissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { email, phone, first_name, last_name, role_id, restaurant_id, status } = req.body;

    // Check if email/phone is taken by another user
    if (email || phone) {
      const existing = await Auth.findByEmailOrPhone(email || phone);
      if (existing && existing.id !== req.params.id) {
        return res.status(400).json({ message: 'Email or phone already in use' });
      }
    }

    let profileImage = null;
    
    // Handle image upload if file is present
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'kfc/users',
          width: 500,
          height: 500,
          crop: 'fill',
          gravity: 'face'
        });
        profileImage = result.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ message: 'Failed to upload image' });
      }
    }

    // Update user
    await Auth.update(req.params.id, {
      email,
      phone,
      first_name,
      last_name,
      role_id,
      restaurant_id,
      status
    });

    if (profileImage) {
      await Auth.updateProfileImage(req.params.id, profileImage);
    }

    const updatedUser = await User.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user status
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required (active, inactive, suspended)' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.updateStatus(req.params.id, status);
    const updatedUser = await User.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = async (req, res) => {
  try {
    const { restaurant_id } = req.query;
    const stats = await User.countByStatus(restaurant_id);
    const recent = await User.getRecent(5, restaurant_id);
    const total = stats.reduce((acc, curr) => acc + curr.count, 0);

    res.status(200).json({
      success: true,
      data: {
        total,
        by_status: stats,
        recent_users: recent
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getUserStats
};