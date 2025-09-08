import { apiRequest } from './api';

// Types
export interface AIGenerationLog {
  id: number;
  userId: string;
  organizationId: string;
  dataType: 'alert' | 'incident' | 'asset' | 'ioc' | 'playbook';
  quantity: number;
  scenario: string;
  prompt: string;
  aiResponse: string | null;
  success: boolean;
  validation: 'Pass' | 'Fail' | 'Pending' | 'Unknown';
  errorMessage: string | null;
  executionTime: number | null;
  aiModel: string | null;
  aiProvider: string | null;
  aiEndpoint: string | null;
  modelVersion: string | null;
  providerMetadata: any;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AIGenerationLogsResponse {
  logs: AIGenerationLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AIGenerationLogsStats {
  period: string;
  summary: {
    totalLogs: number;
    successfulLogs: number;
    failedLogs: number;
    successRate: number;
  };
  dataTypes: Array<{
    dataType: string;
    count: number;
    avgExecutionTime: number | null;
  }>;
  users: Array<{
    userId: string;
    username: string;
    fullName: string;
    count: number;
  }>;
  performance: {
    avgExecutionTime: number | null;
    minExecutionTime: number | null;
    maxExecutionTime: number | null;
  };
  recentActivity: AIGenerationLog[];
}

export interface AIGenerationLogsFilters {
  page?: number;
  limit?: number;
  dataType?: string;
  success?: boolean;
  validation?: string;
  userId?: string;
  scenario?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CleanupOptions {
  dataType?: string;
  onlyFailed?: boolean;
}

export interface CleanupResponse {
  success: boolean;
  message: string;
  deletedCount: number;
  reason?: 'no_logs_found' | 'deletion_failed';
}

class AIGenerationLogsService {
  /**
   * Get AI generation logs with filtering and pagination
   */
  async getAIGenerationLogs(filters: AIGenerationLogsFilters = {}): Promise<AIGenerationLogsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await apiRequest.get(`/ai-generation-logs?${params.toString()}`);
    return response;
  }

  /**
   * Get AI generation log by ID
   */
  async getAIGenerationLogById(id: number): Promise<AIGenerationLog> {
    const response = await apiRequest.get(`/ai-generation-logs/${id}`);
    return response;
  }

  /**
   * Delete AI generation log by ID
   */
  async deleteAIGenerationLog(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest.delete(`/ai-generation-logs/${id}`);
    return response;
  }

  /**
   * Get AI generation logs statistics
   */
  async getAIGenerationLogsStats(days: number = 30): Promise<AIGenerationLogsStats> {
    const response = await apiRequest.get(`/ai-generation-logs/stats?days=${days}`);
    return response;
  }

  /**
   * Cleanup old AI generation logs
   */
  async cleanupAIGenerationLogs(options: CleanupOptions = {}): Promise<CleanupResponse> {
    const params = new URLSearchParams();
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    try {
      const response = await apiRequest.delete(`/ai-generation-logs/cleanup?${params.toString()}`);
      return response;
    } catch (error: any) {
      // Handle cases where the API returns an error but we want to provide user-friendly feedback
      if (error.response && error.response.data) {
        return {
          success: false,
          message: error.response.data.message || 'Failed to cleanup logs',
          deletedCount: 0,
          reason: error.response.data.reason || 'deletion_failed'
        };
      }
      throw error;
    }
  }

  /**
   * Export AI generation logs to CSV
   */
  exportToCSV(logs: AIGenerationLog[]): void {
    const headers = [
      'ID',
      'Date/Time',
      'User',
      'Data Type',
      'Quantity',
      'Scenario',
      'Success',
      'Validation',
      'Execution Time (ms)',
      'AI Provider',
      'AI Model',
      'Model Version',
      'AI Endpoint',
      'Error Message'
    ];

    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        `"${new Date(log.createdAt).toLocaleString()}"`,
        `"${log.user.firstName} ${log.user.lastName} (${log.user.username})"`,
        log.dataType,
        log.quantity,
        `"${log.scenario || ''}"`,
        log.success ? 'Yes' : 'No',
        log.validation || 'Unknown',
        log.executionTime || '',
        `"${log.aiProvider || ''}"`,
        `"${log.aiModel || ''}"`,
        `"${log.modelVersion || ''}"`,
        `"${log.aiEndpoint || ''}"`,
        `"${log.errorMessage || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `ai-generation-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Format execution time for display
   */
  formatExecutionTime(milliseconds: number | null): string {
    if (!milliseconds) return 'N/A';
    
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.floor((milliseconds % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Get status badge color based on success
   */
  getStatusBadgeColor(success: boolean): string {
    return success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  /**
   * Get validation badge color
   */
  getValidationBadgeColor(validation: string): string {
    switch (validation) {
      case 'Pass': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Fail': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Unknown': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  }

  /**
   * Get validation icon
   */
  getValidationIcon(validation: string): string {
    switch (validation) {
      case 'Pass': return '✅';
      case 'Fail': return '❌';
      case 'Pending': return '⏳';
      case 'Unknown': return '❔';
      default: return '❔';
    }
  }

  /**
   * Get data type icon
   */
  getDataTypeIcon(dataType: string): string {
    const icons = {
      alert: '🚨',
      incident: '🔥',
      asset: '🏢',
      ioc: '🎯',
      playbook: '📋'
    };
    return icons[dataType as keyof typeof icons] || '❓';
  }
}

export default new AIGenerationLogsService();