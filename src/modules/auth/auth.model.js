const db = require('../../config/db');
const bcrypt = require('bcryptjs');

const Auth = {
  // Find user by email or phone
  findByEmailOrPhone: async (identifier) => {
    const [rows] = await db.query(
      `SELECT u.*, r.name as role_name, r.restaurant_id as role_restaurant_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE (u.email = ? OR u.phone = ?) AND u.status = 'active'`,
      [identifier, identifier]
    );
    return rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT u.id, u.email, u.phone, u.first_name, u.last_name, 
              u.role_id, u.restaurant_id, u.status, u.last_login,
              r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0];
  },

  // Create new user
  create: async (data) => {
    const { 
      restaurant_id, role_id, email, phone, password, 
      first_name, last_name, shift_preference 
    } = data;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const [result] = await db.query(
      `INSERT INTO users 
       (restaurant_id, role_id, email, phone, password_hash, first_name, last_name, shift_preference) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurant_id, role_id, email, phone, password_hash, first_name, last_name, shift_preference || null]
    );
    return result;
  },

  // Update user
  update: async (id, data) => {
    const fields = [];
    const values = [];
    
    const allowedFields = ['email', 'phone', 'first_name', 'last_name', 'role_id', 'status', 'shift_preference'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    
    // If password is being updated
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(data.password, salt);
      fields.push('password_hash = ?');
      values.push(password_hash);
    }
    
    if (fields.length === 0) return null;
    
    values.push(id);
    const [result] = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result;
  },

  // Update last login
  updateLastLogin: async (id) => {
    const [result] = await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [id]
    );
    return result;
  },

  // Get user permissions
  getUserPermissions: async (userId) => {
    const [rows] = await db.query(
      `SELECT p.name, p.resource, p.action 
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN users u ON u.role_id = rp.role_id
       WHERE u.id = ?`,
      [userId]
    );
    return rows;
  },

  // Check if user has permission
  hasPermission: async (userId, resource, action) => {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN users u ON u.role_id = rp.role_id
       WHERE u.id = ? AND p.resource = ? AND p.action = ?`,
      [userId, resource, action]
    );
    return rows[0].count > 0;
  }
};

module.exports = Auth;
