import { apiRequest } from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'analyst' | 'viewer';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    domain: string;
  };
}

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export interface UserStats {
  total: number;
  active: number;
  byRole: Array<{
    role: string;
    count: string;
  }>;
  recentActivity: number;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserActivityResponse {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  activities: UserActivity[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: string | string[];
  isActive?: boolean;
  search?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'analyst' | 'viewer';
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'analyst' | 'viewer';
  isActive?: boolean;
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
}

class UsersService {
  private baseUrl = '/users';

  /**
   * Get users with filtering and pagination
   */
  async getUsers(filters?: UserFilters): Promise<UsersResponse> {
    const response = await apiRequest.get<UsersResponse>(this.baseUrl, { params: filters });
    return response.data || response as UsersResponse;
  }

  /**
   * Get single user by ID
   */
  async getUser(id: string): Promise<{ user: User }> {
    const response = await apiRequest.get<{ user: User }>(`${this.baseUrl}/${id}`);
    return response.data || response as { user: User };
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserRequest): Promise<{ message: string; user: User }> {
    const response = await apiRequest.post<{ message: string; user: User }>(this.baseUrl, userData);
    return response.data || response as { message: string; user: User };
  }

  /**
   * Update user
   */
  async updateUser(id: string, userData: UpdateUserRequest): Promise<{ message: string; user: User }> {
    const response = await apiRequest.put<{ message: string; user: User }>(`${this.baseUrl}/${id}`, userData);
    return response.data || response as { message: string; user: User };
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<{ message: string }> {
    const response = await apiRequest.delete<{ message: string }>(`${this.baseUrl}/${id}`);
    return response.data || response as { message: string };
  }

  /**
   * Deactivate user
   */
  async deactivateUser(id: string): Promise<{ message: string; user: User }> {
    const response = await apiRequest.post<{ message: string; user: User }>(`${this.baseUrl}/${id}/deactivate`);
    return response.data || response as { message: string; user: User };
  }

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<{ message: string; user: User }> {
    const response = await apiRequest.post<{ message: string; user: User }>(`${this.baseUrl}/${id}/activate`);
    return response.data || response as { message: string; user: User };
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(id: string, filters?: ActivityFilters): Promise<UserActivityResponse> {
    const response = await apiRequest.get<UserActivityResponse>(`${this.baseUrl}/${id}/activity`, { params: filters });
    return response.data || response as UserActivityResponse;
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    const response = await apiRequest.get<UserStats>(`${this.baseUrl}/stats`);
    return response.data || response as UserStats;
  }

  /**
   * Get all user activities (system-wide)
   */
  async getAllActivities(filters?: ActivityFilters): Promise<{ activities: UserActivity[]; pagination: any }> {
    // Note: This would need a separate endpoint in the backend for system-wide activities
    // For now, we'll simulate this by creating mock data that matches the expected structure
    // In a real implementation, there would be a separate endpoint like /api/activities
    
    // Mock activities data for now
    const mockActivities: UserActivity[] = [
      {
        id: '1',
        user_id: '1',
        action: 'user_login',
        description: 'User logged into the system',
        metadata: { success: true },
        timestamp: new Date().toISOString(),
        ip_address: '192.168.1.100'
      },
      {
        id: '2',
        user_id: '2',
        action: 'alert_created',
        description: 'New security alert generated',
        metadata: { severity: 'high' },
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ip_address: '192.168.1.101'
      }
    ];
    
    return {
      activities: mockActivities,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: mockActivities.length,
        itemsPerPage: 20,
        hasNext: false,
        hasPrev: false
      }
    };
  }
}

export default new UsersService();