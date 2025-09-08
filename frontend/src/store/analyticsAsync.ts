import { createAsyncThunk } from '@reduxjs/toolkit';
import analyticsService, { 
  AlertTrendParams, 
  SecurityComparisonParams 
} from '../services/analyticsService';
import threatIntelService from '../services/threatIntelService';

/**
 * Fetch comprehensive dashboard metrics
 */
export const fetchDashboardMetrics = createAsyncThunk(
  'analytics/fetchDashboardMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getDashboardMetrics();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch dashboard metrics');
    }
  }
);

/**
 * Fetch alert trends with optional parameters
 */
export const fetchAlertTrends = createAsyncThunk(
  'analytics/fetchAlertTrends', 
  async (params: AlertTrendParams | undefined, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getAlertTrends(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch alert trends');
    }
  }
);

/**
 * Fetch security metrics comparison
 */
export const fetchSecurityComparison = createAsyncThunk(
  'analytics/fetchSecurityComparison',
  async (params: SecurityComparisonParams | undefined, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getSecurityComparison(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch security comparison');
    }
  }
);

/**
 * Fetch real threat intelligence statistics
 */
export const fetchThreatIntelStats = createAsyncThunk(
  'analytics/fetchThreatIntelStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await threatIntelService.getIOCStats();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch threat intelligence statistics');
    }
  }
);

/**
 * Fetch performance metrics including MTTR and system health
 */
export const fetchPerformanceMetrics = createAsyncThunk(
  'analytics/fetchPerformanceMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getPerformanceMetrics();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch performance metrics');
    }
  }
);