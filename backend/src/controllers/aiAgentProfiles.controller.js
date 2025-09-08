const { models, sequelize } = require('../database/models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/error.middleware');
const aiAgentLogService = require('../services/aiAgentLogService');
const { Op } = require('sequelize');

/**
 * Get all AI agent profiles with social metrics
 * GET /api/ai-agent-profiles
 */
const getAgentProfiles = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    limit = 20,
    offset = 0,
    sortBy = 'totalActivities',
    sortOrder = 'desc'
  } = req.query;

  // Get agent profiles from database (enhanced ai_agents)
  const agents = await models.AIAgent.findAll({
    where: { 
      organizationId,
      isActive: true 
    },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]]
  });

  // Transform to include real agent configurations and stats
  const agentProfiles = agents.map(agent => {
    const agentConfig = aiAgentLogService.AI_AGENTS.ALERT_INCIDENT_SPECIALIST.name === agent.name 
      ? aiAgentLogService.AI_AGENTS.ALERT_INCIDENT_SPECIALIST
      : aiAgentLogService.AI_AGENTS.PLAYBOOK_SPECIALIST.name === agent.name
      ? aiAgentLogService.AI_AGENTS.PLAYBOOK_SPECIALIST
      : null;

    return {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      bio: agent.bio || agentConfig?.bio || `AI agent: ${agent.name}`,
      specialties: agent.specialties || agentConfig?.specialties || [],
      profileImageUrl: agent.profileImageUrl || agentConfig?.profileImageUrl || '/images/agents/default-avatar.png',
      status: agent.status,
      socialMetrics: {
        totalActivities: agent.totalActivities || 0,
        totalLikesReceived: agent.totalLikesReceived || 0,
        totalCommentsReceived: agent.totalCommentsReceived || 0,
        avgExecutionTimeMs: agent.avgExecutionTimeMs,
        successRatePercentage: agent.successRatePercentage,
        lastInteractionAt: agent.lastInteractionAt,
        firstActivityAt: agent.firstActivityAt
      },
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt
    };
  });

  res.status(200).json({
    success: true,
    agents: agentProfiles,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: agentProfiles.length
    }
  });
});

/**
 * Get specific agent profile by name
 * GET /api/ai-agent-profiles/:agentName
 */
const getAgentProfile = asyncHandler(async (req, res) => {
  const { agentName } = req.params;
  const organizationId = req.user.organizationId;

  // Find agent in database
  const agent = await models.AIAgent.findOne({
    where: { 
      name: agentName,
      organizationId,
      isActive: true 
    }
  });

  if (!agent) {
    throw new NotFoundError(`AI Agent '${agentName}' not found`);
  }

  // Get agent configuration
  const agentConfig = Object.values(aiAgentLogService.AI_AGENTS).find(
    config => config.name === agentName
  );

  // Get detailed statistics
  const stats = await aiAgentLogService.getAgentActivityStats(agentName, organizationId, 'month');

  const agentProfile = {
    id: agent.id,
    name: agent.name,
    type: agent.type,
    bio: agent.bio || agentConfig?.bio || `AI agent: ${agent.name}`,
    specialties: agent.specialties || agentConfig?.specialties || [],
    profileImageUrl: agent.profileImageUrl || agentConfig?.profileImageUrl || '/images/agents/default-avatar.png',
    status: agent.status,
    socialMetrics: {
      totalActivities: agent.totalActivities || 0,
      totalLikesReceived: agent.totalLikesReceived || 0,
      totalCommentsReceived: agent.totalCommentsReceived || 0,
      avgExecutionTimeMs: agent.avgExecutionTimeMs,
      successRatePercentage: agent.successRatePercentage,
      lastInteractionAt: agent.lastInteractionAt,
      firstActivityAt: agent.firstActivityAt
    },
    performanceStats: stats,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt
  };

  res.status(200).json({
    success: true,
    agent: agentProfile
  });
});

/**
 * Get agent activity feed (social media style)
 * GET /api/ai-agent-profiles/:agentName/activities
 */
