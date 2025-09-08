import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Alert, AlertFilter } from '../types';
import { 
  fetchAlerts, 
  fetchAlert, 
  updateAlert,
  bulkUpdateAlerts,
  resolveAlert,
  escalateAlert,
  createAlert,
  deleteAlert,
  fetchAlertStats
} from './alertsAsync';
import { 
  savePaginationPreferences, 
  loadPaginationPreferences
} from '../utils/localStorage';

interface AlertsState {
  alerts: Alert[];
  filteredAlerts: Alert[];
  selectedAlert: Alert | null;
  isLoading: boolean;
  error: string | null;
  filters: AlertFilter;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: any;
}

// Load initial preferences from localStorage
const savedPreferences = loadPaginationPreferences('ALERTS');

const initialState: AlertsState = {
  alerts: [],
  filteredAlerts: [],
  selectedAlert: null,
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
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<AlertFilter>) => {
      state.filters = action.payload;
      
      // Save filters to localStorage
      savePaginationPreferences('ALERTS', {
        filters: action.payload,
        currentPage: 1, // Reset to page 1 when filters change
      });
      
      // Reset to page 1 when filters change
      state.pagination.currentPage = 1;
    },
    clearError: (state) => {
      state.error = null;
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      state.pagination.currentPage = action.payload.page;
      state.pagination.itemsPerPage = action.payload.limit;
      
      // Save to localStorage
      savePaginationPreferences('ALERTS', {
        currentPage: action.payload.page,
        pageSize: action.payload.limit,
      });
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.itemsPerPage = action.payload;
      state.pagination.currentPage = 1; // Reset to page 1 when page size changes
      
      // Save to localStorage
      savePaginationPreferences('ALERTS', {
        pageSize: action.payload,
        currentPage: 1,
      });
    },
    fetchAlertsSuccess: (state, action: PayloadAction<Alert[]>) => {
      state.alerts = action.payload;
      state.filteredAlerts = action.payload;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch alerts
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = action.payload.alerts;
        state.filteredAlerts = action.payload.alerts;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch alerts';
      })

    // Fetch single alert
    builder
      .addCase(fetchAlert.fulfilled, (state, action) => {
        state.selectedAlert = action.payload;
        
        // Also update the alert in the main alerts list to ensure data consistency
        const index = state.alerts.findIndex(alert => alert.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
        }
        
        // Update in filtered alerts as well
        const filteredIndex = state.filteredAlerts.findIndex(alert => alert.id === action.payload.id);
        if (filteredIndex !== -1) {
          state.filteredAlerts[filteredIndex] = action.payload;
        }
      })

    // Update alert
    builder
      .addCase(updateAlert.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(alert => alert.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
          const filteredIndex = state.filteredAlerts.findIndex(alert => alert.id === action.payload.id);
          if (filteredIndex !== -1) {
            state.filteredAlerts[filteredIndex] = action.payload;
          }
        }
      })

    // Bulk update alerts
    builder
      .addCase(bulkUpdateAlerts.fulfilled, (state, action) => {
        const { alertIds, updates } = action.payload;
        alertIds.forEach(alertId => {
          const alertIndex = state.alerts.findIndex(alert => alert.id === alertId);
          if (alertIndex !== -1) {
            state.alerts[alertIndex] = { ...state.alerts[alertIndex], ...updates };
          }
          
          const filteredIndex = state.filteredAlerts.findIndex(alert => alert.id === alertId);
          if (filteredIndex !== -1) {
            state.filteredAlerts[filteredIndex] = { ...state.filteredAlerts[filteredIndex], ...updates };
          }
        });
      })

    // Create alert
    builder
      .addCase(createAlert.fulfilled, (state, action) => {
        state.alerts.unshift(action.payload);
        state.filteredAlerts.unshift(action.payload);
        state.pagination.totalItems += 1;
      })

    // Delete alert
    builder
      .addCase(deleteAlert.fulfilled, (state, action) => {
        state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
        state.filteredAlerts = state.filteredAlerts.filter(alert => alert.id !== action.payload);
        state.pagination.totalItems -= 1;
      })

    // Resolve alert
    builder
      .addCase(resolveAlert.fulfilled, (state, action) => {
        const resolvedAlert = action.payload.alert;
        const index = state.alerts.findIndex(alert => alert.id === resolvedAlert.id);
        if (index !== -1) {
          state.alerts[index] = resolvedAlert;
          const filteredIndex = state.filteredAlerts.findIndex(alert => alert.id === resolvedAlert.id);
          if (filteredIndex !== -1) {
            state.filteredAlerts[filteredIndex] = resolvedAlert;
          }
        }
      })

    // Escalate alert
    builder
      .addCase(escalateAlert.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(alert => alert.id === action.payload.alert.id);
        if (index !== -1) {
          state.alerts[index] = action.payload.alert;
          const filteredIndex = state.filteredAlerts.findIndex(alert => alert.id === action.payload.alert.id);
          if (filteredIndex !== -1) {
            state.filteredAlerts[filteredIndex] = action.payload.alert;
          }
        }
      })

    // Fetch alert stats
    builder
      .addCase(fetchAlertStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const {
  setFilters,
  clearError,
  setPagination,
  setPageSize,
  fetchAlertsSuccess,
} = alertsSlice.actions;

export default alertsSlice.reducer;