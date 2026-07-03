const db = require('../../config/db');

const Role = {
  // Create a new role
  create: async (data) => {
    const { restaurant_id, name, description, is_system } = data;
    const [result] = await db.query(
      `INSERT INTO roles (restaurant_id, name, description, is_system) 
       VALUES (?, ?, ?, ?)`,
      [restaurant_id, name, description, is_system || false]
    );
    return result;
  },

  // Get all roles
  findAll: async (filters = {}) => {
    let query = 'SELECT * FROM roles WHERE 1=1';
    const values = [];
    
    if (filters.restaurant_id) {
      query += ' AND restaurant_id = ?';
      values.push(filters.restaurant_id);
    }
    
    query += ' ORDER BY name ASC';
    const [rows] = await db.query(query, values);
    return rows;
  },

  // Find role by ID
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);
    return rows[0];
  },

  // Find role by name and restaurant
  findByName: async (restaurant_id, name) => {
    const [rows] = await db.query(
      'SELECT * FROM roles WHERE restaurant_id = ? AND name = ?',
      [restaurant_id, name]
    );
    return rows[0];
  },

  // Update role
  update: async (id, data) => {
    const fields = [];
    const values = [];
    
    const allowedFields = ['name', 'description', 'is_system'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    
    if (fields.length === 0) return null;
    
    values.push(id);
    const [result] = await db.query(
      `UPDATE roles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result;
  },

  // Delete role (only if not system)
  delete: async (id) => {
    const [result] = await db.query('DELETE FROM roles WHERE id = ? AND is_system = false', [id]);
    return result;
  },

  // Get role permissions
  getPermissions: async (roleId) => {
    const [rows] = await db.query(
      `SELECT p.id, p.name, p.resource, p.action, p.description
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [roleId]
    );
    return rows;
  },

  // Assign permission to role
  assignPermission: async (roleId, permissionId) => {
    const [result] = await db.query(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
      [roleId, permissionId]
    );
    return result;
  },

  // Remove permission from role
  removePermission: async (roleId, permissionId) => {
    const [result] = await db.query(
      'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
      [roleId, permissionId]
    );
    return result;
  },

  // Get users with this role
  getUsers: async (roleId) => {
    const [rows] = await db.query(
      'SELECT id, email, first_name, last_name, status FROM users WHERE role_id = ?',
      [roleId]
    );
    return rows;
  }
};

module.exports = Role;