const getAgentActivityFeed = asyncHandler(async (req, res) => {
  const { agentName } = req.params;
  const organizationId = req.user.organizationId;
  const {
    limit = 20,
    offset = 0,
    startDate = null,
    endDate = null
  } = req.query;

  // Get activities with social interactions
  const activitiesResult = await aiAgentLogService.getAgentActivities(agentName, {
    organizationId,
    limit,
    offset,
    includeInteractions: true
  });

  // Transform activities to include social metrics format expected by frontend
  const activities = activitiesResult.activities.map(activity => {
    // Group interactions by type since Sequelize returns them as a flat array
    const interactions = activity.interactions || [];
    const likes = interactions.filter(i => i.interactionType === 'like');
    const comments = interactions.filter(i => i.interactionType === 'comment');

    return {
      id: activity.id,
      agentName: activity.agentName,
      taskName: activity.taskName,
      description: activity.description,
      success: activity.success,
      executionTimeMs: activity.executionTimeMs,
      inputTokens: activity.inputTokens,
      outputTokens: activity.outputTokens,
      totalTokens: activity.totalTokens,
      socialMetrics: {
        likes: likes.length,
        comments: comments.length,
        likedByCurrentUser: likes.some(like => like.userId === req.user.id)
      },
      interactions: {
        likes,
        comments
      },
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      user: activity.user
    };
  });

  res.status(200).json({
    success: true,
    activities,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: activitiesResult.pagination.hasMore,
      total: activitiesResult.pagination.total
    }
  });
});

/**
 * Get all agent activities (admin view)
 * GET /api/ai-agent-profiles/activities
 */
const getAllAgentActivities = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    limit = 50,
    offset = 0,
    agentName = null,
    taskName = null,
    success = null,
    startDate = null,
    endDate = null
  } = req.query;

  // Build where clause
  const where = { organizationId };
  
  if (agentName) {
    where.agentName = agentName;
  }
  
  if (taskName) {
    where.taskName = taskName;
  }
  
  if (success !== null) {
    where.success = success === 'true';
  }

  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  // Get activities with related data
  const { count, rows: activities } = await models.AIAgentLog.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: models.User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName']
      },
      {
        model: models.AIAgentInteraction,
        as: 'interactions',
        include: [{
          model: models.User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }]
      }
    ]
  });

  res.status(200).json({
    success: true,
    activities,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: count,
      hasMore: count > parseInt(offset) + parseInt(limit)
    }
  });
});

/**
 * Get interactions for an activity
 * GET /api/ai-agent-profiles/activities/:activityId/interactions
 */
const getActivityInteractions = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  // Check if activity exists and belongs to user's organization
  const activity = await models.AIAgentLog.findOne({
    where: { 
      id: activityId,
      organizationId: organizationId
    }
  });

  if (!activity) {
    throw new NotFoundError('Activity not found');
  }

  // Get all interactions for this activity
  const interactions = await models.AIAgentInteraction.findAll({
    where: { agentLogId: activityId },
    include: [
      {
        model: models.User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName'],
        required: true
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    data: {
      interactions: interactions,
      total: interactions.length,
      summary: {
        likes: interactions.filter(i => i.interactionType === 'like').length,
        comments: interactions.filter(i => i.interactionType === 'comment').length
      }
    }
  });
});

/**
 * Add interaction to agent activity (like/comment)
 * POST /api/ai-agent-profiles/activities/:activityId/interactions
 */
