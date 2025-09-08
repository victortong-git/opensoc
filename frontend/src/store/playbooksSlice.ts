import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  Playbook, 
  PlaybookTemplate, 
  PlaybookStats, 
  PlaybookExecution 
} from '../services/playbooksService';
import { 
  savePaginationPreferences, 
  loadPaginationPreferences, 
  PREFERENCE_KEYS 
} from '../utils/localStorage';
import {
  fetchPlaybooks,
  fetchPlaybook,
  createPlaybook,
  updatePlaybook,
  deletePlaybook,
  executePlaybook,
  fetchPlaybookStats,
  fetchPlaybookTemplates
} from './playbooksAsync';

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PlaybooksState {
  // Playbooks data
  playbooks: Playbook[];
  currentPlaybook: Playbook | null;
  playbooksPagination: PaginationState | null;
  playbooksLoading: boolean;
  playbooksError: string | null;

  // Templates data
  templates: PlaybookTemplate[];
  templatesPagination: PaginationState | null;
  templatesLoading: boolean;
  templatesError: string | null;

  // Statistics data
  playbookStats: PlaybookStats | null;
  playbookStatsLoading: boolean;
  playbookStatsError: string | null;

  // Execution data
  currentExecution: PlaybookExecution | null;
  executionLoading: boolean;
  executionError: string | null;

  // UI State
  selectedPlaybookId: string | null;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isExecutionModalOpen: boolean;
  
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

// Load saved preferences from localStorage
const savedPreferences = loadPaginationPreferences('PLAYBOOKS');

const initialState: PlaybooksState = {
  // Playbooks data
  playbooks: [],
  currentPlaybook: null,
  playbooksPagination: {
    currentPage: savedPreferences.currentPage,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: savedPreferences.pageSize,
    hasNext: false,
    hasPrev: false,
  },
  playbooksLoading: false,
  playbooksError: null,

  // Templates data
  templates: [],
  templatesPagination: {
    currentPage: savedPreferences.currentPage,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: savedPreferences.pageSize,
    hasNext: false,
    hasPrev: false,
  },
  templatesLoading: false,
  templatesError: null,

  // Statistics data
  playbookStats: null,
  playbookStatsLoading: false,
  playbookStatsError: null,

  // Execution data
  currentExecution: null,
  executionLoading: false,
  executionError: null,

  // UI State
  selectedPlaybookId: null,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isExecutionModalOpen: false,
  
  // General state
  isLoading: false,
  error: null,
};

const playbooksSlice = createSlice({
  name: 'playbooks',
  initialState,
  reducers: {
    // UI actions
    setSelectedPlaybook: (state, action: PayloadAction<string | null>) => {
      state.selectedPlaybookId = action.payload;
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
    openExecutionModal: (state) => {
      state.isExecutionModalOpen = true;
    },
    closeExecutionModal: (state) => {
      state.isExecutionModalOpen = false;
      state.currentExecution = null;
    },
    
    // Clear errors
    clearPlaybookErrors: (state) => {
      state.playbooksError = null;
      state.templatesError = null;
      state.playbookStatsError = null;
      state.executionError = null;
      state.error = null;
    },
    
    // Set general error
    setPlaybookError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Pagination actions
    setPlaybooksPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      if (state.playbooksPagination) {
        state.playbooksPagination.currentPage = action.payload.page;
        state.playbooksPagination.itemsPerPage = action.payload.limit;
      }
      // Save to localStorage
      savePaginationPreferences('PLAYBOOKS', {
        currentPage: action.payload.page,
        pageSize: action.payload.limit,
      });
    },

    setPlaybooksPageSize: (state, action: PayloadAction<number>) => {
      if (state.playbooksPagination) {
        state.playbooksPagination.itemsPerPage = action.payload;
        state.playbooksPagination.currentPage = 1; // Reset to first page when changing page size
      }
      // Save to localStorage
      savePaginationPreferences('PLAYBOOKS', {
        pageSize: action.payload,
        currentPage: 1,
      });
    },

    setTemplatesPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      if (state.templatesPagination) {
        state.templatesPagination.currentPage = action.payload.page;
        state.templatesPagination.itemsPerPage = action.payload.limit;
      }
      // Save to localStorage
      savePaginationPreferences('PLAYBOOKS', {
        currentPage: action.payload.page,
        pageSize: action.payload.limit,
      });
    },

    setTemplatesPageSize: (state, action: PayloadAction<number>) => {
      if (state.templatesPagination) {
        state.templatesPagination.itemsPerPage = action.payload;
        state.templatesPagination.currentPage = 1; // Reset to first page when changing page size
      }
      // Save to localStorage
      savePaginationPreferences('PLAYBOOKS', {
        pageSize: action.payload,
        currentPage: 1,
      });
    }
  },
  extraReducers: (builder) => {
    // Fetch Playbooks
    builder
      .addCase(fetchPlaybooks.pending, (state) => {
        state.playbooksLoading = true;
        state.playbooksError = null;
        state.isLoading = true;
      })
      .addCase(fetchPlaybooks.fulfilled, (state, action) => {
        state.playbooksLoading = false;
        state.playbooks = action.payload.playbooks;
        state.playbooksPagination = action.payload.pagination;
        state.isLoading = false;
      })
      .addCase(fetchPlaybooks.rejected, (state, action) => {
        state.playbooksLoading = false;
        state.playbooksError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch Single Playbook
    builder
      .addCase(fetchPlaybook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlaybook.fulfilled, (state, action) => {
        state.currentPlaybook = action.payload.playbook;
        state.isLoading = false;
      })
      .addCase(fetchPlaybook.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Create Playbook
    builder
      .addCase(createPlaybook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPlaybook.fulfilled, (state, action) => {
        state.playbooks.push(action.payload.playbook);
        state.isCreateModalOpen = false;
        state.isLoading = false;
        // Update pagination count if we have it
        if (state.playbooksPagination) {
          state.playbooksPagination.totalItems += 1;
        }
      })
      .addCase(createPlaybook.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Update Playbook
    builder
      .addCase(updatePlaybook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePlaybook.fulfilled, (state, action) => {
        const index = state.playbooks.findIndex(playbook => playbook.id === action.payload.playbook.id);
        if (index !== -1) {
          state.playbooks[index] = action.payload.playbook;
        }
        state.currentPlaybook = action.payload.playbook;
        state.isEditModalOpen = false;
        state.isLoading = false;
      })
      .addCase(updatePlaybook.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Delete Playbook
    builder
      .addCase(deletePlaybook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletePlaybook.fulfilled, (state, action) => {
        state.playbooks = state.playbooks.filter(playbook => playbook.id !== action.meta.arg);
        state.isLoading = false;
        // Update pagination count if we have it
        if (state.playbooksPagination) {
          state.playbooksPagination.totalItems -= 1;
        }
      })
      .addCase(deletePlaybook.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Execute Playbook
    builder
      .addCase(executePlaybook.pending, (state) => {
        state.executionLoading = true;
        state.executionError = null;
        state.isLoading = true;
      })
      .addCase(executePlaybook.fulfilled, (state, action) => {
        state.executionLoading = false;
        state.currentExecution = action.payload.execution;
        state.isExecutionModalOpen = true;
        state.isLoading = false;

        // Update execution count for the playbook
        const index = state.playbooks.findIndex(p => p.id === action.payload.execution.playbookId);
        if (index !== -1) {
          state.playbooks[index].executionCount += 1;
        }
      })
      .addCase(executePlaybook.rejected, (state, action) => {
        state.executionLoading = false;
        state.executionError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch Playbook Stats
    builder
      .addCase(fetchPlaybookStats.pending, (state) => {
        state.playbookStatsLoading = true;
        state.playbookStatsError = null;
        state.isLoading = true;
      })
      .addCase(fetchPlaybookStats.fulfilled, (state, action) => {
        state.playbookStatsLoading = false;
        state.playbookStats = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchPlaybookStats.rejected, (state, action) => {
        state.playbookStatsLoading = false;
        state.playbookStatsError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch Playbook Templates
    builder
      .addCase(fetchPlaybookTemplates.pending, (state) => {
        state.templatesLoading = true;
        state.templatesError = null;
        state.isLoading = true;
      })
      .addCase(fetchPlaybookTemplates.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload.templates;
        if (action.payload.pagination) {
          state.templatesPagination = action.payload.pagination;
        }
        state.isLoading = false;
      })
      .addCase(fetchPlaybookTemplates.rejected, (state, action) => {
        state.templatesLoading = false;
        state.templatesError = action.payload as string;
        state.isLoading = false;
      });
  }
});

export const { 
  setSelectedPlaybook,
  openCreateModal,
  closeCreateModal,
  openEditModal,
  closeEditModal,
  openExecutionModal,
  closeExecutionModal,
  clearPlaybookErrors,
  setPlaybookError,
  setPlaybooksPagination,
  setPlaybooksPageSize,
  setTemplatesPagination,
  setTemplatesPageSize
} = playbooksSlice.actions;

export default playbooksSlice.reducer;