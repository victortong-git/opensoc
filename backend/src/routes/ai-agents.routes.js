const express = require('express');
const router = express.Router();
const {
  getAIAgents,
  getAIAgent,
  createAIAgent,
  updateAIAgent,
  deleteAIAgent,
  updateAgentStatus,
  getAgentActivities,
  getAIAgentStats,
  getHumanAITeams,
  // New social media-style adapter endpoints
  getRealAgentActivities,
  getEnhancedAgentProfiles,
  getAgentSocialFeed,
  // AI Agent Activity Logging
  logAIAgentActivity,
} = require('../controllers/ai-agents.controller');

// Import auth middleware
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/ai-agents
 * @desc    Get all AI agents with filtering and pagination
 * @access  Private
 * @params  Query: page, limit, sortBy, sortOrder, type, status, search
 */
router.get('/', getAIAgents);

/**
 * @route   GET /api/ai-agents/stats
 * @desc    Get AI agent statistics
 * @access  Private
 */
router.get('/stats', getAIAgentStats);

/**
 * @route   GET /api/ai-agents/activities
 * @desc    Get AI agent activities with filtering and pagination
 * @access  Private
 * @params  Query: page, limit, agentId, activityType, startDate, endDate
 */
router.get('/activities', getAgentActivities);

/**
 * @route   GET /api/ai-agents/teams
 * @desc    Get human-AI teams data
 * @access  Private
 */
router.get('/teams', getHumanAITeams);

/**
 * @route   GET /api/ai-agents/real-activities
 * @desc    Get real AI agent activities with social interactions
 * @access  Private
 * @params  Query: page, limit, agentName, taskName, startDate, endDate
 */
router.get('/real-activities', getRealAgentActivities);

/**
 * @route   GET /api/ai-agents/profiles
 * @desc    Get enhanced AI agent profiles with social metrics
 * @access  Private
 */
router.get('/profiles', getEnhancedAgentProfiles);

/**
 * @route   GET /api/ai-agents/social-feed
 * @desc    Get AI agent social feed for dashboard
 * @access  Private
 * @params  Query: limit
 */
router.get('/social-feed', getAgentSocialFeed);

/**
 * @route   GET /api/ai-agents/:id
 * @desc    Get single AI agent by ID
 * @access  Private
 */
router.get('/:id', getAIAgent);

/**
 * @route   POST /api/ai-agents
 * @desc    Create new AI agent
 * @access  Private (admin or soc_lead)
 */
router.post('/', requireRole(['admin', 'soc_lead']), createAIAgent);

/**
 * @route   PUT /api/ai-agents/:id
 * @desc    Update AI agent
 * @access  Private (admin or soc_lead)
 */
router.put('/:id', requireRole(['admin', 'soc_lead']), updateAIAgent);

/**
 * @route   POST /api/ai-agents/:id/status
 * @desc    Update AI agent status
 * @access  Private (admin or soc_lead)
 */
router.post('/:id/status', requireRole(['admin', 'soc_lead']), updateAgentStatus);

/**
 * @route   DELETE /api/ai-agents/:id
 * @desc    Delete AI agent
 * @access  Private (admin only)
 */
router.delete('/:id', requireRole(['admin']), deleteAIAgent);

module.exports = router;