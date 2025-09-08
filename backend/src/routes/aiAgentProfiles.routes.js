const express = require('express');
const router = express.Router();
const {
  getAgentProfiles,
  getAgentProfile,
  getAgentActivityFeed,
  getAllAgentActivities,
  getActivityInteractions,
  addAgentInteraction,
  getAgentDashboard,
  getAgentLeaderboard
} = require('../controllers/aiAgentProfiles.controller');
const { authMiddleware, requireAnalyst } = require('../middleware/auth.middleware');
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  };
};

// Validation schemas
const agentNameParam = [
  param('agentName')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Agent name must be a string between 1 and 100 characters')
];

const activityIdParam = [
  param('activityId')
    .isInt({ min: 1 })
    .withMessage('Activity ID must be a positive integer')
];

const interactionSchema = [
  body('interactionType')
    .isIn(['like', 'comment'])
    .withMessage('Interaction type must be "like" or "comment"'),
  body('commentText')
    .optional()
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment text must be between 1 and 1000 characters'),
  body('parentCommentId')
    .optional()
    .isUUID()
    .withMessage('Parent comment ID must be a valid UUID'),
  body('mentionedUsers')
    .optional()
    .isArray()
    .withMessage('Mentioned users must be an array')
];

const paginationQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be 0 or greater')
];

// All routes require authentication
router.use(authMiddleware);

/**
 * @route GET /api/ai-agent-profiles
 * @desc Get all AI agent profiles with social metrics
 * @access Analyst+
 */
router.get('/', 
  requireAnalyst,
  validate(paginationQuery),
  getAgentProfiles
);

/**
 * @route GET /api/ai-agent-profiles/leaderboard
 * @desc Get agent leaderboard by metric
 * @access Analyst+
 */
router.get('/leaderboard',
  requireAnalyst,
  validate([
    query('metric')
      .optional()
      .isIn(['totalActivities', 'totalLikesReceived', 'totalCommentsReceived', 'successRatePercentage'])
      .withMessage('Invalid metric'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ]),
  getAgentLeaderboard
);

/**
 * @route GET /api/ai-agent-profiles/activities
 * @desc Get all agent activities (admin view)
 * @access Analyst+
 */
router.get('/activities',
  requireAnalyst,
  validate([
    ...paginationQuery,
    query('agentName').optional().isString(),
    query('taskName').optional().isString(),
    query('success').optional().isBoolean(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ]),
  getAllAgentActivities
);

/**
 * @route GET /api/ai-agent-profiles/activities/:activityId/interactions
 * @desc Get interactions for an agent activity
 * @access Analyst+
 */
router.get('/activities/:activityId/interactions',
  requireAnalyst,
  validate([...activityIdParam]),
  getActivityInteractions
);

/**
 * @route POST /api/ai-agent-profiles/activities/:activityId/interactions
 * @desc Add interaction (like/comment) to agent activity
 * @access Analyst+
 */
router.post('/activities/:activityId/interactions',
  requireAnalyst,
  validate([
    ...activityIdParam,
    ...interactionSchema
  ]),
  addAgentInteraction
);

/**
 * @route GET /api/ai-agent-profiles/:agentName
 * @desc Get specific agent profile
 * @access Analyst+
 */
router.get('/:agentName',
  requireAnalyst,
  validate(agentNameParam),
  getAgentProfile
);

/**
 * @route GET /api/ai-agent-profiles/:agentName/activities
 * @desc Get agent activity feed (social media style)
 * @access Analyst+
 */
router.get('/:agentName/activities',
  requireAnalyst,
  validate([
    ...agentNameParam,
    ...paginationQuery,
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ]),
  getAgentActivityFeed
);

/**
 * @route GET /api/ai-agent-profiles/:agentName/dashboard
 * @desc Get agent performance dashboard data
 * @access Analyst+
 */
router.get('/:agentName/dashboard',
  requireAnalyst,
  validate([
    ...agentNameParam,
    query('timeframe')
      .optional()
      .isIn(['day', 'week', 'month', 'all'])
      .withMessage('Timeframe must be day, week, month, or all')
  ]),
  getAgentDashboard
);

module.exports = router;