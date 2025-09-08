import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  DashboardMetrics, 
  AlertTrends, 
  SecurityComparison,
  PerformanceMetrics 
} from '../services/analyticsService';
import { IOCStats } from '../services/threatIntelService';
import {
  fetchDashboardMetrics,
  fetchAlertTrends,
  fetchSecurityComparison,
  fetchThreatIntelStats,
  fetchPerformanceMetrics
} from './analyticsAsync';

interface AnalyticsState {
  // Dashboard metrics
  dashboardMetrics: DashboardMetrics | null;
  dashboardMetricsLoading: boolean;
  dashboardMetricsError: string | null;

  // Alert trends
  alertTrends: AlertTrends | null;
  alertTrendsLoading: boolean;
  alertTrendsError: string | null;

  // Security comparison
  securityComparison: SecurityComparison | null;
  securityComparisonLoading: boolean;
  securityComparisonError: string | null;

  // Threat intelligence stats
  threatIntelStats: IOCStats | null;
  threatIntelStatsLoading: boolean;
  threatIntelStatsError: string | null;

  // Performance metrics
  performanceMetrics: PerformanceMetrics | null;
  performanceMetricsLoading: boolean;
  performanceMetricsError: string | null;

  // General loading state
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  // Dashboard metrics
  dashboardMetrics: null,
  dashboardMetricsLoading: false,
  dashboardMetricsError: null,

  // Alert trends
  alertTrends: null,
  alertTrendsLoading: false,
  alertTrendsError: null,

  // Security comparison
  securityComparison: null,
  securityComparisonLoading: false,
  securityComparisonError: null,

  // Threat intelligence stats
  threatIntelStats: null,
  threatIntelStatsLoading: false,
  threatIntelStatsError: null,

  // Performance metrics
  performanceMetrics: null,
  performanceMetricsLoading: false,
  performanceMetricsError: null,

  // General state
  isLoading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalyticsErrors: (state) => {
      state.dashboardMetricsError = null;
      state.alertTrendsError = null;
      state.securityComparisonError = null;
      state.threatIntelStatsError = null;
      state.performanceMetricsError = null;
      state.error = null;
    },
    setAnalyticsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    // Dashboard Metrics
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.dashboardMetricsLoading = true;
        state.dashboardMetricsError = null;
        state.isLoading = true;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.dashboardMetricsLoading = false;
        state.dashboardMetrics = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.dashboardMetricsLoading = false;
        state.dashboardMetricsError = action.payload as string;
        state.isLoading = false;
      });

    // Alert Trends
    builder
      .addCase(fetchAlertTrends.pending, (state) => {
        state.alertTrendsLoading = true;
        state.alertTrendsError = null;
        state.isLoading = true;
      })
      .addCase(fetchAlertTrends.fulfilled, (state, action) => {
        state.alertTrendsLoading = false;
        state.alertTrends = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchAlertTrends.rejected, (state, action) => {
        state.alertTrendsLoading = false;
        state.alertTrendsError = action.payload as string;
        state.isLoading = false;
      });

    // Security Comparison
    builder
      .addCase(fetchSecurityComparison.pending, (state) => {
        state.securityComparisonLoading = true;
        state.securityComparisonError = null;
        state.isLoading = true;
      })
      .addCase(fetchSecurityComparison.fulfilled, (state, action) => {
        state.securityComparisonLoading = false;
        state.securityComparison = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchSecurityComparison.rejected, (state, action) => {
        state.securityComparisonLoading = false;
        state.securityComparisonError = action.payload as string;
        state.isLoading = false;
      });

    // Threat Intelligence Stats
    builder
      .addCase(fetchThreatIntelStats.pending, (state) => {
        state.threatIntelStatsLoading = true;
        state.threatIntelStatsError = null;
      })
      .addCase(fetchThreatIntelStats.fulfilled, (state, action) => {
        state.threatIntelStatsLoading = false;
        state.threatIntelStats = action.payload;
      })
      .addCase(fetchThreatIntelStats.rejected, (state, action) => {
        state.threatIntelStatsLoading = false;
        state.threatIntelStatsError = action.payload as string;
      });

    // Performance Metrics
    builder
      .addCase(fetchPerformanceMetrics.pending, (state) => {
        state.performanceMetricsLoading = true;
        state.performanceMetricsError = null;
      })
      .addCase(fetchPerformanceMetrics.fulfilled, (state, action) => {
        state.performanceMetricsLoading = false;
        state.performanceMetrics = action.payload;
      })
      .addCase(fetchPerformanceMetrics.rejected, (state, action) => {
        state.performanceMetricsLoading = false;
        state.performanceMetricsError = action.payload as string;
      });
  }
});

export const { clearAnalyticsErrors, setAnalyticsError } = analyticsSlice.actions;
export default analyticsSlice.reducer;