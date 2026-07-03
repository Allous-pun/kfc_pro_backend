const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createPermission,
  getPermissions,
  getPermission,
  updatePermission,
  deletePermission,
  getResources
} = require('./permissions.controller');
const { protect, authorize } = require('../../middleware/auth');

// Validation rules
const permissionValidation = [
  body('name').notEmpty().withMessage('Permission name is required'),
  body('resource').notEmpty().withMessage('Resource is required'),
  body('action').notEmpty().withMessage('Action is required'),
  body('description').optional().isString()
];

// Routes
router.get('/resources', protect, getResources);

router.route('/')
  .post(protect, authorize('admin'), permissionValidation, createPermission)
  .get(protect, getPermissions);

router.route('/:id')
  .get(protect, getPermission)
  .put(protect, authorize('admin'), permissionValidation, updatePermission)
  .delete(protect, authorize('admin'), deletePermission);

module.exports = router;