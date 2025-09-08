import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IOC, IOCStats, ThreatActor, Campaign, SearchIOCResponse } from '../services/threatIntelService';
import { 
  savePaginationPreferences, 
  loadPaginationPreferences, 
  PREFERENCE_KEYS 
} from '../utils/localStorage';
import {
  fetchIOCs,
  fetchIOC,
  createIOC,
  createBulkIOCs,
  updateIOC,
  deleteIOC,
  deactivateIOC,
  searchIOCs,
  fetchIOCStats,
  fetchThreatActors,
  fetchCampaigns,
  fetchThreatIntelStats
} from './threatIntelAsync';

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ThreatIntelState {
  // IOCs data
  iocs: IOC[];
  currentIOC: IOC | null;
  iocsPagination: PaginationState | null;
  iocsLoading: boolean;
  iocsError: string | null;

  // IOC statistics
  iocStats: IOCStats | null;
  iocStatsLoading: boolean;
  iocStatsError: string | null;

  // Search results
  searchResults: SearchIOCResponse | null;
  searchLoading: boolean;
  searchError: string | null;

  // Threat actors
  threatActors: ThreatActor[];
  threatActorsPagination: PaginationState | null;
  threatActorsLoading: boolean;
  threatActorsError: string | null;

  // Campaigns
  campaigns: Campaign[];
  campaignsPagination: PaginationState | null;
  campaignsLoading: boolean;
  campaignsError: string | null;

  // Summary statistics
  summaryStats: {
    activeIOCs: number;
    threatActors: number;
    activeCampaigns: number;
    intelligenceFeeds: number;
  } | null;
  summaryStatsLoading: boolean;
  summaryStatsError: string | null;

  // UI State
  selectedIOCId: string | null;
  selectedThreatActorId: string | null;
  selectedCampaignId: string | null;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isImportModalOpen: boolean;
  isIOCDetailModalOpen: boolean;
  isThreatActorDetailModalOpen: boolean;
  isCampaignDetailModalOpen: boolean;
  
  // General loading state
  isLoading: boolean;
  error: string | null;
}

const initialPagination: PaginationState = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 20,
  hasNext: false,
  hasPrev: false,
};

// Load saved preferences from localStorage
const savedPreferences = loadPaginationPreferences('THREAT_INTEL');

const initialState: ThreatIntelState = {
  // IOCs data
  iocs: [],
  currentIOC: null,
  iocsPagination: {
    currentPage: savedPreferences.currentPage,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: savedPreferences.pageSize,
    hasNext: false,
    hasPrev: false,
  },
  iocsLoading: false,
  iocsError: null,

  // IOC statistics
  iocStats: null,
  iocStatsLoading: false,
  iocStatsError: null,

  // Search results
  searchResults: null,
  searchLoading: false,
  searchError: null,

  // Threat actors
  threatActors: [],
  threatActorsPagination: {
    currentPage: savedPreferences.currentPage,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: savedPreferences.pageSize,
    hasNext: false,
    hasPrev: false,
  },
  threatActorsLoading: false,
  threatActorsError: null,

  // Campaigns
  campaigns: [],
  campaignsPagination: {
    currentPage: savedPreferences.currentPage,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: savedPreferences.pageSize,
    hasNext: false,
    hasPrev: false,
  },
  campaignsLoading: false,
  campaignsError: null,

  // Summary statistics
  summaryStats: null,
  summaryStatsLoading: false,
  summaryStatsError: null,

  // UI State
  selectedIOCId: null,
  selectedThreatActorId: null,
  selectedCampaignId: null,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isImportModalOpen: false,
  isIOCDetailModalOpen: false,
  isThreatActorDetailModalOpen: false,
  isCampaignDetailModalOpen: false,
  
  // General state
  isLoading: false,
  error: null,
};

