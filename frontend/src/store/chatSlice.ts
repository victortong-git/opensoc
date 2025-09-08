import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  ragEnabled?: boolean;
  ragContext?: {
    query: string;
    resultsFound: number;
    sources: Array<{
      type: string;
      id: string;
      similarity: number;
    }>;
  };
}

export interface Conversation {
  id: string;
  title?: string;
  messageCount: number;
  settings: {
    ragEnabled: boolean;
    dataSources: string[];
    model: string;
    enabledTools?: string[];
  };
  lastActivity: string;
  createdAt?: string;
  isArchived?: boolean;
  messages?: Message[];
}

export interface ChatStats {
  conversations: {
    total: number;
    withRAG: number;
    averageMessages: number;
  };
  messages: {
    total: number;
  };
  rag: {
    totalRecords: number;
    embeddedRecords: number;
    overallCoverage: number;
    modelInfo: {
      name: string;
      dimensions: number;
      initialized: boolean;
    };
    searchCapabilities: Record<string, {
      available: boolean;
      coverage: number;
      count: number;
    }>;
  };
  timestamp: string;
}

interface ChatState {
  // UI State
  isOpen: boolean;
  width: number;
  
  // Current conversation
  currentConversation: Conversation | null;
  messages: Message[];
  
  // Conversation management
  conversations: Conversation[];
  chatHistory: Conversation[]; // Persistent chat history
  
  // Session management
  sessionMemory: Message[]; // Last 5 messages for context
  currentSessionId: string | null;
  sessionMemoryCount: number;
  
  // Chat settings
  ragEnabled: boolean;
  selectedDataSources: string[];
  similarityThreshold: number;
  model: string;
  markdownEnabled: boolean;
  
  // Tool management
  enabledTools: string[];
  availableTools: Array<{
    category: string;
    tools: Array<{
      name: string;
      displayName: string;
      description: string;
      parameters?: any;
    }>;
  }>;
  isLoadingTools: boolean;
  
  // Connection and sync
  isOnline: boolean;
  autoSave: boolean;
  queuedMessages: Message[]; // Offline queue
  syncStatus: 'idle' | 'syncing' | 'failed';
  
  // Loading states
  isSendingMessage: boolean;
  isLoadingConversations: boolean;
  isLoadingHistory: boolean;
  isLoadingStats: boolean;
  isSyncing: boolean;
  
  // Stats
  stats: ChatStats | null;
  
  // Error handling
  error: string | null;
  
  // Last updated
  lastUpdated: string | null;
  lastSyncTime: string | null;
}

