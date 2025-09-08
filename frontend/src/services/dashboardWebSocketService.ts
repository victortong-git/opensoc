import { io, Socket } from 'socket.io-client';

interface DashboardWebSocketEventMap {
  dashboard_stats_updated: (data: any) => void;
  dashboard_alert_trends_updated: (data: any) => void;
  dashboard_incident_trends_updated: (data: any) => void;
  dashboard_incidents_updated: (data: any) => void;
  dashboard_response_metrics_updated: (data: any) => void;
  dashboard_team_performance_updated: (data: any) => void;
  dashboard_ai_agents_updated: (data: any) => void;
  dashboard_updated: (data: any) => void;
  joined_dashboard: (data: any) => void;
  left_dashboard: (data: any) => void;
  connection_status_changed: (connected: boolean) => void;
}

type DashboardWebSocketEvent = keyof DashboardWebSocketEventMap;

class DashboardWebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private eventListeners: Map<DashboardWebSocketEvent, Function[]> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private isDisconnecting: boolean = false;
  private isDashboardSubscribed: boolean = false;

  constructor() {
    this.token = localStorage.getItem('accessToken');
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.isDisconnecting = false;
    this.isDashboardSubscribed = false;
  }

  /**
   * Update token for WebSocket connection
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
      dashboardSubscribed: this.isDashboardSubscribed,
      reconnectAttempts: this.reconnectAttempts,
      hasSocket: !!this.socket
    };
  }

  /**
   * Initialize WebSocket connection for dashboard
   */
  initializeWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isDisconnecting) {
        reject(new Error('WebSocket is currently disconnecting'));
        return;
      }

      if (this.socket?.connected && this.isConnected) {
        this.subscribeToDashboard();
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
        console.log('🔌 Connected to dashboard WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.subscribeToDashboard();
        this.emit('connection_status_changed', true);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Dashboard WebSocket connection error:', error);
        this.isConnected = false;
        this.reconnectAttempts++;
        this.emit('connection_status_changed', false);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts: ${error.message}`));
        } else {
          reject(error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from dashboard WebSocket:', reason);
        this.isConnected = false;
        this.isDashboardSubscribed = false;
        this.emit('connection_status_changed', false);
      });

      this.setupDashboardEventHandlers();
    });
  }

  /**
   * Subscribe to dashboard updates
   */
  private subscribeToDashboard() {
    if (!this.socket?.connected || this.isDashboardSubscribed) return;
    
    this.socket.emit('join_dashboard');
    this.isDashboardSubscribed = true;
  }

  /**
   * Unsubscribe from dashboard updates
   */
  private unsubscribeFromDashboard() {
    if (!this.socket?.connected || !this.isDashboardSubscribed) return;
    
    this.socket.emit('leave_dashboard');
    this.isDashboardSubscribed = false;
  }

  /**
   * Setup WebSocket event handlers for dashboard
   */
  private setupDashboardEventHandlers() {
    if (!this.socket) return;

    this.socket.on('joined_dashboard', (data) => {
      console.log('📊 Subscribed to dashboard updates');
      this.emit('joined_dashboard', data);
    });

    this.socket.on('left_dashboard', (data) => {
      console.log('📊 Unsubscribed from dashboard updates');
      this.emit('left_dashboard', data);
    });

    this.socket.on('dashboard_stats_updated', (data) => {
      this.emit('dashboard_stats_updated', data);
    });

    this.socket.on('dashboard_alert_trends_updated', (data) => {
      this.emit('dashboard_alert_trends_updated', data);
    });

    this.socket.on('dashboard_incident_trends_updated', (data) => {
      this.emit('dashboard_incident_trends_updated', data);
    });

    this.socket.on('dashboard_incidents_updated', (data) => {
      this.emit('dashboard_incidents_updated', data);
    });

    this.socket.on('dashboard_response_metrics_updated', (data) => {
      this.emit('dashboard_response_metrics_updated', data);
    });

    this.socket.on('dashboard_team_performance_updated', (data) => {
      this.emit('dashboard_team_performance_updated', data);
    });

    this.socket.on('dashboard_ai_agents_updated', (data) => {
      this.emit('dashboard_ai_agents_updated', data);
    });

    this.socket.on('dashboard_updated', (data) => {
      this.emit('dashboard_updated', data);
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket() {
    if (!this.socket || this.isDisconnecting) {
      return;
    }

    this.isDisconnecting = true;

    try {
      // Unsubscribe from dashboard updates first
      this.unsubscribeFromDashboard();
      
      // Remove all socket event listeners
      this.socket.removeAllListeners();
      
      // Only disconnect if still connected
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      
      // Clear socket reference
      this.socket = null;
    } catch (error) {
      console.debug('Dashboard WebSocket disconnection completed');
    } finally {
      this.isDisconnecting = false;
    }
    
    // Clear connection state
    this.isConnected = false;
    this.isDashboardSubscribed = false;
    this.reconnectAttempts = 0;
    
    // Clear all event listeners to prevent memory leaks
    this.eventListeners.clear();

    this.emit('connection_status_changed', false);
  }

  /**
   * Request fresh dashboard data
   */
  requestDashboardData() {
    if (this.socket?.connected && this.isConnected) {
      this.socket.emit('get_dashboard_data');
    }
  }

  /**
   * Event emitter functionality
   */
  on<K extends DashboardWebSocketEvent>(event: K, callback: DashboardWebSocketEventMap[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off<K extends DashboardWebSocketEvent>(event: K, callback: DashboardWebSocketEventMap[K]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit<K extends DashboardWebSocketEvent>(event: K, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Clean up all resources
   */
  cleanup() {
    this.disconnectWebSocket();
    this.eventListeners.clear();
  }
}

// Export singleton instance
const dashboardWebSocketService = new DashboardWebSocketService();
export default dashboardWebSocketService;