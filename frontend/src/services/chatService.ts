import { Message, Conversation } from '../store/chatSlice';
import ChatStorageService from './chatStorageService';
import { apiRequest } from './api';

interface SendMessageRequest {
  message: string;
  conversationId?: string;
  ragEnabled?: boolean;
  dataSources?: string[];
  similarityThreshold?: number;
  maxResults?: number;
  model?: string;
  enabledTools?: string[];
}

interface SendMessageResponse {
  success: boolean;
  data?: {
    conversationId: string;
    isNewConversation?: boolean;
    message: Message;
    conversation: Conversation;
    sessionMemory?: number;
  };
  error?: string;
  message?: string;
}

interface ConversationListResponse {
  success: boolean;
  data?: {
    conversations: Conversation[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  error?: string;
}

interface ConversationResponse {
  success: boolean;
  data?: {
    conversation: Conversation;
    sessionMemory?: {
      messageCount: number;
      lastActivity: string | null;
      lastCleared: string | null;
    };
  };
  error?: string;
}

class ChatService {
  private static isOnline = navigator.onLine;
  
  // Connection status listeners
  private static onlineListeners: ((online: boolean) => void)[] = [];

  static {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      ChatService.isOnline = true;
      ChatService.onlineListeners.forEach(listener => listener(true));
      ChatService.processOfflineQueue();
    });
    
    window.addEventListener('offline', () => {
      ChatService.isOnline = false;
      ChatService.onlineListeners.forEach(listener => listener(false));
    });
  }

