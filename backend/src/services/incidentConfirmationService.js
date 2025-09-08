const { models } = require('../database/models');
const { NotFoundError, ValidationError } = require('../middleware/error.middleware');
const alertTimelineService = require('./alertTimelineService');

/**
 * Incident Confirmation Service
 * Handles incident confirmation details management for alerts
 * with validation, timeline tracking, and comprehensive data handling
 */
class IncidentConfirmationService {

  /**
   * Update incident confirmation details for an alert
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object
   * @param {Object} confirmationDetails - Confirmation details to update
   * @returns {Object} Updated confirmation details
   */
  async updateIncidentConfirmation(alertId, organizationId, user, confirmationDetails) {
    // Verify alert exists and belongs to organization
    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId },
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    // Validate confirmation details structure
    this.validateConfirmationDetails(confirmationDetails);

    // Prepare updated confirmation details with metadata
    const updatedConfirmationDetails = {
      ...alert.incidentConfirmationDetails || {},
      ...confirmationDetails,
      updatedAt: new Date(),
      updatedBy: user.id,
      updatedByName: user.username || user.name
    };

    // Update the alert with incident confirmation details
    await alert.update({
      incidentConfirmationDetails: updatedConfirmationDetails
    });

    // Create timeline event for confirmation update
    await alertTimelineService.createIncidentConfirmationEvent(alert, user, confirmationDetails);

    return {
      success: true,
      message: 'Incident confirmation details updated successfully',
      alert: {
        id: alert.id,
        title: alert.title,
        incidentConfirmationDetails: alert.incidentConfirmationDetails
      }
    };
  }

  /**
   * Get incident confirmation details for an alert
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @returns {Object} Alert with confirmation details
   */
  async getIncidentConfirmation(alertId, organizationId) {
    // Verify alert exists and belongs to organization
    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId },
      attributes: ['id', 'title', 'severity', 'status', 'incidentConfirmationDetails', 'aiAnalysis']
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    return {
      success: true,
      alert: {
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
        status: alert.status,
        incidentConfirmationDetails: alert.incidentConfirmationDetails || null,
        aiAnalysis: alert.aiAnalysis || null
      }
    };
  }

  /**
   * Validate confirmation details structure
   * @private
   * @param {Object} confirmationDetails - Details to validate
   * @throws {Error} If validation fails
   */
  validateConfirmationDetails(confirmationDetails) {
    if (!confirmationDetails || typeof confirmationDetails !== 'object') {
      throw new ValidationError('Valid confirmationDetails object is required');
    }

    // Optional: Add more specific validation rules
    const allowedFields = [
      'isConfirmed', 'notes', 'impactAssessment', 'severity', 'priority',
      'affectedSystems', 'businessImpact', 'containmentStatus', 'nextSteps'
    ];

    // Check for any invalid fields (this is optional validation)
    const invalidFields = Object.keys(confirmationDetails).filter(
      field => !allowedFields.includes(field) && !field.startsWith('custom_')
    );

    if (invalidFields.length > 0) {
      console.warn('Warning: Unknown confirmation fields:', invalidFields);
    }

    return true;
  }

  /**
   * Get confirmation status summary
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @returns {Object} Confirmation status summary
   */
  async getConfirmationStatus(alertId, organizationId) {
    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId },
      attributes: ['id', 'title', 'severity', 'status', 'incidentConfirmationDetails']
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    const confirmationDetails = alert.incidentConfirmationDetails || {};

    return {
      alertId: alert.id,
      alertTitle: alert.title,
      alertSeverity: alert.severity,
      alertStatus: alert.status,
      confirmationStatus: {
        isConfirmed: confirmationDetails.isConfirmed || false,
        hasNotes: !!(confirmationDetails.notes && confirmationDetails.notes.trim()),
        hasImpactAssessment: !!(confirmationDetails.impactAssessment),
        lastUpdated: confirmationDetails.updatedAt || null,
        lastUpdatedBy: confirmationDetails.updatedByName || null,
        completeness: this.calculateCompleteness(confirmationDetails)
      }
    };
  }

  /**
   * Calculate confirmation details completeness percentage
   * @private
   * @param {Object} confirmationDetails - Confirmation details
   * @returns {number} Completeness percentage (0-100)
   */
  calculateCompleteness(confirmationDetails) {
    if (!confirmationDetails) return 0;

    const requiredFields = ['isConfirmed', 'notes', 'impactAssessment'];
    const optionalFields = ['severity', 'affectedSystems', 'businessImpact', 'containmentStatus'];

    let completedRequired = 0;
    let completedOptional = 0;

    requiredFields.forEach(field => {
      if (confirmationDetails[field] !== undefined && confirmationDetails[field] !== null) {
        if (typeof confirmationDetails[field] === 'string' && confirmationDetails[field].trim().length > 0) {
          completedRequired++;
        } else if (typeof confirmationDetails[field] !== 'string') {
          completedRequired++;
        }
      }
    });

    optionalFields.forEach(field => {
      if (confirmationDetails[field] !== undefined && confirmationDetails[field] !== null) {
        if (typeof confirmationDetails[field] === 'string' && confirmationDetails[field].trim().length > 0) {
          completedOptional++;
        } else if (typeof confirmationDetails[field] !== 'string') {
          completedOptional++;
        }
      }
    });

    // Weight required fields more heavily (80% of total)
    const requiredWeight = 0.8;
    const optionalWeight = 0.2;

    const requiredScore = (completedRequired / requiredFields.length) * requiredWeight * 100;
    const optionalScore = (completedOptional / optionalFields.length) * optionalWeight * 100;

    return Math.round(requiredScore + optionalScore);
  }

  /**
   * Bulk update confirmation details for multiple alerts
   * @param {Array} alertIds - Array of alert IDs
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object
   * @param {Object} confirmationDetails - Confirmation details to apply
   * @returns {Object} Bulk update results
   */
  async bulkUpdateConfirmation(alertIds, organizationId, user, confirmationDetails) {
    this.validateConfirmationDetails(confirmationDetails);

    const results = {
      successful: [],
      failed: [],
      totalProcessed: alertIds.length
    };

    for (const alertId of alertIds) {
      try {
        const result = await this.updateIncidentConfirmation(alertId, organizationId, user, confirmationDetails);
        results.successful.push({ alertId, result });
      } catch (error) {
        results.failed.push({ alertId, error: error.message });
      }
    }

    return {
      success: results.failed.length === 0,
      message: `Bulk confirmation update completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      results
    };
  }

  /**
   * Get confirmation history for an alert
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @returns {Array} Confirmation timeline events
   */
  async getConfirmationHistory(alertId, organizationId) {
    // Verify alert exists
    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId }
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    // Get confirmation-related timeline events
    const confirmationEvents = await models.AlertTimelineEvent.findAll({
      where: { 
        alertId,
        type: 'incident_confirmation_updated'
      },
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
      order: [['timestamp', 'DESC']],
      limit: 20
    });

    return {
      alertId,
      confirmationHistory: confirmationEvents,
      historyCount: confirmationEvents.length
    };
  }
}

module.exports = new IncidentConfirmationService();