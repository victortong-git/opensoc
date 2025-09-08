import { apiRequest } from './api';

export interface AIAgentCapability {
  id: string;
  name: string;
  description: string;
  type: 'analysis' | 'automation' | 'prediction' | 'learning';
  enabled: boolean;
  accuracy: number;
  learningProgress: number;
}

export interface AIAgentTask {
  id: string;
  title: string;
  description: string;
  priority: number;
  confidence: number;
  startTime: string;
  collaboratingHuman?: string;
}

export interface AIAgentMetrics {
  successRate: number;
  tasksCompleted: number;
  tasksInProgress: number;
  uptime: number;
  collaborationScore: number;
  falsePositiveReduction?: number;
}

export interface AIAgent {
  id: string;
  name: string;
  type: 'soc_analyst' | 'incident_response' | 'threat_intel' | 'report_generation';
  status: 'online' | 'processing' | 'maintenance' | 'offline';
  description: string;
  capabilities: AIAgentCapability[];
  primaryFunctions: string[];
  metrics: AIAgentMetrics;
  currentTasks: AIAgentTask[];
  assignedHumans: string[];
  version: string;
  lastUpdated: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentActivity {
  id: string;
  user_id?: string;
  agent_id: string;
  agentName: string;
  activityType: 'task_completed' | 'learning_update' | 'collaboration' | 'error' | 'maintenance';
  title: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: string;
  impact: 'high' | 'medium' | 'low';
  humanInvolved?: string;
  agent_name?: string;
  agent_type?: string;
}

export interface SOCTeam {
  id: string;
  name: string;
  specialization: string;
  humanAnalysts: string[];
  aiAgents: string[];
  performance: {
    collaborationEfficiency: number;
    taskCompletionRate: number;
    averageResponseTime: number;
    humanSatisfactionScore: number;
    aiAccuracyImprovement: number;
  };
  currentWorkload: number;
  maxWorkload: number;
}

export interface AIAgentsResponse {
  agents: AIAgent[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AgentActivitiesResponse {
  activities: AgentActivity[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SOCTeamsResponse {
  teams: SOCTeam[];
  totalTeams: number;
  totalHumans: number;
  totalAgents: number;
}

export interface AIAgentStats {
  total: number;
  active: number;
  totalTasks: number;
  avgSuccessRate: number;
  byStatus: Array<{
    status: string;
    count: string;
  }>;
  byType: Array<{
    type: string;
    count: string;
  }>;
  recentActivity: number;
}

export interface AIAgentFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: string | string[];
  status?: string | string[];
  search?: string;
}

export interface CreateAIAgentRequest {
  name: string;
  type: 'soc_analyst' | 'incident_response' | 'threat_intel' | 'report_generation';
  description: string;
  capabilities?: AIAgentCapability[];
  primaryFunctions?: string[];
  metrics?: Partial<AIAgentMetrics>;
  currentTasks?: AIAgentTask[];
  assignedHumans?: string[];
  version?: string;
}

export interface UpdateAIAgentRequest {
  name?: string;
  type?: 'soc_analyst' | 'incident_response' | 'threat_intel' | 'report_generation';
  status?: 'online' | 'processing' | 'maintenance' | 'offline';
  description?: string;
  capabilities?: AIAgentCapability[];
  primaryFunctions?: string[];
  metrics?: Partial<AIAgentMetrics>;
  currentTasks?: AIAgentTask[];
  assignedHumans?: string[];
  version?: string;
}

export interface UpdateAgentStatusRequest {
  status: 'online' | 'processing' | 'maintenance' | 'offline';
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  agentId?: string;
  activityType?: string;
  startDate?: string;
  endDate?: string;
}

class AIAgentsService {
  private baseUrl = '/ai-agents';
  private profilesUrl = '/ai-agent-profiles';

  /**
   * Get AI agents with filtering and pagination
   */
  async getAIAgents(filters?: AIAgentFilters): Promise<AIAgentsResponse> {
    const response = await apiRequest.get<AIAgentsResponse>(this.baseUrl, { params: filters });
    return response.data || response as AIAgentsResponse;
  }

  /**
   * Get enhanced AI agent profiles with social metrics
   */
  async getEnhancedAgentProfiles(): Promise<{ success: boolean; agents: AIAgent[]; totalAgents: number }> {
    const response = await apiRequest.get<{ success: boolean; agents: AIAgent[]; totalAgents: number }>(`${this.baseUrl}/profiles`);
    return response.data || response as { success: boolean; agents: AIAgent[]; totalAgents: number };
  }

  /**
   * Get real AI agent activities with social interactions
   */
  async getRealActivities(params?: { page?: number; limit?: number; agentName?: string; taskName?: string; startDate?: string; endDate?: string }): Promise<{
    activities: Array<{
      id: number;
      agentName: string;
      taskName: string;
      description: string;
      success: boolean;
      executionTimeMs: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      socialMetrics: {
        likes: number;
        comments: number;
        likedByCurrentUser: boolean;
      };
      interactions: {
        likes: Array<{ id: string; user: any; createdAt: string }>;
        comments: Array<{ id: string; text: string; user: any; createdAt: string; isEdited: boolean; editedAt?: string }>;
      };
      metadata: any;
      createdAt: string;
      user: any;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const response = await apiRequest.get(`${this.baseUrl}/real-activities`, { params });
    return response.data || response;
  }

  /**
   * Get AI agent social feed for dashboard
   */
  async getAgentSocialFeed(limit = 10): Promise<{ success: boolean; feed: any[]; totalItems: number }> {
    const response = await apiRequest.get(`${this.baseUrl}/social-feed`, { params: { limit } });
    return response.data || response;
  }

  /**
   * Get single AI agent by ID
   */
  async getAIAgent(id: string): Promise<{ agent: AIAgent }> {
    const response = await apiRequest.get<{ agent: AIAgent }>(`${this.baseUrl}/${id}`);
    return response.data || response as { agent: AIAgent };
  }

  /**
   * Create new AI agent
   */
  async createAIAgent(agentData: CreateAIAgentRequest): Promise<{ message: string; agent: AIAgent }> {
    const response = await apiRequest.post<{ message: string; agent: AIAgent }>(this.baseUrl, agentData);
    return response.data || response as { message: string; agent: AIAgent };
  }

  /**
   * Update AI agent
   */
  async updateAIAgent(id: string, agentData: UpdateAIAgentRequest): Promise<{ message: string; agent: AIAgent }> {
    const response = await apiRequest.put<{ message: string; agent: AIAgent }>(`${this.baseUrl}/${id}`, agentData);
    return response.data || response as { message: string; agent: AIAgent };
  }

  /**
   * Delete AI agent
   */
  async deleteAIAgent(id: string): Promise<{ message: string }> {
    const response = await apiRequest.delete<{ message: string }>(`${this.baseUrl}/${id}`);
    return response.data || response as { message: string };
  }

  /**
   * Update AI agent status
   */
  async updateAgentStatus(id: string, statusData: UpdateAgentStatusRequest): Promise<{ message: string; agent: AIAgent }> {
    const response = await apiRequest.post<{ message: string; agent: AIAgent }>(`${this.baseUrl}/${id}/status`, statusData);
    return response.data || response as { message: string; agent: AIAgent };
  }

  /**
   * Get AI agent activities
   */
  async getAgentActivities(filters?: ActivityFilters): Promise<AgentActivitiesResponse> {
    const response = await apiRequest.get<AgentActivitiesResponse>(`${this.baseUrl}/activities`, { params: filters });
    return response.data || response as AgentActivitiesResponse;
  }

  /**
   * Get AI agent statistics
   */
  async getAIAgentStats(): Promise<AIAgentStats> {
    const response = await apiRequest.get<AIAgentStats>(`${this.baseUrl}/stats`);
    return response.data || response as AIAgentStats;
  }

  /**
   * Get SOC teams
   */
  async getSOCTeams(): Promise<SOCTeamsResponse> {
    const response = await apiRequest.get<SOCTeamsResponse>(`${this.baseUrl}/teams`);
    return response.data || response as SOCTeamsResponse;
  }

  /**
   * Log AI agent activity for Playbook Specialist Agent
   */
  async logAgentActivity(activityData: {
    agentName: string;
    taskName: string;
    description: string;
    inputTokens?: number;
    outputTokens?: number;
    executionTimeMs?: number;
    success?: boolean;
    errorMessage?: string;
    alertId?: string;
    incidentId?: string;
    playbookId?: string;
    aiProvider?: string;
    aiModel?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; logId: number }> {
    try {
      const response = await apiRequest.post('/ai-agent-logs', activityData);
      return response.data || response;
    } catch (error) {
      console.error('Failed to log AI agent activity:', error);
      throw error;
    }
  }
}

export default new AIAgentsService();