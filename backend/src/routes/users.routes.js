const express = require('express');
const Joi = require('joi');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  getUserActivity,
  getUserStats,
} = require('../controllers/users.controller');
const { authMiddleware, requireRoles } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Validation schemas
const createUserBodySchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.empty': 'Username is required',
    'string.alphanum': 'Username must only contain alphanumeric characters',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username must be at most 30 characters',
  }),
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  password: Joi.string().min(8).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
  }),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  role: Joi.string().valid('admin', 'analyst', 'viewer').optional().default('viewer'),
});

const updateUserBodySchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional(),
  email: Joi.string().email({ tlds: { allow: false } }).optional(),
  password: Joi.string().min(8).optional(),
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  role: Joi.string().valid('admin', 'analyst', 'viewer').optional(),
  isActive: Joi.boolean().optional(),
});

const userParamsSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid user ID format',
    'any.required': 'User ID is required'
  })
});

// Routes

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (admin only)
 */
router.get('/stats',
  requireRoles(['admin']),
  getUserStats
);

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (admin only)
 * @query   page, limit, sortBy, sortOrder, role, isActive, search
 */
router.get('/',
  requireRoles(['admin']),
  getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (admin only)
 */
router.get('/:id',
  requireRoles(['admin']),
  validate(userParamsSchema, 'params'),
  getUser
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (admin only)
 */
router.post('/',
  requireRoles(['admin']),
  validate(createUserBodySchema, 'body'),
  createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (admin only)
 */
router.put('/:id',
  requireRoles(['admin']),
  validate(userParamsSchema, 'params'),
  validate(updateUserBodySchema, 'body'),
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (hard delete)
 * @access  Private (admin only)
 */
router.delete('/:id',
  requireRoles(['admin']),
  validate(userParamsSchema, 'params'),
  deleteUser
);

/**
 * @route   POST /api/users/:id/deactivate
 * @desc    Deactivate user (soft delete)
 * @access  Private (admin only)
 */
router.post('/:id/deactivate',
  requireRoles(['admin']),
  validate(userParamsSchema, 'params'),
  deactivateUser
);

/**
 * @route   POST /api/users/:id/activate
 * @desc    Activate user
 * @access  Private (admin only)
 */
router.post('/:id/activate',
  requireRoles(['admin']),
  validate(userParamsSchema, 'params'),
  activateUser
);

/**
 * @route   GET /api/users/:id/activity
 * @desc    Get user activity logs
 * @access  Private (admin only)
 * @query   page, limit, action, startDate, endDate
 */
router.get('/:id/activity',
  requireRoles(['admin']),
  validate(userParamsSchema, 'params'),
  getUserActivity
);

module.exports = router;