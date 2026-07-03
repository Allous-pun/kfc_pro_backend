const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
  assignPermission,
  removePermission
} = require('./roles.controller');
const { protect, authorize } = require('../../middleware/auth');

// Validation rules
const roleValidation = [
  body('restaurant_id').notEmpty().withMessage('Restaurant ID is required'),
  body('name').notEmpty().withMessage('Role name is required'),
  body('description').optional().isString()
];

// Routes
router.route('/')
  .post(protect, authorize('admin'), roleValidation, createRole)
  .get(protect, getRoles);

router.route('/:id')
  .get(protect, getRole)
  .put(protect, authorize('admin'), roleValidation, updateRole)
  .delete(protect, authorize('admin'), deleteRole);

router.post('/:id/permissions', protect, authorize('admin'), assignPermission);
router.delete('/:id/permissions/:permissionId', protect, authorize('admin'), removePermission);

module.exports = router;