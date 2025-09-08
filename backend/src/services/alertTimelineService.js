const { models } = require('../database/models');

/**
 * Alert Timeline Service
 * Handles timeline events creation and retrieval for alerts
 * with comprehensive event tracking and metadata management
 */
class AlertTimelineService {

  /**
   * Get timeline events for an alert
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @returns {Object} Timeline events with alert summary
   */
  async getAlertTimeline(alertId, organizationId) {
    // Verify alert exists and belongs to organization
    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId },
    });

    // If alert doesn't exist (possibly deleted), check if timeline events exist
    if (!alert) {
      const timelineEvents = await models.AlertTimelineEvent.findAll({
        where: { alertId },
        include: [
          {
            model: models.User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false,
          },
        ],
        order: [['timestamp', 'DESC']],
      });

      // Return timeline events even if alert is deleted, for audit purposes
      return {
        success: true,
        timeline: timelineEvents,
        count: timelineEvents.length,
        alert: {
          id: alertId,
          title: 'Deleted Alert',
          severity: null,
          status: 'deleted',
          isDeleted: true
        }
      };
    }

    // Get timeline events for this alert
    const timelineEvents = await models.AlertTimelineEvent.findAll({
      where: { alertId },
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false,
        },
      ],
      order: [['timestamp', 'DESC']],
    });

    return {
      success: true,
      timeline: timelineEvents,
      count: timelineEvents.length,
      alert: {
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
        status: alert.status
      }
    };
  }

  /**
   * Create alert creation timeline event
   * @param {Object} alert - Alert object
   * @param {Object} user - User object
   */
  async createAlertCreatedEvent(alert, user = null) {
    await models.AlertTimelineEvent.create({
      alertId: alert.id,
      timestamp: new Date(),
      type: 'alert_created',
      title: 'Alert Created',
      description: `Alert "${alert.title}" was created in the system`,
      userId: user?.id || null,
      userName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'System',
      metadata: {
        severity: alert.severity,
        sourceSystem: alert.sourceSystem,
        eventTime: alert.eventTime
      }
    });
  }

  /**
   * Create status change timeline event
   * @param {Object} alert - Alert object
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @param {Object} user - User object
   * @param {Object} updateData - Additional update data
   */
  async createStatusChangeEvent(alert, oldStatus, newStatus, user, updateData = {}) {
    await models.AlertTimelineEvent.create({
      alertId: alert.id,
      timestamp: new Date(),
      type: 'status_change',
      title: `Status Changed to ${newStatus.replace('_', ' ').toUpperCase()}`,
      description: `Alert status manually changed from "${oldStatus}" to "${newStatus}" by ${user.username || 'user'}${updateData.triageRemarks?.triageReason ? `. Reason: ${updateData.triageRemarks.triageReason}` : ''}`,
      userId: user.id,
      metadata: {
        originalStatus: oldStatus,
        newStatus: newStatus,
        updatedBy: user.username || user.id,
        triageReason: updateData.triageRemarks?.triageReason,
        manualUpdate: true
      }
    });
  }

  /**
   * Create manual resolution timeline event
   * @param {Object} alert - Alert object
   * @param {Object} user - User object
   * @param {Object} resolveRemarks - Resolution remarks
   */
  async createManualResolutionEvent(alert, user, resolveRemarks) {
    await models.AlertTimelineEvent.create({
      alertId: alert.id,
      timestamp: new Date(),
      type: 'user_action',
      title: 'Alert Manually Resolved',
      description: `Alert manually resolved by ${user.firstName} ${user.lastName}${resolveRemarks?.reason ? `. Reason: ${resolveRemarks.reason}` : ''}`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      metadata: {
        action: 'manual_resolution',
        resolvedBy: user.id,
        resolveReason: resolveRemarks?.reason,
        resolutionNotes: resolveRemarks?.notes,
        resolvedAt: new Date()
      }
    });
  }

  /**
   * Create escalation timeline event
   * @param {Object} alert - Alert object
   * @param {Object} user - User object
   * @param {Object} escalationData - Escalation details
   */
  async createEscalationEvent(alert, user, escalationData) {
    await models.AlertTimelineEvent.create({
      alertId: alert.id,
      timestamp: new Date(),
      type: 'user_action',
      title: 'Alert Escalated',
      description: `Alert escalated to ${escalationData.escalatedTo} by ${user.firstName} ${user.lastName}. Reason: ${escalationData.reason}`,
      userId: user.id,
      metadata: {
        action: 'escalation',
        escalatedTo: escalationData.escalatedTo,
        escalationReason: escalationData.reason,
        priority: escalationData.priority || alert.severity,
        escalatedAt: new Date()
      }
    });
  }

  /**
   * Create incident confirmation update timeline event
   * @param {Object} alert - Alert object
   * @param {Object} user - User object
   * @param {Object} confirmationDetails - Confirmation details
   */
  async createIncidentConfirmationEvent(alert, user, confirmationDetails) {
    await models.AlertTimelineEvent.create({
      alertId: alert.id,
      timestamp: new Date(),
      type: 'user_action',
      title: 'Incident Confirmation Updated',
      description: `Incident confirmation details updated by ${user.firstName} ${user.lastName}. Status: ${confirmationDetails.isConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED'}`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      metadata: {
        action: 'incident_confirmation_updated',
        isConfirmed: confirmationDetails.isConfirmed,
        confirmedBy: user.id,
        confirmationNotes: confirmationDetails.notes,
        impactAssessment: confirmationDetails.impactAssessment,
        confirmedAt: new Date()
      }
    });
  }

  /**
   * Create alert deletion timeline event
   * @param {Object} alert - Alert object
   * @param {Object} user - User object
   */
  async createAlertDeletionEvent(alert, user) {
    await models.AlertTimelineEvent.create({
      alertId: alert.id,
      timestamp: new Date(),
      type: 'user_action',
      title: 'Alert Deleted',
      description: `Alert deleted by ${user.firstName} ${user.lastName}`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      metadata: {
        action: 'alert_deleted',
        deletedBy: user.id,
        deletedAt: new Date(),
        originalTitle: alert.title,
        originalSeverity: alert.severity
      }
    });
  }

  /**
   * Get recent timeline events for multiple alerts (for dashboards)
   * @param {Array} alertIds - Array of alert IDs
   * @param {number} limit - Maximum number of events per alert
   * @returns {Object} Timeline events grouped by alert
   */
  async getRecentTimelineEvents(alertIds, limit = 3) {
    const timelineEvents = await models.AlertTimelineEvent.findAll({
      where: {
        alertId: alertIds
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
      limit: alertIds.length * limit
    });

    // Group events by alert ID
    const groupedEvents = {};
    alertIds.forEach(alertId => {
      groupedEvents[alertId] = timelineEvents
        .filter(event => event.alertId === alertId)
        .slice(0, limit);
    });

    return groupedEvents;
  }

  /**
   * Get timeline event statistics
   * @param {string} alertId - Alert ID
   * @returns {Object} Timeline statistics
   */
  async getTimelineStats(alertId) {
    const events = await models.AlertTimelineEvent.findAll({
      where: { alertId },
      attributes: ['type'],
    });

    const stats = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEvents: events.length,
      eventTypes: stats,
      firstEventTime: events.length > 0 ? Math.min(...events.map(e => new Date(e.timestamp))) : null,
      lastEventTime: events.length > 0 ? Math.max(...events.map(e => new Date(e.timestamp))) : null
    };
  }

  /**
   * Delete a timeline event (admin only)
   * @param {string} eventId - Timeline event ID
   * @param {string} alertId - Alert ID for verification
   * @param {string} organizationId - Organization ID for verification
   * @param {Object} user - User object for permission check
   * @returns {Object} Success status
   */
  async deleteTimelineEvent(eventId, alertId, organizationId, user) {
    // Verify user is admin
    if (user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required to delete timeline events');
    }

    // Verify alert exists and belongs to organization
    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId },
    });

    if (!alert) {
      throw new Error('Alert not found');
    }

    // Find the timeline event
    const timelineEvent = await models.AlertTimelineEvent.findOne({
      where: { 
        id: eventId, 
        alertId: alertId 
      },
    });

    if (!timelineEvent) {
      throw new Error('Timeline event not found');
    }

    // Delete the timeline event
    await timelineEvent.destroy();

    return {
      success: true,
      message: 'Timeline event deleted successfully'
    };
  }

  /**
   * Safe timeline event creation with error handling
   * @param {Function} eventCreationFn - Function that creates the timeline event
   * @param {string} eventType - Type of event being created
   */
  async safeCreateTimelineEvent(eventCreationFn, eventType = 'unknown') {
    try {
      await eventCreationFn();
    } catch (timelineError) {
      console.error(`❌ Failed to create ${eventType} timeline event:`, timelineError);
      // Don't throw the error - continue with response even if timeline fails
    }
  }
}

module.exports = new AlertTimelineService();