  /**
   * Subscribe to connection status changes
   */
  static onConnectionChange(listener: (online: boolean) => void): () => void {
    this.onlineListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.onlineListeners.indexOf(listener);
      if (index >= 0) {
        this.onlineListeners.splice(index, 1);
      }
    };
  }



  /**
   * Send message to AI SOC Consultant
   */
  static async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    // Auto-save current session if enabled
    if (ChatStorageService.isAutoSaveEnabled()) {
      const currentSession = ChatStorageService.getCurrentSession();
      if (currentSession) {
        ChatStorageService.autoSaveSession(currentSession.messages, request.conversationId);
      }
    }

    // If offline, queue the message
    if (!this.isOnline) {
      const offlineMessage: Message = {
        id: `offline-${Date.now()}`,
        role: 'user',
        content: request.message,
        timestamp: new Date().toISOString()
      };
      
      ChatStorageService.queueOfflineMessage(offlineMessage);
      
      return {
        success: false,
        error: 'You are offline. Message queued for when connection is restored.',
        message: 'Message queued for offline sending'
      };
    }

    const startTime = Date.now();
    
    try {
      console.log(`🤖 Sending chat message...`);
      
      // Use standard API request (same pattern as alert service)
      const response = await apiRequest.post<SendMessageResponse>('/chat/message', request);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Chat message sent successfully in ${duration}ms`);

      // Update recent conversations if successful
      if (response.success && response.data) {
        ChatStorageService.addRecentConversation(response.data.conversation);
        
        // Auto-save the conversation
        if (ChatStorageService.isAutoSaveEnabled()) {
          const session = ChatStorageService.getCurrentSession();
          if (session) {
            session.conversationId = response.data.conversationId;
            session.messages.push({
              id: `user-${Date.now()}`,
              role: 'user',
              content: request.message,
              timestamp: new Date().toISOString()
            });
            session.messages.push(response.data.message);
            ChatStorageService.saveCurrentSession(session);
          }
        }
      }

      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Chat message failed after ${duration}ms:`, error);
      
      // Detailed error handling based on error type (same as alert service)
      let errorMessage = 'AI Chat service is not available. Please try again later.';
      
      if (error?.code === 'ECONNABORTED' && error?.message?.includes('timeout')) {
        console.error('🕒 Chat timeout detected');
        const timeoutSeconds = Math.round(duration / 1000);
        if (timeoutSeconds > 120) {
          errorMessage = `Chat request timed out after ${timeoutSeconds} seconds. Your query may be too complex or the AI provider is overloaded. Try asking a simpler question or wait a moment before trying again.`;
        } else {
          errorMessage = `Chat request timed out after ${timeoutSeconds} seconds. The AI provider may be temporarily unavailable. Please check your AI provider settings and try again.`;
        }
      } else if (error?.response?.status === 408) {
        console.error('🕒 Server timeout');
        errorMessage = 'AI chat is taking longer than expected. This may be due to complex processing or high server load. Please try a simpler question or wait a moment before trying again.';
      } else if (error?.response?.status === 429) {
        console.error('🚫 Rate limit exceeded');
        errorMessage = 'Too many chat requests. Please wait a moment before sending another message.';
      } else if (error?.response?.status >= 500) {
        console.error('🔥 Server error');
        errorMessage = 'AI chat service is experiencing issues. Please try again later.';
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to send message to AI assistant'
      };
    }
  }

  /**
   * Get list of user's conversations
   */
  static async getConversations(options: {
    limit?: number;
    offset?: number;
    includeArchived?: boolean;
    search?: string;
  } = {}): Promise<ConversationListResponse> {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.offset) params.set('offset', options.offset.toString());
      if (options.includeArchived) params.set('includeArchived', 'true');
      if (options.search) params.set('search', options.search);

      const queryString = params.toString();
      const endpoint = queryString ? `/conversations?${queryString}` : '/conversations';
      
      const response = await apiRequest.get<ConversationListResponse>(`/chat${endpoint}`);
      
      // Update local storage with fresh data
      if (response.success && response.data?.conversations) {
        response.data.conversations.forEach(conv => {
          ChatStorageService.addRecentConversation(conv);
        });
      }
      
      return response;
    } catch (error) {
      console.error('❌ Failed to get conversations:', error);
      
      // Return the actual error instead of fallback
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load conversations',
        data: {
          conversations: [],
          pagination: {
            total: 0,
            limit: options.limit || 20,
            offset: options.offset || 0,
            hasMore: false
          }
        }
      };
    }
  }

  /**
   * Get specific conversation with messages
   */
  static async getConversation(
    conversationId: string, 
    options: { limit?: number; offset?: number } = {}
  ): Promise<ConversationResponse> {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.offset) params.set('offset', options.offset.toString());

      const queryString = params.toString();
      const endpoint = `/conversations/${conversationId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiRequest.get<ConversationResponse>(`/chat${endpoint}`);
      
      // Update local storage
      if (response.success && response.data?.conversation) {
        ChatStorageService.addRecentConversation(response.data.conversation);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Failed to get conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load conversation'
      };
    }
  }

  /**
   * Update conversation (title, archive status)
   */
  static async updateConversation(
    conversationId: string,
    updates: { title?: string; isArchived?: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiRequest.put(`/chat/conversations/${conversationId}`, updates);

      // Update local storage
      if (response.success && response.data?.conversation) {
        ChatStorageService.addRecentConversation(response.data.conversation);
      }

      return response;
    } catch (error) {
      console.error('❌ Failed to update conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update conversation'
      };
    }
  }

  /**
   * Delete/Archive conversation
   */
  static async deleteConversation(
    conversationId: string, 
    permanent: boolean = false
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const params = permanent ? '?permanent=true' : '';
      const response = await apiRequest.delete(`/chat/conversations/${conversationId}${params}`);

      // Remove from local storage
      if (response.success) {
        ChatStorageService.removeRecentConversation(conversationId);
        
        // Clear current session if it matches
        const currentSession = ChatStorageService.getCurrentSession();
        if (currentSession?.conversationId === conversationId) {
          ChatStorageService.clearCurrentSession();
        }
      }

      return response;
    } catch (error) {
      console.error('❌ Failed to delete conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete conversation'
      };
    }
  }

  /**
   * Clear session memory (not chat history)
   */
  static async clearSessionMemory(conversationId: string): Promise<{
    success: boolean; 
    error?: string; 
    message?: string;
    data?: { conversationId: string; sessionCleared: boolean; clearedAt: string };
  }> {
    try {
      const response = await apiRequest.post(`/chat/conversations/${conversationId}/clear-session`);

      return response;
    } catch (error) {
      console.error('❌ Failed to clear session memory:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear session memory'
      };
    }
  }

  /**
   * Get chat statistics
   */
  static async getStats(): Promise<{
    success: boolean;
    data?: {
      conversations: {
        total: number;
        active: number;
        archived: number;
        averageMessages: number;
      };
      messages: { total: number };
      sessions: {
        active: number;
        memoryLimit: number;
        maxAge: string;
      };
      rag: any;
      timestamp: string;
    };
    error?: string;
  }> {
    try {
      return await apiRequest.get('/chat/stats');
    } catch (error) {
      console.error('❌ Failed to get chat stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load chat statistics'
      };
    }
  }

  /**
   * Process queued offline messages
   */
  private static async processOfflineQueue(): Promise<void> {
    const queue = ChatStorageService.getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`📤 Processing ${queue.length} queued offline messages`);
    
    let processed = 0;
    for (const queuedItem of queue) {
      try {
        await this.sendMessage({
          message: queuedItem.content,
          conversationId: queuedItem.conversationId,
          ragEnabled: true
        });
        processed++;
      } catch (error) {
        console.error('❌ Failed to send queued message:', error);
        // Keep message in queue for retry
      }
    }

    if (processed > 0) {
      console.log(`✅ Successfully sent ${processed} queued messages`);
      ChatStorageService.clearOfflineQueue();
    }
  }

  /**
   * Initialize chat session from localStorage
   */
  static initializeFromStorage(): {
    session: any | null;
    preferences: any;
    recentConversations: Conversation[];
  } {
    return {
      session: ChatStorageService.getCurrentSession(),
      preferences: ChatStorageService.getPreferences(),
      recentConversations: ChatStorageService.getRecentConversations()
    };
  }

  /**
   * Create new chat session
   */
  static createNewSession(settings?: any): any {
    return ChatStorageService.createNewSession(null, settings);
  }

  /**
   * Get connection status
   */
  static getConnectionStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Export chat data
   */
  static exportChatHistory(): string {
    return ChatStorageService.exportData();
  }

  /**
   * Import chat data
   */
  static importChatHistory(jsonData: string): boolean {
    return ChatStorageService.importData(jsonData);
  }

  // Cache for tools to avoid repeated requests
  private static toolsCache: {
    data: Array<{
      category: string;
      tools: Array<{
        name: string;
        displayName: string;
        description: string;
        parameters?: any;
      }>;
    }> | null;
    timestamp: number;
    ttl: number;
  } = { data: null, timestamp: 0, ttl: 15 * 60 * 1000 }; // Extended to 15 minute TTL

  // Request deduplication for tools API
  private static toolsRequestPromise: Promise<any> | null = null;

  // Circuit breaker for tools API
  private static toolsCircuitBreaker = {
    failures: 0,
    lastFailureTime: 0,
    maxFailures: 3,
    resetTimeout: 30000 // 30 seconds
  };

  /**
   * Get available AI tools with caching and fallback
   */
  static async getAvailableTools(useCache = true): Promise<{
    success: boolean;
    data?: Array<{
      category: string;
      tools: Array<{
        name: string;
        displayName: string;
        description: string;
        parameters?: any;
      }>;
    }>;
    error?: string;
  }> {
    const cacheKey = 'chat_available_tools';
    const now = Date.now();
    
    // Check cache first if enabled
    if (useCache && this.toolsCache.data && (now - this.toolsCache.timestamp < this.toolsCache.ttl)) {
      return {
        success: true,
        data: this.toolsCache.data
      };
    }

    // Deduplicate concurrent requests
    if (this.toolsRequestPromise) {
      try {
        return await this.toolsRequestPromise;
      } catch (error) {
        // If the shared request failed, continue with a new request
        this.toolsRequestPromise = null;
      }
    }

    // Check circuit breaker
    const { failures, lastFailureTime, maxFailures, resetTimeout } = this.toolsCircuitBreaker;
    if (failures >= maxFailures) {
      if (now - lastFailureTime < resetTimeout) {
        console.warn('🔌 Tools API circuit breaker is open, using fallback');
        const fallbackTools = this.getToolsFallback();
        if (fallbackTools) {
          return {
            success: true,
            data: fallbackTools,
            error: 'Circuit breaker active - using cached data'
          };
        }
        return {
          success: false,
          error: 'Tools API temporarily unavailable (circuit breaker active)'
        };
      } else {
        // Reset circuit breaker
        this.toolsCircuitBreaker.failures = 0;
      }
    }

    // Check localStorage fallback
    const fallbackTools = this.getToolsFallback();

    // Create shared promise for deduplication
    this.toolsRequestPromise = (async () => {
      try {
        const response = await apiRequest.get('/chat/tools/available');
        
        // Reset circuit breaker on success
        this.toolsCircuitBreaker.failures = 0;
        
        // Cache successful response
        if (response.success && response.data) {
          this.toolsCache.data = response.data;
          this.toolsCache.timestamp = now;
          
          // Also store in localStorage as backup with extended TTL
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: response.data,
              timestamp: now,
              version: '1.0' // Version for cache invalidation if needed
            }));
          } catch (e) {
            console.warn('Failed to cache tools to localStorage:', e);
          }
        }
        
        return response;
      } catch (error) {
        // Increment circuit breaker failures
        this.toolsCircuitBreaker.failures++;
        this.toolsCircuitBreaker.lastFailureTime = now;
        
        console.error('❌ Failed to get available tools:', error);
        
        // Try fallback data if available
        if (fallbackTools) {
          return {
            success: true,
            data: fallbackTools,
            error: `Using cached data - ${error instanceof Error ? error.message : 'Network error'}`
          };
        }
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load available tools'
        };
      } finally {
        // Clear the promise when done
        this.toolsRequestPromise = null;
      }
    })();

    return await this.toolsRequestPromise;
  }

  /**
   * Get tools fallback from localStorage
   */
  private static getToolsFallback(): Array<{
    category: string;
    tools: Array<{
      name: string;
      displayName: string;
      description: string;
      parameters?: any;
    }>;
  }> | null {
    try {
      const cached = localStorage.getItem('chat_available_tools');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Use cached data if it's less than 7 days old (extended fallback period)
        if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (e) {
      console.warn('Failed to load fallback tools:', e);
    }
    return null;
  }

  /**
   * Clear tools cache (for debugging/testing)
   */
  static clearToolsCache(): void {
    this.toolsCache.data = null;
    this.toolsCache.timestamp = 0;
    this.toolsRequestPromise = null;
    this.toolsCircuitBreaker.failures = 0;
    this.toolsCircuitBreaker.lastFailureTime = 0;
    
    try {
      localStorage.removeItem('chat_available_tools');
    } catch (e) {
      console.warn('Failed to clear tools cache from localStorage:', e);
    }
  }

  /**
   * Update conversation settings
   */
  static async updateConversationSettings(
    conversationId: string,
    settings: { enabledTools?: string[]; [key: string]: any }
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const response = await apiRequest.put(`/chat/conversations/${conversationId}/settings`, { settings });

      return response;
    } catch (error) {
      console.error('❌ Failed to update conversation settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update conversation settings'
      };
    }
  }
}

export default ChatService;