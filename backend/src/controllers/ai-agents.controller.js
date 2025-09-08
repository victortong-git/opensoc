const { models, sequelize } = require('../database/models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');
const aiAgentLogService = require('../services/aiAgentLogService');

/**
 * Transform raw agent data to match frontend expectations
 * Adds computed fields and mock data for demonstration
 */
const transformAgentData = (agent) => {
  const agentData = agent.toJSON ? agent.toJSON() : agent;
  
  // Mock capabilities based on agent type
  const getCapabilitiesByType = (type) => {
    const capabilityMap = {
      'soc_analyst': [
        {
          id: '1',
          name: 'Alert Triage',
          description: 'Automatically prioritize and categorize security alerts',
          type: 'analysis',
          enabled: true,
          accuracy: 94,
          learningProgress: 87
        },
        {
          id: '2', 
          name: 'Threat Detection',
          description: 'Identify potential security threats in real-time',
          type: 'prediction',
          enabled: true,
          accuracy: 89,
          learningProgress: 92
        }
      ],
      'incident_response': [
        {
          id: '3',
          name: 'Automated Response',
          description: 'Execute predefined response playbooks automatically',
          type: 'automation',
          enabled: true,
          accuracy: 96,
          learningProgress: 78
        },
        {
          id: '4',
          name: 'Evidence Collection',
          description: 'Gather and preserve digital evidence',
          type: 'analysis',
          enabled: true,
          accuracy: 91,
          learningProgress: 85
        }
      ],
      'threat_intel': [
        {
          id: '5',
          name: 'IOC Analysis',
          description: 'Analyze and correlate indicators of compromise',
          type: 'analysis',
          enabled: true,
          accuracy: 92,
          learningProgress: 88
        },
        {
          id: '6',
          name: 'Threat Prediction',
          description: 'Predict emerging threats based on intelligence',
          type: 'prediction',
          enabled: true,
          accuracy: 87,
          learningProgress: 91
        }
      ],
      'report_generation': [
        {
          id: '7',
          name: 'Automated Reports',
          description: 'Generate comprehensive security reports',
          type: 'automation',
          enabled: true,
          accuracy: 95,
          learningProgress: 82
        },
        {
          id: '8',
          name: 'Data Visualization',
          description: 'Create charts and graphs from security data',
          type: 'analysis',
          enabled: true,
          accuracy: 88,
          learningProgress: 79
        }
      ]
    };
    return capabilityMap[type] || [];
  };

  // Mock primary functions based on agent type
  const getPrimaryFunctionsByType = (type) => {
    const functionsMap = {
      'soc_analyst': [
        'Monitor security alerts in real-time',
        'Perform initial triage and classification',
        'Correlate events across multiple sources',
        'Generate threat intelligence reports'
      ],
      'incident_response': [
        'Execute automated response procedures',
        'Coordinate incident response activities',
        'Collect and preserve digital evidence',
        'Communicate with stakeholders'
      ],
      'threat_intel': [
        'Analyze threat indicators and patterns',
        'Monitor dark web and threat feeds',
        'Correlate threat intelligence data',
        'Provide tactical threat assessments'
      ],
      'report_generation': [
        'Generate automated security reports',
        'Create executive dashboards',
        'Compile compliance documentation',
        'Produce threat landscape analysis'
      ]
    };
    return functionsMap[type] || [];
  };

  // Generate mock metrics
  const generateMetrics = () => {
    const successRate = Math.floor(Math.random() * 15) + 85; // 85-100%
    const tasksCompleted = Math.floor(Math.random() * 500) + 100;
    const tasksInProgress = Math.floor(Math.random() * 10) + 1;
    
    return {
      successRate,
      tasksCompleted,
      tasksInProgress,
      uptime: Math.floor(Math.random() * 5) + 95, // 95-100%
      collaborationScore: Math.floor(Math.random() * 20) + 80, // 80-100
      falsePositiveReduction: agentData.type === 'soc_analyst' ? Math.floor(Math.random() * 20) + 60 : undefined
    };
  };

  // Generate mock current tasks
  const generateCurrentTasks = () => {
    const taskCount = Math.floor(Math.random() * 4) + 1; // 1-4 tasks
    const tasks = [];
    const taskTemplates = [
      { title: 'Analyzing suspicious login attempts', description: 'Investigating multiple failed login attempts from unusual locations', priority: 4 },
      { title: 'Processing malware alert', description: 'Examining potential malware detected on endpoint systems', priority: 5 },
      { title: 'Correlating network anomalies', description: 'Analyzing unusual network traffic patterns', priority: 3 },
      { title: 'Generating threat report', description: 'Compiling weekly threat intelligence summary', priority: 2 },
      { title: 'Updating security playbooks', description: 'Refining automated response procedures', priority: 1 }
    ];
    
    for (let i = 0; i < taskCount; i++) {
      const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
      tasks.push({
        id: `task_${i + 1}`,
        title: template.title,
        description: template.description,
        priority: template.priority,
        confidence: Math.floor(Math.random() * 15) + 85, // 85-100%
        startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Within last hour
        collaboratingHuman: Math.random() > 0.5 ? `analyst_${Math.floor(Math.random() * 3) + 1}@company.com` : undefined
      });
    }
    return tasks;
  };

  // Generate assigned humans
  const generateAssignedHumans = () => {
    const humanCount = Math.floor(Math.random() * 3) + 1; // 1-3 humans
    const humans = [];
    const humanNames = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eva Martinez'];
    
    for (let i = 0; i < humanCount; i++) {
      humans.push(humanNames[Math.floor(Math.random() * humanNames.length)]);
    }
    return [...new Set(humans)]; // Remove duplicates
  };

  return {
    ...agentData,
    capabilities: getCapabilitiesByType(agentData.type),
    primaryFunctions: getPrimaryFunctionsByType(agentData.type),
    metrics: generateMetrics(),
    currentTasks: generateCurrentTasks(),
    assignedHumans: generateAssignedHumans(),
    version: agentData.modelVersion || '1.0.0',
    lastUpdated: agentData.updatedAt || new Date().toISOString()
  };
};

