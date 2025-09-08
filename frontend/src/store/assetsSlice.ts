import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Asset, AssetFilter } from '../types';
import { 
  fetchAssets, 
  fetchAsset, 
  updateAsset, 
  createAsset, 
  deleteAsset,
  fetchAssetStats,
  fetchAssetsByIncident,
  fetchIncidentsByAsset,
  fetchAlertsByAsset
} from './assetsAsync';
import { 
  savePaginationPreferences, 
  loadPaginationPreferences, 
  PREFERENCE_KEYS 
} from '../utils/localStorage';

interface AssetsState {
  assets: Asset[];
  filteredAssets: Asset[];
  selectedAsset: Asset | null;
  isLoading: boolean;
  error: string | null;
  filters: AssetFilter;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: any;
  relatedIncidents: any[];
  relatedAlerts: any[];
}

// Load initial preferences from localStorage
const savedPreferences = loadPaginationPreferences('ASSETS');

const initialState: AssetsState = {
  assets: [],
  filteredAssets: [],
  selectedAsset: null,
  isLoading: false,
  error: null,
  filters: savedPreferences.filters || {},
  pagination: {
    currentPage: 1, // Always start at page 1 on app load
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: savedPreferences.pageSize,
    hasNext: false,
    hasPrev: false,
  },
  stats: null,
  relatedIncidents: [],
  relatedAlerts: [],
};

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    selectAsset: (state, action: PayloadAction<Asset>) => {
      state.selectedAsset = action.payload;
    },
    clearSelectedAsset: (state) => {
      state.selectedAsset = null;
      state.relatedIncidents = [];
      state.relatedAlerts = [];
    },
    setFilters: (state, action: PayloadAction<AssetFilter>) => {
      state.filters = action.payload;
      
      // Save filters to localStorage
      savePaginationPreferences('ASSETS', {
        filters: action.payload,
        currentPage: 1, // Reset to page 1 when filters change
      });
      
      // Reset to page 1 when filters change
      state.pagination.currentPage = 1;
      
      // Apply filters to current assets
      let filtered = state.assets;
      
      if (action.payload.assetType?.length) {
        filtered = filtered.filter(asset => action.payload.assetType!.includes(asset.assetType));
      }
      
      if (action.payload.status?.length) {
        filtered = filtered.filter(asset => action.payload.status!.includes(asset.status));
      }
      
      if (action.payload.criticality?.length) {
        filtered = filtered.filter(asset => action.payload.criticality!.includes(asset.criticality));
      }
      
      if (action.payload.location?.length) {
        filtered = filtered.filter(asset => action.payload.location!.includes(asset.location));
      }
      
      if (action.payload.search) {
        const search = action.payload.search.toLowerCase();
        filtered = filtered.filter(asset => 
          asset.name.toLowerCase().includes(search) ||
          asset.hostname.toLowerCase().includes(search) ||
          asset.ipAddress.toLowerCase().includes(search) ||
          asset.owner.toLowerCase().includes(search)
        );
      }
      
      state.filteredAssets = filtered;
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      state.pagination.currentPage = action.payload.page;
      state.pagination.itemsPerPage = action.payload.limit;
      
      // Save to localStorage
      savePaginationPreferences('ASSETS', {
        currentPage: action.payload.page,
        pageSize: action.payload.limit,
      });
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.itemsPerPage = action.payload;
      state.pagination.currentPage = 1; // Reset to page 1 when page size changes
      
      // Save to localStorage
      savePaginationPreferences('ASSETS', {
        pageSize: action.payload,
        currentPage: 1,
      });
    },
  },
  extraReducers: (builder) => {
    // Fetch assets
    builder
      .addCase(fetchAssets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assets = action.payload.assets;
        state.filteredAssets = action.payload.assets;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch assets';
      })
      
      // Fetch single asset
      .addCase(fetchAsset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedAsset = action.payload;
      })
      .addCase(fetchAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch asset';
      })
      
      // Update asset
      .addCase(updateAsset.fulfilled, (state, action) => {
        const index = state.assets.findIndex(asset => asset.id === action.payload.id);
        if (index !== -1) {
          state.assets[index] = action.payload;
        }
        const filteredIndex = state.filteredAssets.findIndex(asset => asset.id === action.payload.id);
        if (filteredIndex !== -1) {
          state.filteredAssets[filteredIndex] = action.payload;
        }
        if (state.selectedAsset?.id === action.payload.id) {
          state.selectedAsset = action.payload;
        }
      })
      
      // Create asset
      .addCase(createAsset.fulfilled, (state, action) => {
        state.assets.unshift(action.payload);
        state.filteredAssets.unshift(action.payload);
        state.pagination.totalItems += 1;
      })
      
      // Delete asset
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.assets = state.assets.filter(asset => asset.id !== action.payload);
        state.filteredAssets = state.filteredAssets.filter(asset => asset.id !== action.payload);
        state.pagination.totalItems -= 1;
        
        // Recalculate total pages after item removal
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.itemsPerPage);
        
        // If current page is now invalid (e.g., we deleted the last item on the last page), go to previous page
        if (state.pagination.currentPage > state.pagination.totalPages && state.pagination.totalPages > 0) {
          state.pagination.currentPage = state.pagination.totalPages;
          
          // Save the corrected pagination to localStorage
          savePaginationPreferences('ASSETS', {
            currentPage: state.pagination.currentPage,
            pageSize: state.pagination.itemsPerPage,
          });
        }
        
        // Update pagination flags
        state.pagination.hasNext = state.pagination.currentPage < state.pagination.totalPages;
        state.pagination.hasPrev = state.pagination.currentPage > 1;
        
        if (state.selectedAsset?.id === action.payload) {
          state.selectedAsset = null;
        }
      })
      
      // Fetch asset stats
      .addCase(fetchAssetStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      
      // Fetch related incidents
      .addCase(fetchIncidentsByAsset.fulfilled, (state, action) => {
        state.relatedIncidents = action.payload;
      })
      
      // Fetch related alerts
      .addCase(fetchAlertsByAsset.fulfilled, (state, action) => {
        state.relatedAlerts = action.payload;
      });
  },
});

export const {
  selectAsset,
  clearSelectedAsset,
  setFilters,
  setPagination,
  setPageSize,
} = assetsSlice.actions;

export default assetsSlice.reducer;