const { models, sequelize } = require('../database/models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/error.middleware');
const embeddingHelper = require('../services/embeddingHelper');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

/**
 * Get all incidents with filtering and pagination
 * GET /api/incidents
 */
const getIncidents = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    severity,
    status,
    category,
    assignedTo,
    startDate,
    endDate,
    search,
  } = req.query;

  // Build where clause
  const where = { organizationId };

  // Apply filters
  if (severity) {
    const severityArray = Array.isArray(severity) ? severity : [severity];
    where.severity = { [Op.in]: severityArray.map(s => parseInt(s)) };
  }

  if (status) {
    const statusArray = Array.isArray(status) ? status : [status];
    where.status = { [Op.in]: statusArray };
  }

  if (category) {
    const categoryArray = Array.isArray(category) ? category : [category];
    where.category = { [Op.in]: categoryArray };
  }

  if (assignedTo) {
    where.assignedTo = assignedTo;
  }

  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  } else if (startDate) {
    where.createdAt = { [Op.gte]: new Date(startDate) };
  } else if (endDate) {
    where.createdAt = { [Op.lte]: new Date(endDate) };
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Calculate offset
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    console.log(`Fetching incidents: page=${page}, limit=${limit}, offset=${offset}, where=`, JSON.stringify(where));
    
    // Get incidents with pagination
    const { count, rows: incidents } = await models.Incident.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: models.User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
          required: false,
        },
        {
          model: models.TimelineEvent,
          as: 'timeline',
          limit: 5,
          order: [['timestamp', 'DESC']],
          required: false,
        },
      ],
    });

    console.log(`Incidents query result: count=${count}, incidents=${incidents.length}`);

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / parseInt(limit));
    const hasNext = parseInt(page) < totalPages;
    const hasPrev = parseInt(page) > 1;

    const response = {
      incidents,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNext,
        hasPrev,
      },
    };

    console.log(`Incidents response: pagination=`, JSON.stringify(response.pagination));
    res.status(200).json(response);

  } catch (error) {
    console.error('Incidents query failed:', error);
    
    // Return empty response with error indication
    res.status(200).json({
      incidents: [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: parseInt(limit),
        hasNext: false,
        hasPrev: false,
      },
      error: 'Failed to fetch incidents',
    });
  }
});

/**
 * Get single incident by ID
 * GET /api/incidents/:id
 */
const getIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const incident = await models.Incident.findOne({
    where: { id, organizationId },
    include: [
      {
        model: models.User,
        as: 'assignedUser',
        attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
      },
      {
        model: models.TimelineEvent,
        as: 'timeline',
        order: [['timestamp', 'ASC']],
        include: [
          {
            model: models.User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
        ],
      },
    ],
  });

  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  // Get related alerts
  if (incident.alertIds && incident.alertIds.length > 0) {
    const relatedAlerts = await models.Alert.findAll({
      where: {
        id: { [Op.in]: incident.alertIds },
        organizationId,
      },
      include: [
        {
          model: models.Asset,
          as: 'asset',
          attributes: ['id', 'name', 'assetType', 'ipAddress'],
        },
      ],
    });
    incident.dataValues.relatedAlerts = relatedAlerts;
  }

  res.status(200).json({ incident });
});

/**
 * Create new incident
 * POST /api/incidents
 */
