import { io, Socket } from 'socket.io-client';

type WebSocketEventType = 
  | 'ai_analysis_started'
  | 'ai_analysis_progress'
  | 'ai_analysis_completed'
  | 'ai_analysis_cancelled'
  | 'ai_analysis_paused'
  | 'ai_analysis_error'
  | 'ai_batch_started'
  | 'ai_batch_completed'
  | 'ai_batch_progress'
  | 'ai_batch_error'
  | 'security_issue_found'
  | 'alert_created';

interface WebSocketMessage {
  type: WebSocketEventType;
  fileId?: string;
  data: any;
  timestamp: string;
}

interface WebSocketSubscription {
  id: string;
  eventType: WebSocketEventType;
  fileId?: string;
  callback: (data: any) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Reduced from 5 to prevent spam
  private isConnecting = false;
  private url: string;
  private isDestroyed = false;
  private connectionFailed = false; // Circuit breaker flag
  private lastConnectionAttempt = 0;
  private minRetryDelay = 5000; // 5 seconds minimum between attempts

  constructor() {
    // Point to the backend Socket.IO server
    if (import.meta.env.DEV) {
      this.url = 'http://localhost:3001';
    } else {
      this.url = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isDestroyed) {
        reject(new Error('WebSocket service has been destroyed'));
        return;
      }

      if (this.socket?.connected) {
        resolve();
        return;
      }

      // Circuit breaker: if connection failed recently, don't retry immediately
      if (this.connectionFailed) {
        const timeSinceLastAttempt = Date.now() - this.lastConnectionAttempt;
        if (timeSinceLastAttempt < this.minRetryDelay) {
          reject(new Error(`WebSocket connection blocked by circuit breaker. Wait ${Math.ceil((this.minRetryDelay - timeSinceLastAttempt) / 1000)}s before retry.`));
          return;
        }
      }

      if (this.isConnecting) {
        // Wait for the existing connection attempt to complete
        const checkConnection = () => {
          if (this.socket?.connected) {
            resolve();
          } else if (!this.isConnecting) {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        setTimeout(checkConnection, 100);
        return;
      }

      this.isConnecting = true;
      this.lastConnectionAttempt = Date.now();

      try {
        // Get auth token from localStorage (use same key as API service)
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          console.warn('No access token found, WebSocket will not have real-time updates');
          this.isConnecting = false;
          reject(new Error('No authentication token available'));
          return;
        }

        // Basic token validation (check if it looks like a JWT)
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid token format');
          }
          
          // Decode payload to check expiration
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          
          if (payload.exp && payload.exp < currentTime) {
            console.warn('Access token appears to be expired, WebSocket connection may fail');
            // Continue anyway in case backend is more lenient
          }
        } catch (tokenError) {
          console.warn('Token validation failed, continuing with connection attempt:', tokenError.message);
        }

        this.socket = io(this.url, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: false, // Disable automatic reconnection to prevent infinite loops
          forceNew: true // Force new connection to avoid reusing failed connections
        });

        this.socket.on('connect', () => {
          console.log('🔌 Socket.IO connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionFailed = false; // Reset circuit breaker on successful connection
          
          // Re-subscribe to all existing subscriptions
          this.resubscribeAll();
          
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log(`🔌 Socket.IO disconnected: ${reason}`);
          this.isConnecting = false;
          
          // Don't automatically reconnect - let the application handle reconnection manually when needed
          if (!this.isDestroyed && reason !== 'io client disconnect') {
            console.log('🔌 WebSocket disconnected. Reconnection must be initiated manually.');
            this.connectionFailed = true; // Activate circuit breaker
          }
        });

        this.socket.on('connect_error', async (error) => {
          this.isConnecting = false;
          this.connectionFailed = true; // Activate circuit breaker on any connection error
          this.reconnectAttempts++;
          
          console.warn(`🔌 WebSocket connection failed (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}):`, error.message);
          
          // Handle authentication errors by attempting token refresh ONLY on first failure
          if (this.reconnectAttempts === 1 && error.message && (error.message.includes('Invalid token') || error.message.includes('Authentication error'))) {
            console.warn('🔐 WebSocket authentication failed, attempting token refresh...');
            
            try {
              const refreshSuccess = await this.attemptTokenRefresh();
              if (refreshSuccess) {
                console.log('✅ Token refreshed successfully, will retry on next manual connection attempt');
                this.connectionFailed = false; // Allow retry with new token
                reject(new Error('Authentication failed - token refreshed, please retry connection'));
                return;
              }
            } catch (refreshError) {
              console.warn('🔐 Token refresh failed:', refreshError.message);
            }
          }
          
          // After max attempts, disable further connection attempts
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('🚫 Maximum WebSocket reconnection attempts reached. Real-time updates disabled.');
            console.info('💡 Refresh the page to reset WebSocket connection attempts.');
          }
          
          reject(new Error(`WebSocket connection failed: ${error.message}`));
        });

