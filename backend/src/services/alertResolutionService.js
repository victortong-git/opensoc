const { models } = require('../database/models');
const { NotFoundError, ValidationError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');
const alertTimelineService = require('./alertTimelineService');

/**
 * Alert Resolution & Escalation Service
 * Handles alert resolution, false positive marking, and escalation to incidents
 * with comprehensive validation, timeline tracking, and workflow management
 */
class AlertResolutionService {

  /**
   * Resolve alert with remarks
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object
   * @param {Object} resolutionData - Resolution data (resolution, remarks, reasoning)
   * @returns {Object} Resolution result
   */
  async resolveAlert(alertId, organizationId, user, resolutionData) {
    const { 
      resolution = 'resolved', // 'resolved' or 'false_positive'
      remarks,
      reasoning
    } = resolutionData;

    // Validate resolution type
    this.validateResolutionType(resolution);

    // Validate remarks - required for manual resolutions
    this.validateRemarks(remarks);

    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId },
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    // Check if alert is already resolved
    this.validateAlertNotResolved(alert);

    // Create resolve remarks data structure
    const resolveRemarksData = this.buildResolveRemarksData(resolution, remarks, reasoning, user);

    // Update alert status and add resolve remarks
    await alert.update({
      status: resolution,
      resolveRemarks: resolveRemarksData,
      updatedAt: new Date(),
    });

    // Create timeline event for manual resolution
    await alertTimelineService.safeCreateTimelineEvent(
      () => alertTimelineService.createManualResolutionEvent(alert, user, { reason: remarks, notes: reasoning }),
      'manual_resolution'
    );

    // Get updated alert with associations
    const updatedAlert = await models.Alert.findByPk(alert.id, {
      include: [
        {
          model: models.Asset,
          as: 'asset',
          attributes: ['id', 'name', 'assetType', 'ipAddress', 'criticality'],
        },
      ],
    });

    console.log(`✅ Manual resolution: Alert ${alert.id} ${resolution} by ${user.firstName} ${user.lastName}`);

    return {
      message: `Alert ${resolution === 'false_positive' ? 'marked as false positive' : 'resolved'} successfully`,
      alert: updatedAlert,
      resolveRemarks: resolveRemarksData
    };
  }

  /**
   * Escalate alert to incident
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object
   * @param {Object} escalationData - Escalation data (title, description, severity, etc.)
   * @returns {Object} Escalation result
   */
  async escalateAlert(alertId, organizationId, user, escalationData) {
    const { 
      title,
      description,
      severity,
      category,
      assignedTo 
    } = escalationData;

    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId },
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    // Validate escalation data
    this.validateEscalationData(escalationData, alert);

    // Create incident from alert
    const incident = await models.Incident.create({
      title: title || `Incident: ${alert.title}`,
      description: description || alert.description,
      severity: severity || alert.severity,
      category: category || 'malware', // default category
      assignedTo,
      assignedToName: assignedTo ? 'System' : null, // Would need to lookup actual user name
      organizationId,
      alertIds: [alert.id],
      alertCount: 1,
      metadata: {
        sourceAlert: alert.id,
        escalatedBy: user.id,
        escalatedAt: new Date(),
      },
    });

    // Update alert status
    await alert.update({
      status: 'investigating',
    });

    // Create timeline event
    await alertTimelineService.createEscalationEvent(alert, user, {
      escalatedTo: 'incident',
      reason: 'Manual escalation to incident',
      priority: alert.severity
    });

    return {
      message: 'Alert escalated to incident successfully',
      incident,
      alert,
    };
  }

  /**
   * Bulk resolve multiple alerts
   * @param {Array} alertIds - Array of alert IDs
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object
   * @param {Object} resolutionData - Resolution data to apply to all alerts
   * @returns {Object} Bulk resolution results
   */
  async bulkResolveAlerts(alertIds, organizationId, user, resolutionData) {
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      throw new ValidationError('Alert IDs array is required');
    }

    const results = {
      successful: [],
      failed: [],
      totalProcessed: alertIds.length
    };

    for (const alertId of alertIds) {
      try {
        const result = await this.resolveAlert(alertId, organizationId, user, resolutionData);
        results.successful.push({ alertId, result });
      } catch (error) {
        results.failed.push({ alertId, error: error.message });
      }
    }

    return {
      success: results.failed.length === 0,
      message: `Bulk resolution completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      results
    };
  }

  /**
   * Auto-resolve alerts based on criteria
   * @param {string} organizationId - Organization ID
   * @param {Object} criteria - Auto-resolution criteria
   * @param {Object} systemUser - System user for auto-resolution
   * @returns {Object} Auto-resolution results
   */
  async autoResolveAlerts(organizationId, criteria, systemUser) {
    const { maxAge, severityThreshold, statusWhitelist } = criteria;

    const whereClause = {
      organizationId,
      status: { [Op.in]: statusWhitelist || ['open', 'investigating'] }
    };

    if (maxAge) {
      const maxAgeDate = new Date(Date.now() - (maxAge * 24 * 60 * 60 * 1000)); // maxAge in days
      whereClause.createdAt = { [Op.lte]: maxAgeDate };
    }

    if (severityThreshold) {
      whereClause.severity = { [Op.lte]: severityThreshold };
    }

    const eligibleAlerts = await models.Alert.findAll({
      where: whereClause,
      attributes: ['id', 'title', 'severity', 'status'],
      limit: 100 // Safety limit
    });

    const results = {
      eligible: eligibleAlerts.length,
      processed: 0,
      failed: 0,
      errors: []
    };

    for (const alert of eligibleAlerts) {
      try {
        await this.resolveAlert(alert.id, organizationId, systemUser, {
          resolution: 'resolved',
          remarks: 'Auto-resolved based on age and severity criteria',
          reasoning: `Alert auto-resolved: age criteria ${maxAge ? `> ${maxAge} days` : 'N/A'}, severity ${severityThreshold ? `<= ${severityThreshold}` : 'N/A'}`
        });
        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({ alertId: alert.id, error: error.message });
      }
    }

    return results;
  }

  /**
   * Validate resolution type
   * @private
   */
  validateResolutionType(resolution) {
    if (!['resolved', 'false_positive'].includes(resolution)) {
      throw new ValidationError('Resolution must be "resolved" or "false_positive"');
    }
  }

  /**
   * Validate remarks
   * @private
   */
  validateRemarks(remarks) {
    if (!remarks || typeof remarks !== 'string' || remarks.trim().length === 0) {
      throw new ValidationError('Resolve remarks are required and must be a non-empty string');
    }
  }

  /**
   * Validate alert is not already resolved
   * @private
   */
  validateAlertNotResolved(alert) {
    if (alert.status === 'resolved' || alert.status === 'false_positive') {
      throw new ValidationError('Alert is already resolved');
    }
  }

  /**
   * Build resolve remarks data structure
   * @private
   */
  buildResolveRemarksData(resolution, remarks, reasoning, user) {
    return {
      resolvedBy: 'MANUAL_USER_RESOLUTION',
      resolvedAt: new Date().toISOString(),
      resolutionType: resolution,
      remarks: remarks.trim(),
      reasoning: reasoning ? reasoning.trim() : null,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      autoResolved: false
    };
  }

  /**
   * Validate escalation data
   * @private
   */
  validateEscalationData(escalationData, alert) {
    // Basic validation - can be extended
    if (escalationData.severity && ![1, 2, 3, 4, 5].includes(parseInt(escalationData.severity))) {
      throw new ValidationError('Invalid severity level for escalation');
    }

    if (alert.status === 'resolved' || alert.status === 'false_positive') {
      throw new ValidationError('Cannot escalate a resolved alert');
    }

    if (escalationData.title && escalationData.title.length > 255) {
      throw new ValidationError('Escalation title must be 255 characters or less');
    }
  }

  /**
   * Get resolution statistics for organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Options (timeframe, etc.)
   * @returns {Object} Resolution statistics
   */
  async getResolutionStats(organizationId, options = {}) {
    const { days = 30 } = options;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    const totalResolved = await models.Alert.count({
      where: {
        organizationId,
        status: ['resolved', 'false_positive'],
        updatedAt: { [Op.gte]: startDate }
      }
    });

    const resolutionBreakdown = await models.Alert.findAll({
      where: {
        organizationId,
        status: ['resolved', 'false_positive'],
        updatedAt: { [Op.gte]: startDate }
      },
      attributes: [
        'status',
        [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const averageResolutionTime = await this.calculateAverageResolutionTime(organizationId, startDate);

    return {
      totalResolved,
      resolutionBreakdown: resolutionBreakdown.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      averageResolutionTimeHours: averageResolutionTime,
      timeframe: `${days} days`
    };
  }

  /**
   * Calculate average resolution time
   * @private
   */
  async calculateAverageResolutionTime(organizationId, startDate) {
    const resolvedAlerts = await models.Alert.findAll({
      where: {
        organizationId,
        status: ['resolved', 'false_positive'],
        updatedAt: { [Op.gte]: startDate }
      },
      attributes: ['createdAt', 'updatedAt'],
      raw: true
    });

    if (resolvedAlerts.length === 0) return 0;

    const totalTime = resolvedAlerts.reduce((sum, alert) => {
      const created = new Date(alert.createdAt);
      const resolved = new Date(alert.updatedAt);
      return sum + (resolved - created);
    }, 0);

    return Math.round(totalTime / resolvedAlerts.length / (1000 * 60 * 60)); // Convert to hours
  }
}

module.exports = new AlertResolutionService();