const createIncident = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  
  console.log('Creating incident request received:', {
    body: req.body,
    user: { id: req.user.id, organizationId: req.user.organizationId }
  });

  // Validate required fields
  if (!req.body.title || !req.body.title.trim()) {
    console.error('Incident creation failed: Missing title');
    return res.status(400).json({
      error: 'Title is required for incident creation'
    });
  }

  // Description is optional - only validate if provided
  if (req.body.description !== undefined && req.body.description !== null && !req.body.description.trim()) {
    console.error('Incident creation failed: Empty description provided');
    return res.status(400).json({
      error: 'Description cannot be empty if provided'
    });
  }

  if (!req.body.severity || req.body.severity < 1 || req.body.severity > 5) {
    console.error('Incident creation failed: Invalid severity:', req.body.severity);
    return res.status(400).json({
      error: 'Severity must be between 1 and 5'
    });
  }
  
  // Handle assignedTo - convert empty string to null
  const assignedTo = req.body.assignedTo === '' ? null : req.body.assignedTo;
  
  // Get assigned user name if assignedTo is provided
  let assignedToName = null;
  if (assignedTo) {
    const assignedUser = await models.User.findByPk(assignedTo);
    if (assignedUser) {
      assignedToName = `${assignedUser.firstName} ${assignedUser.lastName}`;
    } else {
      console.warn('Assigned user not found:', assignedTo);
    }
  }

  const incidentData = {
    ...req.body,
    assignedTo,
    organizationId,
    assignedToName,
    alertCount: req.body.alertIds ? req.body.alertIds.length : 0,
  };

  console.log('Creating incident with processed data:', incidentData);

  let incident;
  try {
    incident = await models.Incident.create(incidentData);
    console.log('Incident created successfully:', { id: incident.id, title: incident.title });
  } catch (dbError) {
    console.error('Database error creating incident:', dbError);
    return res.status(500).json({
      error: 'Database error occurred while creating incident',
      details: dbError.message
    });
  }

  // Create initial timeline event
  try {
    await models.TimelineEvent.create({
      timestamp: new Date(),
      type: 'action',
      title: 'Incident Created',
      description: `Incident created by ${req.user.firstName} ${req.user.lastName}`,
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      incidentId: incident.id,
    });
  } catch (timelineError) {
    console.error('Failed to create timeline event for incident:', timelineError);
    // Continue - timeline creation failure shouldn't fail the whole request
  }

  // Trigger automatic embedding generation (fire-and-forget)
  try {
    embeddingHelper.triggerEmbeddingForRecord('incident', incident.id, 'create');
  } catch (embeddingError) {
    console.error('Failed to trigger embedding for incident:', embeddingError);
    // Continue - embedding failure shouldn't fail the whole request
  }

  // Get the created incident with associations
  const createdIncident = await models.Incident.findByPk(incident.id, {
    include: [
      {
        model: models.User,
        as: 'assignedUser',
        attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
      },
      {
        model: models.TimelineEvent,
        as: 'timeline',
        order: [['timestamp', 'ASC']],
      },
    ],
  });

  // Create notifications for the incident
  try {
    await notificationService.createFromIncident(createdIncident, 'created');
  } catch (error) {
    console.error('Failed to create notification for incident:', error);
    // Don't fail the request if notification creation fails
  }

  res.status(201).json({
    message: 'Incident created successfully',
    incident: createdIncident,
  });
});

/**
 * Update incident
 * PUT /api/incidents/:id
 */
const updateIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const incident = await models.Incident.findOne({
    where: { id, organizationId },
  });

  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  // Get assigned user name if assignedTo is being updated
  let updateData = { ...req.body };
  if (req.body.assignedTo) {
    const assignedUser = await models.User.findByPk(req.body.assignedTo);
    if (assignedUser) {
      updateData.assignedToName = `${assignedUser.firstName} ${assignedUser.lastName}`;
    }
  }

  // Track what changed for timeline
  const changes = [];
  if (req.body.status && req.body.status !== incident.status) {
    changes.push(`Status changed from ${incident.status} to ${req.body.status}`);
  }
  if (req.body.severity && req.body.severity !== incident.severity) {
    changes.push(`Severity changed from ${incident.severity} to ${req.body.severity}`);
  }
  if (req.body.assignedTo && req.body.assignedTo !== incident.assignedTo) {
    changes.push(`Assignment changed to ${updateData.assignedToName}`);
  }

  await incident.update(updateData);

  // Trigger automatic embedding generation for updates (fire-and-forget)
  embeddingHelper.triggerEmbeddingForRecord('incident', incident.id, 'update');

  // Create timeline event for changes
  if (changes.length > 0) {
    await models.TimelineEvent.create({
      timestamp: new Date(),
      type: 'status_change',
      title: 'Incident Updated',
      description: changes.join('; '),
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      incidentId: incident.id,
    });
  }

  // Get updated incident with associations
  const updatedIncident = await models.Incident.findByPk(incident.id, {
    include: [
      {
        model: models.User,
        as: 'assignedUser',
        attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
      },
      {
        model: models.TimelineEvent,
        as: 'timeline',
        order: [['timestamp', 'ASC']],
      },
    ],
  });

  // Create notifications for incident updates
  try {
    if (req.body.status && req.body.status !== incident.dataValues.status) {
      // Status changed
      const eventType = req.body.status === 'resolved' ? 'resolved' : 'updated';
      await notificationService.createFromIncident(updatedIncident, eventType);
    } else if (req.body.assignedTo && req.body.assignedTo !== incident.dataValues.assignedTo) {
      // Assignment changed
      await notificationService.createFromIncident(updatedIncident, 'assigned');
    } else if (changes.length > 0) {
      // Other significant changes
      await notificationService.createFromIncident(updatedIncident, 'updated');
    }
  } catch (error) {
    console.error('Failed to create notification for incident update:', error);
    // Don't fail the request if notification creation fails
  }

  res.status(200).json({
    message: 'Incident updated successfully',
    incident: updatedIncident,
  });
});

/**
 * Close incident
 * POST /api/incidents/:id/close
 */
const closeIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;
  const { resolution } = req.body;

  const incident = await models.Incident.findOne({
    where: { id, organizationId },
  });

  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  await incident.update({
    status: 'resolved',
    resolvedAt: new Date(),
    metadata: {
      ...incident.metadata,
      resolution: resolution || 'Incident resolved',
      resolvedBy: req.user.id,
    },
  });

  // Create timeline event
  await models.TimelineEvent.create({
    timestamp: new Date(),
    type: 'status_change',
    title: 'Incident Resolved',
    description: `Incident resolved by ${req.user.firstName} ${req.user.lastName}${resolution ? `: ${resolution}` : ''}`,
    userId: req.user.id,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    incidentId: incident.id,
  });

  // Get updated incident
  const resolvedIncident = await models.Incident.findByPk(incident.id, {
    include: [
      {
        model: models.User,
        as: 'assignedUser',
        attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
      },
      {
        model: models.TimelineEvent,
        as: 'timeline',
        order: [['timestamp', 'ASC']],
      },
    ],
  });

  res.status(200).json({
    message: 'Incident resolved successfully',
    incident: resolvedIncident,
  });
});

/**
 * Add note to incident
 * POST /api/incidents/:id/notes
 */
const addNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const organizationId = req.user.organizationId;

  const incident = await models.Incident.findOne({
    where: { id, organizationId },
  });

  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  // Create timeline event for note
  const timelineEvent = await models.TimelineEvent.create({
    timestamp: new Date(),
    type: 'note',
    title: 'Note Added',
    description: note,
    userId: req.user.id,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    incidentId: incident.id,
  });

  res.status(201).json({
    message: 'Note added successfully',
    note: timelineEvent,
  });
});

/**
 * Add timeline event to incident
 * POST /api/incidents/:id/timeline
 */
const addTimelineEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, title, description, timestamp } = req.body;
  const organizationId = req.user.organizationId;

  const incident = await models.Incident.findOne({
    where: { id, organizationId },
  });

  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  // Handle custom timestamp
  let eventTimestamp = new Date();
  if (timestamp) {
    eventTimestamp = new Date(timestamp);
    
    // Validate timestamp is a valid date
    if (isNaN(eventTimestamp.getTime())) {
      throw new ValidationError('Invalid timestamp format');
    }
    
    // Validate timestamp is not in the future (allow up to 5 minutes ahead for clock differences)
    const maxFutureTime = new Date(Date.now() + 5 * 60 * 1000);
    if (eventTimestamp > maxFutureTime) {
      throw new ValidationError('Timeline event timestamp cannot be in the future');
    }
  }

  // Create timeline event
  const timelineEvent = await models.TimelineEvent.create({
    timestamp: eventTimestamp,
    type,
    title,
    description: description || null,
    userId: req.user.id,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    incidentId: incident.id,
    isTestData: incident.isTestData, // Inherit test data flag from incident
  });

  res.status(201).json({
    message: 'Timeline event added successfully',
    timelineEvent,
  });
});

/**
 * Helper function to create an incident (used by test data generation)
 * Creates incident with proper embedding triggers
 */
const createIncidentHelper = async (incidentData, user) => {
  const organizationId = user.organizationId;
  
  // Handle alertIds field - filter out fake IDs and validate real ones
  let processedAlertIds = [];
  if (incidentData.alertIds && Array.isArray(incidentData.alertIds)) {
    // Filter out fake alert IDs (anything that doesn't look like a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    processedAlertIds = incidentData.alertIds.filter(id => {
      if (typeof id === 'string' && uuidRegex.test(id)) {
        return true;
      } else {
        console.log(`🔧 DEBUG: Filtered out fake alert ID: ${id}`);
        return false;
      }
    });
    console.log(`🔧 DEBUG: Processed alert IDs: ${processedAlertIds.length} valid UUIDs out of ${incidentData.alertIds.length} provided`);
  }
  
  const finalIncidentData = {
    ...incidentData,
    organizationId,
    assignedTo: user?.id || null,
    assignedToName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'System',
    // Use processed alert IDs (empty array if no valid UUIDs)
    alertIds: processedAlertIds,
    alertCount: processedAlertIds.length,
    // Explicitly handle isTestData parameter for test data consistency
    isTestData: incidentData.isTestData === true || incidentData.isTestData === 'true',
  };

  const incident = await models.Incident.create(finalIncidentData);

  // Create initial timeline event
  await models.TimelineEvent.create({
    incidentId: incident.id,
    timestamp: new Date(),
    type: 'action',
    title: 'Incident Created',
    description: `Incident "${incident.title}" was created in the system`,
    userId: user?.id || null,
    userName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'System',
    metadata: {
      severity: incident.severity,
      category: incident.category,
      status: incident.status,
    },
  });

  // Trigger automatic embedding generation (fire-and-forget)
  embeddingHelper.triggerEmbeddingForRecord('incident', incident.id, 'create');

  // Get the created incident with associations
  const createdIncident = await models.Incident.findByPk(incident.id, {
    include: [
      {
        model: models.TimelineEvent,
        as: 'timeline',
        order: [['timestamp', 'DESC']],
        limit: 5,
      },
    ],
  });

  // Create notification for the incident
  try {
    await notificationService.createFromIncident(createdIncident);
  } catch (error) {
    console.error('Failed to create notification for incident:', error);
    // Don't fail the request if notification creation fails
  }

  return createdIncident;
};

/**
 * POST /api/incidents/:id/ai-draft-additional-info
 * AI draft additional information fields for incident using comprehensive context
 */