        // Handle custom events
        this.socket.on('ai_analysis_started', (data) => this.handleMessage({ type: 'ai_analysis_started', data, timestamp: new Date().toISOString(), fileId: data.fileId }));
        this.socket.on('ai_analysis_progress', (data) => this.handleMessage({ type: 'ai_analysis_progress', data, timestamp: new Date().toISOString(), fileId: data.fileId }));
        this.socket.on('ai_analysis_completed', (data) => this.handleMessage({ type: 'ai_analysis_completed', data, timestamp: new Date().toISOString(), fileId: data.fileId }));
        this.socket.on('ai_analysis_cancelled', (data) => this.handleMessage({ type: 'ai_analysis_cancelled', data, timestamp: new Date().toISOString(), fileId: data.fileId }));
        this.socket.on('ai_analysis_paused', (data) => this.handleMessage({ type: 'ai_analysis_paused', data, timestamp: new Date().toISOString(), fileId: data.fileId }));
        this.socket.on('ai_analysis_error', (data) => this.handleMessage({ type: 'ai_analysis_error', data, timestamp: new Date().toISOString(), fileId: data.fileId }));
        this.socket.on('ai_batch_started', (data) => this.handleMessage({ type: 'ai_batch_started', data, timestamp: new Date().toISOString(), fileId: data.fileId }));
        this.socket.on('ai_batch_completed', (data) => this.handleMessage({ type: 'ai_batch_completed', data, timestamp: new Date().toISOString(), fileId: data.fileId }));
        this.socket.on('ai_batch_progress', (data) => this.handleMessage({ type: 'ai_batch_progress', data, timestamp: new Date().toISOString(), fileId: data.fileId }));
        this.socket.on('ai_batch_error', (data) => this.handleMessage({ type: 'ai_batch_error', data, timestamp: new Date().toISOString(), fileId: data.fileId }));
        this.socket.on('security_issue_found', (data) => this.handleMessage({ type: 'security_issue_found', data, timestamp: new Date().toISOString(), fileId: data.fileId }));
        this.socket.on('alert_created', (data) => this.handleMessage({ type: 'alert_created', data, timestamp: new Date().toISOString(), fileId: data.fileId }));

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscriptions.clear();
  }

  /**
   * Reset connection state and circuit breaker - useful for manual retries
   */
  resetConnectionState(): void {
    this.connectionFailed = false;
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.lastConnectionAttempt = 0;
    console.log('🔄 WebSocket connection state reset');
  }

  destroy(): void {
    this.isDestroyed = true;
    this.disconnect();
  }

  subscribe(
    eventType: WebSocketEventType, 
    callback: (data: any) => void, 
    fileId?: string
  ): string {
    const subscriptionId = `${eventType}_${fileId || 'global'}_${Date.now()}`;
    
    const subscription: WebSocketSubscription = {
      id: subscriptionId,
      eventType,
      fileId,
      callback
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message to server if connected
    if (this.socket?.connected) {
      this.sendSubscription(subscription);
    }

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription && this.socket?.connected) {
      this.sendUnsubscription(subscription);
    }
    this.subscriptions.delete(subscriptionId);
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log(`📡 WebSocket message received:`, message);
    
    // Find matching subscriptions
    let matchFound = false;
    this.subscriptions.forEach((subscription) => {
      const eventMatches = subscription.eventType === message.type;
      const fileMatches = !subscription.fileId || subscription.fileId === message.fileId;
      
      if (eventMatches && fileMatches) {
        matchFound = true;
        console.log(`📡 Calling subscription callback for ${message.type}${message.fileId ? ` (fileId: ${message.fileId})` : ''}`);
        try {
          subscription.callback(message.data);
        } catch (error) {
          console.error('Error in WebSocket callback:', error);
        }
      }
    });
    
    if (!matchFound) {
      console.log(`📡 No matching subscriptions found for ${message.type}${message.fileId ? ` (fileId: ${message.fileId})` : ''}`);
    }
  }

  private sendSubscription(subscription: WebSocketSubscription): void {
    // No need to send subscription messages to server
    // Backend automatically emits to user rooms (user_${userId})
    // The Socket.IO event listeners are already set up in the constructor
    console.log(`📡 Subscribed to ${subscription.eventType}${subscription.fileId ? ` for file ${subscription.fileId}` : ''}`);
  }

  private sendUnsubscription(subscription: WebSocketSubscription): void {
    // No need to send unsubscription messages to server
    // Just log for debugging
    console.log(`📡 Unsubscribed from ${subscription.eventType}${subscription.fileId ? ` for file ${subscription.fileId}` : ''}`);
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      this.sendSubscription(subscription);
    });
  }

  /**
   * Attempt to refresh the access token using the refresh token
   */
  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        console.warn('No refresh token available for token refresh');
        return false;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const { accessToken } = data;
      
      if (!accessToken) {
        throw new Error('No access token returned from refresh endpoint');
      }

      // Update the access token in localStorage
      localStorage.setItem('accessToken', accessToken);
      console.log('🔄 Access token refreshed successfully');
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): string {
    if (this.isDestroyed) return 'destroyed';
    if (!this.socket) return 'disconnected';
    
    if (this.isConnecting) return 'connecting';
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  getConnectionStats(): {
    attempts: number;
    reconnectAttempts: number;
    isConnected: boolean;
    state: string;
  } {
    return {
      attempts: this.reconnectAttempts,
      reconnectAttempts: this.reconnectAttempts,
      isConnected: this.isConnected(),
      state: this.getConnectionState()
    };
  }
}

// Export a singleton instance
export const websocketService = new WebSocketService();
export default websocketService;

// Export types for use in other components
export type { WebSocketEventType, WebSocketMessage };