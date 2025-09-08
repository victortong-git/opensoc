import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DashboardStats, SecurityEvent } from '../types';

interface DashboardState {
  stats: DashboardStats | null;
  recentEvents: SecurityEvent[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: DashboardState = {
  stats: null,
  recentEvents: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    fetchDashboardStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchDashboardSuccess: (state, action: PayloadAction<{
      stats: DashboardStats;
      recentEvents: SecurityEvent[];
    }>) => {
      state.isLoading = false;
      state.stats = action.payload.stats;
      state.recentEvents = action.payload.recentEvents;
      state.lastUpdated = new Date().toISOString();
    },
    fetchDashboardFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateStats: (state, action: PayloadAction<DashboardStats>) => {
      state.stats = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    addRecentEvent: (state, action: PayloadAction<SecurityEvent>) => {
      state.recentEvents.unshift(action.payload);
      // Keep only the 50 most recent events
      if (state.recentEvents.length > 50) {
        state.recentEvents = state.recentEvents.slice(0, 50);
      }
    },
  },
});

export const {
  fetchDashboardStart,
  fetchDashboardSuccess,
  fetchDashboardFailure,
  updateStats,
  addRecentEvent,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;