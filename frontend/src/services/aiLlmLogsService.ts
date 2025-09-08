import api from './api';

export interface AILLMLog {
  id: number;
  organizationId: number;
  providerId?: number;
  providerName: string;
  providerType: string;
  providerUrl: string;
  modelName: string;
  maxTokens?: number;
  tokenWindow?: number;
  temperature?: number;
  requestTimestamp: string;
  responseTimestamp?: string;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  rawPrompt: string;
  rawResponse?: string;
  success: boolean;
  errorMessage?: string;
  httpStatusCode?: number;
  userId?: number;
  contextType?: string;
  contextId?: number;
  requestHeaders?: Record<string, any>;
  responseHeaders?: Record<string, any>;
  providerMetadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  provider?: {
    id: number;
    name: string;
    type: string;
  };
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface AILLMLogFilters {
  providerId?: number;
  providerName?: string;
  success?: boolean;
  contextType?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface AILLMLogResponse {
  success: boolean;
  data: AILLMLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
    currentPage: number;
  };
  tokenTotals: {
    totalInputTokens: number;
    totalOutputTokens: number;
  };
}

export interface AILLMLogStatsResponse {
  success: boolean;
  data: {
    timeRange: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    avgDuration: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    providerStats: Array<{
      providerName: string;
      providerType: string;
      totalRequests: number;
      successfulRequests: number;
      successRate: number;
      avgDuration: number;
      totalInputTokens: number;
      totalOutputTokens: number;
    }>;
  };
}

export interface ProviderWithLogs {
  name: string;
  type: string;
  logCount: number;
}

class AILLMLogsService {
  /**
   * Get AI LLM logs with filtering and pagination
   */
  async getLogs(filters: AILLMLogFilters = {}): Promise<AILLMLogResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await api.get(`/ai-llm-logs?${params.toString()}`);
    return response.data;
  }

  /**
   * Get specific AI LLM log by ID
   */
  async getLogById(id: number): Promise<{ success: boolean; data: AILLMLog }> {
    const response = await api.get(`/ai-llm-logs/${id}`);
    return response.data;
  }

  /**
   * Get AI LLM statistics
   */
  async getStatistics(timeRange: string = '24h'): Promise<AILLMLogStatsResponse> {
    const response = await api.get(`/ai-llm-logs/stats?timeRange=${timeRange}`);
    return response.data;
  }

  /**
   * Get providers that have logs
   */
  async getProvidersWithLogs(): Promise<{ success: boolean; data: ProviderWithLogs[] }> {
    const response = await api.get('/ai-llm-logs/providers');
    return response.data;
  }

  /**
   * Delete specific AI LLM log (admin only)
   */
  async deleteLog(id: number): Promise<{ success: boolean; message: string; deletedCount: number }> {
    const response = await api.delete(`/ai-llm-logs/${id}`);
    return response.data;
  }

  /**
   * Bulk delete AI LLM logs (admin only)
   */
  async bulkDeleteLogs(logIds: number[]): Promise<{ 
    success: boolean; 
    message: string; 
    deletedCount: number; 
    requestedCount: number;
  }> {
    const response = await api.delete('/ai-llm-logs', {
      data: { logIds }
    });
    return response.data;
  }

  /**
   * Clean up old AI LLM logs (admin only)
   */
  async cleanupOldLogs(retentionDays: number = 30): Promise<{ 
    success: boolean; 
    message: string; 
    deletedCount: number; 
    retentionDays: number;
  }> {
    const response = await api.post('/ai-llm-logs/cleanup', {
      retentionDays
    });
    return response.data;
  }

  /**
   * Export AI LLM logs as CSV (admin only)
   */
  async exportLogsCSV(filters: AILLMLogFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await api.get(`/ai-llm-logs/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return new Blob([response.data], { type: 'text/csv' });
  }

  /**
   * Format duration for display
   */
  formatDuration(durationMs?: number): string {
    if (!durationMs) return 'N/A';
    
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Format token count for display
   */
  formatTokenCount(count?: number): string {
    if (!count) return '0';
    
    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return `${(count / 1000000).toFixed(1)}M`;
    }
  }

  /**
   * Get context type display name
   */
  getContextTypeDisplay(contextType?: string): string {
    const contextTypeMap: Record<string, string> = {
      'chat': 'Chat',
      'incident_draft': 'Incident Draft',
      'alert_analysis': 'Alert Analysis',
      'playbook_generation': 'Playbook Generation',
      'threat_analysis': 'Threat Analysis',
      'log_analysis': 'Log Analysis',
      'rag_search': 'RAG Search'
    };

    return contextTypeMap[contextType || ''] || contextType || 'Unknown';
  }

  /**
   * Get provider type display name
   */
  getProviderTypeDisplay(providerType: string): string {
    const typeMap: Record<string, string> = {
      'ollama': 'Ollama',
      'vllm': 'vLLM',
      'openai': 'OpenAI',
      'anthropic': 'Anthropic'
    };

    return typeMap[providerType] || providerType;
  }

  /**
   * Get status badge color
   */
  getStatusColor(success: boolean): string {
    return success ? 'green' : 'red';
  }

  /**
   * Estimate cost based on token usage
   */
  estimateCost(inputTokens?: number, outputTokens?: number, costPerToken: number = 0.0001): number {
    const input = inputTokens || 0;
    const output = outputTokens || 0;
    return (input + output) * costPerToken;
  }

  /**
   * Format cost for display
   */
  formatCost(cost: number): string {
    if (cost < 0.001) {
      return '<$0.001';
    } else if (cost < 1) {
      return `$${cost.toFixed(3)}`;
    } else {
      return `$${cost.toFixed(2)}`;
    }
  }

  /**
   * Download CSV file
   */
  downloadCSV(blob: Blob, filename: string = 'ai_llm_logs.csv'): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Truncate text for display
   */
  truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Get relative time string
   */
  getRelativeTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  }
}

export default new AILLMLogsService();