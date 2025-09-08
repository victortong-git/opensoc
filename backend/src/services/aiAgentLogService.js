const { models, sequelize } = require('../database/models');
const { Op } = require('sequelize');

/**
 * AI Agent Logging Service
 * Handles logging of all AI agent activities and social interactions
 */

/**
 * Predefined AI Agent configurations
 */
const AI_AGENTS = {
  ALERT_INCIDENT_SPECIALIST: {
    name: 'Alert and Incident Specialist Agent',
    bio: 'I specialize in analyzing security alerts and creating comprehensive incident reports. I help SOC analysts quickly understand threats and respond effectively with accurate classification, detailed analysis, and automated incident creation.',
    specialties: ['Alert Triage', 'Incident Response', 'Risk Assessment', 'Content Review', 'Threat Classification'],
    profileImageUrl: '/images/agents/alert-specialist-avatar.png',
    taskTypes: ['classify alert', 'analyze alert', 'create incident', 'proof read']
  },
  PLAYBOOK_SPECIALIST: {
    name: 'Playbook Specialist Agent',
    bio: 'I create detailed playbooks to guide your incident response and investigation activities. From immediate containment actions to comprehensive forensic analysis procedures, I help standardize and accelerate your response workflows.',
    specialties: ['Incident Response Playbooks', 'Investigation Procedures', 'Automated Workflows', 'Response Coordination'],
    profileImageUrl: '/images/agents/playbook-specialist-avatar.png',
    taskTypes: ['generate immediate playbook', 'generate investigation playbook', 'update playbook', 'review playbook']
  }
};

/**
 * Log an AI agent activity
 */
const logAgentActivity = async ({
  agentName,
  taskName,
  description,
  inputTokens = 0,
  outputTokens = 0,
  executionTimeMs,
  success = false,
  errorMessage = null,
  userId,
  organizationId,
  alertId = null,
  incidentId = null,
  aiProvider = null,
  aiModel = null,
  metadata = {}
}) => {
  try {
    // Calculate total tokens
    const totalTokens = inputTokens + outputTokens;

    // Create the activity log entry
    const logEntry = await models.AIAgentLog.create({
      agentName,
      taskName,
      description,
      inputTokens,
      outputTokens,
      totalTokens,
      executionTimeMs,
      success,
      errorMessage,
      userId,
      organizationId,
      alertId,
      incidentId,
      aiProvider,
      aiModel,
      metadata
    });

    // Update agent statistics asynchronously
    updateAgentStatistics(agentName, organizationId, {
      success,
      executionTimeMs,
      totalTokens
    }).catch(error => {
      console.error('Failed to update agent statistics:', error);
    });

    return logEntry;
  } catch (error) {
    console.error('Failed to log AI agent activity:', error);
    throw error;
  }
};

/**
 * Get activity logs for a specific agent
 */
const getAgentActivities = async (agentName, options = {}) => {
  const {
    organizationId,
    limit = 20,
    offset = 0,
    startDate = null,
    endDate = null,
    success = null,
    includeInteractions = true
  } = options;

  const where = { agentName };
  
  if (organizationId) {
    where.organizationId = organizationId;
  }

  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  if (success !== null) {
    where.success = success;
  }

  const includeOptions = [
    {
      model: models.User,
      as: 'user',
      attributes: ['id', 'username', 'firstName', 'lastName']
    }
  ];

  if (includeInteractions) {
    includeOptions.push({
      model: models.AIAgentInteraction,
      as: 'interactions',
      include: [{
        model: models.User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }]
    });
  }

  const { count, rows: activities } = await models.AIAgentLog.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: includeOptions,
    distinct: true  // Fix pagination count when using includes
  });


  return {
    activities,
    pagination: {
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: count > parseInt(offset) + parseInt(limit)
    }
  };
};

/**
 * Get activity statistics for an agent
 */