/**
 * Get all AI agents with filtering and pagination
 * GET /api/ai-agents
 */
const getAIAgents = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    type,
    status,
    search,
  } = req.query;

  // Build where clause
  const where = { organizationId };

  // Apply filters
  if (type) {
    const typeArray = Array.isArray(type) ? type : [type];
    where.type = { [Op.in]: typeArray };
  }

  if (status) {
    const statusArray = Array.isArray(status) ? status : [status];
    where.status = { [Op.in]: statusArray };
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Calculate offset
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Get AI agents with pagination
  const { count, rows: agents } = await models.AIAgent.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
  });

  // Transform agents data to match frontend expectations
  const transformedAgents = agents.map(agent => transformAgentData(agent));

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / parseInt(limit));
  const hasNext = parseInt(page) < totalPages;
  const hasPrev = parseInt(page) > 1;

  res.status(200).json({
    agents: transformedAgents,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: count,
      itemsPerPage: parseInt(limit),
      hasNext,
      hasPrev,
    },
  });
});

/**
 * Get single AI agent by ID
 * GET /api/ai-agents/:id
 */
const getAIAgent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const agent = await models.AIAgent.findOne({
    where: { id, organizationId },
  });

  if (!agent) {
    throw new NotFoundError('AI Agent not found');
  }

  const transformedAgent = transformAgentData(agent);
  res.status(200).json({ agent: transformedAgent });
});

/**
 * Create new AI agent
 * POST /api/ai-agents
 */
