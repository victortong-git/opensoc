const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const {
  getThreatActors,
  getThreatCampaigns,
  getThreatIntelStats,
  getThreatActor,
  getThreatCampaign,
  aiGenerateThreatActorHunt,
  aiGenerateCampaignHunt
} = require('../controllers/threat-intel.controller');

// Apply auth middleware to all threat intel routes
router.use(authMiddleware);

/**
 * @route   GET /api/threat-intel/stats
 * @desc    Get threat intelligence summary statistics
 * @access  Private (requires authentication)
 */
router.get('/stats', getThreatIntelStats);

/**
 * @route   GET /api/threat-intel/actors
 * @desc    Get threat actors with optional filtering and pagination
 * @access  Private (requires authentication)
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20)
 * @query   {string} search - Search in name, description, or aliases
 * @query   {string} sortBy - Field to sort by (default: name)
 * @query   {string} sortOrder - Sort order: asc or desc (default: asc)
 * @query   {boolean} isActive - Filter by active status
 * @query   {string} sophistication - Filter by sophistication level
 * @query   {string} origin - Filter by origin
 */
router.get('/actors', getThreatActors);

/**
 * @route   GET /api/threat-intel/actors/:id
 * @desc    Get single threat actor by ID
 * @access  Private (requires authentication)
 */
router.get('/actors/:id', getThreatActor);

/**
 * @route   GET /api/threat-intel/campaigns
 * @desc    Get threat campaigns with optional filtering and pagination
 * @access  Private (requires authentication)
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20)
 * @query   {string} search - Search in name or description
 * @query   {string} sortBy - Field to sort by (default: name)
 * @query   {string} sortOrder - Sort order: asc or desc (default: asc)
 * @query   {boolean} isActive - Filter by active status
 * @query   {number} severity - Filter by severity level (1-5)
 * @query   {string} confidence - Filter by confidence level
 * @query   {string} threatActorId - Filter by associated threat actor ID
 */
router.get('/campaigns', getThreatCampaigns);

/**
 * @route   GET /api/threat-intel/campaigns/:id
 * @desc    Get single threat campaign by ID
 * @access  Private (requires authentication)
 */
router.get('/campaigns/:id', getThreatCampaign);

/**
 * @route   POST /api/threat-intel/actors/:id/ai-generate-hunt
 * @desc    AI generate threat hunt form data from Threat Actor
 * @access  Private (requires authentication)
 */
router.post('/actors/:id/ai-generate-hunt', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  aiGenerateThreatActorHunt
);

/**
 * @route   POST /api/threat-intel/campaigns/:id/ai-generate-hunt
 * @desc    AI generate threat hunt form data from Campaign
 * @access  Private (requires authentication)
 */
router.post('/campaigns/:id/ai-generate-hunt', 
  authMiddleware,
  validate(schemas.uuidParam, 'params'),
  aiGenerateCampaignHunt
);

module.exports = router;