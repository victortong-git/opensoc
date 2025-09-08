const { models } = require('../database/models');
const { Op } = require('sequelize');
const Joi = require('joi');

// Validation schemas
const notificationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().valid('alert', 'incident', 'system', 'security', 'info'),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
  isRead: Joi.boolean(),
  actionRequired: Joi.boolean(),
  sourceSystem: Joi.string(),
  notificationChannel: Joi.string().valid('web', 'email', 'webhook', 'websocket'),
  dateFrom: Joi.date(),
  dateTo: Joi.date(),
  sortBy: Joi.string().valid('createdAt', 'priority', 'type', 'readAt').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  includeArchived: Joi.boolean().default(false),
});

const updateNotificationSchema = Joi.object({
  isRead: Joi.boolean(),
  actionRequired: Joi.boolean(),
  notificationSettings: Joi.object(),
  archivedAt: Joi.date().allow(null),
});

const createNotificationSchema = Joi.object({
  title: Joi.string().required().max(255),
  message: Joi.string().required(),
  type: Joi.string().valid('alert', 'incident', 'system', 'security', 'info').required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  actionRequired: Joi.boolean().default(false),
  relatedId: Joi.string().uuid().optional(),
  relatedType: Joi.string().valid('alert', 'incident', 'asset', 'user').optional(),
  sourceSystem: Joi.string().max(100).optional(),
  notificationChannel: Joi.string().valid('web', 'email', 'webhook', 'websocket').default('web'),
  notificationSettings: Joi.object().default({}),
  expiresAt: Joi.date().optional(),
});

const preferencesSchema = Joi.object({
  notificationType: Joi.string().valid('alert', 'incident', 'system', 'security', 'info').required(),
  priorityThreshold: Joi.string().valid('low', 'medium', 'high', 'critical').default('low'),
  enabledChannels: Joi.array().items(Joi.string().valid('web', 'email', 'webhook', 'websocket')).default(['web']),
  quietHoursEnabled: Joi.boolean().default(false),
  quietHoursStart: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  quietHoursEnd: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  quietHoursTimezone: Joi.string().default('UTC'),
  emailEnabled: Joi.boolean().default(false),
  emailPriorityThreshold: Joi.string().valid('low', 'medium', 'high', 'critical').default('high'),
  webhookEnabled: Joi.boolean().default(false),
  webhookUrl: Joi.string().uri().optional(),
  settings: Joi.object().default({}),
  isActive: Joi.boolean().default(true),
});

