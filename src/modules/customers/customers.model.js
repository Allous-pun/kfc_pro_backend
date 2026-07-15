const db = require('../../config/db');

const Customer = {
  // Create a new customer with automatic loyalty record
  create: async (data) => {
    const { 
      restaurant_id, phone, email, first_name, last_name, 
      birth_date, dietary_preferences
    } = data;
    
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert customer
      const [result] = await connection.query(
        `INSERT INTO customers 
         (restaurant_id, phone, email, first_name, last_name, birth_date, 
          dietary_preferences, loyalty_points, total_spent, visit_count) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0.00, 0)`,
        [restaurant_id, phone, email || null, first_name || null, last_name || null, 
         birth_date || null, dietary_preferences || null]
      );

      // Auto-create loyalty record for this customer
      await connection.query(
        `INSERT INTO loyalty (customer_id, restaurant_id, points_balance, lifetime_points, points_redeemed, tier) 
         VALUES (?, ?, 0, 0, 0, 'Bronze')`,
        [result.insertId, restaurant_id]
      );

      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Find customer by phone with loyalty data
  findByPhone: async (restaurant_id, phone) => {
    const [rows] = await db.query(
      `SELECT c.*, 
              l.points_balance as loyalty_balance,
              l.lifetime_points,
              l.points_redeemed,
              l.tier as loyalty_tier,
              l.tier_benefits,
              l.expires_at,
              cp.favorite_items, cp.favorite_modifiers, cp.payment_preferences,
              cp.dining_preferences, cp.notification_preferences
       FROM customers c
       LEFT JOIN loyalty l ON c.id = l.customer_id
       LEFT JOIN customer_preferences cp ON c.id = cp.customer_id
       WHERE c.restaurant_id = ? AND c.phone = ?`,
      [restaurant_id, phone]
    );
    return rows[0];
  },

  // Find customer by email with loyalty data
  findByEmail: async (restaurant_id, email) => {
    const [rows] = await db.query(
      `SELECT c.*, 
              l.points_balance as loyalty_balance,
              l.lifetime_points,
              l.points_redeemed,
              l.tier as loyalty_tier,
              l.tier_benefits,
              l.expires_at,
              cp.favorite_items, cp.favorite_modifiers, cp.payment_preferences,
              cp.dining_preferences, cp.notification_preferences
       FROM customers c
       LEFT JOIN loyalty l ON c.id = l.customer_id
       LEFT JOIN customer_preferences cp ON c.id = cp.customer_id
       WHERE c.restaurant_id = ? AND c.email = ?`,
      [restaurant_id, email]
    );
    return rows[0];
  },

  // Find customer by ID with loyalty data
  findById: async (id) => {
    const [rows] = await db.query(
      `SELECT c.*, 
              l.points_balance as loyalty_balance,
              l.lifetime_points,
              l.points_redeemed,
              l.tier as loyalty_tier,
              l.tier_benefits,
              l.expires_at,
              cp.favorite_items, cp.favorite_modifiers, cp.payment_preferences,
              cp.dining_preferences, cp.notification_preferences
       FROM customers c
       LEFT JOIN loyalty l ON c.id = l.customer_id
       LEFT JOIN customer_preferences cp ON c.id = cp.customer_id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0];
  },

  // Get all customers with loyalty data
  findAll: async (filters = {}) => {
    let query = `
      SELECT c.*, 
             l.points_balance as loyalty_balance,
             l.lifetime_points,
             l.points_redeemed,
             l.tier as loyalty_tier,
             l.tier_benefits,
             cp.favorite_items, cp.favorite_modifiers, cp.payment_preferences,
             cp.dining_preferences, cp.notification_preferences
      FROM customers c
      LEFT JOIN loyalty l ON c.id = l.customer_id
      LEFT JOIN customer_preferences cp ON c.id = cp.customer_id
      WHERE 1=1
    `;
    const values = [];
    
    if (filters.restaurant_id) {
      query += ' AND c.restaurant_id = ?';
      values.push(filters.restaurant_id);
    }
    if (filters.loyalty_tier) {
      query += ' AND l.tier = ?';
      values.push(filters.loyalty_tier);
    }
    if (filters.search) {
      query += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (filters.min_spent) {
      query += ' AND c.total_spent >= ?';
      values.push(filters.min_spent);
    }
    
    query += ' ORDER BY c.total_spent DESC, c.visit_count DESC';
    
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

  // Update customer
  update: async (id, data) => {
    const fields = [];
    const values = [];
    
    const allowedFields = ['phone', 'email', 'first_name', 'last_name', 
                          'birth_date', 'dietary_preferences'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    
    if (fields.length === 0) return null;
    
    values.push(id);
    const [result] = await db.query(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result;
  },

  // ==========================================
  // LOYALTY OPERATIONS (Connected to loyalty table)
  // ==========================================

  // Add loyalty points (earn)
  addLoyaltyPoints: async (customerId, points, amountSpent = 0, orderId = null, description = null) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get current loyalty record
      const [loyalty] = await connection.query(
        'SELECT * FROM loyalty WHERE customer_id = ? FOR UPDATE',
        [customerId]
      );

      if (loyalty.length === 0) {
        throw new Error('Loyalty record not found for this customer');
      }

      const record = loyalty[0];
      const balanceBefore = record.points_balance;

      // Update loyalty record
      await connection.query(
        `UPDATE loyalty 
         SET points_balance = points_balance + ?,
             lifetime_points = lifetime_points + ?
         WHERE customer_id = ?`,
        [points, points, customerId]
      );

      // Update customer total_spent and visit_count
      await connection.query(
        `UPDATE customers 
         SET total_spent = total_spent + ?,
             visit_count = visit_count + 1,
             last_visit = NOW()
         WHERE id = ?`,
        [amountSpent, customerId]
      );

      // Update loyalty tier based on total_spent
      const [customer] = await connection.query(
        'SELECT total_spent FROM customers WHERE id = ?',
        [customerId]
      );
      
      let tier = 'Bronze';
      if (customer[0].total_spent >= 100000) tier = 'Diamond';
      else if (customer[0].total_spent >= 50000) tier = 'Platinum';
      else if (customer[0].total_spent >= 20000) tier = 'Gold';
      else if (customer[0].total_spent >= 5000) tier = 'Silver';

      await connection.query(
        'UPDATE loyalty SET tier = ? WHERE customer_id = ?',
        [tier, customerId]
      );

      // Record transaction
      await connection.query(
        `INSERT INTO loyalty_transactions 
         (customer_id, restaurant_id, order_id, type, points, balance_before, balance_after, description) 
         SELECT ?, restaurant_id, ?, 'earn', ?, ?, ? + ?, ? 
         FROM loyalty WHERE customer_id = ?`,
        [customerId, orderId, points, balanceBefore, points, description || `Earned ${points} points from purchase`, customerId]
      );

      await connection.commit();

      // Get updated record
      const [updated] = await connection.query(
        'SELECT * FROM loyalty WHERE customer_id = ?',
        [customerId]
      );
      
      return updated[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Redeem loyalty points
  redeemPoints: async (customerId, points, orderId = null, description = null) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get current loyalty record
      const [loyalty] = await connection.query(
        'SELECT * FROM loyalty WHERE customer_id = ? FOR UPDATE',
        [customerId]
      );

      if (loyalty.length === 0) {
        throw new Error('Loyalty record not found for this customer');
      }

      const record = loyalty[0];
      
      if (record.points_balance < points) {
        throw new Error(`Insufficient points. Available: ${record.points_balance}, Requested: ${points}`);
      }

      const balanceBefore = record.points_balance;

      // Update loyalty record
      await connection.query(
        `UPDATE loyalty 
         SET points_balance = points_balance - ?,
             points_redeemed = points_redeemed + ?
         WHERE customer_id = ?`,
        [points, points, customerId]
      );

      // Record transaction
      await connection.query(
        `INSERT INTO loyalty_transactions 
         (customer_id, restaurant_id, order_id, type, points, balance_before, balance_after, description) 
         SELECT ?, restaurant_id, ?, 'redeem', ?, ?, ? - ?, ? 
         FROM loyalty WHERE customer_id = ?`,
        [customerId, orderId, points, balanceBefore, points, description || `Redeemed ${points} points`, customerId]
      );

      await connection.commit();

      // Get updated record
      const [updated] = await connection.query(
        'SELECT * FROM loyalty WHERE customer_id = ?',
        [customerId]
      );
      
      return updated[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get loyalty summary for customer
  getLoyaltySummary: async (customerId) => {
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

  // Get loyalty transactions
  getLoyaltyTransactions: async (customerId, limit = 50) => {
    const [rows] = await db.query(
      `SELECT lt.*, 
              o.order_number,
              o.total_amount as order_total
       FROM loyalty_transactions lt
       LEFT JOIN orders o ON lt.order_id = o.id
       WHERE lt.customer_id = ?
       ORDER BY lt.created_at DESC
       LIMIT ?`,
      [customerId, limit]
    );
    return rows;
  },

  // Get customer with full loyalty data
  getWithLoyalty: async (id) => {
    const [rows] = await db.query(
      `SELECT c.*, 
              l.points_balance as loyalty_balance,
              l.lifetime_points,
              l.points_redeemed,
              l.tier as loyalty_tier,
              l.tier_benefits,
              l.expires_at,
              cp.favorite_items, cp.favorite_modifiers, cp.payment_preferences,
              cp.dining_preferences, cp.notification_preferences
       FROM customers c
       LEFT JOIN loyalty l ON c.id = l.customer_id
       LEFT JOIN customer_preferences cp ON c.id = cp.customer_id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0];
  },

  // ... (keep other existing methods: getOrderHistory, getStats, getTierDistribution, search, delete, upsertPreferences, getWithPreferences)
  
  // Get customer order history
  getOrderHistory: async (customerId, limit = 10) => {
    const [rows] = await db.query(
      `SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at,
              COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.customer_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ?`,
      [customerId, limit]
    );
    return rows;
  },

  // Get customer stats
  getStats: async (restaurantId = null) => {
    let query = `
      SELECT 
        COUNT(DISTINCT c.id) as total_customers,
        SUM(l.points_balance) as total_points,
        AVG(c.total_spent) as avg_spent,
        SUM(c.total_spent) as total_revenue,
        COUNT(DISTINCT l.tier) as tiers_count
      FROM customers c
      LEFT JOIN loyalty l ON c.id = l.customer_id
    `;
    const values = [];
    
    if (restaurantId) {
      query += ' WHERE c.restaurant_id = ?';
      values.push(restaurantId);
    }
    
    const [rows] = await db.query(query, values);
    return rows[0];
  },

  // Get loyalty tier distribution
  getTierDistribution: async (restaurantId = null) => {
    let query = `
      SELECT l.tier, COUNT(*) as count, SUM(l.points_balance) as total_points
      FROM loyalty l
      JOIN customers c ON l.customer_id = c.id
    `;
    const values = [];
    
    if (restaurantId) {
      query += ' WHERE c.restaurant_id = ?';
      values.push(restaurantId);
    }
    
    query += ' GROUP BY l.tier ORDER BY FIELD(l.tier, "Diamond", "Platinum", "Gold", "Silver", "Bronze")';
    
    const [rows] = await db.query(query, values);
    return rows;
  },

  // Search customers by phone or name
  search: async (restaurant_id, searchTerm) => {
    const [rows] = await db.query(
      `SELECT c.id, c.first_name, c.last_name, c.phone, c.email, 
              l.points_balance as loyalty_points, l.tier as loyalty_tier
       FROM customers c
       LEFT JOIN loyalty l ON c.id = l.customer_id
       WHERE c.restaurant_id = ? 
       AND (c.phone LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)
       LIMIT 10`,
      [restaurant_id, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    return rows;
  },

  // Delete customer (also deletes loyalty and preferences)
  delete: async (id) => {
    await db.query('DELETE FROM customer_preferences WHERE customer_id = ?', [id]);
    await db.query('DELETE FROM loyalty_transactions WHERE customer_id = ?', [id]);
    await db.query('DELETE FROM loyalty WHERE customer_id = ?', [id]);
    const [result] = await db.query('DELETE FROM customers WHERE id = ?', [id]);
    return result;
  },

  // Create or update customer preferences
  upsertPreferences: async (customerId, data) => {
    const { favorite_items, favorite_modifiers, payment_preferences, 
            dining_preferences, notification_preferences } = data;
    
    const [existing] = await db.query(
      'SELECT id FROM customer_preferences WHERE customer_id = ?',
      [customerId]
    );
    
    if (existing.length > 0) {
      const fields = [];
      const values = [];
      
      const allowedFields = ['favorite_items', 'favorite_modifiers', 'payment_preferences',
                            'dining_preferences', 'notification_preferences'];
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }
      
      if (fields.length === 0) return null;
      
      values.push(customerId);
      const [result] = await db.query(
        `UPDATE customer_preferences SET ${fields.join(', ')} WHERE customer_id = ?`,
        values
      );
      return result;
    } else {
      const [result] = await db.query(
        `INSERT INTO customer_preferences 
         (customer_id, favorite_items, favorite_modifiers, payment_preferences, 
          dining_preferences, notification_preferences) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [customerId, favorite_items || null, favorite_modifiers || null, 
         payment_preferences || null, dining_preferences || null, notification_preferences || null]
      );
      return result;
    }
  },

  // Get customer with preferences
  getWithPreferences: async (id) => {
    const [rows] = await db.query(
      `SELECT c.*, 
              l.points_balance as loyalty_balance,
              l.tier as loyalty_tier,
              cp.favorite_items, cp.favorite_modifiers, cp.payment_preferences,
              cp.dining_preferences, cp.notification_preferences
       FROM customers c
       LEFT JOIN loyalty l ON c.id = l.customer_id
       LEFT JOIN customer_preferences cp ON c.id = cp.customer_id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0];
  }
};

module.exports = Customer;