const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { models } = require('../database/models');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.userSockets = new Map(); // socketId -> user info mapping
  }

  /**
   * Initialize WebSocket server with HTTP server
   */
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('✅ WebSocket server initialized');
    return this.io;
  }

  /**
   * Setup authentication middleware for socket connections
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await models.User.findByPk(decoded.id, {
          attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'organizationId']
        });

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        // Attach user to socket
        socket.user = user;
        next();
        
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  /**
   * Setup event handlers for socket connections
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Notification-specific events
      socket.on('join_notifications', () => {
        this.handleJoinNotifications(socket);
      });

      socket.on('leave_notifications', () => {
        this.handleLeaveNotifications(socket);
      });

      socket.on('mark_notification_read', (data) => {
        this.handleMarkNotificationRead(socket, data);
      });

      socket.on('get_unread_count', () => {
        this.handleGetUnreadCount(socket);
      });

      // Orchestration-specific events
      socket.on('join_orchestration', (data) => {
        this.handleJoinOrchestration(socket, data);
      });

      socket.on('leave_orchestration', (data) => {
        this.handleLeaveOrchestration(socket, data);
      });

      // Dashboard-specific events
      socket.on('join_dashboard', () => {
        this.handleJoinDashboard(socket);
      });

      socket.on('leave_dashboard', () => {
        this.handleLeaveDashboard(socket);
      });

      socket.on('get_dashboard_data', () => {
        this.handleGetDashboardData(socket);
      });

      // Heartbeat to keep connection alive
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    const user = socket.user;
    
    console.log(`🔌 User connected: ${user.firstName} ${user.lastName} (${user.username})`);
    
    // Join user to their personal room
    socket.join(`user_${user.id}`);
    socket.join(`org_${user.organizationId}`);
    
    // Store user connection
    this.connectedUsers.set(user.id, socket.id);
    this.userSockets.set(socket.id, {
      userId: user.id,
      username: user.username,
      organizationId: user.organizationId,
      connectedAt: new Date()
    });

    // Send initial data
    this.sendUserNotificationSummary(socket);

    // Emit connection event
    socket.emit('connected', {
      message: 'Connected to real-time notifications',
      timestamp: new Date()
    });
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnect(socket) {
    const userInfo = this.userSockets.get(socket.id);
    
    if (userInfo) {
      console.log(`🔌 User disconnected: ${userInfo.username}`);
      this.connectedUsers.delete(userInfo.userId);
      this.userSockets.delete(socket.id);
    }
  }

  /**
   * Handle user joining notification updates
   */
  handleJoinNotifications(socket) {
    const user = socket.user;
    socket.join(`notifications_${user.id}`);
    
    socket.emit('joined_notifications', {
      message: 'Subscribed to notification updates',
      timestamp: new Date()
    });
  }

  /**
   * Handle user leaving notification updates
   */
  handleLeaveNotifications(socket) {
    const user = socket.user;
    socket.leave(`notifications_${user.id}`);
    
    socket.emit('left_notifications', {
      message: 'Unsubscribed from notification updates',
      timestamp: new Date()
    });
  }

  /**
   * Handle marking notification as read via WebSocket
   */
  async handleMarkNotificationRead(socket, data) {
    try {
      const user = socket.user;
      const { notificationId } = data;

      if (!notificationId) {
        socket.emit('error', { message: 'Notification ID is required' });
        return;
      }

      // Update notification in database
      const [affectedRows] = await models.Notification.update(
        {
          isRead: true,
          readAt: new Date()
        },
        {
          where: {
            id: notificationId,
            userId: user.id,
            organizationId: user.organizationId
          }
        }
      );

      if (affectedRows > 0) {
        // Emit confirmation to the user
        socket.emit('notification_read', {
          notificationId,
          readAt: new Date()
        });

        // Send updated unread count
        this.sendUserNotificationSummary(socket);
      } else {
        socket.emit('error', { message: 'Notification not found or already read' });
      }

    } catch (error) {
      console.error('Error marking notification as read:', error);
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  /**
   * Handle getting unread notification count
   */
  async handleGetUnreadCount(socket) {
    try {
      const user = socket.user;
      
      const unreadCount = await models.Notification.count({
        where: {
          userId: user.id,
          organizationId: user.organizationId,
          isRead: false,
          archivedAt: null
        }
      });

      socket.emit('unread_count', { count: unreadCount });

    } catch (error) {
      console.error('Error getting unread count:', error);
      socket.emit('error', { message: 'Failed to get unread count' });
    }
  }

  /**
   * Send user notification summary
   */
  async sendUserNotificationSummary(socket) {
    try {
      const user = socket.user;
      
      const [unreadCount, urgentCount, actionRequiredCount] = await Promise.all([
        models.Notification.count({
          where: { userId: user.id, organizationId: user.organizationId, isRead: false, archivedAt: null }
        }),
        models.Notification.count({
          where: { userId: user.id, organizationId: user.organizationId, priority: 'critical', isRead: false, archivedAt: null }
        }),
        models.Notification.count({
          where: { userId: user.id, organizationId: user.organizationId, actionRequired: true, isRead: false, archivedAt: null }
        })
      ]);

      socket.emit('notification_summary', {
        unread: unreadCount,
        urgent: urgentCount,
        actionRequired: actionRequiredCount,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error sending notification summary:', error);
    }
  }

  /**
   * Emit notification to specific user
   */
  emitToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  /**
   * Emit notification to all users in organization
   */
  emitToOrganization(organizationId, event, data) {
    if (this.io) {
      this.io.to(`org_${organizationId}`).emit(event, data);
    }
  }

  /**
   * Emit new notification to user
   */
  async emitNewNotification(notification) {
    if (!this.io || !notification.userId) return;

    const notificationData = {
      ...notification.toJSON(),
      organizationId: undefined // Don't send organization ID to client
    };

    // Emit to specific user
    this.emitToUser(notification.userId, 'new_notification', {
      notification: notificationData,
      timestamp: new Date()
    });

    // Update notification summary for user
    const socket = this.io.sockets.sockets.get(this.connectedUsers.get(notification.userId));
    if (socket) {
      await this.sendUserNotificationSummary(socket);
    }

    console.log(`📫 New notification sent to user ${notification.userId}: ${notification.title}`);
  }

  /**
   * Emit notification update to user
   */
  emitNotificationUpdate(notification) {
    if (!this.io || !notification.userId) return;

    const notificationData = {
      ...notification.toJSON(),
      organizationId: undefined
    };

    this.emitToUser(notification.userId, 'notification_updated', {
      notification: notificationData,
      timestamp: new Date()
    });
  }

  /**
   * Emit notification deletion to user
   */
  emitNotificationDeleted(userId, notificationId) {
    if (!this.io) return;

    this.emitToUser(userId, 'notification_deleted', {
      notificationId,
      timestamp: new Date()
    });
  }

  /**
   * Emit bulk notification update to user
   */
  emitBulkNotificationUpdate(userId, eventType, data) {
    if (!this.io) return;

    this.emitToUser(userId, `notifications_${eventType}`, {
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users for organization
   */
  getConnectedUsersInOrganization(organizationId) {
    const orgUsers = [];
    for (const [socketId, userInfo] of this.userSockets) {
      if (userInfo.organizationId === organizationId) {
        orgUsers.push(userInfo);
      }
    }
    return orgUsers;
  }

  /**
   * Handle user joining orchestration updates for specific alert
   */
  handleJoinOrchestration(socket, data) {
    const { alertId } = data;
    const user = socket.user;
    
    if (!alertId) {
      socket.emit('error', { message: 'Alert ID required for orchestration updates' });
      return;
    }
    
    socket.join(`orchestration_${alertId}`);
    console.log(`🤖 User ${user.username} joined orchestration updates for alert ${alertId}`);
    
    socket.emit('joined_orchestration', {
      alertId,
      message: 'Subscribed to orchestration updates',
      timestamp: new Date()
    });
  }

  /**
   * Handle user leaving orchestration updates for specific alert
   */
  handleLeaveOrchestration(socket, data) {
    const { alertId } = data;
    const user = socket.user;
    
    if (!alertId) {
      socket.emit('error', { message: 'Alert ID required for orchestration updates' });
      return;
    }
    
    socket.leave(`orchestration_${alertId}`);
    console.log(`🤖 User ${user.username} left orchestration updates for alert ${alertId}`);
    
    socket.emit('left_orchestration', {
      alertId,
      message: 'Unsubscribed from orchestration updates',
      timestamp: new Date()
    });
  }

  /**
   * Emit orchestration progress update to alert room
   */
  emitOrchestrationProgress(alertId, progressData) {
    if (!this.io || !alertId) return;

    const data = {
      alertId,
      timestamp: new Date().toISOString(),
      ...progressData
    };

    console.log(`📊 Emitting orchestration progress for alert ${alertId}:`, progressData);
    
    // Emit to alert-specific room
    this.io.to(`orchestration_${alertId}`).emit('orchestration_progress', data);
  }

  /**
   * Emit orchestration completion to alert room
   */
  emitOrchestrationComplete(alertId, completionData) {
    if (!this.io || !alertId) return;

    const data = {
      alertId,
      timestamp: new Date().toISOString(),
      ...completionData
    };

    console.log(`✅ Emitting orchestration completion for alert ${alertId}`);
    
    // Emit to alert-specific room
    this.io.to(`orchestration_${alertId}`).emit('orchestration_complete', data);
  }

  /**
   * Emit orchestration error to alert room
   */
  emitOrchestrationError(alertId, errorData) {
    if (!this.io || !alertId) return;

    const data = {
      alertId,
      timestamp: new Date().toISOString(),
      error: errorData
    };

    console.log(`❌ Emitting orchestration error for alert ${alertId}:`, errorData);
    
    // Emit to alert-specific room
    this.io.to(`orchestration_${alertId}`).emit('orchestration_error', data);
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Handle user joining dashboard updates
   */
  handleJoinDashboard(socket) {
    const user = socket.user;
    socket.join(`dashboard_${user.organizationId}`);
    
    socket.emit('joined_dashboard', {
      message: 'Subscribed to dashboard updates',
      timestamp: new Date()
    });
  }

  /**
   * Handle user leaving dashboard updates
   */
  handleLeaveDashboard(socket) {
    const user = socket.user;
    socket.leave(`dashboard_${user.organizationId}`);
    
    socket.emit('left_dashboard', {
      message: 'Unsubscribed from dashboard updates',
      timestamp: new Date()
    });
  }

  /**
   * Handle dashboard data request
   */
  async handleGetDashboardData(socket) {
    try {
      const user = socket.user;
      
      // This would typically fetch fresh data from database
      // For now, emit acknowledgment
      socket.emit('dashboard_data_request', {
        message: 'Dashboard data request received',
        timestamp: new Date(),
        organizationId: user.organizationId
      });

    } catch (error) {
      console.error('Error handling dashboard data request:', error);
      socket.emit('error', { message: 'Failed to process dashboard data request' });
    }
  }

  /**
   * Emit dashboard stats update to organization
   */
  emitDashboardStatsUpdate(organizationId, statsData) {
    if (!this.io) return;

    this.io.to(`dashboard_${organizationId}`).emit('dashboard_stats_updated', {
      stats: statsData,
      timestamp: new Date()
    });

    console.log(`📊 Dashboard stats update sent to organization ${organizationId}`);
  }

  /**
   * Emit alert trends update to organization
   */
  emitAlertTrendsUpdate(organizationId, alertTrends) {
    if (!this.io) return;

    this.io.to(`dashboard_${organizationId}`).emit('dashboard_alert_trends_updated', {
      alertTrends,
      timestamp: new Date()
    });
  }

  /**
   * Emit incident trends update to organization
   */
  emitIncidentTrendsUpdate(organizationId, incidentTrends) {
    if (!this.io) return;

    this.io.to(`dashboard_${organizationId}`).emit('dashboard_incident_trends_updated', {
      incidentTrends,
      timestamp: new Date()
    });
  }

  /**
   * Emit incidents update to organization
   */
  emitIncidentsUpdate(organizationId, incidentsData) {
    if (!this.io) return;

    this.io.to(`dashboard_${organizationId}`).emit('dashboard_incidents_updated', {
      incidents: incidentsData.incidents,
      workflowDistribution: incidentsData.workflowDistribution,
      totalIncidents: incidentsData.totalIncidents,
      timestamp: new Date()
    });
  }

  /**
   * Emit response metrics update to organization
   */
  emitResponseMetricsUpdate(organizationId, responseMetrics) {
    if (!this.io) return;

    this.io.to(`dashboard_${organizationId}`).emit('dashboard_response_metrics_updated', {
      responseMetrics,
      timestamp: new Date()
    });
  }

  /**
   * Emit team performance update to organization
   */
  emitTeamPerformanceUpdate(organizationId, teamPerformance) {
    if (!this.io) return;

    this.io.to(`dashboard_${organizationId}`).emit('dashboard_team_performance_updated', {
      teamPerformance,
      timestamp: new Date()
    });
  }

  /**
   * Emit AI agents status update to organization
   */
  emitAIAgentsStatusUpdate(organizationId, aiAgents) {
    if (!this.io) return;

    this.io.to(`dashboard_${organizationId}`).emit('dashboard_ai_agents_updated', {
      aiAgents,
      timestamp: new Date()
    });
  }

  /**
   * Emit comprehensive dashboard update to organization
   */
  emitDashboardUpdate(organizationId, dashboardData) {
    if (!this.io) return;

    this.io.to(`dashboard_${organizationId}`).emit('dashboard_updated', {
      ...dashboardData,
      timestamp: new Date()
    });

    console.log(`📊 Full dashboard update sent to organization ${organizationId}`);
  }

  /**
   * Handle user joining orchestration updates for a specific alert
   */
  handleJoinOrchestration(socket, data) {
    const { alertId } = data;
    const user = socket.user;
    
    if (alertId) {
      socket.join(`orchestration_${alertId}`);
      socket.emit('joined_orchestration', {
        alertId,
        message: 'Subscribed to orchestration progress updates',
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle user leaving orchestration updates
   */
  handleLeaveOrchestration(socket, data) {
    const { alertId } = data;
    
    if (alertId) {
      socket.leave(`orchestration_${alertId}`);
      socket.emit('left_orchestration', {
        alertId,
        message: 'Unsubscribed from orchestration progress updates',
        timestamp: new Date()
      });
    }
  }

  /**
   * Emit orchestration progress update to alert-specific room
   */
  emitOrchestrationProgress(alertId, progressData) {
    if (!this.io || !alertId) return;

    this.io.to(`orchestration_${alertId}`).emit('orchestration_progress', {
      alertId,
      ...progressData,
      timestamp: new Date()
    });

    console.log(`📊 Orchestration progress sent for alert ${alertId}: ${progressData.step}`);
  }

  /**
   * Emit orchestration completion to alert-specific room
   */
  emitOrchestrationComplete(alertId, resultData) {
    if (!this.io || !alertId) return;

    this.io.to(`orchestration_${alertId}`).emit('orchestration_complete', {
      alertId,
      result: resultData,
      timestamp: new Date()
    });

    console.log(`✅ Orchestration completion sent for alert ${alertId}`);
  }

  /**
   * Emit orchestration error to alert-specific room
   */
  emitOrchestrationError(alertId, errorData) {
    if (!this.io || !alertId) return;

    this.io.to(`orchestration_${alertId}`).emit('orchestration_error', {
      alertId,
      error: errorData,
      timestamp: new Date()
    });

    console.log(`❌ Orchestration error sent for alert ${alertId}: ${errorData.message}`);
  }

  /**
   * Get WebSocket server instance
   */
  getIO() {
    return this.io;
  }
}

// Export singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService;