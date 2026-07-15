const db = require('../../config/db');

const Loyalty = {
  // Get loyalty record by customer ID
  findByCustomerId: async (customerId) => {
    const [rows] = await db.query(
      'SELECT * FROM loyalty WHERE customer_id = ?',
      [customerId]
    );
    return rows[0];
  },

  // Get loyalty record by ID
  findById: async (id) => {
    const [rows] = await db.query(
      'SELECT * FROM loyalty WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // Get loyalty with customer details
  getWithCustomer: async (customerId) => {
    const [rows] = await db.query(
      `SELECT l.*, 
              c.first_name, c.last_name, c.phone, c.email,
              c.total_spent, c.visit_count
       FROM loyalty l
       JOIN customers c ON l.customer_id = c.id
       WHERE l.customer_id = ?`,
      [customerId]
    );
    return rows[0];
  },

  // Get all loyalty records with filters
  findAll: async (filters = {}) => {
    let query = `
      SELECT l.*, 
             c.first_name, c.last_name, c.phone, c.email
      FROM loyalty l
      JOIN customers c ON l.customer_id = c.id
      WHERE 1=1
    `;
    const values = [];

    if (filters.restaurant_id) {
      query += ' AND l.restaurant_id = ?';
      values.push(filters.restaurant_id);
    }
    if (filters.tier) {
      query += ' AND l.tier = ?';
      values.push(filters.tier);
    }
    if (filters.min_points) {
      query += ' AND l.points_balance >= ?';
      values.push(filters.min_points);
    }
    if (filters.search) {
      query += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY l.points_balance DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      values.push(parseInt(filters.limit));
      if (filters.offset) {
        query += ' OFFSET ?';
        values.push(parseInt(filters.offset));
      }
    }

    const [rows] = await db.query(query, values);
    return rows;
  },

  // Get tier statistics
  getTierStats: async (restaurantId = null) => {
    let query = `
      SELECT 
        tier,
        COUNT(*) as count,
        SUM(points_balance) as total_points,
        AVG(points_balance) as avg_points
      FROM loyalty
    `;
    const values = [];

    if (restaurantId) {
      query += ' WHERE restaurant_id = ?';
      values.push(restaurantId);
    }

    query += ' GROUP BY tier ORDER BY FIELD(tier, "Diamond", "Platinum", "Gold", "Silver", "Bronze")';

    const [rows] = await db.query(query, values);
    return rows;
  },

  // Get overall loyalty stats
  getStats: async (restaurantId = null) => {
    let query = `
      SELECT 
        COUNT(*) as total_members,
        SUM(points_balance) as total_points,
        SUM(lifetime_points) as lifetime_points,
        SUM(points_redeemed) as points_redeemed,
        AVG(points_balance) as avg_points
      FROM loyalty
    `;
    const values = [];

    if (restaurantId) {
      query += ' WHERE restaurant_id = ?';
      values.push(restaurantId);
    }

    const [rows] = await db.query(query, values);
    return rows[0];
  }
};

module.exports = Loyalty;