const threatIntelSlice = createSlice({
  name: 'threatIntel',
  initialState,
  reducers: {
    // UI actions
    setSelectedIOC: (state, action: PayloadAction<string | null>) => {
      state.selectedIOCId = action.payload;
    },
    setSelectedThreatActor: (state, action: PayloadAction<string | null>) => {
      state.selectedThreatActorId = action.payload;
    },
    setSelectedCampaign: (state, action: PayloadAction<string | null>) => {
      state.selectedCampaignId = action.payload;
    },
    openIOCDetailModal: (state) => {
      state.isIOCDetailModalOpen = true;
    },
    closeIOCDetailModal: (state) => {
      state.isIOCDetailModalOpen = false;
      state.selectedIOCId = null;
    },
    openThreatActorDetailModal: (state) => {
      state.isThreatActorDetailModalOpen = true;
    },
    closeThreatActorDetailModal: (state) => {
      state.isThreatActorDetailModalOpen = false;
      state.selectedThreatActorId = null;
    },
    openCampaignDetailModal: (state) => {
      state.isCampaignDetailModalOpen = true;
    },
    closeCampaignDetailModal: (state) => {
      state.isCampaignDetailModalOpen = false;
      state.selectedCampaignId = null;
    },
    openCreateModal: (state) => {
      state.isCreateModalOpen = true;
    },
    closeCreateModal: (state) => {
      state.isCreateModalOpen = false;
    },
    openEditModal: (state) => {
      state.isEditModalOpen = true;
    },
    closeEditModal: (state) => {
      state.isEditModalOpen = false;
    },
    openImportModal: (state) => {
      state.isImportModalOpen = true;
    },
    closeImportModal: (state) => {
      state.isImportModalOpen = false;
    },
    
    // Clear errors
    clearThreatIntelErrors: (state) => {
      state.iocsError = null;
      state.iocStatsError = null;
      state.searchError = null;
      state.threatActorsError = null;
      state.campaignsError = null;
      state.summaryStatsError = null;
      state.error = null;
    },
    
    // Set general error
    setThreatIntelError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Clear search results
    clearSearchResults: (state) => {
      state.searchResults = null;
      state.searchError = null;
    },

    // Pagination actions
    setIOCsPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      if (state.iocsPagination) {
        state.iocsPagination.currentPage = action.payload.page;
        state.iocsPagination.itemsPerPage = action.payload.limit;
      }
      // Save to localStorage
      savePaginationPreferences('THREAT_INTEL', {
        currentPage: action.payload.page,
        pageSize: action.payload.limit,
      });
    },

    setIOCsPageSize: (state, action: PayloadAction<number>) => {
      if (state.iocsPagination) {
        state.iocsPagination.itemsPerPage = action.payload;
        state.iocsPagination.currentPage = 1; // Reset to first page when changing page size
      }
      // Save to localStorage
      savePaginationPreferences('THREAT_INTEL', {
        pageSize: action.payload,
        currentPage: 1,
      });
    },

    setThreatActorsPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      if (state.threatActorsPagination) {
        state.threatActorsPagination.currentPage = action.payload.page;
        state.threatActorsPagination.itemsPerPage = action.payload.limit;
      }
      // Save to localStorage
      savePaginationPreferences('THREAT_INTEL', {
        currentPage: action.payload.page,
        pageSize: action.payload.limit,
      });
    },

    setThreatActorsPageSize: (state, action: PayloadAction<number>) => {
      if (state.threatActorsPagination) {
        state.threatActorsPagination.itemsPerPage = action.payload;
        state.threatActorsPagination.currentPage = 1; // Reset to first page when changing page size
      }
      // Save to localStorage
      savePaginationPreferences('THREAT_INTEL', {
        pageSize: action.payload,
        currentPage: 1,
      });
    },

    setCampaignsPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      if (state.campaignsPagination) {
        state.campaignsPagination.currentPage = action.payload.page;
        state.campaignsPagination.itemsPerPage = action.payload.limit;
      }
      // Save to localStorage
      savePaginationPreferences('THREAT_INTEL', {
        currentPage: action.payload.page,
        pageSize: action.payload.limit,
      });
    },

    setCampaignsPageSize: (state, action: PayloadAction<number>) => {
      if (state.campaignsPagination) {
        state.campaignsPagination.itemsPerPage = action.payload;
        state.campaignsPagination.currentPage = 1; // Reset to first page when changing page size
      }
      // Save to localStorage
      savePaginationPreferences('THREAT_INTEL', {
        pageSize: action.payload,
        currentPage: 1,
      });
    }
  },
  extraReducers: (builder) => {
    // Fetch IOCs
    builder
      .addCase(fetchIOCs.pending, (state) => {
        state.iocsLoading = true;
        state.iocsError = null;
        state.isLoading = true;
      })
      .addCase(fetchIOCs.fulfilled, (state, action) => {
        state.iocsLoading = false;
        state.iocs = action.payload.iocs;
        state.iocsPagination = action.payload.pagination;
        state.isLoading = false;
      })
      .addCase(fetchIOCs.rejected, (state, action) => {
        state.iocsLoading = false;
        state.iocsError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch Single IOC
    builder
      .addCase(fetchIOC.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIOC.fulfilled, (state, action) => {
        state.currentIOC = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchIOC.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Create IOC
    builder
      .addCase(createIOC.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createIOC.fulfilled, (state, action) => {
        state.iocs.push(action.payload);
        state.isCreateModalOpen = false;
        state.isLoading = false;
        // Update pagination count if we have it
        if (state.iocsPagination) {
          state.iocsPagination.totalItems += 1;
        }
      })
      .addCase(createIOC.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Create Bulk IOCs
    builder
      .addCase(createBulkIOCs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBulkIOCs.fulfilled, (state, action) => {
        state.iocs.push(...action.payload);
        state.isImportModalOpen = false;
        state.isLoading = false;
        // Update pagination count if we have it
        if (state.iocsPagination) {
          state.iocsPagination.totalItems += action.payload.length;
        }
      })
      .addCase(createBulkIOCs.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Update IOC
    builder
      .addCase(updateIOC.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateIOC.fulfilled, (state, action) => {
        const index = state.iocs.findIndex(ioc => ioc.id === action.payload.id);
        if (index !== -1) {
          state.iocs[index] = action.payload;
        }
        state.currentIOC = action.payload;
        state.isEditModalOpen = false;
        state.isLoading = false;
      })
      .addCase(updateIOC.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Delete IOC
    builder
      .addCase(deleteIOC.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteIOC.fulfilled, (state, action) => {
        state.iocs = state.iocs.filter(ioc => ioc.id !== action.payload);
        state.isLoading = false;
        // Update pagination count if we have it
        if (state.iocsPagination) {
          state.iocsPagination.totalItems -= 1;
        }
      })
      .addCase(deleteIOC.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Deactivate IOC
    builder
      .addCase(deactivateIOC.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deactivateIOC.fulfilled, (state, action) => {
        const index = state.iocs.findIndex(ioc => ioc.id === action.payload.id);
        if (index !== -1) {
          state.iocs[index] = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(deactivateIOC.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Search IOCs
    builder
      .addCase(searchIOCs.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
        state.isLoading = true;
      })
      .addCase(searchIOCs.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
        state.isLoading = false;
      })
      .addCase(searchIOCs.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch IOC Stats
    builder
      .addCase(fetchIOCStats.pending, (state) => {
        state.iocStatsLoading = true;
        state.iocStatsError = null;
        state.isLoading = true;
      })
      .addCase(fetchIOCStats.fulfilled, (state, action) => {
        state.iocStatsLoading = false;
        state.iocStats = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchIOCStats.rejected, (state, action) => {
        state.iocStatsLoading = false;
        state.iocStatsError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch Threat Actors
    builder
      .addCase(fetchThreatActors.pending, (state) => {
        state.threatActorsLoading = true;
        state.threatActorsError = null;
        state.isLoading = true;
      })
      .addCase(fetchThreatActors.fulfilled, (state, action) => {
        state.threatActorsLoading = false;
        state.threatActors = action.payload.actors;
        state.threatActorsPagination = action.payload.pagination;
        state.isLoading = false;
      })
      .addCase(fetchThreatActors.rejected, (state, action) => {
        state.threatActorsLoading = false;
        state.threatActorsError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch Campaigns
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.campaignsLoading = true;
        state.campaignsError = null;
        state.isLoading = true;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.campaignsLoading = false;
        state.campaigns = action.payload.campaigns;
        state.campaignsPagination = action.payload.pagination;
        state.isLoading = false;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.campaignsLoading = false;
        state.campaignsError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch Threat Intel Summary Stats
    builder
      .addCase(fetchThreatIntelStats.pending, (state) => {
        state.summaryStatsLoading = true;
        state.summaryStatsError = null;
        state.isLoading = true;
      })
      .addCase(fetchThreatIntelStats.fulfilled, (state, action) => {
        state.summaryStatsLoading = false;
        state.summaryStats = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchThreatIntelStats.rejected, (state, action) => {
        state.summaryStatsLoading = false;
        state.summaryStatsError = action.payload as string;
        state.isLoading = false;
      });
  }
});

export const { 
  setSelectedIOC,
  setSelectedThreatActor,
  setSelectedCampaign,
  openIOCDetailModal,
  closeIOCDetailModal,
  openThreatActorDetailModal,
  closeThreatActorDetailModal,
  openCampaignDetailModal,
  closeCampaignDetailModal,
  openCreateModal,
  closeCreateModal,
  openEditModal,
  closeEditModal,
  openImportModal,
  closeImportModal,
  clearThreatIntelErrors,
  setThreatIntelError,
  clearSearchResults,
  setIOCsPagination,
  setIOCsPageSize,
  setThreatActorsPagination,
  setThreatActorsPageSize,
  setCampaignsPagination,
  setCampaignsPageSize
} = threatIntelSlice.actions;

export default threatIntelSlice.reducer;