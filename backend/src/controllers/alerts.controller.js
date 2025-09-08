const { asyncHandler, NotFoundError } = require('../middleware/error.middleware');
const { models } = require('../database/models');
const { Op } = require('sequelize');
const alertStatsService = require('../services/alertStatsService');
const alertAnalysisHelper = require('./helpers/alertAnalysisHelper');
const alertClassificationHelper = require('./helpers/alertClassificationHelper');
const incidentFormGenerationService = require('../services/incidentFormGenerationService');
const proofreadingService = require('../services/proofreadingService');
const alertTimelineService = require('../services/alertTimelineService');
const incidentConfirmationService = require('../services/incidentConfirmationService');
const alertCrudService = require('../services/alertCrudService');
const alertResolutionService = require('../services/alertResolutionService');
const alertUtilsService = require('../services/alertUtilsService');

/**
 * Get all alerts with filtering and pagination
 * GET /api/alerts
 */
const getAlerts = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const result = await alertCrudService.getAlerts(organizationId, req.query);
  
  res.status(200).json({
    alerts: result.alerts,
    pagination: {
      currentPage: result.metadata.currentPage,
      totalPages: result.metadata.totalPages,
      totalItems: result.metadata.totalCount,
      itemsPerPage: result.metadata.pageSize,
      hasNext: result.metadata.hasNextPage,
      hasPrev: result.metadata.hasPreviousPage,
    },
    metadata: result.metadata
  });
});

/**
 * Get single alert by ID
 * GET /api/alerts/:id
 */
const getAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const result = await alertCrudService.getAlert(id, organizationId);
  res.status(200).json(result);
});

/**
 * Create new alert
 * POST /api/alerts
 */
const createAlert = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const result = await alertCrudService.createAlert(req.body, organizationId, req.user);
  res.status(201).json(result);
});

/**
 * Update alert
 * PUT /api/alerts/:id
 */
const updateAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;
  const result = await alertCrudService.updateAlert(id, organizationId, req.body, req.user);
  res.status(200).json(result);
});

/**
 * Delete alert
 * DELETE /api/alerts/:id
 */
const deleteAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;
  const result = await alertCrudService.deleteAlert(id, organizationId, req.user);
  res.status(200).json(result);
});

/**
 * Bulk update alerts
 * PUT /api/alerts/bulk
 */
const bulkUpdateAlerts = asyncHandler(async (req, res) => {
  const { alertIds, updateData } = req.body;
  const organizationId = req.user.organizationId;
  const result = await alertCrudService.bulkUpdateAlerts(alertIds, organizationId, updateData, req.user);
  res.status(200).json(result);
});

/**
 * Resolve alert with remarks
 * POST /api/alerts/:id/resolve
 */
const resolveAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;
  const result = await alertResolutionService.resolveAlert(id, organizationId, req.user, req.body);
  res.status(200).json(result);
});

/**
 * Escalate alert to incident
 * POST /api/alerts/:id/escalate
 */
const escalateAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;
  const result = await alertResolutionService.escalateAlert(id, organizationId, req.user, req.body);
  res.status(201).json(result);
});

/**
 * Get alert statistics
 * GET /api/alerts/stats
 */
const getAlertStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { days = 7 } = req.query;
  
  const statistics = await alertStatsService.getAlertStatistics(organizationId, days);
  
  res.status(200).json(statistics);
});

/**
 * AI Analysis for alert
 * POST /api/alerts/:id/ai-analysis
 */
const analyzeAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // Find the alert
  const alert = await models.Alert.findOne({
    where: { id, organizationId },
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  try {
    const result = await alertAnalysisHelper.performAnalysis(alert, organizationId, req.user);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'AI analysis failed',
      processingTimeMs: Date.now() - Date.now(),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * AI Classification for alert - generates event type classification and contextual tags
 * POST /api/alerts/:id/ai-classification
 */
const aiClassification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // Find the alert
  const alert = await models.Alert.findOne({
    where: { id, organizationId },
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  try {
    const options = {
      refreshAnalysis: req.body.refreshAnalysis || false
    };

    const result = await alertClassificationHelper.performClassification(alert, organizationId, req.user, options);
    res.status(200).json(result);
  } catch (error) {
    const startTime = Date.now();
    res.status(500).json({
      success: false,
      error: error.message || 'AI classification failed',
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * AI Generate Incident Form Data from Alert
 * POST /api/alerts/:id/ai-generate-incident-form
 * Uses Security Alert data AND existing AI Analysis as context
 */
const aiGenerateIncidentForm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // Find the alert with all available context
  const alert = await models.Alert.findOne({
    where: { id, organizationId },
    include: [
      {
        model: models.Asset,
        as: 'asset',
        attributes: ['id', 'name', 'assetType', 'ipAddress', 'criticality', 'location', 'owner'],
      },
    ],
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  try {
    const result = await incidentFormGenerationService.generateIncidentForm(alert, organizationId, req.user);
    
    // Transform response format to match frontend expectations
    const response = {
      success: result.success,
      suggestions: result.incidentFormData,
      processingTime: result.processingTimeMs,
      sourceAlert: result.alert,
      hasExistingAnalysis: !!alert.aiAnalysis
    };
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Incident form generation failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * AI Proof Read Incident Form Fields
 * POST /api/alerts/proof-read
 * Uses AI to improve grammar and spelling in text fields
 */
const proofReadIncidentFields = asyncHandler(async (req, res) => {
  const { fields } = req.body;
  const startTime = Date.now();

  try {
    const validFields = proofreadingService.validateFields(fields);

    if (validFields.length === 0) {
      return res.status(200).json({
        success: true,
        suggestions: {},
        processingTime: Date.now() - startTime,
        message: 'No text fields provided for proofreading'
      });
    }

    const result = await proofreadingService.proofreadIncidentFields(
      validFields, 
      req.user.organizationId, 
      req.user.id
    );

    res.status(200).json(result);

  } catch (error) {
    console.error('Proofreading failed:', error);
    
    // Handle enhanced errors from service
    if (error.details) {
      return res.status(200).json({
        success: false,
        ...error.details
      });
    }

    // Handle unexpected errors
    res.status(500).json({
      success: false,
      error: error.message || 'Proofreading service failed',
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get incidents created from this alert (reverse lookup)
 * GET /api/alerts/:id/incidents
 */
const getAlertIncidents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  // First verify the alert exists and belongs to the organization
  const alert = await models.Alert.findOne({
    where: { id, organizationId },
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  try {
    // Find incidents that contain this alert ID in their alertIds array
    const incidents = await models.Incident.findAll({
      where: {
        organizationId,
        alertIds: {
          [Op.contains]: [id] // PostgreSQL array contains operator
        }
      },
      include: [
        {
          model: models.TimelineEvent,
          as: 'timeline',
          limit: 3, // Just show recent timeline events
          order: [['timestamp', 'DESC']],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']] // Most recent incidents first
    });

    res.status(200).json({
      success: true,
      incidents,
      count: incidents.length,
      alert: {
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
        status: alert.status
      }
    });

  } catch (error) {
    console.error('Failed to fetch alert incidents:', error);
    
    res.status(200).json({
      success: false,
      incidents: [],
      count: 0,
      error: 'Failed to fetch related incidents'
    });
  }
});

/**
 * Get alert timeline events
 * GET /api/alerts/:id/timeline
 */
const getAlertTimeline = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const result = await alertTimelineService.getAlertTimeline(id, organizationId);
  res.status(200).json(result);
});

/**
 * Update incident confirmation details for an alert
 * PUT /api/alerts/:id/incident-confirmation
 */
const updateIncidentConfirmation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;
  const { confirmationDetails } = req.body;

  const result = await incidentConfirmationService.updateIncidentConfirmation(id, organizationId, req.user, confirmationDetails);
  res.status(200).json(result);
});

/**
 * Helper function to create alert without HTTP context
 * Used by other controllers like test-data.controller
 */
const createAlertHelper = async (alertData, user) => {
  return await alertUtilsService.createAlertHelper(alertData, user);
};

/**
 * Delete a timeline event
 * DELETE /api/alerts/:alertId/timeline/:eventId
 */
const deleteTimelineEvent = asyncHandler(async (req, res) => {
  const { id: alertId, eventId } = req.params;
  const organizationId = req.user.organizationId;

  const result = await alertTimelineService.deleteTimelineEvent(eventId, alertId, organizationId, req.user);
  res.status(200).json(result);
});

/**
 * Get incident confirmation details for an alert
 * GET /api/alerts/:id/incident-confirmation
 */
const getIncidentConfirmation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const result = await incidentConfirmationService.getIncidentConfirmation(id, organizationId);
  res.status(200).json(result);
});

module.exports = {
  getAlerts,
  getAlert,
  createAlert,
  createAlertHelper,
  updateAlert,
  deleteAlert,
  bulkUpdateAlerts,
  resolveAlert,
  escalateAlert,
  getAlertStats,
  analyzeAlert,
  aiClassification,
  aiGenerateIncidentForm,
  proofReadIncidentFields,
  getAlertIncidents,
  getAlertTimeline,
  deleteTimelineEvent,
  updateIncidentConfirmation,
  getIncidentConfirmation,
};