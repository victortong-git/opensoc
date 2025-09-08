const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const Joi = require('joi');
const {
  getAIStatus,
  generateTestData,
  getTestDataStats,
  cleanupTestData,
} = require('../controllers/test-data.controller');

const {
  createTestAlerts,
  createTestIncidents,
  createTestAssets,
  createTestIOCs,
  createTestPlaybooks,
  createTestThreatActors,
  createTestThreatCampaigns,
} = require('../controllers/test-data-creation.controller');

// Validation schemas
const schemas = {
  generateTestData: Joi.object({
    dataType: Joi.string().valid('alert', 'incident', 'asset', 'ioc', 'playbook', 'threat_actor', 'threat_campaign').required(),
    quantity: Joi.number().integer().min(1).max(5).default(5),
    severityDistribution: Joi.object({
      critical: Joi.number().integer().min(0).max(100).default(10),
      high: Joi.number().integer().min(0).max(100).default(20),
      medium: Joi.number().integer().min(0).max(100).default(30),
      low: Joi.number().integer().min(0).max(100).default(25),
      info: Joi.number().integer().min(0).max(100).default(15),
    }).optional(),
    scenario: Joi.string().default('mixed'),
    timeRange: Joi.string().valid('last_24h', 'last_7d', 'last_30d', 'custom').default('last_24h'),
    customTimeStart: Joi.date().optional(),
    customTimeEnd: Joi.date().optional(),
    preview: Joi.boolean().default(true),
    // Custom generation enhancement fields
    customDescription: Joi.string().max(2000).optional().allow(''),
    customRequirements: Joi.string().max(2000).optional().allow(''),
    customExamples: Joi.string().max(2000).optional().allow(''),
  }),
  
  cleanup: Joi.object({
    dataType: Joi.string().valid('alert', 'incident', 'asset', 'ioc', 'playbook', 'threat_actor', 'threat_campaign').optional(),
    olderThan: Joi.number().integer().min(1).optional(),
  }),

  // Individual creation schemas - accept wrapped objects from frontend
  createTestAlerts: Joi.object({
    alerts: Joi.array().items(Joi.object()).min(1).max(5).required()
  }),
  createTestIncidents: Joi.object({
    incidents: Joi.array().items(Joi.object()).min(1).max(5).required()
  }),
  createTestAssets: Joi.object({
    assets: Joi.array().items(Joi.object()).min(1).max(5).required()
  }),
  createTestIOCs: Joi.object({
    iocs: Joi.array().items(Joi.object()).min(1).max(5).required()
  }),
  createTestPlaybooks: Joi.object({
    playbooks: Joi.array().items(Joi.object()).min(1).max(5).required()
  }),
  createTestThreatActors: Joi.object({
    threat_actors: Joi.array().items(Joi.object()).min(1).max(5).required()
  }),
  createTestThreatCampaigns: Joi.object({
    threat_campaigns: Joi.array().items(Joi.object()).min(1).max(5).required()
  }),
};

// Apply authentication to all routes
router.use(requireAuth);

/**
 * @route   GET /api/test-data/ai-status
 * @desc    Check AI connection status
 * @access  Private (Admin, SOC Lead)
 */
router.get('/ai-status', 
  requireRole(['admin', 'soc_lead']), 
  getAIStatus
);

/**
 * @route   POST /api/test-data/generate
 * @desc    Generate test data using AI and automatically save to database
 * @access  Private (Admin, SOC Lead)
 * @note    This endpoint now handles both generation and creation in one step
 *          Uses existing manual creation APIs internally for consistency
 */
router.post('/generate',
  requireRole(['admin', 'soc_lead']),
  validate(schemas.generateTestData),
  generateTestData
);

/**
 * @route   GET /api/test-data/stats
 * @desc    Get test data statistics including AI generation stats
 * @access  Private (Admin, SOC Lead)
 */
router.get('/stats',
  requireRole(['admin', 'soc_lead']),
  getTestDataStats
);

/**
 * @route   DELETE /api/test-data/cleanup
 * @desc    Clean up test data
 * @access  Private (Admin only)
 */
router.delete('/cleanup',
  requireRole(['admin']),
  validate(schemas.cleanup, { source: 'query' }),
  cleanupTestData
);

// Individual creation endpoints for UI Import functionality
/**
 * @route   POST /api/test-data/alerts
 * @desc    Create test alerts from generated data
 * @access  Private (Admin, SOC Lead)
 */
router.post('/alerts',
  requireRole(['admin', 'soc_lead']),
  validate(schemas.createTestAlerts),
  createTestAlerts
);

/**
 * @route   POST /api/test-data/incidents
 * @desc    Create test incidents from generated data
 * @access  Private (Admin, SOC Lead)
 */
router.post('/incidents',
  requireRole(['admin', 'soc_lead']),
  validate(schemas.createTestIncidents),
  createTestIncidents
);

/**
 * @route   POST /api/test-data/assets
 * @desc    Create test assets from generated data
 * @access  Private (Admin, SOC Lead)
 */
router.post('/assets',
  requireRole(['admin', 'soc_lead']),
  validate(schemas.createTestAssets),
  createTestAssets
);

/**
 * @route   POST /api/test-data/iocs
 * @desc    Create test IOCs from generated data
 * @access  Private (Admin, SOC Lead)
 */
router.post('/iocs',
  requireRole(['admin', 'soc_lead']),
  validate(schemas.createTestIOCs),
  createTestIOCs
);

/**
 * @route   POST /api/test-data/playbooks
 * @desc    Create test playbooks from generated data
 * @access  Private (Admin, SOC Lead)
 */
router.post('/playbooks',
  requireRole(['admin', 'soc_lead']),
  validate(schemas.createTestPlaybooks),
  createTestPlaybooks
);

/**
 * @route   POST /api/test-data/threat-actors
 * @desc    Create test threat actors from generated data
 * @access  Private (Admin, SOC Lead)
 */
router.post('/threat-actors',
  requireRole(['admin', 'soc_lead']),
  validate(schemas.createTestThreatActors),
  createTestThreatActors
);

/**
 * @route   POST /api/test-data/threat-campaigns
 * @desc    Create test threat campaigns from generated data
 * @access  Private (Admin, SOC Lead)
 */
router.post('/threat-campaigns',
  requireRole(['admin', 'soc_lead']),
  validate(schemas.createTestThreatCampaigns),
  createTestThreatCampaigns
);

module.exports = router;