const createAIAgent = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    name,
    type,
    description,
    capabilities = [],
    primaryFunctions = [],
    metrics = {},
    currentTasks = [],
    assignedHumans = [],
    version = '1.0.0',
  } = req.body;

  const agentData = {
    name,
    type,
    description,
    capabilities,
    primaryFunctions,
    metrics,
    currentTasks,
    assignedHumans,
    version,
    organizationId,
    status: 'offline', // New agents start offline
    lastUpdated: new Date(),
  };

  const agent = await models.AIAgent.create(agentData);

  // Log agent creation activity
  await logAgentActivity(req.user.id, agent.id, 'agent_created', `Created AI agent: ${name}`, {
    agentType: type,
    agentName: name,
  });

  res.status(201).json({
    message: 'AI Agent created successfully',
    agent,
  });
});

/**
 * Update AI agent
 * PUT /api/ai-agents/:id
 */
const updateAIAgent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const agent = await models.AIAgent.findOne({
    where: { id, organizationId },
  });

  if (!agent) {
    throw new NotFoundError('AI Agent not found');
  }

  // Track changes for activity log
  const changes = [];
  const updateData = { ...req.body, lastUpdated: new Date() };
  
  Object.keys(updateData).forEach(key => {
    if (key !== 'lastUpdated' && JSON.stringify(updateData[key]) !== JSON.stringify(agent[key])) {
      changes.push(`${key}: updated`);
    }
  });

  await agent.update(updateData);

  // Log agent update activity
  if (changes.length > 0) {
    await logAgentActivity(req.user.id, agent.id, 'agent_updated', `Updated AI agent: ${agent.name}`, {
      agentType: agent.type,
      agentName: agent.name,
      changes: changes,
    });
  }

  res.status(200).json({
    message: 'AI Agent updated successfully',
    agent,
  });
});

/**
 * Delete AI agent
 * DELETE /api/ai-agents/:id
 */
const deleteAIAgent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const agent = await models.AIAgent.findOne({
    where: { id, organizationId },
  });

  if (!agent) {
    throw new NotFoundError('AI Agent not found');
  }

  // Log agent deletion activity
  await logAgentActivity(req.user.id, agent.id, 'agent_deleted', `Deleted AI agent: ${agent.name}`, {
    agentType: agent.type,
    agentName: agent.name,
  });

  await agent.destroy();

  res.status(200).json({
    message: 'AI Agent deleted successfully',
  });
});

/**
 * Update AI agent status
 * POST /api/ai-agents/:id/status
 */
const updateAgentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const organizationId = req.user.organizationId;

  // Validate status
  const validStatuses = ['online', 'processing', 'maintenance', 'offline'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const agent = await models.AIAgent.findOne({
    where: { id, organizationId },
  });

  if (!agent) {
    throw new NotFoundError('AI Agent not found');
  }

  const oldStatus = agent.status;
  await agent.update({ 
    status, 
    lastUpdated: new Date() 
  });

  // Log status change activity
  await logAgentActivity(req.user.id, agent.id, 'agent_status_changed', 
    `Changed AI agent status: ${oldStatus} → ${status}`, {
    agentType: agent.type,
    agentName: agent.name,
    oldStatus,
    newStatus: status,
  });

  res.status(200).json({
    message: 'AI Agent status updated successfully',
    agent,
  });
});

/**
 * Get AI agent activities
 * GET /api/ai-agents/activities
 */
