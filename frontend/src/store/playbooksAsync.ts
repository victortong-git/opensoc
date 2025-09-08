import { createAsyncThunk } from '@reduxjs/toolkit';
import playbooksService, { 
  PlaybookFilters,
  CreatePlaybookRequest,
  UpdatePlaybookRequest
} from '../services/playbooksService';

/**
 * Fetch playbooks with filtering and pagination
 */
export const fetchPlaybooks = createAsyncThunk(
  'playbooks/fetchPlaybooks',
  async (filters: PlaybookFilters | undefined, { rejectWithValue }) => {
    try {
      const response = await playbooksService.getPlaybooks(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch playbooks');
    }
  }
);

/**
 * Fetch single playbook by ID
 */
export const fetchPlaybook = createAsyncThunk(
  'playbooks/fetchPlaybook',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await playbooksService.getPlaybook(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch playbook');
    }
  }
);

/**
 * Create new playbook
 */
export const createPlaybook = createAsyncThunk(
  'playbooks/createPlaybook',
  async (playbookData: CreatePlaybookRequest, { rejectWithValue }) => {
    try {
      const response = await playbooksService.createPlaybook(playbookData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create playbook');
    }
  }
);

/**
 * Update playbook
 */
export const updatePlaybook = createAsyncThunk(
  'playbooks/updatePlaybook',
  async ({ id, playbookData }: { id: string; playbookData: UpdatePlaybookRequest }, { rejectWithValue }) => {
    try {
      const response = await playbooksService.updatePlaybook(id, playbookData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update playbook');
    }
  }
);

/**
 * Delete playbook
 */
export const deletePlaybook = createAsyncThunk(
  'playbooks/deletePlaybook',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await playbooksService.deletePlaybook(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete playbook');
    }
  }
);

/**
 * Execute playbook
 */
export const executePlaybook = createAsyncThunk(
  'playbooks/executePlaybook',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await playbooksService.executePlaybook(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to execute playbook');
    }
  }
);

/**
 * Fetch playbook statistics
 */
export const fetchPlaybookStats = createAsyncThunk(
  'playbooks/fetchPlaybookStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await playbooksService.getPlaybookStats();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch playbook statistics');
    }
  }
);

/**
 * Fetch playbook templates
 */
export const fetchPlaybookTemplates = createAsyncThunk(
  'playbooks/fetchPlaybookTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await playbooksService.getPlaybookTemplates();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch playbook templates');
    }
  }
);