import { apiRequest } from './api';

export interface AgentProfile {
  id: string;
  name: string;
  type: string;
  bio: string;
  specialties: string[];
  profileImageUrl: string;
  status: string;
  socialMetrics: {
    totalActivities: number;
    totalLikesReceived: number;
    totalCommentsReceived: number;
    avgExecutionTimeMs?: number;
    successRatePercentage?: number;
    lastInteractionAt?: string;
    firstActivityAt?: string;
  };
  performanceStats?: {
    weekStats: any;
    monthStats: any;
    allTimeStats: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AgentActivity {
  id: number;
  agentName: string;
  taskName: string;
  description: string;
  success: boolean;
  executionTimeMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  socialMetrics: {
    likes: number;
    comments: number;
    likedByCurrentUser: boolean;
  };
  interactions: {
    likes: Array<{ id: string; user: any; createdAt: string }>;
    comments: Array<{ 
      id: string; 
      commentText: string; 
      user: any; 
      createdAt: string; 
      isEdited: boolean; 
      editedAt?: string;
      parentCommentId?: string;
    }>;
  };
  metadata?: any;
  createdAt: string;
  user?: any;
}

export interface AgentInteraction {
  id: string;
  interactionType: 'like' | 'comment';
  commentText?: string;
  createdAt: string;
}

export interface AddInteractionRequest {
  interactionType: 'like' | 'comment';
  commentText?: string;
  parentCommentId?: string;
  mentionedUsers?: string[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  value: number;
  metric: string;
  profileImageUrl: string;
}

class AIAgentProfilesService {
  private baseUrl = '/ai-agent-profiles';

  /**
   * Get all AI agent profiles with social metrics
   */
  async getAgentProfiles(params?: { 
    limit?: number; 
    offset?: number; 
    sortBy?: string; 
    sortOrder?: string; 
  }): Promise<{
    success: boolean;
    agents: AgentProfile[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }> {
    const response = await apiRequest.get(this.baseUrl, { params });
    return response.data || response;
  }

  /**
   * Get specific agent profile by name
   */
  async getAgentProfile(agentName: string): Promise<{
    success: boolean;
    agent: AgentProfile;
  }> {
    const response = await apiRequest.get(`${this.baseUrl}/${encodeURIComponent(agentName)}`);
    return response.data || response;
  }

  /**
   * Get agent activity feed (social media style)
   */
  async getAgentActivityFeed(
    agentName: string,
    params?: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    success: boolean;
    activities: AgentActivity[];
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const response = await apiRequest.get(`${this.baseUrl}/${encodeURIComponent(agentName)}/activities`, { params });
    return response.data || response;
  }

  /**
   * Get all agent activities (admin view)
   */
  async getAllAgentActivities(params?: {
    limit?: number;
    offset?: number;
    agentName?: string;
    taskName?: string;
    success?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    activities: AgentActivity[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
  }> {
    const response = await apiRequest.get(`${this.baseUrl}/activities`, { params });
    return response.data || response;
  }

  /**
   * Add interaction (like/comment) to agent activity
   */
  async addAgentInteraction(
    activityId: number,
    interactionData: AddInteractionRequest
  ): Promise<{
    success: boolean;
    message: string;
    interaction?: AgentInteraction;
    action: 'added' | 'removed';
  }> {
    const response = await apiRequest.post(`${this.baseUrl}/activities/${activityId}/interactions`, interactionData);
    return response.data || response;
  }

  /**
   * Get agent performance dashboard data
   */
  async getAgentDashboard(
    agentName: string,
    timeframe = 'week'
  ): Promise<{
    success: boolean;
    dashboard: {
      weekStats: any;
      monthStats: any;
      allTimeStats: any;
      recentActivities: AgentActivity[];
      timeframe: string;
    };
  }> {
    const response = await apiRequest.get(`${this.baseUrl}/${encodeURIComponent(agentName)}/dashboard`, {
      params: { timeframe }
    });
    return response.data || response;
  }

  /**
   * Get agent leaderboard
   */
  async getAgentLeaderboard(
    metric = 'totalActivities',
    limit = 10
  ): Promise<{
    success: boolean;
    leaderboard: LeaderboardEntry[];
    metric: string;
  }> {
    const response = await apiRequest.get(`${this.baseUrl}/leaderboard`, {
      params: { metric, limit }
    });
    return response.data || response;
  }

  /**
   * Toggle like on an activity (convenience method)
   */
  async toggleLike(activityId: number): Promise<{
    success: boolean;
    message: string;
    action: 'added' | 'removed';
  }> {
    return this.addAgentInteraction(activityId, { interactionType: 'like' });
  }

  /**
   * Add comment to an activity (convenience method)
   */
  async addComment(
    activityId: number,
    commentText: string,
    parentCommentId?: string,
    mentionedUsers?: string[]
  ): Promise<{
    success: boolean;
    message: string;
    interaction?: AgentInteraction;
    action: 'added';
  }> {
    return this.addAgentInteraction(activityId, {
      interactionType: 'comment',
      commentText,
      parentCommentId,
      mentionedUsers
    });
  }
}

export default new AIAgentProfilesService();