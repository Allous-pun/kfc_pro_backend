const Auth = require('./auth.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role_id: user.role_id,
      restaurant_id: user.restaurant_id
    },
    process.env.JWT_SECRET || 'defaultsecret',
    { expiresIn: '30d' }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { restaurant_id, role_id, email, phone, password, first_name, last_name, shift_preference } = req.body;

    // Check if user exists
    const existing = await Auth.findByEmailOrPhone(email);
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email or phone' });
    }

    // Create user
    const result = await Auth.create({
      restaurant_id,
      role_id,
      email,
      phone,
      password,
      first_name,
      last_name,
      shift_preference
    });

    // Get created user
    const user = await Auth.findById(result.insertId);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.role_id,
        role_name: user.role_name,
        restaurant_id: user.restaurant_id
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    // Check if user exists
    const user = await Auth.findByEmailOrPhone(identifier);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await Auth.updateLastLogin(user.id);

    // Get user permissions
    const permissions = await Auth.getUserPermissions(user.id);

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.role_id,
        role_name: user.role_name,
        restaurant_id: user.restaurant_id,
        permissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await Auth.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const permissions = await Auth.getUserPermissions(req.user.id);

    res.json({
      success: true,
      user: {
        ...user,
        permissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, phone, first_name, last_name, shift_preference } = req.body;
    
    // Check if email/phone is taken by another user
    const existing = await Auth.findByEmailOrPhone(email);
    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({ message: 'Email or phone already in use' });
    }

    await Auth.update(req.user.id, {
      email,
      phone,
      first_name,
      last_name,
      shift_preference
    });

    const user = await Auth.findById(req.user.id);
    const permissions = await Auth.getUserPermissions(req.user.id);

    res.json({
      success: true,
      user: {
        ...user,
        permissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const [users] = await db.query(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    
    await db.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [password_hash, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
};
