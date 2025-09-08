import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EmbeddingStatus {
  total: number;
  embedded: number;
  pending: number;
  percentage: number;
  error?: string;
}

export interface EmbeddingModelInfo {
  name: string;
  dimensions: number;
  initialized: boolean;
}

export interface SearchCapability {
  available: boolean;
  coverage: number;
  count: number;
}

export interface EmbeddingStats {
  totalRecords: number;
  embeddedRecords: number;
  overallCoverage: number;
  modelInfo: EmbeddingModelInfo;
  searchCapabilities: Record<string, SearchCapability>;
}

export interface GenerationResult {
  modelType: string;
  updated: number;
  errors: number;
  batchSize: number;
  organizationId: string;
}

export interface SearchResult {
  id: string;
  type: string;
  similarity: number;
  data: any;
}

interface EmbeddingState {
  // Embedding status for each data type
  status: Record<string, EmbeddingStatus>;
  
  // Overall statistics
  stats: EmbeddingStats | null;
  
  // Generation states
  isGenerating: Record<string, boolean>;
  generationResults: Record<string, GenerationResult>;
  
  // Search functionality
  searchResults: SearchResult[];
  lastSearchQuery: string | null;
  isSearching: boolean;
  
  // Model initialization
  isInitializingModel: boolean;
  
  // Loading states
  isLoadingStatus: boolean;
  isLoadingStats: boolean;
  
  // Error handling
  error: string | null;
  generationErrors: Record<string, string>;
  
  // Last updated
  lastUpdated: string | null;
}

const initialState: EmbeddingState = {
  // Embedding status
  status: {},
  
  // Statistics
  stats: null,
  
  // Generation states
  isGenerating: {},
  generationResults: {},
  
  // Search functionality
  searchResults: [],
  lastSearchQuery: null,
  isSearching: false,
  
  // Model initialization
  isInitializingModel: false,
  
  // Loading states
  isLoadingStatus: false,
  isLoadingStats: false,
  
  // Error handling
  error: null,
  generationErrors: {},
  
  // Last updated
  lastUpdated: null,
};

const embeddingSlice = createSlice({
  name: 'embedding',
  initialState,
  reducers: {
    // Status Management
    setEmbeddingStatus: (state, action: PayloadAction<Record<string, EmbeddingStatus>>) => {
      state.status = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    updateEmbeddingStatus: (state, action: PayloadAction<{ type: string; status: EmbeddingStatus }>) => {
      const { type, status } = action.payload;
      state.status[type] = status;
      state.lastUpdated = new Date().toISOString();
    },
    
    // Statistics Management
    setEmbeddingStats: (state, action: PayloadAction<EmbeddingStats>) => {
      state.stats = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    // Generation Management
    startGeneration: (state, action: PayloadAction<string>) => {
      const modelType = action.payload;
      state.isGenerating[modelType] = true;
      delete state.generationErrors[modelType];
    },
    
    completeGeneration: (state, action: PayloadAction<GenerationResult>) => {
      const result = action.payload;
      state.isGenerating[result.modelType] = false;
      state.generationResults[result.modelType] = result;
      state.lastUpdated = new Date().toISOString();
    },
    
    failGeneration: (state, action: PayloadAction<{ modelType: string; error: string }>) => {
      const { modelType, error } = action.payload;
      state.isGenerating[modelType] = false;
      state.generationErrors[modelType] = error;
    },
    
    startAllGeneration: (state, action: PayloadAction<string[]>) => {
      const modelTypes = action.payload;
      modelTypes.forEach(type => {
        state.isGenerating[type] = true;
        delete state.generationErrors[type];
      });
    },
    
    completeAllGeneration: (state, action: PayloadAction<Record<string, GenerationResult>>) => {
      const results = action.payload;
      Object.keys(state.isGenerating).forEach(type => {
        state.isGenerating[type] = false;
      });
      Object.assign(state.generationResults, results);
      state.lastUpdated = new Date().toISOString();
    },
    
    clearGenerationResults: (state) => {
      state.generationResults = {};
      state.generationErrors = {};
    },
    
    // Search Management
    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },
    
    setSearchResults: (state, action: PayloadAction<{ query: string; results: SearchResult[] }>) => {
      const { query, results } = action.payload;
      state.searchResults = results;
      state.lastSearchQuery = query;
      state.isSearching = false;
      state.lastUpdated = new Date().toISOString();
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.lastSearchQuery = null;
    },
    
    // Model Management
    setInitializingModel: (state, action: PayloadAction<boolean>) => {
      state.isInitializingModel = action.payload;
    },
    
    updateModelInfo: (state, action: PayloadAction<EmbeddingModelInfo>) => {
      if (state.stats) {
        state.stats.modelInfo = action.payload;
        state.lastUpdated = new Date().toISOString();
      }
    },
    
    // Loading States
    setLoadingStatus: (state, action: PayloadAction<boolean>) => {
      state.isLoadingStatus = action.payload;
    },
    
    setLoadingStats: (state, action: PayloadAction<boolean>) => {
      state.isLoadingStats = action.payload;
    },
    
    // Error Handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    clearAllErrors: (state) => {
      state.error = null;
      state.generationErrors = {};
    },
    
    // Data Refresh
    refreshData: (state) => {
      state.isLoadingStatus = true;
      state.isLoadingStats = true;
      state.error = null;
    },
    
    // Reset
    resetEmbedding: (state) => {
      return initialState;
    },
  },
});

export const {
  // Status Management
  setEmbeddingStatus,
  updateEmbeddingStatus,
  
  // Statistics Management
  setEmbeddingStats,
  
  // Generation Management
  startGeneration,
  completeGeneration,
  failGeneration,
  startAllGeneration,
  completeAllGeneration,
  clearGenerationResults,
  
  // Search Management
  setSearching,
  setSearchResults,
  clearSearchResults,
  
  // Model Management
  setInitializingModel,
  updateModelInfo,
  
  // Loading States
  setLoadingStatus,
  setLoadingStats,
  
  // Error Handling
  setError,
  clearError,
  clearAllErrors,
  
  // Data Refresh
  refreshData,
  
  // Reset
  resetEmbedding,
} = embeddingSlice.actions;

export default embeddingSlice.reducer;