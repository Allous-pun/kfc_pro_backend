const db = require('../../config/db');

const Restaurant = {
  // Create a new restaurant
  create: async (data) => {
    const { name, legal_name, tax_id, phone, email, address, logo_url, timezone, currency, status } = data;
    const [result] = await db.query(
      `INSERT INTO restaurants (name, legal_name, tax_id, phone, email, address, logo_url, timezone, currency, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, legal_name, tax_id, phone, email, address, logo_url, timezone || 'UTC', currency || 'KSH', status || 'active']
    );
    return result;
  },

  // Get all restaurants
  findAll: async (filters = {}) => {
    let query = 'SELECT * FROM restaurants WHERE 1=1';
    const values = [];
    
    if (filters.status) {
      query += ' AND status = ?';
      values.push(filters.status);
    }
    
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, values);
    return rows;
  },

  // Find restaurant by ID
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM restaurants WHERE id = ?', [id]);
    return rows[0];
  },

  // Update restaurant
  update: async (id, data) => {
    const fields = [];
    const values = [];
    
    const allowedFields = ['name', 'legal_name', 'tax_id', 'phone', 'email', 'address', 'logo_url', 'timezone', 'currency', 'status'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    
    if (fields.length === 0) return null;
    
    values.push(id);
    const [result] = await db.query(
      `UPDATE restaurants SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result;
  },

  // Delete restaurant (soft delete)
  delete: async (id) => {
    const [result] = await db.query('UPDATE restaurants SET status = "inactive" WHERE id = ?', [id]);
    return result;
  }
};

module.exports = Restaurant;