const initialState: ChatState = {
  // UI State
  isOpen: false,
  width: 480,
  
  // Current conversation
  currentConversation: null,
  messages: [],
  
  // Conversation management
  conversations: [],
  chatHistory: [],
  
  // Session management
  sessionMemory: [],
  currentSessionId: null,
  sessionMemoryCount: 0,
  
  // Chat settings
  ragEnabled: true,
  selectedDataSources: ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
  similarityThreshold: 0.55,
  model: 'default',
  markdownEnabled: true,
  
  // Tool management
  enabledTools: [],
  availableTools: [],
  isLoadingTools: false,
  
  // Connection and sync
  isOnline: true,
  autoSave: true,
  queuedMessages: [],
  syncStatus: 'idle',
  
  // Loading states
  isSendingMessage: false,
  isLoadingConversations: false,
  isLoadingHistory: false,
  isLoadingStats: false,
  isSyncing: false,
  
  // Stats
  stats: null,
  
  // Error handling
  error: null,
  
  // Last updated
  lastUpdated: null,
  lastSyncTime: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // UI Actions
    toggleChat: (state) => {
      state.isOpen = !state.isOpen;
    },
    
    openChat: (state) => {
      state.isOpen = true;
    },
    
    closeChat: (state) => {
      state.isOpen = false;
    },
    
    setChatWidth: (state, action: PayloadAction<number>) => {
      state.width = action.payload;
    },
    
    // Message Actions
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
      state.lastUpdated = new Date().toISOString();
    },
    
    clearMessages: (state) => {
      state.messages = [];
      state.currentConversation = null;
      state.error = null;
    },
    
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    // Conversation Actions
    setCurrentConversation: (state, action: PayloadAction<Conversation>) => {
      state.currentConversation = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.conversations.unshift(action.payload);
      state.lastUpdated = new Date().toISOString();
    },
    
    removeConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(conv => conv.id !== action.payload);
      if (state.currentConversation?.id === action.payload) {
        state.currentConversation = null;
        state.messages = [];
      }
      state.lastUpdated = new Date().toISOString();
    },
    
    // Settings Actions
    setRagEnabled: (state, action: PayloadAction<boolean>) => {
      state.ragEnabled = action.payload;
    },
    
    setSelectedDataSources: (state, action: PayloadAction<string[]>) => {
      state.selectedDataSources = action.payload;
    },
    
    setSimilarityThreshold: (state, action: PayloadAction<number>) => {
      state.similarityThreshold = Math.max(0, Math.min(1, action.payload)); // Clamp between 0 and 1
    },
    
    toggleDataSource: (state, action: PayloadAction<string>) => {
      const source = action.payload;
      if (state.selectedDataSources.includes(source)) {
        state.selectedDataSources = state.selectedDataSources.filter(s => s !== source);
      } else {
        state.selectedDataSources.push(source);
      }
    },
    
    setModel: (state, action: PayloadAction<string>) => {
      state.model = action.payload;
    },
    
    setMarkdownEnabled: (state, action: PayloadAction<boolean>) => {
      state.markdownEnabled = action.payload;
    },
    
    // Tool Management Actions
    setEnabledTools: (state, action: PayloadAction<string[]>) => {
      state.enabledTools = action.payload;
    },
    
    toggleTool: (state, action: PayloadAction<string>) => {
      const tool = action.payload;
      if (state.enabledTools.includes(tool)) {
        state.enabledTools = state.enabledTools.filter(t => t !== tool);
      } else {
        state.enabledTools.push(tool);
      }
    },
    
    setAvailableTools: (state, action: PayloadAction<Array<{
      category: string;
      tools: Array<{
        name: string;
        displayName: string;
        description: string;
        parameters?: any;
      }>;
    }>>) => {
      state.availableTools = action.payload;
    },
    
    setLoadingTools: (state, action: PayloadAction<boolean>) => {
      state.isLoadingTools = action.payload;
    },
    
    enableAllTools: (state) => {
      const allTools = state.availableTools.flatMap(category => 
        category.tools.map(tool => tool.name)
      );
      state.enabledTools = allTools;
    },
    
    disableAllTools: (state) => {
      state.enabledTools = [];
    },
    
    enableToolsByCategory: (state, action: PayloadAction<string>) => {
      const category = action.payload;
      const categoryTools = state.availableTools
        .find(cat => cat.category === category)
        ?.tools.map(tool => tool.name) || [];
      
      // Add tools that aren't already enabled
      const newTools = categoryTools.filter(tool => !state.enabledTools.includes(tool));
      state.enabledTools = [...state.enabledTools, ...newTools];
    },
    
    disableToolsByCategory: (state, action: PayloadAction<string>) => {
      const category = action.payload;
      const categoryTools = state.availableTools
        .find(cat => cat.category === category)
        ?.tools.map(tool => tool.name) || [];
      
      // Remove all tools from this category
      state.enabledTools = state.enabledTools.filter(tool => !categoryTools.includes(tool));
    },
    
    updateConversationSettings: (state, action: PayloadAction<{ 
      conversationId: string; 
      settings: Partial<Conversation['settings']> 
    }>) => {
      const { conversationId, settings } = action.payload;
      
      // Update current conversation if it matches
      if (state.currentConversation?.id === conversationId) {
        state.currentConversation.settings = {
          ...state.currentConversation.settings,
          ...settings
        };
      }
      
      // Update in conversations list
      const conversationIndex = state.conversations.findIndex(c => c.id === conversationId);
      if (conversationIndex >= 0) {
        state.conversations[conversationIndex].settings = {
          ...state.conversations[conversationIndex].settings,
          ...settings
        };
      }
      
      state.lastUpdated = new Date().toISOString();
    },
    
    // Loading States
    setSendingMessage: (state, action: PayloadAction<boolean>) => {
      state.isSendingMessage = action.payload;
    },
    
    setLoadingConversations: (state, action: PayloadAction<boolean>) => {
      state.isLoadingConversations = action.payload;
    },
    
    setLoadingStats: (state, action: PayloadAction<boolean>) => {
      state.isLoadingStats = action.payload;
    },
    
    setLoadingHistory: (state, action: PayloadAction<boolean>) => {
      state.isLoadingHistory = action.payload;
    },
    
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
      state.syncStatus = action.payload ? 'syncing' : 'idle';
    },
    
    // Session Memory Actions
    updateSessionMemory: (state, action: PayloadAction<Message[]>) => {
      state.sessionMemory = action.payload.slice(-10); // Keep last 10 messages max
      state.sessionMemoryCount = state.sessionMemory.length;
    },
    
    clearSessionMemory: (state) => {
      state.sessionMemory = [];
      state.sessionMemoryCount = 0;
    },
    
    setCurrentSessionId: (state, action: PayloadAction<string | null>) => {
      state.currentSessionId = action.payload;
    },
    
    // Chat History Actions
    setChatHistory: (state, action: PayloadAction<Conversation[]>) => {
      state.chatHistory = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    addToChatHistory: (state, action: PayloadAction<Conversation>) => {
      const existing = state.chatHistory.findIndex(c => c.id === action.payload.id);
      if (existing >= 0) {
        state.chatHistory[existing] = action.payload;
      } else {
        state.chatHistory.unshift(action.payload);
      }
      state.lastUpdated = new Date().toISOString();
    },
    
    removeFromChatHistory: (state, action: PayloadAction<string>) => {
      state.chatHistory = state.chatHistory.filter(c => c.id !== action.payload);
      state.lastUpdated = new Date().toISOString();
    },
    
    // Connection and Sync Actions
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (action.payload && state.queuedMessages.length > 0) {
        state.syncStatus = 'syncing';
      }
    },
    
    setAutoSave: (state, action: PayloadAction<boolean>) => {
      state.autoSave = action.payload;
    },
    
    addQueuedMessage: (state, action: PayloadAction<Message>) => {
      state.queuedMessages.push(action.payload);
    },
    
    clearQueuedMessages: (state) => {
      state.queuedMessages = [];
      state.syncStatus = 'idle';
    },
    
    setSyncStatus: (state, action: PayloadAction<'idle' | 'syncing' | 'failed'>) => {
      state.syncStatus = action.payload;
    },
    
    setLastSyncTime: (state, action: PayloadAction<string>) => {
      state.lastSyncTime = action.payload;
    },
    
    // Load Conversation into Current Session
    loadConversation: (state, action: PayloadAction<{
      conversation: Conversation | null;
      messages: Message[];
    }>) => {
      const { conversation, messages } = action.payload;
      state.currentConversation = conversation;
      state.messages = messages;
      state.currentSessionId = conversation?.id || null;
      state.lastUpdated = new Date().toISOString();
    },

    // Update Conversation Title
    updateConversationTitle: (state, action: PayloadAction<{
      conversationId: string;
      title: string;
    }>) => {
      const { conversationId, title } = action.payload;
      
      // Update current conversation if it matches
      if (state.currentConversation?.id === conversationId) {
        state.currentConversation.title = title;
      }
      
      // Update in conversations list
      const convIndex = state.conversations.findIndex(c => c.id === conversationId);
      if (convIndex >= 0) {
        state.conversations[convIndex].title = title;
      }
      
      // Update in chat history
      const historyIndex = state.chatHistory.findIndex(c => c.id === conversationId);
      if (historyIndex >= 0) {
        state.chatHistory[historyIndex].title = title;
      }
      
      state.lastUpdated = new Date().toISOString();
    },

    // Archive/Unarchive Conversation
    updateConversationArchiveStatus: (state, action: PayloadAction<{
      conversationId: string;
      isArchived: boolean;
    }>) => {
      const { conversationId, isArchived } = action.payload;
      
      // Update in chat history
      const historyIndex = state.chatHistory.findIndex(c => c.id === conversationId);
      if (historyIndex >= 0) {
        state.chatHistory[historyIndex].isArchived = isArchived;
      }
      
      state.lastUpdated = new Date().toISOString();
    },

    // Filter Chat History
    setHistoryFilter: (state, action: PayloadAction<{
      searchQuery?: string;
      includeArchived?: boolean;
    }>) => {
      // This would be used by components to maintain filter state
      // The actual filtering happens in the UI components
      state.lastUpdated = new Date().toISOString();
    },

    // Initialize from Storage
    initializeFromStorage: (state, action: PayloadAction<{
      session?: any;
      preferences?: any;
      recentConversations?: Conversation[];
    }>) => {
      const { session, preferences, recentConversations } = action.payload;
      
      if (session) {
        state.currentSessionId = session.conversationId;
        state.messages = session.messages || [];
        state.ragEnabled = session.settings?.ragEnabled ?? state.ragEnabled;
        state.selectedDataSources = session.settings?.selectedDataSources ?? state.selectedDataSources;
        state.model = session.settings?.model ?? state.model;
        state.markdownEnabled = session.settings?.markdownEnabled ?? state.markdownEnabled;
      }
      
      if (preferences) {
        state.autoSave = preferences.autoSave ?? state.autoSave;
        state.width = preferences.chatPanelWidth ?? state.width;
        state.markdownEnabled = preferences.markdownEnabled ?? state.markdownEnabled;
      }
      
      if (recentConversations) {
        state.chatHistory = recentConversations;
      }
      
      state.lastUpdated = new Date().toISOString();
    },
    
    // Stats Actions
    setStats: (state, action: PayloadAction<ChatStats>) => {
      state.stats = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    // Error Handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset
    resetChat: (state) => {
      return {
        ...initialState,
        width: state.width, // Preserve UI preferences
        isOpen: state.isOpen,
      };
    },
  },
});

