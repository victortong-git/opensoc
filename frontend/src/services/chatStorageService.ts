import { Message, Conversation } from '../store/chatSlice';

interface ChatSession {
  conversationId: string | null;
  messages: Message[];
  settings: {
    ragEnabled: boolean;
    selectedDataSources: string[];
    model: string;
    markdownEnabled: boolean;
  };
  lastActivity: string;
  isNew: boolean;
}

interface StoredChatData {
  currentSession: ChatSession | null;
  recentConversations: Conversation[];
  preferences: {
    autoSave: boolean;
    maxStoredSessions: number;
    chatPanelWidth: number;
    markdownEnabled: boolean;
  };
  version: string;
}

class ChatStorageService {
  private static readonly STORAGE_KEY = 'opensoc_chat_data';
  private static readonly VERSION = '1.0.0';
  
  private static readonly DEFAULT_DATA: StoredChatData = {
    currentSession: null,
    recentConversations: [],
    preferences: {
      autoSave: true,
      maxStoredSessions: 10,
      chatPanelWidth: 400,
      markdownEnabled: true
    },
    version: ChatStorageService.VERSION
  };

  /**
   * Get stored chat data from localStorage
   */
  static getStoredData(): StoredChatData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { ...this.DEFAULT_DATA };
      }

      const parsed = JSON.parse(stored) as StoredChatData;
      
      // Version check and migration
      if (parsed.version !== this.VERSION) {
        console.log(`🔄 Migrating chat data from v${parsed.version} to v${this.VERSION}`);
        return this.migrateData(parsed);
      }

      return { ...this.DEFAULT_DATA, ...parsed };
    } catch (error) {
      console.error('❌ Failed to load chat data from localStorage:', error);
      return { ...this.DEFAULT_DATA };
    }
  }

  /**
   * Save chat data to localStorage
   */
  static saveData(data: Partial<StoredChatData>): boolean {
    try {
      const current = this.getStoredData();
      const updated = { 
        ...current, 
        ...data, 
        version: this.VERSION 
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('❌ Failed to save chat data to localStorage:', error);
      return false;
    }
  }

  /**
   * Save current chat session
   */
  static saveCurrentSession(session: ChatSession): boolean {
    return this.saveData({ currentSession: session });
  }

  /**
   * Get current chat session
   */
  static getCurrentSession(): ChatSession | null {
    const data = this.getStoredData();
    return data.currentSession;
  }

  /**
   * Clear current session
   */
  static clearCurrentSession(): boolean {
    return this.saveData({ currentSession: null });
  }

  /**
   * Update session messages
   */
  static updateSessionMessages(messages: Message[]): boolean {
    const current = this.getCurrentSession();
    if (!current) return false;

    const updated = {
      ...current,
      messages,
      lastActivity: new Date().toISOString()
    };

    return this.saveCurrentSession(updated);
  }

  /**
   * Update session settings
   */
  static updateSessionSettings(settings: Partial<ChatSession['settings']>): boolean {
    const current = this.getCurrentSession();
    if (!current) return false;

    const updated = {
      ...current,
      settings: { ...current.settings, ...settings },
      lastActivity: new Date().toISOString()
    };

    return this.saveCurrentSession(updated);
  }

  /**
   * Create new session
   */
  static createNewSession(
    conversationId: string | null = null,
    settings?: Partial<ChatSession['settings']>
  ): ChatSession {
    const defaultSettings = {
      ragEnabled: true,
      selectedDataSources: ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
      model: 'default',
      markdownEnabled: true
    };

    const session: ChatSession = {
      conversationId,
      messages: [],
      settings: { ...defaultSettings, ...settings },
      lastActivity: new Date().toISOString(),
      isNew: conversationId === null
    };

    this.saveCurrentSession(session);
    return session;
  }

  /**
   * Add recent conversation
   */
  static addRecentConversation(conversation: Conversation): boolean {
    const data = this.getStoredData();
    const existing = data.recentConversations.findIndex(c => c.id === conversation.id);
    
    if (existing >= 0) {
      // Update existing
      data.recentConversations[existing] = conversation;
    } else {
      // Add new, keep only recent ones
      data.recentConversations.unshift(conversation);
      data.recentConversations = data.recentConversations
        .slice(0, data.preferences.maxStoredSessions);
    }

    return this.saveData({ recentConversations: data.recentConversations });
  }

  /**
   * Get recent conversations
   */
  static getRecentConversations(): Conversation[] {
    const data = this.getStoredData();
    return data.recentConversations;
  }

  /**
   * Remove conversation from recent
   */
  static removeRecentConversation(conversationId: string): boolean {
    const data = this.getStoredData();
    const filtered = data.recentConversations.filter(c => c.id !== conversationId);
    return this.saveData({ recentConversations: filtered });
  }

  /**
   * Get user preferences
   */
  static getPreferences() {
    const data = this.getStoredData();
    return data.preferences;
  }

  /**
   * Update preferences
   */
  static updatePreferences(updates: Partial<StoredChatData['preferences']>): boolean {
    const data = this.getStoredData();
    const preferences = { ...data.preferences, ...updates };
    return this.saveData({ preferences });
  }

  /**
   * Check if auto-save is enabled
   */
  static isAutoSaveEnabled(): boolean {
    const preferences = this.getPreferences();
    return preferences.autoSave;
  }

  /**
   * Auto-save current session (if enabled)
   */
  static autoSaveSession(messages: Message[], conversationId?: string): boolean {
    if (!this.isAutoSaveEnabled()) return false;

    const current = this.getCurrentSession();
    if (!current) {
      // Create new session for auto-save
      const session = this.createNewSession(conversationId);
      session.messages = messages;
      return this.saveCurrentSession(session);
    }

    return this.updateSessionMessages(messages);
  }

  /**
   * Export chat data for backup
   */
  static exportData(): string {
    const data = this.getStoredData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import chat data from backup
   */
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData) as StoredChatData;
      
      // Validate basic structure
      if (!data.version || !data.preferences) {
        throw new Error('Invalid chat data format');
      }

      return this.saveData(data);
    } catch (error) {
      console.error('❌ Failed to import chat data:', error);
      return false;
    }
  }

  /**
   * Clear all stored chat data
   */
  static clearAllData(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('❌ Failed to clear chat data:', error);
      return false;
    }
  }

  /**
   * Get storage usage info
   */
  static getStorageInfo() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const size = data ? new Blob([data]).size : 0;
      
      return {
        sizeBytes: size,
        sizeKB: Math.round(size / 1024),
        conversationCount: this.getRecentConversations().length,
        hasCurrentSession: !!this.getCurrentSession(),
        lastUpdated: this.getStoredData().currentSession?.lastActivity || null
      };
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return null;
    }
  }

  /**
   * Migrate data between versions
   */
  private static migrateData(oldData: any): StoredChatData {
    // Handle migration logic for different versions
    // For now, just merge with defaults
    return { ...this.DEFAULT_DATA, ...oldData, version: this.VERSION };
  }

  /**
   * Queue message for offline sending
   */
  static queueOfflineMessage(message: Message): boolean {
    try {
      const queued = localStorage.getItem('opensoc_chat_queue');
      const queue = queued ? JSON.parse(queued) : [];
      
      queue.push({
        ...message,
        queuedAt: new Date().toISOString(),
        attempts: 0
      });
      
      localStorage.setItem('opensoc_chat_queue', JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('❌ Failed to queue offline message:', error);
      return false;
    }
  }

  /**
   * Get queued offline messages
   */
  static getOfflineQueue(): any[] {
    try {
      const queued = localStorage.getItem('opensoc_chat_queue');
      return queued ? JSON.parse(queued) : [];
    } catch (error) {
      console.error('❌ Failed to get offline queue:', error);
      return [];
    }
  }

  /**
   * Clear offline queue
   */
  static clearOfflineQueue(): boolean {
    try {
      localStorage.removeItem('opensoc_chat_queue');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear offline queue:', error);
      return false;
    }
  }
}

export default ChatStorageService;