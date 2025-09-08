const express = require('express');
const Joi = require('joi');
const {
  getIOCs,
  getIOC,
  createIOC,
  createBulkIOCs,
  updateIOC,
  deleteIOC,
  deactivateIOC,
  searchIOCs,
  getIOCStats,
} = require('../controllers/ioc.controller');

// Import AI hunt generation from threat-intel controller
const { aiGenerateIOCHunt } = require('../controllers/threat-intel.controller');
const { authMiddleware, requireRoles } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Validation schemas
const createIOCBodySchema = Joi.object({
  type: Joi.string().valid('ip', 'domain', 'url', 'file_hash', 'email', 'registry_key').required(),
  value: Joi.string().required().messages({
    'string.empty': 'IOC value is required',
    'any.required': 'IOC value is required'
  }),
  confidence: Joi.string().valid('low', 'medium', 'high', 'very_high').required(),
  severity: Joi.number().integer().min(1).max(5).required(),
  description: Joi.string().optional(),
  source: Joi.string().required().messages({
    'string.empty': 'IOC source is required',
    'any.required': 'IOC source is required'
  }),
  tags: Joi.array().items(Joi.string()).optional(),
  firstSeen: Joi.date().optional(),
  lastSeen: Joi.date().optional(),
  relatedCampaign: Joi.string().uuid().optional(),
  mitreAttack: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
});

const updateIOCBodySchema = Joi.object({
  type: Joi.string().valid('ip', 'domain', 'url', 'file_hash', 'email', 'registry_key').optional(),
  value: Joi.string().optional(),
  confidence: Joi.string().valid('low', 'medium', 'high', 'very_high').optional(),
  severity: Joi.number().integer().min(1).max(5).optional(),
  description: Joi.string().optional(),
  source: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  firstSeen: Joi.date().optional(),
  lastSeen: Joi.date().optional(),
  relatedCampaign: Joi.string().uuid().optional(),
  mitreAttack: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
});

const bulkCreateIOCBodySchema = Joi.object({
  iocs: Joi.array().items(createIOCBodySchema).min(1).required().messages({
    'array.min': 'At least one IOC is required',
    'any.required': 'IOCs array is required'
  })
});

const searchIOCBodySchema = Joi.object({
  values: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'At least one search value is required',
    'any.required': 'Values array is required'
  }),
  exactMatch: Joi.boolean().optional().default(false),
});

const iocParamsSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid IOC ID format',
    'any.required': 'IOC ID is required'
  })
});

// Routes

/**
 * @route   GET /api/threat-intel/iocs/stats
 * @desc    Get IOC statistics
 * @access  Private
 */
router.get('/stats', 
  getIOCStats
);

/**
 * @route   POST /api/threat-intel/iocs/search
 * @desc    Search IOCs by value patterns
 * @access  Private
 */
router.post('/search',
  validate(searchIOCBodySchema, 'body'),
  searchIOCs
);

/**
 * @route   POST /api/threat-intel/iocs/bulk
 * @desc    Create multiple IOCs in bulk
 * @access  Private (admin, analyst)
 */
router.post('/bulk',
  requireRoles(['admin', 'analyst']),
  validate(bulkCreateIOCBodySchema, 'body'),
  createBulkIOCs
);

/**
 * @route   GET /api/threat-intel/iocs
 * @desc    Get all IOCs with filtering and pagination
 * @access  Private
 */
router.get('/', 
  getIOCs
);

/**
 * @route   GET /api/threat-intel/iocs/:id
 * @desc    Get single IOC by ID
 * @access  Private
 */
router.get('/:id',
  validate(iocParamsSchema, 'params'),
  getIOC
);

/**
 * @route   POST /api/threat-intel/iocs
 * @desc    Create new IOC
 * @access  Private (admin, analyst)
 */
router.post('/',
  requireRoles(['admin', 'analyst']),
  validate(createIOCBodySchema, 'body'),
  createIOC
);

/**
 * @route   PUT /api/threat-intel/iocs/:id
 * @desc    Update IOC
 * @access  Private (admin, analyst)
 */
router.put('/:id',
  requireRoles(['admin', 'analyst']),
  validate(iocParamsSchema, 'params'),
  validate(updateIOCBodySchema, 'body'),
  updateIOC
);

/**
 * @route   DELETE /api/threat-intel/iocs/:id
 * @desc    Delete IOC
 * @access  Private (admin only)
 */
router.delete('/:id',
  requireRoles(['admin']),
  validate(iocParamsSchema, 'params'),
  deleteIOC
);

/**
 * @route   POST /api/threat-intel/iocs/:id/deactivate
 * @desc    Deactivate IOC (soft delete)
 * @access  Private (admin, analyst)
 */
router.post('/:id/deactivate',
  requireRoles(['admin', 'analyst']),
  validate(iocParamsSchema, 'params'),
  deactivateIOC
);

/**
 * @route   POST /api/threat-intel/iocs/:id/ai-generate-hunt
 * @desc    AI generate threat hunt form data from IOC
 * @access  Private (requires authentication)
 */
router.post('/:id/ai-generate-hunt',
  validate(iocParamsSchema, 'params'),
  aiGenerateIOCHunt
);

module.exports = router;