export const {
  // UI Actions
  toggleChat,
  openChat,
  closeChat,
  setChatWidth,
  
  // Message Actions
  addMessage,
  clearMessages,
  setMessages,
  
  // Conversation Actions
  setCurrentConversation,
  setConversations,
  addConversation,
  removeConversation,
  
  // Settings Actions
  setRagEnabled,
  setSelectedDataSources,
  setSimilarityThreshold,
  toggleDataSource,
  setModel,
  setMarkdownEnabled,
  updateConversationSettings,
  
  // Tool Management Actions
  setEnabledTools,
  toggleTool,
  setAvailableTools,
  setLoadingTools,
  enableAllTools,
  disableAllTools,
  enableToolsByCategory,
  disableToolsByCategory,
  
  // Session Memory Actions
  updateSessionMemory,
  clearSessionMemory,
  setCurrentSessionId,
  
  // Chat History Actions
  setChatHistory,
  addToChatHistory,
  removeFromChatHistory,
  
  // Connection and Sync Actions
  setOnlineStatus,
  setAutoSave,
  addQueuedMessage,
  clearQueuedMessages,
  setSyncStatus,
  setLastSyncTime,
  
  // Load Conversation
  loadConversation,
  updateConversationTitle,
  updateConversationArchiveStatus,
  setHistoryFilter,
  
  // Initialize from Storage
  initializeFromStorage,
  
  // Loading States
  setSendingMessage,
  setLoadingConversations,
  setLoadingStats,
  setLoadingHistory,
  setSyncing,
  
  // Stats Actions
  setStats,
  
  // Error Handling
  setError,
  clearError,
  
  // Reset
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;