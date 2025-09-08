import { User } from '../types';
import apiRequest from './api';

// Types for API requests and responses
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    organization: {
      id: string;
      name: string;
      domain: string;
      settings: any;
    };
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

// Token management functions
const decodeToken = (token: string): any => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiRequest.post<LoginResponse>('/auth/login', credentials);
      
      if (response.data) {
        const { user, tokens } = response.data;
        // Store tokens and user in localStorage
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  },

  logout: async (): Promise<void> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Call logout endpoint
        await apiRequest.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !authService.isTokenValid(token)) {
        return null;
      }

      // Try to get user from localStorage first
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        // Convert API user format to frontend User format
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0ea5e9&color=fff`,
          isActive: true,
          lastLogin: new Date().toISOString(),
          organizationId: user.organizationId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // If no stored user, fetch from API
      const response = await apiRequest.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data?.user || null;
    } catch (error) {
      // If token is invalid or user fetch fails, clear storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return null;
    }
  },

  isTokenValid: (token: string | null): boolean => {
    if (!token) return false;
    
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return false;
    
    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    return decoded.exp * 1000 > Date.now();
  },

  getStoredToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  // Alias for attackService compatibility
  getAuthToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('accessToken');
    return authService.isTokenValid(token);
  },

  getProfile: async (): Promise<User> => {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    return user;
  },

  changePassword: async (passwordData: ChangePasswordRequest): Promise<void> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !authService.isTokenValid(token)) {
        throw new Error('Authentication required');
      }

      const response = await apiRequest.put<ChangePasswordResponse>('/auth/password', passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data) {
        throw new Error('Failed to change password');
      }

      // Password change successful
      return;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      throw new Error(errorMessage);
    }
  }
};

export default authService;

// Named exports for compatibility
export const getAuthToken = authService.getAuthToken;