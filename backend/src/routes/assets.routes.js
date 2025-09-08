const express = require('express');
const Joi = require('joi');
const {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetVulnerabilities,
  getAssetEvents,
} = require('../controllers/assets.controller');
const { authMiddleware, requireRoles } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Validation schemas
const createAssetBodySchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Asset name is required',
    'any.required': 'Asset name is required'
  }),
  assetType: Joi.string().valid('server', 'workstation', 'network_device', 'mobile', 'iot').required(),
  ipAddress: Joi.string().ip().optional(),
  hostname: Joi.string().optional(),
  os: Joi.string().optional(),
  osVersion: Joi.string().optional(),
  criticality: Joi.number().integer().min(1).max(5).optional(),
  riskScore: Joi.number().integer().min(0).max(100).optional(),
  location: Joi.string().optional(),
  owner: Joi.string().optional(),
  metadata: Joi.object().optional(),
});

const updateAssetBodySchema = Joi.object({
  name: Joi.string().optional(),
  assetType: Joi.string().valid('server', 'workstation', 'network_device', 'mobile', 'iot').optional(),
  ipAddress: Joi.string().ip().optional(),
  hostname: Joi.string().optional(),
  os: Joi.string().optional(),
  osVersion: Joi.string().optional(),
  criticality: Joi.number().integer().min(1).max(5).optional(),
  riskScore: Joi.number().integer().min(0).max(100).optional(),
  status: Joi.string().valid('online', 'offline', 'maintenance', 'compromised').optional(),
  location: Joi.string().optional(),
  owner: Joi.string().optional(),
  metadata: Joi.object().optional(),
  vulnerabilityCount: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

const assetParamsSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid asset ID format',
    'any.required': 'Asset ID is required'
  })
});

// Routes

/**
 * @route   GET /api/assets
 * @desc    Get all assets with filtering and pagination
 * @access  Private
 */
router.get('/', 
  getAssets
);

/**
 * @route   GET /api/assets/:id
 * @desc    Get single asset by ID with related alerts
 * @access  Private
 */
router.get('/:id',
  validate(assetParamsSchema, 'params'),
  getAsset
);

/**
 * @route   POST /api/assets
 * @desc    Create new asset
 * @access  Private (admin, analyst)
 */
router.post('/',
  requireRoles(['admin', 'analyst']),
  validate(createAssetBodySchema, 'body'),
  createAsset
);

/**
 * @route   PUT /api/assets/:id
 * @desc    Update asset
 * @access  Private (admin, analyst)
 */
router.put('/:id',
  requireRoles(['admin', 'analyst']),
  validate(assetParamsSchema, 'params'),
  validate(updateAssetBodySchema, 'body'),
  updateAsset
);

/**
 * @route   DELETE /api/assets/:id
 * @desc    Delete asset
 * @access  Private (admin only)
 */
router.delete('/:id',
  requireRoles(['admin']),
  validate(assetParamsSchema, 'params'),
  deleteAsset
);

/**
 * @route   GET /api/assets/:id/vulnerabilities
 * @desc    Get asset vulnerability summary
 * @access  Private
 */
router.get('/:id/vulnerabilities',
  validate(assetParamsSchema, 'params'),
  getAssetVulnerabilities
);

/**
 * @route   GET /api/assets/:id/events
 * @desc    Get asset security events (alerts)
 * @access  Private
 */
router.get('/:id/events',
  validate(assetParamsSchema, 'params'),
  getAssetEvents
);

module.exports = router;