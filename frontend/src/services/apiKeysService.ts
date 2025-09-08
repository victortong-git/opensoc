import api from './api';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  permissions: string[];
  createdAt: string;
  creator: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  metadata?: {
    usageCount: number;
    lastUsed: string | null;
  };
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  success: boolean;
  message: string;
  apiKey: ApiKey & {
    key: string; // Only returned on creation
  };
}

export interface ApiKeysResponse {
  success: boolean;
  apiKeys: ApiKey[];
  count: number;
}

export interface ApiKeyStatsResponse {
  success: boolean;
  stats: {
    totalUsage: number;
    lastUsed: string | null;
    createdAt: string;
    isActive: boolean;
    daysActive: number;
    permissions: string[];
    expiresAt: string | null;
    isExpired: boolean;
  };
}

class ApiKeysService {
  /**
   * Get all API keys for the organization
   */
  async getApiKeys(): Promise<ApiKeysResponse> {
    const response = await api.get('/settings/api-keys');
    return response.data;
  }

  /**
   * Create a new API key
   */
  async createApiKey(data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    const response = await api.post('/settings/api-keys', data);
    return response.data;
  }

  /**
   * Update an existing API key (limited to name changes)
   */
  async updateApiKey(id: string, data: { name: string }): Promise<{ success: boolean; message: string; apiKey: ApiKey }> {
    const response = await api.put(`/settings/api-keys/${id}`, data);
    return response.data;
  }

  /**
   * Regenerate an existing API key
   */
  async regenerateApiKey(id: string): Promise<CreateApiKeyResponse> {
    const response = await api.put(`/settings/api-keys/${id}/regenerate`);
    return response.data;
  }

  /**
   * Deactivate an API key
   */
  async deactivateApiKey(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/settings/api-keys/${id}`);
    return response.data;
  }

  /**
   * Get API key usage statistics
   */
  async getApiKeyStats(id: string): Promise<ApiKeyStatsResponse> {
    const response = await api.get(`/settings/api-keys/${id}/stats`);
    return response.data;
  }

  /**
   * Get external API documentation
   */
  async getExternalApiHelp(): Promise<any> {
    const response = await api.get('/external/help');
    return response.data;
  }

  /**
   * Test external API health with API key
   */
  async testExternalApi(apiKey: string): Promise<any> {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/external/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    return await response.json();
  }

  /**
   * Create a test alert using external API
   */
  async createTestExternalAlert(apiKey: string): Promise<any> {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/external/alerts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Alert from API Integration',
        description: 'This is a test alert created through the external API to verify integration functionality.',
        severity: 2,
        sourceSystem: 'Integration Test',
        eventTime: new Date().toISOString(),
        assetName: 'Test System',
        category: 'test',
        rawData: {
          testMode: true,
          createdAt: new Date().toISOString(),
          testType: 'api_integration_verification'
        }
      })
    });
    
    return await response.json();
  }
}

export default new ApiKeysService();