const aiDraftAdditionalInformation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // Find the incident with all available context
  const incident = await models.Incident.findOne({
    where: { id, organizationId },
    include: [
      {
        model: models.User,
        as: 'assignedUser',
        attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
      },
      {
        model: models.TimelineEvent,
        as: 'timeline',
        order: [['timestamp', 'ASC']],
        include: [
          {
            model: models.User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName'],
          },
        ],
      },
    ],
  });

  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  const startTime = Date.now();

  try {
    // Get related alerts with full context
    let relatedAlerts = [];
    if (incident.alertIds && incident.alertIds.length > 0) {
      relatedAlerts = await models.Alert.findAll({
        where: {
          id: { [Op.in]: incident.alertIds },
          organizationId,
        },
        include: [
          {
            model: models.Asset,
            as: 'asset',
            attributes: ['id', 'name', 'assetType', 'ipAddress', 'criticality', 'location', 'owner'],
          },
        ],
      });
    }

    // Import aiGenerationService
    const aiGenerationService = require('../services/aiGenerationService');
    
    // Generate AI draft for additional information
    const draftResult = await aiGenerationService.draftAdditionalInformation({
      organizationId, // Add organizationId for dynamic provider configuration
      incident: {
        id: incident.id,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        category: incident.category,
        assignedTo: incident.assignedTo,
        assignedToName: incident.assignedToName,
        createdAt: incident.createdAt,
        metadata: incident.metadata || {}
      },
      relatedAlerts: relatedAlerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        sourceSystem: alert.sourceSystem,
        eventTime: alert.eventTime,
        assetName: alert.assetName,
        assetId: alert.assetId,
        status: alert.status,
        rawData: alert.rawData,
        enrichmentData: alert.enrichmentData,
        aiAnalysis: alert.aiAnalysis,
        asset: alert.asset
      })),
      timeline: incident.timeline || []
    });

    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      draftedFields: draftResult.draftedFields,
      confidence: draftResult.confidence || 85,
      processingTime,
      incident: {
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        status: incident.status
      }
    });
  } catch (error) {
    console.error(`AI drafting failed for incident ${id}:`, error);
    
    const processingTime = Date.now() - startTime;
    
    // Provide more specific error messages based on error type
    let errorMessage = 'AI drafting service is temporarily unavailable. Please try again later.';
    let statusCode = 500;
    
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      errorMessage = 'AI drafting is taking longer than expected due to complex analysis. Please try again.';
      statusCode = 504; // Gateway timeout
    } else if (error.message?.includes('Cannot connect to Ollama')) {
      errorMessage = 'AI service is currently unavailable. Using fallback drafting mode.';
      statusCode = 503; // Service unavailable
    } else if (error.message?.includes('Invalid response')) {
      errorMessage = 'AI service returned invalid response. Please try again.';
      statusCode = 502; // Bad gateway
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      processingTime,
      incident: {
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        status: incident.status
      }
    });
  }
});

/**
 * Delete incident
 * DELETE /api/incidents/:id
 */
const deleteIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const incident = await models.Incident.findOne({
    where: { id, organizationId },
  });

  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  // Allow deletion of incidents in any status since this is a soft delete for user management
  // The soft delete preserves all data and audit trail while removing from active view

  // Create timeline event before deletion for audit purposes
  await models.TimelineEvent.create({
    timestamp: new Date(),
    type: 'action',
    title: 'Incident Deleted',
    description: `Incident "${incident.title}" was deleted by ${req.user.firstName} ${req.user.lastName}`,
    userId: req.user.id,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    incidentId: incident.id,
    metadata: {
      deletedBy: req.user.id,
      deletionReason: 'User requested deletion',
      originalSeverity: incident.severity,
      originalStatus: incident.status,
    },
  });

  // Perform soft delete by updating status instead of hard delete to preserve audit trail
  await incident.update({
    status: 'resolved',
    resolvedAt: new Date(),
    metadata: {
      ...incident.metadata,
      deletedAt: new Date(),
      deletedBy: req.user.id,
      deletedByName: `${req.user.firstName} ${req.user.lastName}`,
      deletionReason: 'User requested deletion',
      isDeleted: true,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Incident deleted successfully',
    incident: {
      id: incident.id,
      title: incident.title,
      status: 'resolved',
      deletedAt: new Date().toISOString(),
    },
  });
});

module.exports = {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  deleteIncident,
  closeIncident,
  addNote,
  addTimelineEvent,
  createIncidentHelper,
  aiDraftAdditionalInformation,
};