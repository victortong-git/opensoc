import { apiRequest } from './api';

export interface AIProvider {
  id: string;
  name: string;
  type: 'ollama' | 'vllm' | 'lmstudio';
  host: string;
  port: number;
  isEnabled: boolean;
  isConnected: boolean;
  lastHealthCheck: Date | null;
  responseTime: number;
  availableModels: string[];
  selectedModel: string;
  maxTokens: number;
  maxTokenWindow: number;
  temperature: number;
  description: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIProviderConfig {
  providers: AIProvider[];
  activeProviderId: string | null;
  globalSettings: {
    timeout: number;
    retryAttempts: number;
    enableLogging: boolean;
    enableMetrics: boolean;
    healthCheckInterval: number;
  };
}

export interface CreateAIProviderData {
  name: string;
  type: 'ollama' | 'vllm' | 'lmstudio';
  host: string;
  port: number;
  availableModels: string[];
  selectedModel: string;
  maxTokens?: number;
  maxTokenWindow?: number;
  temperature?: number;
  description?: string;
  isEnabled?: boolean;
}

export interface UpdateAIProviderData {
  name?: string;
  type?: 'ollama' | 'vllm' | 'lmstudio';
  host?: string;
  port?: number;
  availableModels?: string[];
  selectedModel?: string;
  maxTokens?: number;
  maxTokenWindow?: number;
  temperature?: number;
  description?: string;
  isEnabled?: boolean;
}

export interface ConnectionTestResult {
  isConnected: boolean;
  responseTime: number;
  error: string | null;
  availableModels: string[];
}

export interface AIProviderStats {
  totalProviders: number;
  enabledProviders: number;
  connectedProviders: number;
  avgResponseTime: number;
  availableModels: number;
  modelsList: string[];
}

export interface GlobalSettings {
  timeout?: number;
  retryAttempts?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  healthCheckInterval?: number;
}

export interface TestMessageResult {
  success: boolean;
  message: string;
  response: string | null;
  responseTime: number;
  error: string | null;
  provider: {
    id: string;
    name: string;
    type: string;
    model: string;
  };
  aiProvider?: any;
  usage?: any;
}

// API functions
export const aiProviderApi = {
  // Get all AI providers
  async getProviders(): Promise<AIProviderConfig> {
    const response = await apiRequest.get<AIProviderConfig>('/ai-providers');
    return response;
  },

  // Get active AI provider
  async getActiveProvider(): Promise<{ activeProvider: AIProvider | null }> {
    const response = await apiRequest.get<{ activeProvider: AIProvider | null }>('/ai-providers/active');
    return response;
  },

  // Get AI provider statistics
  async getStats(): Promise<AIProviderStats> {
    const response = await apiRequest.get<AIProviderStats>('/ai-providers/stats');
    return response;
  },

  // Create new AI provider
  async createProvider(data: CreateAIProviderData): Promise<{ provider: AIProvider; message: string }> {
    const response = await apiRequest.post<{ provider: AIProvider; message: string }>('/ai-providers', data);
    return response;
  },

  // Update AI provider
  async updateProvider(id: string, data: UpdateAIProviderData): Promise<{ provider: AIProvider; message: string }> {
    const response = await apiRequest.put<{ provider: AIProvider; message: string }>(`/ai-providers/${id}`, data);
    return response;
  },

  // Delete AI provider
  async deleteProvider(id: string): Promise<{ message: string }> {
    const response = await apiRequest.delete<{ message: string }>(`/ai-providers/${id}`);
    return response;
  },

  // Set active AI provider
  async setActiveProvider(id: string): Promise<{ activeProvider: AIProvider; message: string }> {
    const response = await apiRequest.put<{ activeProvider: AIProvider; message: string }>(`/ai-providers/${id}/set-active`);
    return response;
  },

  // Test AI provider connection
  async testConnection(id: string): Promise<{ result: ConnectionTestResult; provider: AIProvider; message: string }> {
    const response = await apiRequest.post<{ result: ConnectionTestResult; provider: AIProvider; message: string }>(`/ai-providers/${id}/test`, {}, {
      timeout: 60000 // 1 minute for connection tests
    });
    return response;
  },

  // Test AI provider with custom message
  async testMessage(id: string, message: string): Promise<{ result: TestMessageResult; message: string }> {
    const response = await apiRequest.post<{ result: TestMessageResult; message: string }>(`/ai-providers/${id}/test-message`, { message }, {
      timeout: 120000 // 2 minutes for AI response tests
    });
    return response;
  },

  // Update global settings
  async updateGlobalSettings(settings: GlobalSettings): Promise<{ settings: any[]; message: string }> {
    const response = await apiRequest.put<{ settings: any[]; message: string }>('/ai-providers/global-settings', settings);
    return response;
  },
};

export default aiProviderApi;