const addAgentInteraction = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const { interactionType, commentText, parentCommentId, mentionedUsers } = req.body;
  const userId = req.user.id;

  // Validate interaction type
  if (!['like', 'comment'].includes(interactionType)) {
    throw new ValidationError('Interaction type must be "like" or "comment"');
  }

  // Validate comment text for comment interactions
  if (interactionType === 'comment' && (!commentText || commentText.trim().length === 0)) {
    throw new ValidationError('Comment text is required for comment interactions');
  }

  // Check if activity exists
  const activity = await models.AIAgentLog.findByPk(activityId);
  if (!activity) {
    throw new NotFoundError('Activity not found');
  }

  // Use transaction to prevent race conditions
  const result = await sequelize.transaction(async (transaction) => {
    // For likes, check if user already liked this activity
    if (interactionType === 'like') {
      const existingLike = await models.AIAgentInteraction.findOne({
        where: {
          agentLogId: activityId,
          userId,
          interactionType: 'like'
        },
        transaction
      });

      if (existingLike) {
        // Remove like (toggle)
        await existingLike.destroy({ transaction });
        
        // Update social metrics within transaction
        await aiAgentLogService.updateAgentSocialMetrics(activityId, 'like', transaction);
        
        return {
          success: true,
          message: 'Like removed',
          action: 'removed'
        };
      }
    }

    // Add interaction within transaction
    const interaction = await aiAgentLogService.addAgentInteraction({
      agentLogId: parseInt(activityId),
      userId,
      interactionType,
      commentText: commentText?.trim() || null,
      parentCommentId: parentCommentId || null,
      mentionedUsers: mentionedUsers || []
    }, transaction);

    return {
      success: true,
      message: `${interactionType === 'like' ? 'Like' : 'Comment'} added successfully`,
      interaction: {
        id: interaction.id,
        interactionType: interaction.interactionType,
        commentText: interaction.commentText,
        createdAt: interaction.createdAt
      },
      action: 'added'
    };
  });

  const statusCode = result.action === 'removed' ? 200 : 201;
  res.status(statusCode).json(result);
});

/**
 * Get agent performance dashboard data
 * GET /api/ai-agent-profiles/:agentName/dashboard
 */
const getAgentDashboard = asyncHandler(async (req, res) => {
  const { agentName } = req.params;
  const organizationId = req.user.organizationId;
  const { timeframe = 'week' } = req.query;

  // Get comprehensive statistics
  const [weekStats, monthStats, allTimeStats] = await Promise.all([
    aiAgentLogService.getAgentActivityStats(agentName, organizationId, 'week'),
    aiAgentLogService.getAgentActivityStats(agentName, organizationId, 'month'),
    aiAgentLogService.getAgentActivityStats(agentName, organizationId, 'all')
  ]);

  // Get recent activities for timeline
  const recentActivities = await aiAgentLogService.getAgentActivities(agentName, {
    organizationId,
    limit: 10,
    includeInteractions: true
  });

  res.status(200).json({
    success: true,
    dashboard: {
      weekStats,
      monthStats,
      allTimeStats,
      recentActivities: recentActivities.activities,
      timeframe
    }
  });
});

/**
 * Get agent leaderboard
 * GET /api/ai-agent-profiles/leaderboard
 */
const getAgentLeaderboard = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { metric = 'totalActivities', limit = 10 } = req.query;

  const validMetrics = ['totalActivities', 'totalLikesReceived', 'totalCommentsReceived', 'successRatePercentage'];
  if (!validMetrics.includes(metric)) {
    throw new ValidationError(`Metric must be one of: ${validMetrics.join(', ')}`);
  }

  const agents = await models.AIAgent.findAll({
    where: { 
      organizationId,
      isActive: true,
      [metric]: { [Op.not]: null }
    },
    order: [[metric, 'DESC']],
    limit: parseInt(limit)
  });

  const leaderboard = agents.map((agent, index) => ({
    rank: index + 1,
    name: agent.name,
    value: agent[metric],
    metric,
    profileImageUrl: agent.profileImageUrl || '/images/agents/default-avatar.png'
  }));

  res.status(200).json({
    success: true,
    leaderboard,
    metric
  });
});

module.exports = {
  getAgentProfiles,
  getAgentProfile,
  getAgentActivityFeed,
  getAllAgentActivities,
  getActivityInteractions,
  addAgentInteraction,
  getAgentDashboard,
  getAgentLeaderboard
};