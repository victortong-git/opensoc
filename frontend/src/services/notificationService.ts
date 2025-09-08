import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'incident' | 'system' | 'security' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  actionRequired: boolean;
  relatedId?: string;
  relatedType?: 'alert' | 'incident' | 'asset' | 'user';
  sourceSystem?: string;
  notificationChannel: 'web' | 'email' | 'webhook' | 'websocket';
  archivedAt?: Date;
  readAt?: Date;
  notificationSettings: any;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationPreference {
  id: string;
  notificationType: 'alert' | 'incident' | 'system' | 'security' | 'info';
  priorityThreshold: 'low' | 'medium' | 'high' | 'critical';
  enabledChannels: string[];
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursTimezone: string;
  emailEnabled: boolean;
  emailPriorityThreshold: 'low' | 'medium' | 'high' | 'critical';
  webhookEnabled: boolean;
  webhookUrl?: string;
  settings: any;
  isActive: boolean;
}

interface NotificationQuery {
  page?: number;
  limit?: number;
  type?: 'alert' | 'incident' | 'system' | 'security' | 'info';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  isRead?: boolean;
  actionRequired?: boolean;
  sourceSystem?: string;
  notificationChannel?: 'web' | 'email' | 'webhook' | 'websocket';
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'priority' | 'type' | 'readAt';
  sortOrder?: 'asc' | 'desc';
  includeArchived?: boolean;
}

interface NotificationSummary {
  unread: number;
  urgent: number;
  actionRequired: number;
  recent24h?: number;
}

interface NotificationStats {
  total: number;
  unread: number;
  recent24h: number;
  byPriority: { [key: string]: number };
  byType: { [key: string]: number };
}

class NotificationService {
  private baseURL: string;
  private socket: Socket | null = null;
  private token: string | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private isDisconnecting: boolean = false;

