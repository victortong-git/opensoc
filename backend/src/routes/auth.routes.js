const express = require('express');
const Joi = require('joi');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', 
  validate(schemas.login),
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh',
  validate(Joi.object({ refreshToken: Joi.string().required() })),
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', 
  authMiddleware,
  authController.logout
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', 
  authMiddleware,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', 
  authMiddleware,
  validate(schemas.updateUser),
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', 
  authMiddleware,
  validate(schemas.changePassword),
  authController.changePassword
);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (admin only)
 * @access  Private (Admin)
 */
router.post('/register', 
  authMiddleware,
  requireAdmin,
  validate(schemas.register),
  authController.register
);

module.exports = router;