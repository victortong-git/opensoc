import { createAsyncThunk } from '@reduxjs/toolkit';
import aiAgentsService, { 
  AIAgentFilters,
  CreateAIAgentRequest,
  UpdateAIAgentRequest,
  UpdateAgentStatusRequest,
  ActivityFilters
} from '../services/aiAgentsService';

/**
 * Fetch AI agents with filtering and pagination
 */
export const fetchAIAgents = createAsyncThunk(
  'aiAgents/fetchAIAgents',
  async (filters: AIAgentFilters | undefined, { rejectWithValue }) => {
    try {
      const response = await aiAgentsService.getAIAgents(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch AI agents');
    }
  }
);

/**
 * Fetch single AI agent by ID
 */
export const fetchAIAgent = createAsyncThunk(
  'aiAgents/fetchAIAgent',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await aiAgentsService.getAIAgent(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch AI agent');
    }
  }
);

/**
 * Create new AI agent
 */
export const createAIAgent = createAsyncThunk(
  'aiAgents/createAIAgent',
  async (agentData: CreateAIAgentRequest, { rejectWithValue }) => {
    try {
      const response = await aiAgentsService.createAIAgent(agentData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create AI agent');
    }
  }
);

/**
 * Update AI agent
 */
export const updateAIAgent = createAsyncThunk(
  'aiAgents/updateAIAgent',
  async ({ id, agentData }: { id: string; agentData: UpdateAIAgentRequest }, { rejectWithValue }) => {
    try {
      const response = await aiAgentsService.updateAIAgent(id, agentData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update AI agent');
    }
  }
);

/**
 * Delete AI agent
 */
export const deleteAIAgent = createAsyncThunk(
  'aiAgents/deleteAIAgent',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await aiAgentsService.deleteAIAgent(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete AI agent');
    }
  }
);

/**
 * Update AI agent status
 */
export const updateAgentStatus = createAsyncThunk(
  'aiAgents/updateAgentStatus',
  async ({ id, statusData }: { id: string; statusData: UpdateAgentStatusRequest }, { rejectWithValue }) => {
    try {
      const response = await aiAgentsService.updateAgentStatus(id, statusData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update agent status');
    }
  }
);

/**
 * Fetch agent activities
 */
export const fetchAgentActivities = createAsyncThunk(
  'aiAgents/fetchAgentActivities',
  async (filters: ActivityFilters | undefined, { rejectWithValue }) => {
    try {
      const response = await aiAgentsService.getAgentActivities(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch agent activities');
    }
  }
);

/**
 * Fetch AI agent statistics
 */
export const fetchAIAgentStats = createAsyncThunk(
  'aiAgents/fetchAIAgentStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiAgentsService.getAIAgentStats();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch AI agent statistics');
    }
  }
);

/**
 * Fetch SOC teams
 */
export const fetchSOCTeams = createAsyncThunk(
  'aiAgents/fetchSOCTeams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiAgentsService.getSOCTeams();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch SOC teams');
    }
  }
);