class NotificationsController {
  // Get notifications for the authenticated user
  static async getNotifications(req, res) {
    try {
      const { error, value: query } = notificationQuerySchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.details.map(d => d.message)
        });
      }

      const { page, limit, type, priority, isRead, actionRequired, sourceSystem, 
              notificationChannel, dateFrom, dateTo, sortBy, sortOrder, includeArchived } = query;

      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
      };

      // Add archived filter
      if (!includeArchived) {
        whereConditions.archivedAt = null;
      }

      // Add optional filters
      if (type) whereConditions.type = type;
      if (priority) whereConditions.priority = priority;
      if (isRead !== undefined) whereConditions.isRead = isRead;
      if (actionRequired !== undefined) whereConditions.actionRequired = actionRequired;
      if (sourceSystem) whereConditions.sourceSystem = sourceSystem;
      if (notificationChannel) whereConditions.notificationChannel = notificationChannel;

      // Add date range filter
      if (dateFrom || dateTo) {
        whereConditions.createdAt = {};
        if (dateFrom) whereConditions.createdAt[Op.gte] = new Date(dateFrom);
        if (dateTo) whereConditions.createdAt[Op.lte] = new Date(dateTo);
      }

      // Build order clause
      let orderClause = [[sortBy, sortOrder.toUpperCase()]];
      
      // Secondary sort by priority for better UX
      if (sortBy !== 'priority') {
        const priorityOrder = {
          'critical': 4,
          'high': 3,
          'medium': 2,
          'low': 1
        };
        orderClause.push([
          models.Notification.sequelize.literal(`
            CASE priority 
              WHEN 'critical' THEN 4 
              WHEN 'high' THEN 3 
              WHEN 'medium' THEN 2 
              WHEN 'low' THEN 1 
            END
          `), 
          'DESC'
        ]);
      }

      const { count, rows: notifications } = await models.Notification.findAndCountAll({
        where: whereConditions,
        limit,
        offset,
        order: orderClause,
        attributes: {
          exclude: ['organizationId'] // Don't expose organization ID in response
        }
      });

      const totalPages = Math.ceil(count / limit);

      // Get unread count for user
      const unreadCount = await models.Notification.count({
        where: {
          userId: req.user.id,
          organizationId: req.user.organizationId,
          isRead: false,
          archivedAt: null,
        }
      });

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: count,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
          unreadCount,
        }
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get a specific notification
  static async getNotificationById(req, res) {
    try {
      const { id } = req.params;

      const notification = await models.Notification.findOne({
        where: {
          id,
          userId: req.user.id,
          organizationId: req.user.organizationId,
        },
        attributes: {
          exclude: ['organizationId']
        }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        data: notification
      });

    } catch (error) {
      console.error('Get notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create a new notification
  static async createNotification(req, res) {
    try {
      const { error, value: notificationData } = createNotificationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification data',
          errors: error.details.map(d => d.message)
        });
      }

      const notification = await models.Notification.create({
        ...notificationData,
        userId: req.user.id,
        organizationId: req.user.organizationId,
      });

      // Emit WebSocket event for real-time updates (will be implemented in websocket integration)
      if (req.io) {
        req.io.to(`user_${req.user.id}`).emit('new_notification', {
          notification: {
            ...notification.toJSON(),
            organizationId: undefined // Don't send organization ID to client
          }
        });
      }

      res.status(201).json({
        success: true,
        data: {
          ...notification.toJSON(),
          organizationId: undefined
        },
        message: 'Notification created successfully'
      });

    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update a notification
  static async updateNotification(req, res) {
    try {
      const { id } = req.params;
      const { error, value: updateData } = updateNotificationSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid update data',
          errors: error.details.map(d => d.message)
        });
      }

      const notification = await models.Notification.findOne({
        where: {
          id,
          userId: req.user.id,
          organizationId: req.user.organizationId,
        }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.update(updateData);

      // Emit WebSocket event for real-time updates
      if (req.io) {
        req.io.to(`user_${req.user.id}`).emit('notification_updated', {
          notification: {
            ...notification.toJSON(),
            organizationId: undefined
          }
        });
      }

      res.json({
        success: true,
        data: {
          ...notification.toJSON(),
          organizationId: undefined
        },
        message: 'Notification updated successfully'
      });

    } catch (error) {
      console.error('Update notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;

      const notification = await models.Notification.findOne({
        where: {
          id,
          userId: req.user.id,
          organizationId: req.user.organizationId,
        }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.update({
        isRead: true,
        readAt: new Date()
      });

      // Emit WebSocket event for real-time updates
      if (req.io) {
        req.io.to(`user_${req.user.id}`).emit('notification_read', {
          notificationId: id,
          readAt: notification.readAt
        });
      }

      res.json({
        success: true,
        message: 'Notification marked as read'
      });

    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      const [affectedCount] = await models.Notification.update(
        {
          isRead: true,
          readAt: new Date()
        },
        {
          where: {
            userId: req.user.id,
            organizationId: req.user.organizationId,
            isRead: false,
            archivedAt: null,
          }
        }
      );

      // Emit WebSocket event for real-time updates
      if (req.io) {
        req.io.to(`user_${req.user.id}`).emit('all_notifications_read', {
          count: affectedCount,
          readAt: new Date()
        });
      }

      res.json({
        success: true,
        message: `${affectedCount} notifications marked as read`
      });

    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete a notification
  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;

      const notification = await models.Notification.findOne({
        where: {
          id,
          userId: req.user.id,
          organizationId: req.user.organizationId,
        }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.destroy();

      // Emit WebSocket event for real-time updates
      if (req.io) {
        req.io.to(`user_${req.user.id}`).emit('notification_deleted', {
          notificationId: id
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });

    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Archive a notification (soft delete)
  static async archiveNotification(req, res) {
    try {
      const { id } = req.params;

      const notification = await models.Notification.findOne({
        where: {
          id,
          userId: req.user.id,
          organizationId: req.user.organizationId,
        }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.update({
        archivedAt: new Date()
      });

      // Emit WebSocket event for real-time updates
      if (req.io) {
        req.io.to(`user_${req.user.id}`).emit('notification_archived', {
          notificationId: id,
          archivedAt: notification.archivedAt
        });
      }

      res.json({
        success: true,
        message: 'Notification archived successfully'
      });

    } catch (error) {
      console.error('Archive notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get notification preferences for user
  static async getPreferences(req, res) {
    try {
      const preferences = await models.NotificationPreference.findAll({
        where: {
          userId: req.user.id,
          organizationId: req.user.organizationId,
          isActive: true,
        },
        attributes: {
          exclude: ['organizationId', 'userId']
        }
      });

      res.json({
        success: true,
        data: preferences
      });

    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification preferences',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update or create notification preferences
  static async updatePreferences(req, res) {
    try {
      const { error, value: preferencesData } = preferencesSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid preferences data',
          errors: error.details.map(d => d.message)
        });
      }

      const [preference, created] = await models.NotificationPreference.upsert({
        ...preferencesData,
        userId: req.user.id,
        organizationId: req.user.organizationId,
      }, {
        where: {
          userId: req.user.id,
          organizationId: req.user.organizationId,
          notificationType: preferencesData.notificationType,
        }
      });

      res.json({
        success: true,
        data: {
          ...preference.toJSON(),
          organizationId: undefined,
          userId: undefined
        },
        message: created ? 'Preference created successfully' : 'Preference updated successfully'
      });

    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get notification statistics
  static async getStats(req, res) {
    try {
      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      const [
        totalCount,
        unreadCount,
        priorityStats,
        typeStats,
        recentCount
      ] = await Promise.all([
        // Total notifications
        models.Notification.count({
          where: { userId, organizationId, archivedAt: null }
        }),
        
        // Unread notifications
        models.Notification.count({
          where: { userId, organizationId, isRead: false, archivedAt: null }
        }),
        
        // Priority breakdown
        models.Notification.findAll({
          where: { userId, organizationId, archivedAt: null },
          attributes: [
            'priority',
            [models.Notification.sequelize.fn('COUNT', models.Notification.sequelize.col('priority')), 'count']
          ],
          group: ['priority'],
          raw: true
        }),
        
        // Type breakdown
        models.Notification.findAll({
          where: { userId, organizationId, archivedAt: null },
          attributes: [
            'type',
            [models.Notification.sequelize.fn('COUNT', models.Notification.sequelize.col('type')), 'count']
          ],
          group: ['type'],
          raw: true
        }),
        
        // Recent (last 24 hours)
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

      res.json({
        success: true,
        data: {
          total: totalCount,
          unread: unreadCount,
          recent24h: recentCount,
          byPriority: priorityStats.reduce((acc, stat) => {
            acc[stat.priority] = parseInt(stat.count);
            return acc;
          }, {}),
          byType: typeStats.reduce((acc, stat) => {
            acc[stat.type] = parseInt(stat.count);
            return acc;
          }, {})
        }
      });

    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = NotificationsController;