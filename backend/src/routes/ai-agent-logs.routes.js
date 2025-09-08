const express = require('express');
const router = express.Router();
const { logAIAgentActivity } = require('../controllers/ai-agents.controller');

// Import auth middleware
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/ai-agent-logs
 * @desc    Log AI agent activity (Playbook Specialist Agent activities)
 * @access  Private
 * @body    { agentName, taskName, description, inputTokens?, outputTokens?, executionTimeMs?, success?, errorMessage?, alertId?, incidentId?, playbookId?, aiProvider?, aiModel?, metadata? }
 */
router.post('/', logAIAgentActivity);

module.exports = router;