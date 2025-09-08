const { models } = require('../database/models');
const embeddingHelper = require('./embeddingHelper');
const alertTimelineService = require('./alertTimelineService');

/**
 * Alert Utilities Service
 * Provides utility functions for alert operations that don't fit into other services
 * Used by controllers and other services for common alert operations
 */
class AlertUtilsService {

  /**
   * Helper function to create alert without HTTP context
   * Used by other controllers like test-data.controller and internal services
   * @param {Object} alertData - Alert data to create
   * @param {Object} user - User object with organizationId
   * @returns {Object} Created alert with associations
   */
  async createAlertHelper(alertData, user) {
    const organizationId = user.organizationId;
    
    const finalAlertData = {
      ...alertData,
      organizationId,
      // Explicitly handle isTestData parameter for test data consistency
      isTestData: alertData.isTestData === true || alertData.isTestData === 'true',
    };

    const alert = await models.Alert.create(finalAlertData);

    // Create alert timeline event
    await alertTimelineService.createAlertCreatedEvent(alert, user);

    // Trigger automatic embedding generation (fire-and-forget)
    embeddingHelper.triggerEmbeddingForRecord('alert', alert.id, 'create');

    // Get the created alert with associations
    const createdAlert = await models.Alert.findByPk(alert.id, {
      include: [
        {
          model: models.Asset,
          as: 'asset',
          attributes: ['id', 'name', 'assetType', 'ipAddress', 'criticality'],
        },
      ],
    });

    // Create notification for the alert
    try {
      const notificationService = require('./notificationService');
      await notificationService.createFromAlert(createdAlert);
    } catch (error) {
      console.error('Failed to create notification for alert:', error);
      // Don't fail the request if notification creation fails
    }

    return createdAlert;
  }

  /**
   * Validate alert exists and belongs to organization
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Additional options (include, attributes)
   * @returns {Object} Alert if found
   * @throws {NotFoundError} If alert not found
   */
  async validateAlertAccess(alertId, organizationId, options = {}) {
    const { include = [], attributes = null } = options;

    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId },
      include,
      attributes,
    });

    if (!alert) {
      const { NotFoundError } = require('../middleware/error.middleware');
      throw new NotFoundError('Alert not found');
    }

    return alert;
  }

  /**
   * Get common alert associations for detailed queries
   * @returns {Array} Standard associations for alert queries
   */
  getStandardAlertIncludes() {
    return [
      {
        model: models.Asset,
        as: 'asset',
        attributes: ['id', 'name', 'assetType', 'ipAddress', 'hostname', 'criticality', 'location', 'owner'],
        required: false,
      },
      {
        model: models.User,
        as: 'assignedUser',
        attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
        required: false,
      },
      {
        model: models.AlertMitreAnalysis,
        as: 'mitreAnalysisRecords',
        required: false,
      },
    ];
  }

  /**
   * Get minimal alert associations for list queries
   * @returns {Array} Minimal associations for performance
   */
  getMinimalAlertIncludes() {
    return [
      {
        model: models.Asset,
        as: 'asset',
        attributes: ['id', 'name', 'assetType', 'ipAddress', 'criticality'],
        required: false,
      },
      {
        model: models.User,
        as: 'assignedUser',
        attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
        required: false,
      },
    ];
  }

  /**
   * Format alert for API response
   * @param {Object} alert - Alert object from database
   * @param {Object} options - Formatting options
   * @returns {Object} Formatted alert
   */
  formatAlertResponse(alert, options = {}) {
    const { 
      includeTimestamps = true, 
      includeMetadata = true,
      includeAnalysis = true 
    } = options;

    const formatted = {
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      status: alert.status,
      sourceSystem: alert.sourceSystem,
      assetName: alert.assetName,
      assetId: alert.assetId,
    };

    if (includeTimestamps) {
      formatted.eventTime = alert.eventTime;
      formatted.createdAt = alert.createdAt;
      formatted.updatedAt = alert.updatedAt;
      formatted.triageTimestamp = alert.triageTimestamp;
    }

    if (includeMetadata) {
      formatted.assignedAgent = alert.assignedAgent;
      formatted.securityEventType = alert.securityEventType;
      formatted.eventTags = alert.eventTags;
      formatted.tagsConfidence = alert.tagsConfidence;
      formatted.isTestData = alert.isTestData;
    }

    if (includeAnalysis) {
      formatted.aiAnalysis = alert.aiAnalysis;
      formatted.aiAnalysisTimestamp = alert.aiAnalysisTimestamp;
      formatted.resolveRemarks = alert.resolveRemarks;
      formatted.triageRemarks = alert.triageRemarks;
      formatted.incidentConfirmationDetails = alert.incidentConfirmationDetails;
    }

    // Include associations if they exist
    if (alert.asset) {
      formatted.asset = alert.asset;
    }

    if (alert.assignedUser) {
      formatted.assignedUser = alert.assignedUser;
    }

    if (alert.mitreAnalysisRecords) {
      formatted.mitreAnalysisRecords = alert.mitreAnalysisRecords;
    }

    return formatted;
  }

  /**
   * Calculate alert age in hours
   * @param {Object} alert - Alert object
   * @returns {number} Age in hours
   */
  calculateAlertAge(alert) {
    const createdAt = new Date(alert.createdAt);
    const now = new Date();
    return Math.floor((now - createdAt) / (1000 * 60 * 60));
  }

  /**
   * Check if alert is stale based on age and status
   * @param {Object} alert - Alert object
   * @param {Object} criteria - Staleness criteria
   * @returns {boolean} Whether alert is stale
   */
  isAlertStale(alert, criteria = {}) {
    const { 
      maxAgeHours = 72, 
      staleStatuses = ['open', 'investigating'] 
    } = criteria;

    if (!staleStatuses.includes(alert.status)) {
      return false;
    }

    const ageHours = this.calculateAlertAge(alert);
    return ageHours > maxAgeHours;
  }
}

module.exports = new AlertUtilsService();