const getAgentActivityStats = async (agentName, organizationId, timeframe = 'week') => {
  let startDate;
  const endDate = new Date();

  switch (timeframe) {
    case 'day':
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  const [
    totalActivities,
    successfulActivities,
    avgExecutionTime,
    totalTokens,
    taskBreakdown,
    dailyActivities
  ] = await Promise.all([
    // Total activities
    models.AIAgentLog.count({
      where: {
        agentName,
        organizationId,
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    }),

    // Successful activities
    models.AIAgentLog.count({
      where: {
        agentName,
        organizationId,
        success: true,
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    }),

    // Average execution time
    models.AIAgentLog.findOne({
      where: {
        agentName,
        organizationId,
        createdAt: { [Op.between]: [startDate, endDate] },
        executionTimeMs: { [Op.not]: null }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('execution_time_ms')), 'avgTime']
      ]
    }),

    // Total tokens consumed
    models.AIAgentLog.findOne({
      where: {
        agentName,
        organizationId,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_tokens')), 'totalTokens']
      ]
    }),

    // Task breakdown
    sequelize.query(`
      SELECT task_name, COUNT(*) as count, 
             AVG(execution_time_ms) as avg_time,
             SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful
      FROM ai_agent_logs 
      WHERE agent_name = :agentName 
        AND organization_id = :organizationId
        AND created_at BETWEEN :startDate AND :endDate
      GROUP BY task_name
      ORDER BY count DESC
    `, {
      replacements: { agentName, organizationId, startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    }),

    // Daily activity counts
    sequelize.query(`
      SELECT DATE_TRUNC('day', created_at) as date,
             COUNT(*) as activities,
             SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful,
             AVG(execution_time_ms) as avg_time
      FROM ai_agent_logs 
      WHERE agent_name = :agentName 
        AND organization_id = :organizationId
        AND created_at BETWEEN :startDate AND :endDate
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `, {
      replacements: { agentName, organizationId, startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    })
  ]);

  const successRate = totalActivities > 0 ? (successfulActivities / totalActivities) * 100 : 0;

  return {
    totalActivities,
    successfulActivities,
    successRate: Math.round(successRate * 100) / 100,
    avgExecutionTimeMs: avgExecutionTime?.dataValues?.avgTime ? Math.round(avgExecutionTime.dataValues.avgTime) : null,
    totalTokensConsumed: totalTokens?.dataValues?.totalTokens || 0,
    taskBreakdown: taskBreakdown.map(task => ({
      taskName: task.task_name,
      count: parseInt(task.count),
      avgTime: task.avg_time ? Math.round(task.avg_time) : null,
      successRate: task.count > 0 ? Math.round((task.successful / task.count) * 100) : 0
    })),
    dailyActivities: dailyActivities.map(day => ({
      date: day.date,
      activities: parseInt(day.activities),
      successful: parseInt(day.successful),
      avgTime: day.avg_time ? Math.round(day.avg_time) : null
    })),
    timeframe,
    startDate,
    endDate
  };
};

/**
 * Update agent statistics in the ai_agents table
 */
const updateAgentStatistics = async (agentName, organizationId, activityData) => {
  try {
    // Find or create the AI agent record
    const [agent, created] = await models.AIAgent.findOrCreate({
      where: {
        name: agentName,
        organizationId
      },
      defaults: {
        name: agentName,
        type: getAgentTypeFromName(agentName),
        description: getAgentConfig(agentName)?.bio || `AI agent: ${agentName}`,
        organizationId,
        bio: getAgentConfig(agentName)?.bio,
        capabilities: [], // Add empty array for capabilities field
        specialties: getAgentConfig(agentName)?.specialties || [],
        profileImageUrl: getAgentConfig(agentName)?.profileImageUrl,
        totalActivities: 0,
        totalLikesReceived: 0,
        totalCommentsReceived: 0,
        firstActivityAt: new Date(),
        isActive: true
      }
    });

    // Use the unified sync function to ensure all metrics are accurate
    await syncAgentMetrics(agentName, organizationId);

    return agent;
  } catch (error) {
    console.error('Failed to update agent statistics:', error);
    throw error;
  }
};

/**
 * Get global statistics for an agent (all time)
 */
const getAgentGlobalStats = async (agentName, organizationId) => {
  const [
    totalActivities,
    successfulActivities,
    avgExecutionTime,
    totalTokens
  ] = await Promise.all([
    models.AIAgentLog.count({
      where: { agentName, organizationId }
    }),
    models.AIAgentLog.count({
      where: { agentName, organizationId, success: true }
    }),
    models.AIAgentLog.findOne({
      where: {
        agentName,
        organizationId,
        executionTimeMs: { [Op.not]: null }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('execution_time_ms')), 'avgTime']
      ]
    }),
    models.AIAgentLog.findOne({
      where: { agentName, organizationId },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_tokens')), 'totalTokens']
      ]
    })
  ]);

  const successRate = totalActivities > 0 ? (successfulActivities / totalActivities) * 100 : 0;

  return {
    totalActivities,
    successfulActivities,
    successRate: Math.round(successRate * 100) / 100,
    avgExecutionTime: avgExecutionTime?.dataValues?.avgTime ? Math.round(avgExecutionTime.dataValues.avgTime) : null,
    totalTokensConsumed: totalTokens?.dataValues?.totalTokens || 0
  };
};

