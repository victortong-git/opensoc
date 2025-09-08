import { createAsyncThunk } from '@reduxjs/toolkit';
import threatIntelService, { 
  IOCFilters, 
  CreateIOCRequest, 
  UpdateIOCRequest,
  SearchIOCRequest
} from '../services/threatIntelService';

/**
 * Fetch IOCs with optional filtering
 */
export const fetchIOCs = createAsyncThunk(
  'threatIntel/fetchIOCs',
  async (filters: IOCFilters | undefined, { rejectWithValue }) => {
    try {
      const response = await threatIntelService.getIOCs(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch IOCs');
    }
  }
);

/**
 * Fetch single IOC by ID
 */
export const fetchIOC = createAsyncThunk(
  'threatIntel/fetchIOC',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await threatIntelService.getIOC(id);
      return response.ioc;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch IOC');
    }
  }
);

/**
 * Create new IOC
 */
export const createIOC = createAsyncThunk(
  'threatIntel/createIOC',
  async (iocData: CreateIOCRequest, { rejectWithValue }) => {
    try {
      const response = await threatIntelService.createIOC(iocData);
      return response.ioc;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to create IOC');
    }
  }
);

/**
 * Create multiple IOCs in bulk
 */
export const createBulkIOCs = createAsyncThunk(
  'threatIntel/createBulkIOCs',
  async (iocs: CreateIOCRequest[], { rejectWithValue }) => {
    try {
      const response = await threatIntelService.createBulkIOCs(iocs);
      return response.iocs;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to create IOCs');
    }
  }
);

/**
 * Update IOC
 */
export const updateIOC = createAsyncThunk(
  'threatIntel/updateIOC',
  async ({ id, iocData }: { id: string; iocData: UpdateIOCRequest }, { rejectWithValue }) => {
    try {
      const response = await threatIntelService.updateIOC(id, iocData);
      return response.ioc;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to update IOC');
    }
  }
);

/**
 * Delete IOC
 */
export const deleteIOC = createAsyncThunk(
  'threatIntel/deleteIOC',
  async (id: string, { rejectWithValue }) => {
    try {
      await threatIntelService.deleteIOC(id);
      return id; // Return the ID for removal from state
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to delete IOC');
    }
  }
);

/**
 * Deactivate IOC
 */
export const deactivateIOC = createAsyncThunk(
  'threatIntel/deactivateIOC',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await threatIntelService.deactivateIOC(id);
      return response.ioc;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to deactivate IOC');
    }
  }
);

/**
 * Search IOCs by value patterns
 */
export const searchIOCs = createAsyncThunk(
  'threatIntel/searchIOCs',
  async (searchData: SearchIOCRequest, { rejectWithValue }) => {
    try {
      const response = await threatIntelService.searchIOCs(searchData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to search IOCs');
    }
  }
);

/**
 * Fetch IOC statistics
 */
export const fetchIOCStats = createAsyncThunk(
  'threatIntel/fetchIOCStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await threatIntelService.getIOCStats();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch IOC statistics');
    }
  }
);

/**
 * Fetch threat actors
 */
export const fetchThreatActors = createAsyncThunk(
  'threatIntel/fetchThreatActors',
  async (filters: { search?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await threatIntelService.getThreatActors(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch threat actors');
    }
  }
);

/**
 * Fetch campaigns
 */
export const fetchCampaigns = createAsyncThunk(
  'threatIntel/fetchCampaigns',
  async (filters: { search?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await threatIntelService.getCampaigns(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch campaigns');
    }
  }
);

/**
 * Fetch threat intelligence summary statistics
 */
export const fetchThreatIntelStats = createAsyncThunk(
  'threatIntel/fetchThreatIntelStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await threatIntelService.getThreatIntelStats();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch threat intelligence statistics');
    }
  }
);