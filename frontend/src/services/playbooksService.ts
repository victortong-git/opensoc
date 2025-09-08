import { apiRequest } from './api';

export interface PlaybookStep {
  id: string;
  name: string;
  type: 'automated' | 'manual' | 'decision';
  description: string;
  parameters?: Record<string, any>;
  timeout: number;
  isRequired: boolean;
  order: number;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  category: string;
  triggerType: 'manual' | 'automatic';
  steps: PlaybookStep[];
  isActive: boolean;
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  createdBy: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface PlaybookTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: PlaybookStep[];
}

export interface PlaybookExecution {
  id: string;
  playbookId: string;
  playbookName: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: string;
  endTime?: string;
  estimatedDuration?: number;
  steps: Array<PlaybookStep & { status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' }>;
}

export interface PlaybooksResponse {
  playbooks: Playbook[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PlaybookStats {
  total: number;
  active: number;
  byCategory: Array<{
    category: string;
    count: string;
  }>;
  recentExecutions: number;
  avgSuccessRate: number;
}

export interface PlaybookTemplatesResponse {
  templates: PlaybookTemplate[];
}

export interface PlaybookEnhancement {
  id: string;
  type: 'new_step' | 'improve_step' | 'optimize_config' | 'security_enhancement';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  reasoning: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedTimeReduction?: string;
  suggestedStep?: any;
  applied: boolean;
}

export interface PlaybookEnhancementResponse {
  message: string;
  playbook: {
    id: string;
    name: string;
    description: string;
    category: string;
    steps: any[];
  };
  enhancements: PlaybookEnhancement[];
  analysis: {
    totalSuggestions: number;
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
    categories: string[];
    executionTime: number;
    confidence: number;
  };
  aiProvider: {
    type: string;
    model: string;
    isFallback: boolean;
  };
}

export interface PlaybookReviewFinding {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  category: string;
  recommendation: string;
  affectedSteps: number[];
  impact: string;
}

export interface PlaybookReviewResponse {
  message: string;
  playbook: {
    id: string;
    name: string;
    description: string;
    category: string;
    steps: any[];
  };
  review: {
    overallScore: number;
    scores: {
      security: number;
      compliance: number;
      efficiency: number;
      completeness: number;
    };
    findings: PlaybookReviewFinding[];
    recommendations: string[];
  };
  analysis: {
    totalFindings: number;
    criticalFindings: number;
    majorFindings: number;
    minorFindings: number;
    executionTime: number;
    confidence: number;
  };
  aiProvider: {
    type: string;
    model: string;
    isFallback: boolean;
  };
}

export interface PlaybookFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string | string[];
  isActive?: boolean;
  triggerType?: string | string[];
  search?: string;
}

export interface CreatePlaybookRequest {
  name: string;
  description: string;
  category: string;
  triggerType?: 'manual' | 'automatic';
  steps?: PlaybookStep[];
  isActive?: boolean;
}

export interface UpdatePlaybookRequest {
  name?: string;
  description?: string;
  category?: string;
  triggerType?: 'manual' | 'automatic';
  steps?: PlaybookStep[];
  isActive?: boolean;
}

class PlaybooksService {
  private baseUrl = '/playbooks';

  /**
   * Get playbooks with filtering and pagination
   */
  async getPlaybooks(filters?: PlaybookFilters): Promise<PlaybooksResponse> {
    const response = await apiRequest.get<PlaybooksResponse>(this.baseUrl, { params: filters });
    return response.data || response as PlaybooksResponse;
  }

  /**
   * Get single playbook by ID
   */
  async getPlaybook(id: string): Promise<{ playbook: Playbook }> {
    const response = await apiRequest.get<{ playbook: Playbook }>(`${this.baseUrl}/${id}`);
    return response.data || response as { playbook: Playbook };
  }

  /**
   * Create new playbook
   */
  async createPlaybook(playbookData: CreatePlaybookRequest): Promise<{ message: string; playbook: Playbook }> {
    const response = await apiRequest.post<{ message: string; playbook: Playbook }>(this.baseUrl, playbookData);
    return response.data || response as { message: string; playbook: Playbook };
  }

  /**
   * Update playbook
   */
  async updatePlaybook(id: string, playbookData: UpdatePlaybookRequest): Promise<{ message: string; playbook: Playbook }> {
    const response = await apiRequest.put<{ message: string; playbook: Playbook }>(`${this.baseUrl}/${id}`, playbookData);
    return response.data || response as { message: string; playbook: Playbook };
  }

  /**
   * Delete playbook
   */
  async deletePlaybook(id: string): Promise<{ message: string }> {
    const response = await apiRequest.delete<{ message: string }>(`${this.baseUrl}/${id}`);
    return response.data || response as { message: string };
  }

  /**
   * Execute playbook
   */
  async executePlaybook(id: string): Promise<{ message: string; execution: PlaybookExecution }> {
    const response = await apiRequest.post<{ message: string; execution: PlaybookExecution }>(`${this.baseUrl}/${id}/execute`);
    return response.data || response as { message: string; execution: PlaybookExecution };
  }

  /**
   * Get playbook statistics
   */
  async getPlaybookStats(): Promise<PlaybookStats> {
    const response = await apiRequest.get<PlaybookStats>(`${this.baseUrl}/stats`);
    return response.data || response as PlaybookStats;
  }

  /**
   * Get playbook templates
   */
  async getPlaybookTemplates(): Promise<PlaybookTemplatesResponse> {
    const response = await apiRequest.get<PlaybookTemplatesResponse>(`${this.baseUrl}/templates`);
    return response.data || response as PlaybookTemplatesResponse;
  }

  /**
   * AI-powered playbook enhancement
   */
  async enhancePlaybook(id: string): Promise<PlaybookEnhancementResponse> {
    try {
      console.log('🤖 Calling AI enhancement service for playbook:', id);
      const response = await apiRequest.post<PlaybookEnhancementResponse>(
        `${this.baseUrl}/${id}/enhance`,
        {}, // Empty body for POST request
        { timeout: 180000 } // 3 minute timeout for AI processing
      );
      console.log('✅ AI enhancement completed successfully');
      return response.data || response as PlaybookEnhancementResponse;
    } catch (error) {
      console.error('❌ AI enhancement failed:', error);
      throw error;
    }
  }

  /**
   * AI-powered playbook security and compliance review
   */
  async reviewPlaybook(id: string): Promise<PlaybookReviewResponse> {
    try {
      console.log('🤖 Calling AI review service for playbook:', id);
      const response = await apiRequest.post<PlaybookReviewResponse>(
        `${this.baseUrl}/${id}/review`,
        {}, // Empty body for POST request
        { timeout: 180000 } // 3 minute timeout for AI processing
      );
      console.log('✅ AI review completed successfully');
      return response.data || response as PlaybookReviewResponse;
    } catch (error) {
      console.error('❌ AI review failed:', error);
      throw error;
    }
  }
}

export default new PlaybooksService();