/**
 * Helper function to get agent configuration
 */
const getAgentConfig = (agentName) => {
  return Object.values(AI_AGENTS).find(agent => agent.name === agentName);
};

/**
 * Helper function to determine agent type from name
 */
const getAgentTypeFromName = (agentName) => {
  if (agentName.includes('Alert') || agentName.includes('Incident')) {
    return 'soc_analyst';
  }
  if (agentName.includes('Playbook')) {
    return 'incident_response';
  }
  return 'soc_analyst'; // default
};

/**
 * Get all available AI agents
 */
const getAvailableAgents = () => {
  return Object.values(AI_AGENTS);
};

/**
 * Add social interaction (like/comment)
 */
const addAgentInteraction = async ({
  agentLogId,
  userId,
  interactionType,
  commentText = null,
  parentCommentId = null,
  mentionedUsers = []
}, transaction = null) => {
  try {
    const interaction = await models.AIAgentInteraction.create({
      agentLogId,
      userId,
      interactionType,
      commentText,
      parentCommentId,
      mentionedUsers
    }, transaction ? { transaction } : {});

    // Update social metrics for the agent
    await updateAgentSocialMetrics(agentLogId, interactionType, transaction);

    return interaction;
  } catch (error) {
    console.error('Failed to add agent interaction:', error);
    throw error;
  }
};

/**
 * Sync all agent metrics from database (unified function)
 */
const syncAgentMetrics = async (agentName, organizationId, transaction = null) => {
  try {
    // Find the agent record
    const agent = await models.AIAgent.findOne({
      where: {
        name: agentName,
        organizationId
      }
    }, transaction ? { transaction } : {});

    if (!agent) return;

    // Get all metrics in parallel
    const [
      totalActivities,
      successfulActivities,
      avgExecutionTime,
      totalTokens,
      likesCount,
      commentsCount
    ] = await Promise.all([
      // Total activities
      models.AIAgentLog.count({
        where: { agentName, organizationId },
        transaction
      }),
      // Successful activities
      models.AIAgentLog.count({
        where: { agentName, organizationId, success: true },
        transaction
      }),
      // Average execution time
      models.AIAgentLog.findOne({
        where: {
          agentName,
          organizationId,
          executionTimeMs: { [Op.not]: null }
        },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('execution_time_ms')), 'avgTime']
        ],
        transaction
      }),
      // Total tokens consumed
      models.AIAgentLog.findOne({
        where: { agentName, organizationId },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('total_tokens')), 'totalTokens']
        ],
        transaction
      }),
      // Total likes
      sequelize.query(`
        SELECT COUNT(*) as count 
        FROM ai_agent_interactions aii
        JOIN ai_agent_logs aal ON aii.agent_log_id = aal.id
        WHERE aal.agent_name = :agentName 
          AND aal.organization_id = :organizationId
          AND aii.interaction_type = 'like'
      `, {
        replacements: { agentName, organizationId },
        type: sequelize.QueryTypes.SELECT,
        transaction
      }),
      // Total comments
      sequelize.query(`
        SELECT COUNT(*) as count 
        FROM ai_agent_interactions aii
        JOIN ai_agent_logs aal ON aii.agent_log_id = aal.id
        WHERE aal.agent_name = :agentName 
          AND aal.organization_id = :organizationId
          AND aii.interaction_type = 'comment'
      `, {
        replacements: { agentName, organizationId },
        type: sequelize.QueryTypes.SELECT,
        transaction
      })
    ]);

    const successRate = totalActivities > 0 ? (successfulActivities / totalActivities) * 100 : 0;

    // Update all metrics atomically
    await agent.update({
      totalActivities,
      totalLikesReceived: parseInt(likesCount[0].count),
      totalCommentsReceived: parseInt(commentsCount[0].count),
      avgExecutionTimeMs: avgExecutionTime?.dataValues?.avgTime ? Math.round(avgExecutionTime.dataValues.avgTime) : null,
      successRatePercentage: Math.round(successRate * 100) / 100,
      lastActivity: new Date(),
      lastInteractionAt: new Date(),
      isActive: true
    }, transaction ? { transaction } : {});

    return agent;
  } catch (error) {
    console.error('Failed to sync agent metrics:', error);
    throw error;
  }
};

