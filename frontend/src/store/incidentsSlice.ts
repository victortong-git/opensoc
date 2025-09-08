import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Incident, IncidentFilter } from '../types';
import { fetchIncidents, deleteIncident } from './incidentsAsync';
import { 
  savePaginationPreferences, 
  loadPaginationPreferences, 
  PREFERENCE_KEYS 
} from '../utils/localStorage';

interface IncidentsState {
  incidents: Incident[];
  filteredIncidents: Incident[];
  selectedIncident: Incident | null;
  isLoading: boolean;
  error: string | null;
  filters: IncidentFilter;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Load initial preferences from localStorage
const savedPreferences = loadPaginationPreferences('INCIDENTS');

const initialState: IncidentsState = {
  incidents: [],
  filteredIncidents: [],
  selectedIncident: null,
  isLoading: false,
  error: null,
  filters: savedPreferences.filters || {},
  pagination: {
    page: 1, // Always start at page 1 on app load
    limit: savedPreferences.pageSize,
    total: 0,
  },
};

const incidentsSlice = createSlice({
  name: 'incidents',
  initialState,
  reducers: {
    fetchIncidentsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchIncidentsSuccess: (state, action: PayloadAction<Incident[]>) => {
      state.isLoading = false;
      state.incidents = action.payload;
      state.filteredIncidents = action.payload;
      state.pagination.total = action.payload.length;
    },
    fetchIncidentsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    selectIncident: (state, action: PayloadAction<Incident>) => {
      state.selectedIncident = action.payload;
    },
    clearSelectedIncident: (state) => {
      state.selectedIncident = null;
    },
    updateIncident: (state, action: PayloadAction<Incident>) => {
      const index = state.incidents.findIndex(incident => incident.id === action.payload.id);
      if (index !== -1) {
        state.incidents[index] = action.payload;
        // Update filtered incidents as well
        const filteredIndex = state.filteredIncidents.findIndex(incident => incident.id === action.payload.id);
        if (filteredIndex !== -1) {
          state.filteredIncidents[filteredIndex] = action.payload;
        }
      }
      // Update selected incident if it's the same one
      if (state.selectedIncident?.id === action.payload.id) {
        state.selectedIncident = action.payload;
      }
    },
    addIncident: (state, action: PayloadAction<Incident>) => {
      state.incidents.unshift(action.payload);
      state.filteredIncidents.unshift(action.payload);
      state.pagination.total += 1;
    },
    setFilters: (state, action: PayloadAction<IncidentFilter>) => {
      state.filters = action.payload;
      
      // Save filters to localStorage
      savePaginationPreferences('INCIDENTS', {
        filters: action.payload,
        currentPage: 1, // Reset to page 1 when filters change
      });
      
      // Apply filters
      let filtered = state.incidents;
      
      if (action.payload.severity?.length) {
        filtered = filtered.filter(incident => action.payload.severity!.includes(incident.severity));
      }
      
      if (action.payload.status?.length) {
        filtered = filtered.filter(incident => action.payload.status!.includes(incident.status));
      }
      
      if (action.payload.category?.length) {
        filtered = filtered.filter(incident => action.payload.category!.includes(incident.category));
      }
      
      if (action.payload.assignedTo?.length) {
        filtered = filtered.filter(incident => action.payload.assignedTo!.includes(incident.assignedTo));
      }
      
      if (action.payload.search) {
        const search = action.payload.search.toLowerCase();
        filtered = filtered.filter(incident => 
          incident.title.toLowerCase().includes(search) ||
          incident.description.toLowerCase().includes(search) ||
          incident.assignedToName.toLowerCase().includes(search)
        );
      }
      
      state.filteredIncidents = filtered;
      state.pagination.total = filtered.length;
      state.pagination.page = 1;
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      state.pagination.page = action.payload.page;
      state.pagination.limit = action.payload.limit;
      
      // Save to localStorage
      savePaginationPreferences('INCIDENTS', {
        currentPage: action.payload.page,
        pageSize: action.payload.limit,
      });
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to page 1 when page size changes
      
      // Save to localStorage
      savePaginationPreferences('INCIDENTS', {
        pageSize: action.payload,
        currentPage: 1,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncidents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIncidents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.incidents = action.payload.incidents || action.payload;
        state.filteredIncidents = action.payload.incidents || action.payload;
        state.pagination = {
          page: action.payload.pagination?.currentPage || 1,
          limit: action.payload.pagination?.itemsPerPage || state.pagination.limit,
          total: action.payload.pagination?.totalItems || (action.payload.incidents || action.payload).length,
        };
      })
      .addCase(fetchIncidents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch incidents';
      })
      .addCase(deleteIncident.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteIncident.fulfilled, (state, action) => {
        state.isLoading = false;
        const incidentId = action.payload;
        state.incidents = state.incidents.filter(incident => incident.id !== incidentId);
        state.filteredIncidents = state.filteredIncidents.filter(incident => incident.id !== incidentId);
        state.pagination.total -= 1;
        // Clear selected incident if it's the one being deleted
        if (state.selectedIncident?.id === incidentId) {
          state.selectedIncident = null;
        }
      })
      .addCase(deleteIncident.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete incident';
      });
  },
});

export const {
  fetchIncidentsStart,
  fetchIncidentsSuccess,
  fetchIncidentsFailure,
  selectIncident,
  clearSelectedIncident,
  updateIncident,
  addIncident,
  setFilters,
  setPagination,
  setPageSize,
} = incidentsSlice.actions;

export default incidentsSlice.reducer;