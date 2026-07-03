const db = require('../../config/db');

const User = {
  // Get all users with filters
  findAll: async (filters = {}) => {
    let query = `
      SELECT u.id, u.email, u.phone, u.first_name, u.last_name, 
             u.role_id, u.restaurant_id, u.status, u.last_login, u.profile_image,
             r.name as role_name,
             res.name as restaurant_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN restaurants res ON u.restaurant_id = res.id
      WHERE 1=1
    `;
    const values = [];
    
    if (filters.restaurant_id) {
      query += ' AND u.restaurant_id = ?';
      values.push(filters.restaurant_id);
    }
    if (filters.role_id) {
      query += ' AND u.role_id = ?';
      values.push(filters.role_id);
    }
    if (filters.status) {
      query += ' AND u.status = ?';
      values.push(filters.status);
    }
    if (filters.search) {
      query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY u.created_at DESC';
    
    const [rows] = await db.query(query, values);
    return rows;
  },

  // Find user by ID
  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT u.id, u.email, u.phone, u.first_name, u.last_name, 
              u.role_id, u.restaurant_id, u.status, u.last_login, u.profile_image,
              r.name as role_name,
              res.name as restaurant_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN restaurants res ON u.restaurant_id = res.id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0];
  },

  // Update user status
  updateStatus: async (id, status) => {
    const [result] = await db.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id]
    );
    return result;
  },

  // Delete user (soft delete - set inactive)
  delete: async (id) => {
    const [result] = await db.query(
      'UPDATE users SET status = "inactive" WHERE id = ?',
      [id]
    );
    return result;
  },

  // Count users by status
  countByStatus: async (restaurantId = null) => {
    let query = 'SELECT status, COUNT(*) as count FROM users';
    const values = [];
    
    if (restaurantId) {
      query += ' WHERE restaurant_id = ?';
      values.push(restaurantId);
    }
    
    query += ' GROUP BY status';
    
    const [rows] = await db.query(query, values);
    return rows;
  },

  // Get recent users
  getRecent: async (limit = 10, restaurantId = null) => {
    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.profile_image,
             u.status, u.created_at, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
    `;
    const values = [];
    
    if (restaurantId) {
      query += ' WHERE u.restaurant_id = ?';
      values.push(restaurantId);
    }
    
    query += ' ORDER BY u.created_at DESC LIMIT ?';
    values.push(limit);
    
    const [rows] = await db.query(query, values);
    return rows;
  }
};

module.exports = User;