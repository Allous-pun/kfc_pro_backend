const db = require('../../config/db');

const Table = {
  // Create a new table
  create: async (data) => {
    const { restaurant_id, table_number, capacity, section, qr_code, status } = data;
    const [result] = await db.query(
      `INSERT INTO tables (restaurant_id, table_number, capacity, section, qr_code, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [restaurant_id, table_number, capacity || 4, section, qr_code, status || 'available']
    );
    return result;
  },

  // Get all tables with filters
  findAll: async (filters = {}) => {
    let query = 'SELECT * FROM tables WHERE 1=1';
    const values = [];
    
    if (filters.restaurant_id) {
      query += ' AND restaurant_id = ?';
      values.push(filters.restaurant_id);
    }
    if (filters.status) {
      query += ' AND status = ?';
      values.push(filters.status);
    }
    
    query += ' ORDER BY table_number ASC';
    const [rows] = await db.query(query, values);
    return rows;
  },

  // Find table by ID
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM tables WHERE id = ?', [id]);
    return rows[0];
  },

  // Find tables by restaurant
  findByRestaurant: async (restaurantId) => {
    const [rows] = await db.query(
      'SELECT * FROM tables WHERE restaurant_id = ? ORDER BY table_number ASC',
      [restaurantId]
    );
    return rows;
  },

  // Update table
  update: async (id, data) => {
    const fields = [];
    const values = [];
    
    const allowedFields = ['table_number', 'capacity', 'section', 'qr_code', 'status', 'current_order_id', 'last_occupied_at'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    
    if (fields.length === 0) return null;
    
    values.push(id);
    const [result] = await db.query(
      `UPDATE tables SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result;
  },

  // Update table status
  updateStatus: async (id, status, orderId = null) => {
    const [result] = await db.query(
      `UPDATE tables SET status = ?, current_order_id = ?, last_occupied_at = ? WHERE id = ?`,
      [status, orderId, status === 'occupied' ? new Date() : null, id]
    );
    return result;
  },

  // Delete table
  delete: async (id) => {
    const [result] = await db.query('DELETE FROM tables WHERE id = ?', [id]);
    return result;
  },

  // Get available tables
  findAvailable: async (restaurantId) => {
    const [rows] = await db.query(
      'SELECT * FROM tables WHERE restaurant_id = ? AND status = "available" ORDER BY table_number ASC',
      [restaurantId]
    );
    return rows;
  }
};

module.exports = Table;