const getAgentActivities = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, agentId, activityType, startDate, endDate } = req.query;
  const organizationId = req.user.organizationId;

  // Build activity query - get activities for agents belonging to this organization
  const where = {};

  if (agentId) {
    where.agentId = agentId;
  }

  if (activityType) {
    where.action = activityType;
  }

  if (startDate && endDate) {
    where.timestamp = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  // Calculate offset
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Get activity logs with pagination using raw query to ensure we only get activities for this org's agents
  const activities = await sequelize.query(`
    SELECT aa.*, ag.name as agent_name, ag.type as agent_type
    FROM agent_activities aa
    JOIN ai_agents ag ON aa.agent_id = ag.id
    WHERE ag.organization_id = :organizationId
    ${agentId ? "AND aa.agent_id = :agentId" : ""}
    ${activityType ? "AND aa.action = :activityType" : ""}
    ${startDate && endDate ? "AND aa.timestamp BETWEEN :startDate AND :endDate" : ""}
    ORDER BY aa.timestamp DESC
    LIMIT :limit OFFSET :offset
  `, {
    replacements: { 
      organizationId,
      agentId,
      activityType,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      limit: parseInt(limit),
      offset
    },
    type: sequelize.QueryTypes.SELECT
  });

  const totalResult = await sequelize.query(`
    SELECT COUNT(*) as count
    FROM agent_activities aa
    JOIN ai_agents ag ON aa.agent_id = ag.id
    WHERE ag.organization_id = :organizationId
    ${agentId ? "AND aa.agent_id = :agentId" : ""}
    ${activityType ? "AND aa.action = :activityType" : ""}
    ${startDate && endDate ? "AND aa.timestamp BETWEEN :startDate AND :endDate" : ""}
  `, {
    replacements: { 
      organizationId,
      agentId,
      activityType,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
    type: sequelize.QueryTypes.SELECT
  });

  const totalPages = Math.ceil(parseInt(totalResult[0].count) / parseInt(limit));

  res.status(200).json({
    activities,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: parseInt(totalResult[0].count),
      itemsPerPage: parseInt(limit),
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1,
    },
  });
});

/**
 * Get AI agent statistics
 * GET /api/ai-agents/stats
 */
const getAIAgentStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const [
    totalAgents,
    agentsByStatus,
    agentsByType,
    recentActivities
  ] = await Promise.all([
    models.AIAgent.count({ where: { organizationId } }),
    sequelize.query(`
      SELECT status, COUNT(*) as count 
      FROM ai_agents 
      WHERE organization_id = :orgId 
      GROUP BY status
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }),
    sequelize.query(`
      SELECT type, COUNT(*) as count 
      FROM ai_agents 
      WHERE organization_id = :orgId 
      GROUP BY type
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }),
    sequelize.query(`
      SELECT COUNT(*) as count 
      FROM agent_activities aa
      JOIN ai_agents ag ON aa.agent_id = ag.id
      WHERE ag.organization_id = :orgId 
      AND aa.timestamp >= NOW() - INTERVAL '24 hours'
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }).catch(() => [{ count: 0 }]) // Handle case where table doesn't exist yet
  ]);

  // Calculate metrics from agents data
  const agents = await models.AIAgent.findAll({ 
    where: { organizationId },
    attributes: ['performance_metrics', 'total_tasks', 'successful_tasks', 'failed_tasks', 'status']
  });

  const totalTasks = agents.reduce((sum, agent) => {
    return sum + (agent.total_tasks || 0);
  }, 0);

  const avgSuccessRate = agents.length > 0 
    ? Math.round(agents.reduce((sum, agent) => {
        const successRate = agent.total_tasks > 0 ? (agent.successful_tasks / agent.total_tasks) * 100 : 0;
        return sum + successRate;
      }, 0) / agents.length)
    : 0;

  const activeAgents = agentsByStatus.find(s => s.status === 'online')?.count || 0;

  res.status(200).json({
    total: totalAgents,
    active: parseInt(activeAgents),
    totalTasks,
    avgSuccessRate,
    byStatus: agentsByStatus,
    byType: agentsByType,
    recentActivity: parseInt(recentActivities[0].count),
  });
});

/**
 * Log agent activity
 */
const logAgentActivity = async (userId, agentId, action, description, metadata = {}) => {
  try {
    await sequelize.query(`
      INSERT INTO agent_activities (user_id, agent_id, action, description, metadata, timestamp)
      VALUES (:userId, :agentId, :action, :description, :metadata, NOW())
    `, {
      replacements: {
        userId,
        agentId,
        action,
        description,
        metadata: JSON.stringify(metadata)
      }
    });
  } catch (error) {
    console.error('Failed to log agent activity:', error);
    // Don't throw error - activity logging should not break main functionality
  }
};

/**
 * Get human-AI teams data
 * GET /api/ai-agents/teams
 */
const getHumanAITeams = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  // Get all users and agents for this organization
  const [users, agents] = await Promise.all([
    models.User.findAll({
      where: { organizationId, isActive: true },
      attributes: ['id', 'username', 'firstName', 'lastName', 'role']
    }),
    models.AIAgent.findAll({
      where: { organizationId },
      attributes: ['id', 'name', 'type', 'status', 'performance_metrics', 'total_tasks', 'successful_tasks']
    })
  ]);

  // Build teams based on agent assignments
  const teams = [];
  const processedHumans = new Set();

  // Since we don't have assignedHumans data yet, create mock teams based on agent types
  const agentsByType = {};
  agents.forEach(agent => {
    if (!agentsByType[agent.type]) {
      agentsByType[agent.type] = [];
    }
    agentsByType[agent.type].push(agent);
  });

  // Create teams for each agent type
  Object.entries(agentsByType).forEach(([type, typeAgents]) => {
    // Assign some users to each agent type team
    const teamSize = Math.min(users.length, Math.floor(Math.random() * 3) + 2);
    const availableUsers = users.filter(user => !processedHumans.has(user.id));
    const teamHumans = availableUsers.slice(0, teamSize);

    if (teamHumans.length > 0) {
      const successRate = typeAgents.length > 0 && typeAgents[0].total_tasks > 0 
        ? (typeAgents[0].successful_tasks / typeAgents[0].total_tasks) * 100 
        : Math.floor(Math.random() * 20) + 85;

      const team = {
        id: `team-${type}`,
        name: `${type.replace('_', ' ').toUpperCase()} Team`,
        specialization: type,
        humanAnalysts: teamHumans.map(h => `${h.firstName} ${h.lastName}`),
        aiAgents: typeAgents.map(agent => agent.id),
        performance: {
          collaborationEfficiency: Math.floor(Math.random() * 20) + 80,
          taskCompletionRate: successRate,
          averageResponseTime: Math.floor(Math.random() * 10) + 3,
          humanSatisfactionScore: Math.floor(Math.random() * 10) / 10 + 4,
          aiAccuracyImprovement: Math.floor(Math.random() * 30) + 10
        },
        currentWorkload: Math.floor(Math.random() * 40) + 40,
        maxWorkload: 100
      };

      teams.push(team);
      teamHumans.forEach(h => processedHumans.add(h.id));
    }
  });

  res.status(200).json({
    teams,
    totalTeams: teams.length,
    totalHumans: users.length,
    totalAgents: agents.length
  });
});

/**
 * ADAPTER ENDPOINTS FOR SOCIAL MEDIA-STYLE AI AGENT SYSTEM
 * These endpoints provide backward compatibility while integrating the new social features
 */

/**
 * Get real AI agent activities (with social interactions)
 * This replaces the mock activity system with real logged activities
 * GET /api/ai-agents/real-activities
 */
const getRealAgentActivities = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    page = 1,
    limit = 20,
    agentName = null,
    taskName = null,
    startDate = null,
    endDate = null
  } = req.query;

  const where = { organizationId };
  
  if (agentName) {
    where.agentName = agentName;
  }
  
  if (taskName) {
    where.taskName = taskName;
  }

  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Get activities with social interactions
  const { count, rows: activities } = await models.AIAgentLog.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
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

  // Transform to social media style format
  const transformedActivities = activities.map(activity => {
    const likes = activity.interactions?.filter(i => i.interactionType === 'like') || [];
    const comments = activity.interactions?.filter(i => i.interactionType === 'comment') || [];
    
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
        likes: likes.map(like => ({
          id: like.id,
          user: like.user,
          createdAt: like.createdAt
        })),
        comments: comments.map(comment => ({
          id: comment.id,
          text: comment.commentText,
          user: comment.user,
          createdAt: comment.createdAt,
          isEdited: comment.isEdited,
          editedAt: comment.editedAt
        }))
      },
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      user: activity.user
    };
  });

  const totalPages = Math.ceil(count / parseInt(limit));

  res.status(200).json({
    activities: transformedActivities,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: count,
      itemsPerPage: parseInt(limit),
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1,
    },
  });
});

/**
 * Get enhanced AI agent profiles (social media style)
 * GET /api/ai-agents/profiles
 */
const getEnhancedAgentProfiles = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  // Get agents with social metrics
  const agents = await models.AIAgent.findAll({
    where: { 
      organizationId,
      isActive: true 
    },
    order: [['totalActivities', 'DESC']]
  });

  // Transform to include social media profile data
  const enhancedProfiles = agents.map(agent => {
    const agentConfig = Object.values(aiAgentLogService.AI_AGENTS).find(
      config => config.name === agent.name
    );

    return {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
      description: agent.description,
      bio: agent.bio || agentConfig?.bio || `AI specialist: ${agent.name}`,
      specialties: agent.specialties || agentConfig?.specialties || [],
      profileImageUrl: agent.profileImageUrl || agentConfig?.profileImageUrl || '/images/agents/default-avatar.png',
      socialMetrics: {
        totalActivities: agent.totalActivities || 0,
        totalLikesReceived: agent.totalLikesReceived || 0,
        totalCommentsReceived: agent.totalCommentsReceived || 0,
        avgExecutionTimeMs: agent.avgExecutionTimeMs,
        successRatePercentage: agent.successRatePercentage,
        lastInteractionAt: agent.lastInteractionAt,
        firstActivityAt: agent.firstActivityAt
      },
      performance: {
        tasksCompleted: agent.totalActivities || 0,
        successRate: agent.successRatePercentage || 0,
        avgResponseTime: agent.avgExecutionTimeMs ? Math.round(agent.avgExecutionTimeMs / 1000) : 0,
        popularityScore: (agent.totalLikesReceived || 0) + (agent.totalCommentsReceived || 0) * 2
      },
      isOnline: agent.status === 'online',
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt
    };
  });

  res.status(200).json({
    success: true,
    agents: enhancedProfiles,
    totalAgents: enhancedProfiles.length
  });
});

/**
 * Get AI agent social feed (for dashboard)
 * GET /api/ai-agents/social-feed
 */
const getAgentSocialFeed = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { limit = 10 } = req.query;

  // Get recent activities with social metrics
  const socialFeed = await aiAgentLogService.getAgentSocialFeed(organizationId, {
    limit: parseInt(limit),
    offset: 0
  });

  res.status(200).json({
    success: true,
    feed: socialFeed,
    totalItems: socialFeed.length
  });
});

/**
 * Log AI agent activity
 * POST /api/ai-agent-logs
 */
const logAIAgentActivity = asyncHandler(async (req, res) => {
  const {
    agentName,
    taskName,
    description,
    inputTokens = 0,
    outputTokens = 0,
    executionTimeMs,
    success = true,
    errorMessage = null,
    alertId = null,
    incidentId = null,
    playbookId = null,
    aiProvider = null,
    aiModel = null,
    metadata = {}
  } = req.body;

  // Validate required fields
  if (!agentName || !taskName || !description) {
    throw new ValidationError('Agent name, task name, and description are required');
  }

  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  try {
    const logEntry = await aiAgentLogService.logAgentActivity({
      agentName,
      taskName,
      description,
      inputTokens,
      outputTokens,
      executionTimeMs,
      success,
      errorMessage,
      userId,
      organizationId,
      alertId,
      incidentId,
      aiProvider,
      aiModel,
      metadata: {
        ...metadata,
        playbookId // Add playbookId to metadata if provided
      }
    });

    res.status(201).json({
      success: true,
      message: 'AI agent activity logged successfully',
      logId: logEntry.id
    });
  } catch (error) {
    console.error('Failed to log AI agent activity:', error);
    throw new Error('Failed to log activity');
  }
});

module.exports = {
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
};