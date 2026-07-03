const db = require('../../config/db');

const Permission = {
  // Create a new permission
  create: async (data) => {
    const { name, resource, action, description } = data;
    const [result] = await db.query(
      `INSERT INTO permissions (name, resource, action, description) 
       VALUES (?, ?, ?, ?)`,
      [name, resource, action, description]
    );
    return result;
  },

  // Get all permissions
  findAll: async (filters = {}) => {
    let query = 'SELECT * FROM permissions WHERE 1=1';
    const values = [];
    
    if (filters.resource) {
      query += ' AND resource = ?';
      values.push(filters.resource);
    }
    
    query += ' ORDER BY resource, action';
    const [rows] = await db.query(query, values);
    return rows;
  },

  // Find permission by ID
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM permissions WHERE id = ?', [id]);
    return rows[0];
  },

  // Find permission by resource and action
  findByResourceAction: async (resource, action) => {
    const [rows] = await db.query(
      'SELECT * FROM permissions WHERE resource = ? AND action = ?',
      [resource, action]
    );
    return rows[0];
  },

  // Update permission
  update: async (id, data) => {
    const fields = [];
    const values = [];
    
    const allowedFields = ['name', 'description'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    
    if (fields.length === 0) return null;
    
    values.push(id);
    const [result] = await db.query(
      `UPDATE permissions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result;
  },

  // Delete permission
  delete: async (id) => {
    // Check if permission is used by any role
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = ?',
      [id]
    );
    
    if (rows[0].count > 0) {
      throw new Error('Cannot delete permission that is assigned to roles');
    }
    
    const [result] = await db.query('DELETE FROM permissions WHERE id = ?', [id]);
    return result;
  },

  // Get all resources
  getResources: async () => {
    const [rows] = await db.query(
      'SELECT DISTINCT resource FROM permissions ORDER BY resource'
    );
    return rows.map(r => r.resource);
  },

  // Get roles with this permission
  getRoles: async (permissionId) => {
    const [rows] = await db.query(
      `SELECT r.id, r.name, r.restaurant_id
       FROM roles r
       JOIN role_permissions rp ON r.id = rp.role_id
       WHERE rp.permission_id = ?`,
      [permissionId]
    );
    return rows;
  }
};

module.exports = Permission;