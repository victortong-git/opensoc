import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import searchService, { SearchResult, SearchResponse, QuickSearchResponse, SearchSuggestion } from '../services/searchService';

interface SearchState {
  // Search query and settings
  query: string;
  searchType: 'keyword' | 'vector' | 'hybrid';
  selectedEntities: string[];
  
  // Full search results
  results: Record<string, {
    items: SearchResult[];
    count: number;
    hasMore: boolean;
  }>;
  totalItems: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  
  // Quick search results (for navbar)
  quickResults: Record<string, SearchResult[]>;
  quickTotalItems: number;
  quickHasMore: boolean;
  
  // Search suggestions
  suggestions: SearchSuggestion[];
  
  // Search history
  searchHistory: string[];
  
  // UI state
  isSearching: boolean;
  isQuickSearching: boolean;
  isLoadingSuggestions: boolean;
  error: string | null;
  
  // Search preferences
  preferences: {
    defaultSearchType: 'keyword' | 'vector' | 'hybrid';
    defaultEntities: string[];
    resultsPerPage: number;
  };
}

const initialState: SearchState = {
  query: '',
  searchType: 'hybrid',
  selectedEntities: ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
  
  results: {},
  totalItems: 0,
  pagination: {
    limit: 20,
    offset: 0,
    hasMore: false
  },
  
  quickResults: {},
  quickTotalItems: 0,
  quickHasMore: false,
  
  suggestions: [],
  searchHistory: [],
  
  isSearching: false,
  isQuickSearching: false,
  isLoadingSuggestions: false,
  error: null,
  
  preferences: {
    defaultSearchType: 'hybrid',
    defaultEntities: ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
    resultsPerPage: 20
  }
};

// Async thunks
export const performSearch = createAsyncThunk(
  'search/performSearch',
  async (options: {
    query: string;
    searchType?: 'keyword' | 'vector' | 'hybrid';
    entities?: string[];
    limit?: number;
    offset?: number;
  }) => {
    const response = await searchService.search(options);
    return response.data;
  }
);

export const performQuickSearch = createAsyncThunk(
  'search/performQuickSearch',
  async (options: {
    query: string;
    searchType?: 'keyword' | 'vector' | 'hybrid';
    limit?: number;
  }) => {
    const response = await searchService.quickSearch(
      options.query,
      options.searchType,
      options.limit
    );
    return response.data;
  }
);

export const loadSuggestions = createAsyncThunk(
  'search/loadSuggestions',
  async (options: { query: string; limit?: number }) => {
    const response = await searchService.getSuggestions(options.query, options.limit);
    return response.data.suggestions;
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    
    setSearchType: (state, action: PayloadAction<'keyword' | 'vector' | 'hybrid'>) => {
      state.searchType = action.payload;
    },
    
    setSelectedEntities: (state, action: PayloadAction<string[]>) => {
      state.selectedEntities = action.payload;
    },
    
    toggleEntity: (state, action: PayloadAction<string>) => {
      const entity = action.payload;
      const index = state.selectedEntities.indexOf(entity);
      if (index === -1) {
        state.selectedEntities.push(entity);
      } else {
        state.selectedEntities.splice(index, 1);
      }
    },
    
    clearResults: (state) => {
      state.results = {};
      state.totalItems = 0;
      state.pagination = {
        limit: state.preferences.resultsPerPage,
        offset: 0,
        hasMore: false
      };
    },
    
    clearQuickResults: (state) => {
      state.quickResults = {};
      state.quickTotalItems = 0;
      state.quickHasMore = false;
    },
    
    clearSuggestions: (state) => {
      state.suggestions = [];
    },
    
    addToSearchHistory: (state, action: PayloadAction<string>) => {
      const query = action.payload.trim();
      if (query && !state.searchHistory.includes(query)) {
        state.searchHistory.unshift(query);
        // Keep only last 10 searches
        state.searchHistory = state.searchHistory.slice(0, 10);
      }
    },
    
    removeFromSearchHistory: (state, action: PayloadAction<string>) => {
      state.searchHistory = state.searchHistory.filter(q => q !== action.payload);
    },
    
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
    
    setPreferences: (state, action: PayloadAction<Partial<SearchState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Pagination actions
    setOffset: (state, action: PayloadAction<number>) => {
      state.pagination.offset = action.payload;
    },
    
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
    },
    
    nextPage: (state) => {
      state.pagination.offset += state.pagination.limit;
    },
    
    prevPage: (state) => {
      state.pagination.offset = Math.max(0, state.pagination.offset - state.pagination.limit);
    },
    
    resetPagination: (state) => {
      state.pagination.offset = 0;
    }
  },
  
  extraReducers: (builder) => {
    // Full search
    builder
      .addCase(performSearch.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.isSearching = false;
        state.results = action.payload.results;
        state.totalItems = action.payload.totalItems;
        state.pagination = action.payload.pagination;
        
        // Add to search history
        if (state.query.trim()) {
          const query = state.query.trim();
          if (!state.searchHistory.includes(query)) {
            state.searchHistory.unshift(query);
            state.searchHistory = state.searchHistory.slice(0, 10);
          }
        }
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.error.message || 'Search failed';
      })
      
      // Quick search
      .addCase(performQuickSearch.pending, (state) => {
        state.isQuickSearching = true;
        state.error = null;
      })
      .addCase(performQuickSearch.fulfilled, (state, action) => {
        state.isQuickSearching = false;
        state.quickResults = action.payload.results;
        state.quickTotalItems = action.payload.totalItems;
        state.quickHasMore = action.payload.hasMore;
      })
      .addCase(performQuickSearch.rejected, (state, action) => {
        state.isQuickSearching = false;
        state.error = action.error.message || 'Quick search failed';
      })
      
      // Suggestions
      .addCase(loadSuggestions.pending, (state) => {
        state.isLoadingSuggestions = true;
      })
      .addCase(loadSuggestions.fulfilled, (state, action) => {
        state.isLoadingSuggestions = false;
        state.suggestions = action.payload;
      })
      .addCase(loadSuggestions.rejected, (state) => {
        state.isLoadingSuggestions = false;
        state.suggestions = [];
      });
  }
});

export const {
  setQuery,
  setSearchType,
  setSelectedEntities,
  toggleEntity,
  clearResults,
  clearQuickResults,
  clearSuggestions,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  setPreferences,
  clearError,
  setOffset,
  setLimit,
  nextPage,
  prevPage,
  resetPagination
} = searchSlice.actions;

export default searchSlice.reducer;