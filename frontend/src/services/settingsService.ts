import { apiRequest } from './api';

// SystemSettings interfaces
export interface SystemSetting {
  id: string;
  category: string;
  name: string;
  value: any;
  type: 'boolean' | 'string' | 'number' | 'object';
  description?: string;
  isEditable: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  updater?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

// AlertRule interfaces
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  severity: number;
  category: string;
  conditions: AlertRuleCondition[];
  actions: AlertRuleAction[];
  timeWindow: number;
  threshold: number;
  triggerCount: number;
  lastTriggered?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface AlertRuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface AlertRuleAction {
  type: 'email' | 'webhook' | 'create_incident' | 'assign_user' | 'run_playbook';
  config: {
    [key: string]: any;
  };
}

export interface CreateAlertRuleRequest {
  name: string;
  description?: string;
  severity: number;
  category: string;
  conditions?: AlertRuleCondition[];
  actions?: AlertRuleAction[];
  timeWindow?: number;
  threshold?: number;
  isEnabled?: boolean;
}

export interface UpdateAlertRuleRequest {
  name?: string;
  description?: string;
  severity?: number;
  category?: string;
  conditions?: AlertRuleCondition[];
  actions?: AlertRuleAction[];
  timeWindow?: number;
  threshold?: number;
  isEnabled?: boolean;
}

export interface UpdateSystemSettingRequest {
  value: any;
}

// Response interfaces
export interface SystemSettingsResponse {
  settings: SystemSetting[];
}

export interface AlertRulesResponse {
  alertRules: AlertRule[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SettingsStatsResponse {
  totalSettings: number;
  settingsByCategory: Array<{ category: string; count: number }>;
  totalAlertRules: number;
  enabledAlertRules: number;
  alertRulesByCategory: Array<{ category: string; count: number }>;
  alertRulesBySeverity: Array<{ severity: number; count: number }>;
}

export interface DataCountsResponse {
  dataCounts: {
    alerts: {
      alerts: number;
      timelineEvents: number;
      total: number;
    };
    incidents: {
      incidents: number;
      timelineEvents: number;
      total: number;
    };
    assets: {
      total: number;
    };
    threatIntel: {
      total: number;
    };
    playbooks: {
      total: number;
    };
    notifications: {
      total: number;
    };
  };
}

export interface ClearDataResponse {
  message: string;
  deletedCount: number;
  description: string;
}

// Query parameters interfaces
export interface AlertRulesQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string | string[];
  isEnabled?: boolean;
  severity?: number | number[];
  search?: string;
}

export interface SystemSettingsQueryParams {
  category?: string;
}

class SettingsService {
  // System Settings methods
  async getSystemSettings(params?: SystemSettingsQueryParams): Promise<SystemSettingsResponse> {
    const response = await apiRequest.get('/settings', { params });
    return response.data;
  }

  async updateSystemSetting(id: string, data: UpdateSystemSettingRequest): Promise<{ message: string; setting: SystemSetting }> {
    const response = await apiRequest.put(`/settings/${id}`, data);
    return response.data;
  }

  // Alert Rules methods
  async getAlertRules(params?: AlertRulesQueryParams): Promise<AlertRulesResponse> {
    const response = await apiRequest.get('/settings/alert-rules', { params });
    return response.data;
  }

  async createAlertRule(data: CreateAlertRuleRequest): Promise<{ message: string; alertRule: AlertRule }> {
    const response = await apiRequest.post('/settings/alert-rules', data);
    return response.data;
  }

  async updateAlertRule(id: string, data: UpdateAlertRuleRequest): Promise<{ message: string; alertRule: AlertRule }> {
    const response = await apiRequest.put(`/settings/alert-rules/${id}`, data);
    return response.data;
  }

  async deleteAlertRule(id: string): Promise<{ message: string }> {
    const response = await apiRequest.delete(`/settings/alert-rules/${id}`);
    return response.data;
  }

  async toggleAlertRule(id: string): Promise<{ message: string; alertRule: AlertRule }> {
    const response = await apiRequest.post(`/settings/alert-rules/${id}/toggle`);
    return response.data;
  }

  // Statistics methods
  async getSettingsStats(): Promise<SettingsStatsResponse> {
    const response = await apiRequest.get('/settings/stats');
    return response.data;
  }

  // Clear Data methods
  async getDataCounts(): Promise<DataCountsResponse> {
    const response = await apiRequest.get('/settings/data-counts');
    return response;
  }

  async clearData(type: 'alerts' | 'incidents' | 'assets' | 'threatintel' | 'playbooks' | 'notifications'): Promise<ClearDataResponse> {
    const response = await apiRequest.delete(`/settings/clear-data/${type}`);
    return response;
  }
}

export default new SettingsService();