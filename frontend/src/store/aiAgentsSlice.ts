import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  AIAgent, 
  AgentActivity, 
  SOCTeam, 
  AIAgentStats 
} from '../services/aiAgentsService';
import {
  fetchAIAgents,
  fetchAIAgent,
  createAIAgent,
  updateAIAgent,
  deleteAIAgent,
  updateAgentStatus,
  fetchAgentActivities,
  fetchAIAgentStats,
  fetchSOCTeams
} from './aiAgentsAsync';

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface AIAgentsState {
  // Agents data
  agents: AIAgent[];
  currentAgent: AIAgent | null;
  agentsPagination: PaginationState | null;
  agentsLoading: boolean;
  agentsError: string | null;

  // Activities data
  activities: AgentActivity[];
  activitiesPagination: PaginationState | null;
  activitiesLoading: boolean;
  activitiesError: string | null;

  // Teams data
  teams: SOCTeam[];
  teamsLoading: boolean;
  teamsError: string | null;
  teamsStats: {
    totalTeams: number;
    totalHumans: number;
    totalAgents: number;
  } | null;

  // Agent statistics
  agentStats: AIAgentStats | null;
  agentStatsLoading: boolean;
  agentStatsError: string | null;

  // UI State
  selectedAgentId: string | null;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  
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

const initialState: AIAgentsState = {
  // Agents data
  agents: [],
  currentAgent: null,
  agentsPagination: null,
  agentsLoading: false,
  agentsError: null,

  // Activities data
  activities: [],
  activitiesPagination: null,
  activitiesLoading: false,
  activitiesError: null,

  // Teams data
  teams: [],
  teamsLoading: false,
  teamsError: null,
  teamsStats: null,

  // Agent statistics
  agentStats: null,
  agentStatsLoading: false,
  agentStatsError: null,

  // UI State
  selectedAgentId: null,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  
  // General state
  isLoading: false,
  error: null,
};

const aiAgentsSlice = createSlice({
  name: 'aiAgents',
  initialState,
  reducers: {
    // UI actions
    setSelectedAgent: (state, action: PayloadAction<string | null>) => {
      state.selectedAgentId = action.payload;
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
    
    // Clear errors
    clearAIAgentErrors: (state) => {
      state.agentsError = null;
      state.activitiesError = null;
      state.teamsError = null;
      state.agentStatsError = null;
      state.error = null;
    },
    
    // Set general error
    setAIAgentError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    // Fetch AI Agents
    builder
      .addCase(fetchAIAgents.pending, (state) => {
        state.agentsLoading = true;
        state.agentsError = null;
        state.isLoading = true;
      })
      .addCase(fetchAIAgents.fulfilled, (state, action) => {
        state.agentsLoading = false;
        state.agents = action.payload.agents;
        state.agentsPagination = action.payload.pagination;
        state.isLoading = false;
      })
      .addCase(fetchAIAgents.rejected, (state, action) => {
        state.agentsLoading = false;
        state.agentsError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch Single AI Agent
    builder
      .addCase(fetchAIAgent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAIAgent.fulfilled, (state, action) => {
        state.currentAgent = action.payload.agent;
        state.isLoading = false;
      })
      .addCase(fetchAIAgent.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Create AI Agent
    builder
      .addCase(createAIAgent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAIAgent.fulfilled, (state, action) => {
        state.agents.push(action.payload.agent);
        state.isCreateModalOpen = false;
        state.isLoading = false;
        // Update pagination count if we have it
        if (state.agentsPagination) {
          state.agentsPagination.totalItems += 1;
        }
      })
      .addCase(createAIAgent.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Update AI Agent
    builder
      .addCase(updateAIAgent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAIAgent.fulfilled, (state, action) => {
        const index = state.agents.findIndex(agent => agent.id === action.payload.agent.id);
        if (index !== -1) {
          state.agents[index] = action.payload.agent;
        }
        state.currentAgent = action.payload.agent;
        state.isEditModalOpen = false;
        state.isLoading = false;
      })
      .addCase(updateAIAgent.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Delete AI Agent
    builder
      .addCase(deleteAIAgent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAIAgent.fulfilled, (state, action) => {
        state.agents = state.agents.filter(agent => agent.id !== action.meta.arg);
        state.isLoading = false;
        // Update pagination count if we have it
        if (state.agentsPagination) {
          state.agentsPagination.totalItems -= 1;
        }
      })
      .addCase(deleteAIAgent.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Update Agent Status
    builder
      .addCase(updateAgentStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAgentStatus.fulfilled, (state, action) => {
        const index = state.agents.findIndex(agent => agent.id === action.payload.agent.id);
        if (index !== -1) {
          state.agents[index] = action.payload.agent;
        }
        if (state.currentAgent && state.currentAgent.id === action.payload.agent.id) {
          state.currentAgent = action.payload.agent;
        }
        state.isLoading = false;
      })
      .addCase(updateAgentStatus.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Fetch Agent Activities
    builder
      .addCase(fetchAgentActivities.pending, (state) => {
        state.activitiesLoading = true;
        state.activitiesError = null;
        state.isLoading = true;
      })
      .addCase(fetchAgentActivities.fulfilled, (state, action) => {
        state.activitiesLoading = false;
        state.activities = action.payload.activities;
        state.activitiesPagination = action.payload.pagination;
        state.isLoading = false;
      })
      .addCase(fetchAgentActivities.rejected, (state, action) => {
        state.activitiesLoading = false;
        state.activitiesError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch AI Agent Stats
    builder
      .addCase(fetchAIAgentStats.pending, (state) => {
        state.agentStatsLoading = true;
        state.agentStatsError = null;
        state.isLoading = true;
      })
      .addCase(fetchAIAgentStats.fulfilled, (state, action) => {
        state.agentStatsLoading = false;
        state.agentStats = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchAIAgentStats.rejected, (state, action) => {
        state.agentStatsLoading = false;
        state.agentStatsError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch SOC Teams
    builder
      .addCase(fetchSOCTeams.pending, (state) => {
        state.teamsLoading = true;
        state.teamsError = null;
        state.isLoading = true;
      })
      .addCase(fetchSOCTeams.fulfilled, (state, action) => {
        state.teamsLoading = false;
        state.teams = action.payload.teams;
        state.teamsStats = {
          totalTeams: action.payload.totalTeams,
          totalHumans: action.payload.totalHumans,
          totalAgents: action.payload.totalAgents,
        };
        state.isLoading = false;
      })
      .addCase(fetchSOCTeams.rejected, (state, action) => {
        state.teamsLoading = false;
        state.teamsError = action.payload as string;
        state.isLoading = false;
      });
  }
});

export const { 
  setSelectedAgent,
  openCreateModal,
  closeCreateModal,
  openEditModal,
  closeEditModal,
  clearAIAgentErrors,
  setAIAgentError
} = aiAgentsSlice.actions;

export default aiAgentsSlice.reducer;