/**
 * Update social metrics for an agent based on interactions
 */
const updateAgentSocialMetrics = async (agentLogId, interactionType, transaction = null) => {
  try {
    // Get the agent log to find which agent this belongs to
    const agentLog = await models.AIAgentLog.findByPk(agentLogId, transaction ? { transaction } : {});
    if (!agentLog) return;

    // Use the unified sync function to ensure all metrics are accurate
    await syncAgentMetrics(agentLog.agentName, agentLog.organizationId, transaction);

  } catch (error) {
    console.error('Failed to update agent social metrics:', error);
  }
};

/**
 * Get social feed for agents (recent activities with interactions)
 */
const getAgentSocialFeed = async (organizationId, options = {}) => {
  const {
    limit = 20,
    offset = 0,
    agentName = null
  } = options;

  const where = { organizationId };
  if (agentName) {
    where.agentName = agentName;
  }

  const activities = await models.AIAgentLog.findAll({
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
      // Temporarily disabled while AIAgentInteraction model is not available
      // {
      //   model: models.AIAgentInteraction,
      //   as: 'interactions',
      //   include: [{
      //     model: models.User,
      //     as: 'user',
      //     attributes: ['id', 'username', 'firstName', 'lastName']
      //   }],
      //   order: [['createdAt', 'ASC']]
      // }
    ]
  });

  // Transform to social media post format
  const socialPosts = activities.map(activity => {
    // Temporarily return empty arrays while interactions table is disabled
    const likes = [];
    const comments = [];

    return {
      id: activity.id,
      agent: {
        name: activity.agentName,
        avatar: getAgentConfig(activity.agentName)?.profileImageUrl || '/images/agents/default-avatar.png'
      },
      task: {
        name: activity.taskName,
        description: activity.description
      },
      performance: {
        executionTimeMs: activity.executionTimeMs,
        success: activity.success,
        tokenUsage: {
          input: activity.inputTokens,
          output: activity.outputTokens,
          total: activity.totalTokens
        }
      },
      social: {
        likes: {
          count: likes.length,
          users: likes.map(like => like.user)
        },
        comments: {
          count: comments.length,
          items: comments.map(comment => ({
            id: comment.id,
            text: comment.commentText,
            user: comment.user,
            createdAt: comment.createdAt,
            isEdited: comment.isEdited,
            editedAt: comment.editedAt
          }))
        }
      },
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      user: activity.user
    };
  });

  return socialPosts;
};

module.exports = {
  logAgentActivity,
  getAgentActivities,
  getAgentActivityStats,
  updateAgentStatistics,
  getAvailableAgents,
  addAgentInteraction,
  updateAgentSocialMetrics,
  syncAgentMetrics,
  getAgentSocialFeed,
  AI_AGENTS
};