import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserStats, UserActivity, UserActivityResponse } from '../services/usersService';
import {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  fetchUserStats,
  fetchUserActivity,
  fetchAllActivities
} from './usersAsync';

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UsersState {
  // Users data
  users: User[];
  currentUser: User | null;
  usersPagination: PaginationState | null;
  usersLoading: boolean;
  usersError: string | null;

  // User statistics
  userStats: UserStats | null;
  userStatsLoading: boolean;
  userStatsError: string | null;

  // User activities
  userActivities: UserActivity[];
  userActivitiesTarget: { id: string; username: string; firstName: string; lastName: string } | null;
  userActivitiesPagination: PaginationState | null;
  userActivitiesLoading: boolean;
  userActivitiesError: string | null;

  // All activities (system-wide)
  allActivities: UserActivity[];
  allActivitiesPagination: PaginationState | null;
  allActivitiesLoading: boolean;
  allActivitiesError: string | null;

  // UI State
  selectedUserId: string | null;
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

const initialState: UsersState = {
  // Users data
  users: [],
  currentUser: null,
  usersPagination: null,
  usersLoading: false,
  usersError: null,

  // User statistics
  userStats: null,
  userStatsLoading: false,
  userStatsError: null,

  // User activities
  userActivities: [],
  userActivitiesTarget: null,
  userActivitiesPagination: null,
  userActivitiesLoading: false,
  userActivitiesError: null,

  // All activities
  allActivities: [],
  allActivitiesPagination: null,
  allActivitiesLoading: false,
  allActivitiesError: null,

  // UI State
  selectedUserId: null,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  
  // General state
  isLoading: false,
  error: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // UI actions
    setSelectedUser: (state, action: PayloadAction<string | null>) => {
      state.selectedUserId = action.payload;
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
    clearUsersErrors: (state) => {
      state.usersError = null;
      state.userStatsError = null;
      state.userActivitiesError = null;
      state.allActivitiesError = null;
      state.error = null;
    },
    
    // Set general error
    setUsersError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    // Fetch Users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
        state.isLoading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload.users;
        state.usersPagination = action.payload.pagination;
        state.isLoading = false;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch Single User
    builder
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Create User
    builder
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
        state.isCreateModalOpen = false;
        state.isLoading = false;
        // Update pagination count if we have it
        if (state.usersPagination) {
          state.usersPagination.totalItems += 1;
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Update User
    builder
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.currentUser = action.payload;
        state.isEditModalOpen = false;
        state.isLoading = false;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Delete User
    builder
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.id !== action.payload);
        state.isLoading = false;
        // Update pagination count if we have it
        if (state.usersPagination) {
          state.usersPagination.totalItems -= 1;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Deactivate User
    builder
      .addCase(deactivateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deactivateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(deactivateUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Activate User
    builder
      .addCase(activateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(activateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(activateUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });

    // Fetch User Stats
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.userStatsLoading = true;
        state.userStatsError = null;
        state.isLoading = true;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.userStatsLoading = false;
        state.userStats = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.userStatsLoading = false;
        state.userStatsError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch User Activity
    builder
      .addCase(fetchUserActivity.pending, (state) => {
        state.userActivitiesLoading = true;
        state.userActivitiesError = null;
        state.isLoading = true;
      })
      .addCase(fetchUserActivity.fulfilled, (state, action) => {
        state.userActivitiesLoading = false;
        state.userActivities = action.payload.activities;
        state.userActivitiesTarget = action.payload.user;
        state.userActivitiesPagination = action.payload.pagination;
        state.isLoading = false;
      })
      .addCase(fetchUserActivity.rejected, (state, action) => {
        state.userActivitiesLoading = false;
        state.userActivitiesError = action.payload as string;
        state.isLoading = false;
      });

    // Fetch All Activities
    builder
      .addCase(fetchAllActivities.pending, (state) => {
        state.allActivitiesLoading = true;
        state.allActivitiesError = null;
        state.isLoading = true;
      })
      .addCase(fetchAllActivities.fulfilled, (state, action) => {
        state.allActivitiesLoading = false;
        state.allActivities = action.payload.activities;
        state.allActivitiesPagination = action.payload.pagination;
        state.isLoading = false;
      })
      .addCase(fetchAllActivities.rejected, (state, action) => {
        state.allActivitiesLoading = false;
        state.allActivitiesError = action.payload as string;
        state.isLoading = false;
      });
  }
});

export const { 
  setSelectedUser,
  openCreateModal,
  closeCreateModal,
  openEditModal,
  closeEditModal,
  clearUsersErrors,
  setUsersError
} = usersSlice.actions;

export default usersSlice.reducer;