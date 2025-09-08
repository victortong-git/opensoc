import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  // New simplified interfaces
  ThreatHunt, 
  ThreatHuntTTP, 
  ThreatHuntReport, 
  HuntTypes,
  // Legacy interfaces for backwards compatibility
  ThreatHuntingEvent, 
  ThreatHuntingStats, 
  Asset, 
  MitreTechnique 
} from '../services/threatHuntingService';

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ThreatHuntingState {
  // === NEW SIMPLIFIED THREAT HUNTS ===
  // Professional threat hunts (new schema)
  hunts: ThreatHunt[];
  selectedHunt: ThreatHunt | null;
  huntTypes: HuntTypes | null;
  
  // TTP management
  huntTTPs: { [huntId: string]: ThreatHuntTTP[] };
  selectedHuntTTPs: ThreatHuntTTP[];
  
  // Professional reports
  huntReports: { [huntId: string]: ThreatHuntReport[] };
  selectedHuntReports: ThreatHuntReport[];
  
  // Loading states for new features
  huntsLoading: boolean;
  huntLoading: boolean;
  huntTypesLoading: boolean;
  ttpsLoading: boolean;
  reportsLoading: boolean;
  
  // === LEGACY THREAT HUNTING EVENTS ===
  // Legacy events (backwards compatibility)
  events: ThreatHuntingEvent[];
  selectedEvent: ThreatHuntingEvent | null;
  
  // Legacy loading states
  eventsLoading: boolean;
  eventLoading: boolean;
  statsLoading: boolean;
  assetsLoading: boolean;
  techniquesLoading: boolean;
  
  // === SHARED STATE ===
  // Pagination (works for both hunts and events)
  pagination: PaginationState | null;
  
  // Filters (enhanced for new schema)
  filters: {
    search: string;
    status: string;
    priority: string;
    huntingType: string; // legacy field
    huntType: string; // new field
    hunterId: string;
    confidence: string;
    severity: string;
    startDate: string;
    endDate: string;
    sourceIntelType: string; // new field
    aiEnhanced: string; // new field
  };
  
  // Sort
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Statistics
  stats: ThreatHuntingStats | null;
  
  // Supporting data
  availableAssets: Asset[];
  availableTechniques: MitreTechnique[];
  
  // UI state
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDetailModalOpen: boolean;
  isCloneModalOpen: boolean;
  
  // New UI state for enhanced features
  isTTPModalOpen: boolean;
  isReportModalOpen: boolean;
  currentView: 'hunts' | 'events'; // Toggle between new and legacy views
  
  // Error handling
  error: string | null;
}

const initialState: ThreatHuntingState = {
  // === NEW SIMPLIFIED THREAT HUNTS ===
  hunts: [],
  selectedHunt: null,
  huntTypes: null,
  huntTTPs: {},
  selectedHuntTTPs: [],
  huntReports: {},
  selectedHuntReports: [],
  huntsLoading: false,
  huntLoading: false,
  huntTypesLoading: false,
  ttpsLoading: false,
  reportsLoading: false,
  
  // === LEGACY THREAT HUNTING EVENTS ===
  events: [],
  selectedEvent: null,
  eventsLoading: false,
  eventLoading: false,
  statsLoading: false,
  assetsLoading: false,
  techniquesLoading: false,
  
  // === SHARED STATE ===
  pagination: null,
  filters: {
    search: '',
    status: '',
    priority: '',
    huntingType: '', // legacy
    huntType: '', // new
    hunterId: '',
    confidence: '',
    severity: '',
    startDate: '',
    endDate: '',
    sourceIntelType: '', // new
    aiEnhanced: '', // new
  },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  stats: null,
  availableAssets: [],
  availableTechniques: [],
  
  // UI state
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDetailModalOpen: false,
  isCloneModalOpen: false,
  isTTPModalOpen: false,
  isReportModalOpen: false,
  currentView: 'hunts', // Default to new hunts view
  
  error: null,
};

