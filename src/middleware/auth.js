const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');

      // Get user from database
      const [users] = await db.query(
        `SELECT u.id, u.email, u.phone, u.first_name, u.last_name, 
                u.role_id, u.restaurant_id, u.status,
                r.name as role_name
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [decoded.id]
      );
      
      if (users.length === 0) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      const user = users[0];
      
      if (user.status !== 'active') {
        return res.status(401).json({ message: 'Not authorized, account is inactive' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Authorize based on roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if user's role matches any of the allowed roles
    const userRole = req.user.role_id;
    const userRoleName = req.user.role_name;
    
    // Check if the user has any of the allowed roles
    let hasRole = false;
    
    for (const role of roles) {
      // Check by role_id (if role is a number or numeric string)
      if (!isNaN(role) && userRole == role) {
        hasRole = true;
        break;
      }
      // Check by role_name (if role is a string)
      if (typeof role === 'string' && userRoleName && userRoleName.toLowerCase() === role.toLowerCase()) {
        hasRole = true;
        break;
      }
    }

    if (!hasRole) {
      return res.status(403).json({ 
        message: `Not authorized. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Check specific permission
const hasPermission = (resource, action) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    try {
      const [rows] = await db.query(
        `SELECT COUNT(*) as count
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         JOIN users u ON u.role_id = rp.role_id
         WHERE u.id = ? AND p.resource = ? AND p.action = ?`,
        [req.user.id, resource, action]
      );
      
      if (rows[0].count === 0) {
        return res.status(403).json({ 
          message: `Not authorized: ${action} on ${resource} required` 
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error checking permissions' });
    }
  };
};

module.exports = { protect, authorize, hasPermission };
