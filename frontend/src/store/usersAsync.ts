import { createAsyncThunk } from '@reduxjs/toolkit';
import usersService, { 
  UserFilters, 
  CreateUserRequest, 
  UpdateUserRequest,
  ActivityFilters
} from '../services/usersService';

/**
 * Fetch users with optional filtering
 */
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (filters: UserFilters | undefined, { rejectWithValue }) => {
    try {
      const response = await usersService.getUsers(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch users');
    }
  }
);

/**
 * Fetch single user by ID
 */
export const fetchUser = createAsyncThunk(
  'users/fetchUser',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await usersService.getUser(id);
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch user');
    }
  }
);

/**
 * Create new user
 */
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: CreateUserRequest, { rejectWithValue }) => {
    try {
      const response = await usersService.createUser(userData);
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to create user');
    }
  }
);

/**
 * Update user
 */
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }: { id: string; userData: UpdateUserRequest }, { rejectWithValue }) => {
    try {
      const response = await usersService.updateUser(id, userData);
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to update user');
    }
  }
);

/**
 * Delete user
 */
export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id: string, { rejectWithValue }) => {
    try {
      await usersService.deleteUser(id);
      return id; // Return the ID for removal from state
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to delete user');
    }
  }
);

/**
 * Deactivate user
 */
export const deactivateUser = createAsyncThunk(
  'users/deactivateUser',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await usersService.deactivateUser(id);
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to deactivate user');
    }
  }
);

/**
 * Activate user
 */
export const activateUser = createAsyncThunk(
  'users/activateUser',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await usersService.activateUser(id);
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to activate user');
    }
  }
);

/**
 * Fetch user statistics
 */
export const fetchUserStats = createAsyncThunk(
  'users/fetchUserStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersService.getUserStats();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch user statistics');
    }
  }
);

/**
 * Fetch user activity logs
 */
export const fetchUserActivity = createAsyncThunk(
  'users/fetchUserActivity',
  async ({ id, filters }: { id: string; filters?: ActivityFilters }, { rejectWithValue }) => {
    try {
      const response = await usersService.getUserActivity(id, filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch user activity');
    }
  }
);

/**
 * Fetch all user activities (system-wide)
 */
export const fetchAllActivities = createAsyncThunk(
  'users/fetchAllActivities',
  async (filters: ActivityFilters | undefined, { rejectWithValue }) => {
    try {
      const response = await usersService.getAllActivities(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch activities');
    }
  }
);