const threatHuntingSlice = createSlice({
  name: 'threatHunting',
  initialState,
  reducers: {
    // === NEW HUNT MANAGEMENT ===
    
    // Loading states for new features
    setHuntsLoading: (state, action: PayloadAction<boolean>) => {
      state.huntsLoading = action.payload;
    },
    setHuntLoading: (state, action: PayloadAction<boolean>) => {
      state.huntLoading = action.payload;
    },
    setHuntTypesLoading: (state, action: PayloadAction<boolean>) => {
      state.huntTypesLoading = action.payload;
    },
    setTTPsLoading: (state, action: PayloadAction<boolean>) => {
      state.ttpsLoading = action.payload;
    },
    setReportsLoading: (state, action: PayloadAction<boolean>) => {
      state.reportsLoading = action.payload;
    },
    
    // Hunt types management
    setHuntTypes: (state, action: PayloadAction<HuntTypes>) => {
      state.huntTypes = action.payload;
    },
    
    // Hunts management (new simplified API)
    setHunts: (state, action: PayloadAction<ThreatHunt[]>) => {
      state.hunts = action.payload;
    },
    addHunt: (state, action: PayloadAction<ThreatHunt>) => {
      state.hunts.unshift(action.payload);
      if (state.pagination) {
        state.pagination.totalItems += 1;
      }
    },
    updateHunt: (state, action: PayloadAction<ThreatHunt>) => {
      const index = state.hunts.findIndex(hunt => hunt.id === action.payload.id);
      if (index !== -1) {
        state.hunts[index] = action.payload;
      }
      if (state.selectedHunt?.id === action.payload.id) {
        state.selectedHunt = action.payload;
      }
    },
    removeHunt: (state, action: PayloadAction<string>) => {
      state.hunts = state.hunts.filter(hunt => hunt.id !== action.payload);
      if (state.pagination) {
        state.pagination.totalItems -= 1;
      }
      if (state.selectedHunt?.id === action.payload) {
        state.selectedHunt = null;
      }
      // Clean up associated TTPs and reports
      delete state.huntTTPs[action.payload];
      delete state.huntReports[action.payload];
    },
    setSelectedHunt: (state, action: PayloadAction<ThreatHunt | null>) => {
      state.selectedHunt = action.payload;
    },
    
    // TTP management
    setHuntTTPs: (state, action: PayloadAction<{ huntId: string; ttps: ThreatHuntTTP[] }>) => {
      state.huntTTPs[action.payload.huntId] = action.payload.ttps;
    },
    setSelectedHuntTTPs: (state, action: PayloadAction<ThreatHuntTTP[]>) => {
      state.selectedHuntTTPs = action.payload;
    },
    addHuntTTPs: (state, action: PayloadAction<{ huntId: string; ttps: ThreatHuntTTP[] }>) => {
      if (!state.huntTTPs[action.payload.huntId]) {
        state.huntTTPs[action.payload.huntId] = [];
      }
      state.huntTTPs[action.payload.huntId].push(...action.payload.ttps);
    },
    
    // Report management
    setHuntReports: (state, action: PayloadAction<{ huntId: string; reports: ThreatHuntReport[] }>) => {
      state.huntReports[action.payload.huntId] = action.payload.reports;
    },
    setSelectedHuntReports: (state, action: PayloadAction<ThreatHuntReport[]>) => {
      state.selectedHuntReports = action.payload;
    },
    addHuntReport: (state, action: PayloadAction<{ huntId: string; report: ThreatHuntReport }>) => {
      if (!state.huntReports[action.payload.huntId]) {
        state.huntReports[action.payload.huntId] = [];
      }
      state.huntReports[action.payload.huntId].unshift(action.payload.report);
    },
    
    // === LEGACY EVENT MANAGEMENT ===
    
    // Legacy loading states
    setEventsLoading: (state, action: PayloadAction<boolean>) => {
      state.eventsLoading = action.payload;
    },
    setEventLoading: (state, action: PayloadAction<boolean>) => {
      state.eventLoading = action.payload;
    },
    setStatsLoading: (state, action: PayloadAction<boolean>) => {
      state.statsLoading = action.payload;
    },
    setAssetsLoading: (state, action: PayloadAction<boolean>) => {
      state.assetsLoading = action.payload;
    },
    setTechniquesLoading: (state, action: PayloadAction<boolean>) => {
      state.techniquesLoading = action.payload;
    },
    
    // Legacy events management
    setEvents: (state, action: PayloadAction<ThreatHuntingEvent[]>) => {
      state.events = action.payload;
    },
    addEvent: (state, action: PayloadAction<ThreatHuntingEvent>) => {
      state.events.unshift(action.payload);
      if (state.pagination) {
        state.pagination.totalItems += 1;
      }
    },
    updateEvent: (state, action: PayloadAction<ThreatHuntingEvent>) => {
      const index = state.events.findIndex(event => event.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
      if (state.selectedEvent?.id === action.payload.id) {
        state.selectedEvent = action.payload;
      }
    },
    removeEvent: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter(event => event.id !== action.payload);
      if (state.pagination) {
        state.pagination.totalItems -= 1;
      }
      if (state.selectedEvent?.id === action.payload) {
        state.selectedEvent = null;
      }
    },
    setSelectedEvent: (state, action: PayloadAction<ThreatHuntingEvent | null>) => {
      state.selectedEvent = action.payload;
    },
    
    // Pagination
    setPagination: (state, action: PayloadAction<PaginationState>) => {
      state.pagination = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      if (state.pagination) {
        state.pagination.currentPage = action.payload;
      }
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      if (state.pagination) {
        state.pagination.itemsPerPage = action.payload;
        state.pagination.currentPage = 1; // Reset to first page
      }
    },
    
    // Filters
    setFilters: (state, action: PayloadAction<Partial<ThreatHuntingState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    
    // Sort
    setSort: (state, action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    
    // Statistics
    setStats: (state, action: PayloadAction<ThreatHuntingStats>) => {
      state.stats = action.payload;
    },
    
    // Supporting data
    setAvailableAssets: (state, action: PayloadAction<Asset[]>) => {
      state.availableAssets = action.payload;
    },
    setAvailableTechniques: (state, action: PayloadAction<MitreTechnique[]>) => {
      state.availableTechniques = action.payload;
    },
    
    // View management
    setCurrentView: (state, action: PayloadAction<'hunts' | 'events'>) => {
      state.currentView = action.payload;
    },
    
    // Modal states (existing)
    openCreateModal: (state) => {
      state.isCreateModalOpen = true;
      state.selectedEvent = null;
      state.selectedHunt = null;
    },
    closeCreateModal: (state) => {
      state.isCreateModalOpen = false;
      state.selectedEvent = null;
      state.selectedHunt = null;
    },
    openEditModal: (state) => {
      state.isEditModalOpen = true;
    },
    closeEditModal: (state) => {
      state.isEditModalOpen = false;
      state.selectedEvent = null;
      state.selectedHunt = null;
    },
    openDetailModal: (state) => {
      state.isDetailModalOpen = true;
    },
    closeDetailModal: (state) => {
      state.isDetailModalOpen = false;
    },
    openCloneModal: (state) => {
      state.isCloneModalOpen = true;
    },
    closeCloneModal: (state) => {
      state.isCloneModalOpen = false;
    },
    
    // New modal states for enhanced features
    openTTPModal: (state) => {
      state.isTTPModalOpen = true;
    },
    closeTTPModal: (state) => {
      state.isTTPModalOpen = false;
      state.selectedHuntTTPs = [];
    },
    openReportModal: (state) => {
      state.isReportModalOpen = true;
    },
    closeReportModal: (state) => {
      state.isReportModalOpen = false;
      state.selectedHuntReports = [];
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset state
    resetState: () => initialState,
  },
});

export const {
  // === NEW HUNT MANAGEMENT ACTIONS ===
  
  // Loading states for new features
  setHuntsLoading,
  setHuntLoading,
  setHuntTypesLoading,
  setTTPsLoading,
  setReportsLoading,
  
  // Hunt types management
  setHuntTypes,
  
  // Hunts management (new simplified API)
  setHunts,
  addHunt,
  updateHunt,
  removeHunt,
  setSelectedHunt,
  
  // TTP management
  setHuntTTPs,
  setSelectedHuntTTPs,
  addHuntTTPs,
  
  // Report management
  setHuntReports,
  setSelectedHuntReports,
  addHuntReport,
  
  // === LEGACY ACTIONS (BACKWARDS COMPATIBILITY) ===
  
  // Legacy loading states
  setEventsLoading,
  setEventLoading,
  setStatsLoading,
  setAssetsLoading,
  setTechniquesLoading,
  
  // Legacy events management
  setEvents,
  addEvent,
  updateEvent,
  removeEvent,
  setSelectedEvent,
  
  // === SHARED ACTIONS ===
  
  // Pagination
  setPagination,
  setPage,
  setPageSize,
  
  // Filters
  setFilters,
  resetFilters,
  setSearch,
  
  // Sort
  setSort,
  
  // Statistics
  setStats,
  
  // Supporting data
  setAvailableAssets,
  setAvailableTechniques,
  
  // View management
  setCurrentView,
  
  // Modal states (existing)
  openCreateModal,
  closeCreateModal,
  openEditModal,
  closeEditModal,
  openDetailModal,
  closeDetailModal,
  openCloneModal,
  closeCloneModal,
  
  // New modal states
  openTTPModal,
  closeTTPModal,
  openReportModal,
  closeReportModal,
  
  // Error handling
  setError,
  clearError,
  
  // Reset state
  resetState,
} = threatHuntingSlice.actions;

export default threatHuntingSlice.reducer;