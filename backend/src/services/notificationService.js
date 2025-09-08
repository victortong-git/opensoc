const { models } = require('../database/models');
const { Op } = require('sequelize');
const EventEmitter = require('events');

// Create a global notification event emitter
const notificationEmitter = new EventEmitter();

class NotificationService {
  constructor() {
    this.emitter = notificationEmitter;
  }

  /**
   * Create a notification with business logic and user preference checking
   */
  async createNotification(notificationData) {
    try {
      // Validate required fields
      if (!notificationData.title || !notificationData.message || !notificationData.type || !notificationData.priority) {
        throw new Error('Missing required notification fields');
      }

      // Get user preferences for this notification type
      const preferences = await models.NotificationPreference.findAll({
        where: {
          organizationId: notificationData.organizationId,
          notificationType: notificationData.type,
          isActive: true,
        },
        include: [{
          model: models.User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }]
      });

      const notifications = [];
      
      // If specific userId provided, create for that user only
      if (notificationData.userId) {
        const userPreference = preferences.find(p => p.userId === notificationData.userId);
        
        if (this.shouldCreateNotification(notificationData, userPreference)) {
          const notification = await models.Notification.create(notificationData);
          notifications.push(notification);
          
          // Emit events for real-time updates and additional processing
          await this.processNotificationEvents(notification, userPreference);
        }
      } else {
        // Create notifications for all users with appropriate preferences
        for (const preference of preferences) {
          if (this.shouldCreateNotification(notificationData, preference)) {
            const userNotification = await models.Notification.create({
              ...notificationData,
              userId: preference.userId,
            });
            notifications.push(userNotification);
            
            // Emit events for real-time updates and additional processing
            await this.processNotificationEvents(userNotification, preference);
          }
        }
      }

      return notifications;

    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Check if notification should be created based on user preferences
   */
  shouldCreateNotification(notificationData, preference) {
    if (!preference) {
      // If no preference exists, create notification for critical alerts only
      return notificationData.priority === 'critical';
    }

    // Check if notification meets the priority threshold
    const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    if (priorityOrder[notificationData.priority] < priorityOrder[preference.priorityThreshold]) {
      return false;
    }

    // Check quiet hours for non-critical notifications
    if (preference.quietHoursEnabled && notificationData.priority !== 'critical') {
      const now = new Date();
      const currentTime = now.toTimeString().substring(0, 8); // HH:MM:SS format
      
      if (preference.quietHoursStart && preference.quietHoursEnd) {
        if (preference.quietHoursStart <= preference.quietHoursEnd) {
          // Same day range
          if (currentTime >= preference.quietHoursStart && currentTime <= preference.quietHoursEnd) {
            return false;
          }
        } else {
          // Overnight range
          if (currentTime >= preference.quietHoursStart || currentTime <= preference.quietHoursEnd) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Process notification events (WebSocket, email, webhooks, etc.)
   */
  async processNotificationEvents(notification, preference) {
    try {
      // Emit real-time WebSocket event
      this.emitter.emit('notification:created', {
        notification,
        userId: notification.userId,
        organizationId: notification.organizationId,
      });

      // Handle email notifications
      if (preference && preference.emailEnabled) {
        const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        if (priorityOrder[notification.priority] >= priorityOrder[preference.emailPriorityThreshold]) {
          this.emitter.emit('notification:email', {
            notification,
            userEmail: preference.user?.email,
            preference,
          });
        }
      }

      // Handle webhook notifications
      if (preference && preference.webhookEnabled && preference.webhookUrl) {
        this.emitter.emit('notification:webhook', {
          notification,
          webhookUrl: preference.webhookUrl,
          preference,
        });
      }

      // Additional processing based on notification type and priority
      if (notification.priority === 'critical' && notification.actionRequired) {
        this.emitter.emit('notification:critical', {
          notification,
          preference,
        });
      }

    } catch (error) {
      console.error('Error processing notification events:', error);
    }
  }

  /**
   * Create notification from alert
   */
  async createFromAlert(alert, additionalData = {}) {
    const notificationData = {
      title: `${alert.severity >= 4 ? 'Critical Alert' : 'Security Alert'}: ${alert.title}`,
      message: alert.description || `New security alert detected on ${alert.assetName}`,
      type: 'alert',
      priority: this.mapSeverityToPriority(alert.severity),
      actionRequired: alert.severity >= 4,
      relatedId: alert.id,
      relatedType: 'alert',
      organizationId: alert.organizationId,
      sourceSystem: alert.sourceSystem || 'Alert System',
      notificationChannel: alert.severity >= 4 ? 'email' : 'web',
      notificationSettings: {
        alertId: alert.id,
        severity: alert.severity,
        assetName: alert.assetName,
        eventTime: alert.eventTime,
        ...additionalData
      },
      ...additionalData
    };

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification from incident
   */
  async createFromIncident(incident, eventType = 'created', additionalData = {}) {
    const eventMessages = {
      'created': `New incident created: ${incident.title}`,
      'updated': `Incident updated: ${incident.title}`,
      'escalated': `Incident escalated: ${incident.title}`,
      'resolved': `Incident resolved: ${incident.title}`,
      'assigned': `Incident assigned to you: ${incident.title}`,
    };

    const notificationData = {
      title: `Incident ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}: ${incident.title}`,
      message: eventMessages[eventType] || incident.description,
      type: 'incident',
      priority: this.mapSeverityToPriority(incident.severity),
      actionRequired: ['created', 'escalated', 'assigned'].includes(eventType),
      relatedId: incident.id,
      relatedType: 'incident',
      organizationId: incident.organizationId,
      userId: eventType === 'assigned' ? incident.assignedTo : undefined,
      sourceSystem: 'Incident Management',
      notificationChannel: incident.severity >= 4 ? 'email' : 'web',
      notificationSettings: {
        incidentId: incident.id,
        eventType,
        severity: incident.severity,
        category: incident.category,
        assignedTo: incident.assignedToName,
        ...additionalData
      },
      ...additionalData
    };

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification from asset status change
   */
  async createFromAsset(asset, statusChange, additionalData = {}) {
    const statusMessages = {
      'offline': `Asset went offline: ${asset.name}`,
      'compromised': `Asset compromised: ${asset.name}`,
      'maintenance': `Asset under maintenance: ${asset.name}`,
      'online': `Asset back online: ${asset.name}`,
    };

    const priority = statusChange === 'compromised' ? 'critical' : 
                    statusChange === 'offline' ? 'high' : 'medium';

    const notificationData = {
      title: `Asset Status Change: ${asset.name}`,
      message: statusMessages[statusChange] || `Asset status changed to ${statusChange}: ${asset.name}`,
      type: 'system',
      priority,
      actionRequired: ['offline', 'compromised'].includes(statusChange),
      relatedId: asset.id,
      relatedType: 'asset',
      organizationId: asset.organizationId,
      sourceSystem: 'Asset Monitor',
      notificationChannel: priority === 'critical' ? 'email' : 'web',
      notificationSettings: {
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.assetType,
        previousStatus: asset.previousStatus,
        newStatus: statusChange,
        criticality: asset.criticality,
        ...additionalData
      },
      ...additionalData
    };

    return await this.createNotification(notificationData);
  }

  /**
   * Create system notification
   */
  async createSystemNotification(title, message, organizationId, additionalData = {}) {
    const notificationData = {
      title,
      message,
      type: 'system',
      priority: additionalData.priority || 'medium',
      actionRequired: additionalData.actionRequired || false,
      organizationId,
      sourceSystem: additionalData.sourceSystem || 'System',
      notificationChannel: 'web',
      notificationSettings: additionalData.settings || {},
      ...additionalData
    };

    return await this.createNotification(notificationData);
  }

  /**
   * Create AI agent notification
   */
  async createAIAgentNotification(agentName, message, type = 'info', organizationId, additionalData = {}) {
    const notificationData = {
      title: `AI Agent Update: ${agentName}`,
      message,
      type,
      priority: additionalData.priority || 'low',
      actionRequired: additionalData.actionRequired || false,
      organizationId,
      sourceSystem: 'AI Agent System',
      notificationChannel: 'web',
      notificationSettings: {
        agentName,
        ...additionalData.settings
      },
      ...additionalData
    };

    return await this.createNotification(notificationData);
  }

  /**
   * Bulk mark notifications as read
   */
  async bulkMarkAsRead(notificationIds, userId, organizationId) {
    try {
      const [affectedCount] = await models.Notification.update(
        {
          isRead: true,
          readAt: new Date()
        },
        {
          where: {
            id: { [Op.in]: notificationIds },
            userId,
            organizationId,
          }
        }
      );

      // Emit bulk read event
      this.emitter.emit('notifications:bulk_read', {
        notificationIds,
        userId,
        count: affectedCount,
      });

      return affectedCount;

    } catch (error) {
      console.error('Error bulk marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications() {
    try {
      const expiredCount = await models.Notification.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      });

      console.log(`Cleaned up ${expiredCount} expired notifications`);
      return expiredCount;

    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  /**
   * Archive old notifications (older than 90 days)
   */
  async archiveOldNotifications(days = 90) {
    try {
      const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
      
      const [affectedCount] = await models.Notification.update(
        {
          archivedAt: new Date()
        },
        {
          where: {
            createdAt: {
              [Op.lt]: cutoffDate
            },
            archivedAt: null,
          }
        }
      );

      console.log(`Archived ${affectedCount} old notifications`);
      return affectedCount;

    } catch (error) {
      console.error('Error archiving old notifications:', error);
      throw error;
    }
  }

  /**
   * Get user's notification summary
   */
  async getUserNotificationSummary(userId, organizationId) {
    try {
      const [
        unreadCount,
        urgentCount,
        actionRequiredCount,
        recentCount
      ] = await Promise.all([
        models.Notification.count({
          where: { userId, organizationId, isRead: false, archivedAt: null }
        }),
        models.Notification.count({
          where: { userId, organizationId, priority: 'critical', isRead: false, archivedAt: null }
        }),
        models.Notification.count({
          where: { userId, organizationId, actionRequired: true, isRead: false, archivedAt: null }
        }),
        models.Notification.count({
          where: {
            userId,
            organizationId,
            archivedAt: null,
            createdAt: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return {
        unread: unreadCount,
        urgent: urgentCount,
        actionRequired: actionRequiredCount,
        recent24h: recentCount,
      };

    } catch (error) {
      console.error('Error getting notification summary:', error);
      throw error;
    }
  }

  /**
   * Helper method to map alert severity to notification priority
   */
  mapSeverityToPriority(severity) {
    if (severity >= 5) return 'critical';
    if (severity >= 4) return 'high';
    if (severity >= 3) return 'medium';
    return 'low';
  }

  /**
   * Get the notification emitter for external event handling
   */
  getEmitter() {
    return this.emitter;
  }
}

// Export singleton instance
const notificationService = new NotificationService();

// Set up automatic cleanup tasks (run every hour)
setInterval(async () => {
  try {
    await notificationService.cleanupExpiredNotifications();
  } catch (error) {
    console.error('Scheduled notification cleanup failed:', error);
  }
}, 60 * 60 * 1000);

// Set up weekly archival task (run every 7 days)
setInterval(async () => {
  try {
    await notificationService.archiveOldNotifications(90);
  } catch (error) {
    console.error('Scheduled notification archival failed:', error);
  }
}, 7 * 24 * 60 * 60 * 1000);

module.exports = notificationService;