  constructor() {
    this.baseURL = '/api/notifications';
    // Get token from localStorage - match the key used by authSlice
    this.token = localStorage.getItem('accessToken');
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.isDisconnecting = false;
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Update token for API calls
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Get current connection status
   */
  isWebSocketConnected(): boolean {
    return this.socket?.connected === true && this.isConnected;
  }

  /**
   * Get connection state information
   */
  getConnectionState() {
    return {
      connected: this.isConnected,
      socketConnected: this.socket?.connected || false,
      reconnectAttempts: this.reconnectAttempts,
      hasSocket: !!this.socket
    };
  }

  /**
   * Initialize WebSocket connection
   */
  initializeWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Prevent initialization during disconnection process
      if (this.isDisconnecting) {
        reject(new Error('WebSocket is currently disconnecting'));
        return;
      }

      if (this.socket?.connected && this.isConnected) {
        resolve();
        return;
      }

      if (!this.token) {
        reject(new Error('No authentication token available'));
        return;
      }

      // Clean up any existing connection first
      if (this.socket) {
        this.disconnectWebSocket();
      }

      // Use current page location for Socket.IO in development (Vite proxy)
      // In production, use VITE_WS_URL environment variable  
      const socketURL = import.meta.env.DEV 
        ? window.location.origin
        : (import.meta.env.VITE_WS_URL || 'http://localhost:3001');
      
      this.socket = io(socketURL, {
        auth: {
          token: this.token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 5000,
        forceNew: true,
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to notification WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.socket?.emit('join_notifications');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts: ${error.message}`));
        } else {
          reject(error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from notification WebSocket:', reason);
        this.isConnected = false;
      });

      // Setup notification event handlers
      this.setupWebSocketEventHandlers();
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketEventHandlers() {
    if (!this.socket) return;

    this.socket.on('new_notification', (data) => {
      this.emit('newNotification', data.notification);
      this.emit('notificationCountUpdate', data);
    });

    this.socket.on('notification_updated', (data) => {
      this.emit('notificationUpdated', data.notification);
    });

    this.socket.on('notification_deleted', (data) => {
      this.emit('notificationDeleted', data.notificationId);
      this.emit('notificationCountUpdate', data);
    });

    this.socket.on('notification_read', (data) => {
      this.emit('notificationRead', data);
      this.emit('notificationCountUpdate', data);
    });

    this.socket.on('notifications_bulk_read', (data) => {
      this.emit('notificationsBulkRead', data);
      this.emit('notificationCountUpdate', data);
    });

    this.socket.on('notification_summary', (data) => {
      this.emit('notificationSummary', data);
    });

    this.socket.on('unread_count', (data) => {
      this.emit('unreadCount', data.count);
    });

    // Orchestration progress events
    this.socket.on('orchestration_progress', (data) => {
      this.emit('orchestrationProgress', data);
    });

    this.socket.on('orchestration_complete', (data) => {
      this.emit('orchestrationComplete', data);
    });

    this.socket.on('orchestration_error', (data) => {
      this.emit('orchestrationError', data);
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket() {
    // Guard against multiple disconnections (React Strict Mode protection)
    if (!this.socket || this.isDisconnecting) {
      return;
    }

    this.isDisconnecting = true;

    try {
      // Remove all socket event listeners first
      this.socket.removeAllListeners();
      
      // Only disconnect if still connected
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      
      // Clear socket reference
      this.socket = null;
    } catch (error) {
      // Ignore errors during disconnection to prevent console warnings
      console.debug('WebSocket disconnection completed');
    } finally {
      // Always reset the disconnecting flag
      this.isDisconnecting = false;
    }
    
    // Clear connection state
    this.isConnected = false;
    this.reconnectAttempts = 0;
    
    // Clear all event listeners to prevent memory leaks
    this.eventListeners.clear();
  }

  /**
   * Event emitter functionality
   */
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Get notifications with filtering and pagination
   */
  async getNotifications(query: NotificationQuery = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await axios.get(`${this.baseURL}?${params}`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get a specific notification by ID
   */
  async getNotification(id: string) {
    try {
      const response = await axios.get(`${this.baseURL}/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notification:', error);
      throw error;
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(notification: Partial<Notification>) {
    try {
      const response = await axios.post(this.baseURL, notification, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Update a notification
   */
  async updateNotification(id: string, updates: Partial<Notification>) {
    try {
      const response = await axios.patch(`${this.baseURL}/${id}`, updates, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string) {
    try {
      // First try via WebSocket for real-time update
      if (this.socket?.connected && this.isConnected) {
        this.socket.emit('mark_notification_read', { notificationId: id });
      }

      // Also make API call as backup
      const response = await axios.patch(`${this.baseURL}/${id}/read`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await axios.patch(`${this.baseURL}/mark-all-read`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string) {
    try {
      const response = await axios.delete(`${this.baseURL}/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Archive a notification
   */
  async archiveNotification(id: string) {
    try {
      const response = await axios.patch(`${this.baseURL}/${id}/archive`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await axios.get(`${this.baseURL}/stats`, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreference[]> {
    try {
      const response = await axios.get(`${this.baseURL}/preferences`, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preference: Partial<NotificationPreference>) {
    try {
      const response = await axios.post(`${this.baseURL}/preferences`, preference, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      if (this.socket?.connected && this.isConnected) {
        this.socket.emit('get_unread_count');
        // Return a promise that resolves when we receive the count
        return new Promise((resolve) => {
          const handler = (count: number) => {
            this.off('unreadCount', handler);
            resolve(count);
          };
          this.on('unreadCount', handler);
          
          // Add timeout to prevent hanging promises
          setTimeout(() => {
            this.off('unreadCount', handler);
            resolve(0); // Fallback to 0 if no response
          }, 5000);
        });
      }

      // Fallback to API if WebSocket not available
      const stats = await this.getStats();
      return stats.unread;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Join orchestration progress updates for a specific alert
   */
  joinOrchestrationUpdates(alertId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_orchestration', { alertId });
    }
  }

  /**
   * Leave orchestration progress updates for a specific alert
   */
  leaveOrchestrationUpdates(alertId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_orchestration', { alertId });
    }
  }

  /**
   * Get priority color class for notification
   */
  getPriorityColorClass(priority: string): string {
    switch (priority) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-slate-500';
    }
  }

  /**
   * Get type icon for notification
   */
  getTypeIcon(type: string): string {
    switch (type) {
      case 'alert': return '🚨';
      case 'incident': return '🛡️';
      case 'system': return '⚙️';
      case 'security': return '🔒';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  }

  /**
   * Format relative time for notification
   */
  formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const notificationDate = typeof date === 'string' ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notificationDate.toLocaleDateString();
  }

  /**
   * Check if notification requires action
   */
  requiresAction(notification: Notification): boolean {
    return notification.actionRequired && !notification.isRead;
  }

  /**
   * Check if notification is urgent
   */
  isUrgent(notification: Notification): boolean {
    return notification.priority === 'critical' || notification.priority === 'high';
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;