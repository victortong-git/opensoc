import { apiRequest } from './api';

export interface IOC {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'file_hash' | 'email' | 'registry_key';
  value: string;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  severity: 1 | 2 | 3 | 4 | 5;
  description?: string;
  source: string;
  tags: string[];
  firstSeen: string;
  lastSeen: string;
  isActive: boolean;
  relatedCampaign?: string;
  mitreAttack: string[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  sophistication: 'minimal' | 'intermediate' | 'advanced' | 'expert';
  origin: string;
  firstSeen: string;
  lastSeen: string;
  isActive: boolean;
  campaigns: string[];
  techniques: string[];
  targetSectors: string[];
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  threatActor: string;
  severity: 1 | 2 | 3 | 4 | 5;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  affectedAssets: number;
  targetSectors: string[];
  techniques: string[];
}

export interface IOCStats {
  total: number;
  active: number;
  byType: Array<{
    type: string;
    count: string;
  }>;
  byConfidence: Array<{
    confidence: string;
    count: string;
  }>;
  bySeverity: Array<{
    severity: string;
    count: string;
  }>;
  recentCount: number;
}

export interface IOCsResponse {
  iocs: IOC[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface IOCFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: string | string[];
  confidence?: string | string[];
  severity?: number | number[];
  source?: string;
  isActive?: boolean;
  search?: string;
  tags?: string | string[];
  mitreAttack?: string | string[];
  startDate?: string;
  endDate?: string;
}

export interface CreateIOCRequest {
  type: 'ip' | 'domain' | 'url' | 'file_hash' | 'email' | 'registry_key';
  value: string;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  severity: 1 | 2 | 3 | 4 | 5;
  description?: string;
  source: string;
  tags?: string[];
  firstSeen?: string;
  lastSeen?: string;
  relatedCampaign?: string;
  mitreAttack?: string[];
  isActive?: boolean;
}

export interface UpdateIOCRequest {
  type?: 'ip' | 'domain' | 'url' | 'file_hash' | 'email' | 'registry_key';
  value?: string;
  confidence?: 'low' | 'medium' | 'high' | 'very_high';
  severity?: 1 | 2 | 3 | 4 | 5;
  description?: string;
  source?: string;
  tags?: string[];
  firstSeen?: string;
  lastSeen?: string;
  relatedCampaign?: string;
  mitreAttack?: string[];
  isActive?: boolean;
}

export interface SearchIOCRequest {
  values: string[];
  exactMatch?: boolean;
}

export interface SearchIOCResponse {
  matches: IOC[];
  count: number;
  searchTerm: string[];
  exactMatch: boolean;
}

// Enhanced ThreatHuntSuggestions interface matching the new simplified schema
export interface ThreatHuntSuggestions {
  // Core fields matching new ThreatHunt schema
  title: string;
  description: string;
  huntType: 'proactive_exploration' | 'hypothesis_driven' | 'intel_driven' | 
            'behavioral_analysis' | 'infrastructure_hunt' | 'campaign_tracking' | 
            'threat_reaction' | 'compliance_hunt' | 'red_team_verification' | 
            'threat_landscape';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Professional methodology fields
  hypothesis: string;
  scope: string;
  targetSystems: string;
  timeframe: string;
  methodology: string;
  successCriteria: string;
  businessJustification: string;
  
  // Enhanced context
  threatIntelContext: {
    sourceType: 'ioc' | 'threat_actor' | 'campaign';
    sourceId: string;
    sourceData: any;
    relatedIOCs: string[];
    relatedThreatActors: string[];
    relatedCampaigns: string[];
    mitreTactics: string[];
    mitreTechniques: string[];
    threatLandscape: string;
    riskAssessment: string;
  };
  
  // Professional hunting approach
  huntingQueries: Array<{
    platform: string; // e.g., 'Splunk', 'ELK', 'KQL', 'Custom'
    query: string;
    description: string;
    expectedResults: string;
  }>;
  investigationSteps: Array<{
    step: number;
    title: string;
    description: string;
    tools: string[];
    expectedOutcome: string;
  }>;
  
  // Results prediction
  expectedFindings: string;
  threatsDetected: string[];
  falsePositiveConsiderations: string;
  coverageAssessment: string;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  effectivenessRating: number; // 1-5
  
  // Enhanced MITRE ATT&CK integration
  suggestedTTPs: Array<{
    tacticId: string;
    tacticName: string;
    techniqueId: string;
    techniqueName: string;
    huntingApproach: string;
    detectionStrategy: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  
  // Professional reporting recommendations
  reportingGuidance: {
    executiveSummaryPoints: string[];
    technicalFindings: string[];
    businessImpact: string;
    recommendedActions: string[];
  };
}

export interface AIThreatHuntResponse {
  success: boolean;
  suggestions?: ThreatHuntSuggestions;
  error?: string;
  processingTime?: number;
  sourceIOC?: {
    id: string;
    type: string;
    value: string;
    severity: number;
  };
  sourceThreatActor?: {
    id: string;
    name: string;
    sophistication: string;
  };
  sourceCampaign?: {
    id: string;
    name: string;
    severity: number;
  };
}

class ThreatIntelService {
  private baseUrl = '/threat-intel/iocs';

  /**
   * Get IOCs with filtering and pagination
   */
  async getIOCs(filters?: IOCFilters): Promise<IOCsResponse> {
    const response = await apiRequest.get<IOCsResponse>(this.baseUrl, { params: filters });
    return response.data || response as IOCsResponse;
  }

  /**
   * Get single IOC by ID
   */
  async getIOC(id: string): Promise<{ ioc: IOC }> {
    const response = await apiRequest.get<{ ioc: IOC }>(`${this.baseUrl}/${id}`);
    return response.data || response as { ioc: IOC };
  }

  /**
   * Create new IOC
   */
  async createIOC(iocData: CreateIOCRequest): Promise<{ message: string; ioc: IOC }> {
    const response = await apiRequest.post<{ message: string; ioc: IOC }>(this.baseUrl, iocData);
    return response.data || response as { message: string; ioc: IOC };
  }

  /**
   * Create multiple IOCs in bulk
   */
  async createBulkIOCs(iocs: CreateIOCRequest[]): Promise<{ message: string; count: number; iocs: IOC[] }> {
    const response = await apiRequest.post<{ message: string; count: number; iocs: IOC[] }>(`${this.baseUrl}/bulk`, { iocs });
    return response.data || response as { message: string; count: number; iocs: IOC[] };
  }

  /**
   * Update IOC
   */
  async updateIOC(id: string, iocData: UpdateIOCRequest): Promise<{ message: string; ioc: IOC }> {
    const response = await apiRequest.put<{ message: string; ioc: IOC }>(`${this.baseUrl}/${id}`, iocData);
    return response.data || response as { message: string; ioc: IOC };
  }

  /**
   * Delete IOC
   */
  async deleteIOC(id: string): Promise<{ message: string }> {
    const response = await apiRequest.delete<{ message: string }>(`${this.baseUrl}/${id}`);
    return response.data || response as { message: string };
  }

  /**
   * Deactivate IOC
   */
  async deactivateIOC(id: string): Promise<{ message: string; ioc: IOC }> {
    const response = await apiRequest.post<{ message: string; ioc: IOC }>(`${this.baseUrl}/${id}/deactivate`);
    return response.data || response as { message: string; ioc: IOC };
  }

  /**
   * Search IOCs by value patterns
   */
  async searchIOCs(searchData: SearchIOCRequest): Promise<SearchIOCResponse> {
    const response = await apiRequest.post<SearchIOCResponse>(`${this.baseUrl}/search`, searchData);
    return response.data || response as SearchIOCResponse;
  }

  /**
   * Get IOC statistics
   */
  async getIOCStats(): Promise<IOCStats> {
    const response = await apiRequest.get<IOCStats>(`${this.baseUrl}/stats`);
    return response.data || response as IOCStats;
  }

  /**
   * Get threat actors from backend API
   */
  async getThreatActors(filters?: { search?: string }): Promise<{ actors: ThreatActor[]; pagination: any }> {
    const response = await apiRequest.get<{ actors: ThreatActor[]; pagination: any }>('/threat-intel/actors', { params: filters });
    return response.data || response as { actors: ThreatActor[]; pagination: any };
  }

  /**
   * Get campaigns from backend API
   */
  async getCampaigns(filters?: { search?: string }): Promise<{ campaigns: Campaign[]; pagination: any }> {
    const response = await apiRequest.get<{ campaigns: Campaign[]; pagination: any }>('/threat-intel/campaigns', { params: filters });
    return response.data || response as { campaigns: Campaign[]; pagination: any };
  }

  /**
   * Get threat intelligence summary statistics
   */
  async getThreatIntelStats(): Promise<{
    activeIOCs: number;
    threatActors: number;
    activeCampaigns: number;
    intelligenceFeeds: number;
  }> {
    const response = await apiRequest.get<{
      activeIOCs: number;
      threatActors: number;
      activeCampaigns: number;
      intelligenceFeeds: number;
    }>('/threat-intel/stats');
    return response.data || response as {
      activeIOCs: number;
      threatActors: number;
      activeCampaigns: number;
      intelligenceFeeds: number;
    };
  }

  /**
   * AI generate threat hunt form data from IOC
   */
  async generateIOCHunt(id: string): Promise<AIThreatHuntResponse> {
    try {
      const response = await apiRequest.post<AIThreatHuntResponse>(`/threat-intel/iocs/${id}/ai-generate-hunt`, {}, {
        timeout: 120000 // 2 minutes for AI hunt generation
      });
      return response.data || response as AIThreatHuntResponse;
    } catch (error: any) {
      console.error('AI IOC hunt generation failed:', error);
      
      // Extract specific error message from API response
      let errorMessage = 'AI Hunt Generation service is not available. Please try again later.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status === 404) {
        errorMessage = 'IOC not found. Please refresh and try again.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'AI hunt generation is taking longer than expected. Please try again.';
      } else if (error?.code === 'NETWORK_ERROR') {
        errorMessage = 'Network connection error. Please check your connection.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * AI generate threat hunt form data from Threat Actor
   */
  async generateThreatActorHunt(id: string): Promise<AIThreatHuntResponse> {
    try {
      const response = await apiRequest.post<AIThreatHuntResponse>(`/threat-intel/actors/${id}/ai-generate-hunt`, {}, {
        timeout: 120000 // 2 minutes for AI hunt generation
      });
      return response.data || response as AIThreatHuntResponse;
    } catch (error: any) {
      console.error('AI Threat Actor hunt generation failed:', error);
      
      let errorMessage = 'AI Hunt Generation service is not available. Please try again later.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status === 404) {
        errorMessage = 'Threat Actor not found. Please refresh and try again.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'AI hunt generation is taking longer than expected. Please try again.';
      } else if (error?.code === 'NETWORK_ERROR') {
        errorMessage = 'Network connection error. Please check your connection.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * AI generate threat hunt form data from Campaign
   */
  async generateCampaignHunt(id: string): Promise<AIThreatHuntResponse> {
    try {
      const response = await apiRequest.post<AIThreatHuntResponse>(`/threat-intel/campaigns/${id}/ai-generate-hunt`, {}, {
        timeout: 120000 // 2 minutes for AI hunt generation
      });
      return response.data || response as AIThreatHuntResponse;
    } catch (error: any) {
      console.error('AI Campaign hunt generation failed:', error);
      
      let errorMessage = 'AI Hunt Generation service is not available. Please try again later.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status === 404) {
        errorMessage = 'Campaign not found. Please refresh and try again.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'AI hunt generation is taking longer than expected. Please try again.';
      } else if (error?.code === 'NETWORK_ERROR') {
        errorMessage = 'Network connection error. Please check your connection.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // === ENHANCED THREAT INTELLIGENCE INTEGRATION ===

  /**
   * Get comprehensive threat intelligence context for hunt creation
   */
  async getThreatIntelContext(
    sourceType: 'ioc' | 'threat_actor' | 'campaign',
    sourceId: string
  ): Promise<{
    success: boolean;
    data?: {
      sourceData: any;
      relatedIOCs: IOC[];
      relatedThreatActors: ThreatActor[];
      relatedCampaigns: Campaign[];
      mitreTactics: string[];
      mitreTechniques: string[];
      threatLandscape: string;
      riskAssessment: string;
      suggestedHuntTypes: string[];
      priorityScore: number;
    };
    error?: string;
  }> {
    try {
      const response = await apiRequest.get<{
        sourceData: any;
        relatedIOCs: IOC[];
        relatedThreatActors: ThreatActor[];
        relatedCampaigns: Campaign[];
        mitreTactics: string[];
        mitreTechniques: string[];
        threatLandscape: string;
        riskAssessment: string;
        suggestedHuntTypes: string[];
        priorityScore: number;
      }>(`/threat-intel/${sourceType}s/${sourceId}/context`);
      
      return {
        success: true,
        data: response.data || response as any
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch threat intelligence context';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get professional hunt recommendations with enhanced context
   */
  async getEnhancedHuntRecommendations(
    sourceType: 'ioc' | 'threat_actor' | 'campaign',
    sourceId: string,
    options?: {
      includeRelatedThreats?: boolean;
      includeTTPs?: boolean;
      includeReportingGuidance?: boolean;
      huntTypePreference?: string;
      organizationalContext?: string;
    }
  ): Promise<{
    success: boolean;
    recommendations?: {
      primaryHunt: ThreatHuntSuggestions;
      alternativeHunts: ThreatHuntSuggestions[];
      relatedHuntOpportunities: Array<{
        title: string;
        description: string;
        huntType: string;
        priority: string;
        reason: string;
      }>;
      threatLandscapeAssessment: string;
      organizationalImpact: string;
    };
    error?: string;
  }> {
    try {
      const response = await apiRequest.post<{
        primaryHunt: ThreatHuntSuggestions;
        alternativeHunts: ThreatHuntSuggestions[];
        relatedHuntOpportunities: Array<{
          title: string;
          description: string;
          huntType: string;
          priority: string;
          reason: string;
        }>;
        threatLandscapeAssessment: string;
        organizationalImpact: string;
      }>(`/threat-intel/${sourceType}s/${sourceId}/hunt-recommendations`, options || {}, {
        timeout: 120000 // 2 minutes for comprehensive analysis
      });

      return {
        success: true,
        recommendations: response.data || response as any
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to get hunt recommendations';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Create automated hunt from threat intelligence with smart defaults
   */
  async createSmartHuntFromIntel(
    sourceType: 'ioc' | 'threat_actor' | 'campaign',
    sourceId: string,
    customization?: {
      huntTypeOverride?: string;
      priorityOverride?: string;
      scopeModifications?: string;
      additionalContext?: string;
    }
  ): Promise<{
    success: boolean;
    huntData?: any; // ThreatHunt format for direct creation
    contextData?: any;
    recommendations?: string[];
    error?: string;
  }> {
    try {
      const response = await apiRequest.post<{
        huntData: any;
        contextData: any;
        recommendations: string[];
      }>(`/threat-intel/${sourceType}s/${sourceId}/create-smart-hunt`, customization || {}, {
        timeout: 180000 // 3 minutes for comprehensive hunt creation
      });

      return {
        success: true,
        huntData: response.data?.huntData || (response as any).huntData,
        contextData: response.data?.contextData || (response as any).contextData,
        recommendations: response.data?.recommendations || (response as any).recommendations || []
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create smart hunt from intelligence';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get hunt effectiveness predictions based on threat intelligence
   */
  async getHuntEffectivenessPrediction(
    sourceType: 'ioc' | 'threat_actor' | 'campaign',
    sourceId: string,
    huntConfiguration: {
      huntType: string;
      scope: string;
      methodology?: string;
      timeframe?: string;
    }
  ): Promise<{
    success: boolean;
    prediction?: {
      effectivenessScore: number; // 1-100
      confidenceLevel: 'low' | 'medium' | 'high' | 'very_high';
      successProbability: number; // 0-1
      expectedFindings: string[];
      falsePositiveRisk: 'low' | 'medium' | 'high';
      resourceRequirements: {
        estimatedHours: number;
        skillLevel: 'junior' | 'mid' | 'senior' | 'expert';
        toolsRequired: string[];
        dataSourcesNeeded: string[];
      };
      recommendations: string[];
      riskFactors: string[];
    };
    error?: string;
  }> {
    try {
      const response = await apiRequest.post<{
        effectivenessScore: number;
        confidenceLevel: 'low' | 'medium' | 'high' | 'very_high';
        successProbability: number;
        expectedFindings: string[];
        falsePositiveRisk: 'low' | 'medium' | 'high';
        resourceRequirements: {
          estimatedHours: number;
          skillLevel: 'junior' | 'mid' | 'senior' | 'expert';
          toolsRequired: string[];
          dataSourcesNeeded: string[];
        };
        recommendations: string[];
        riskFactors: string[];
      }>(`/threat-intel/${sourceType}s/${sourceId}/predict-effectiveness`, { huntConfiguration }, {
        timeout: 60000
      });

      return {
        success: true,
        prediction: response.data || response as any
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to predict hunt effectiveness';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get related threat intelligence for hunt expansion
   */
  async getRelatedThreatIntel(
    sourceType: 'ioc' | 'threat_actor' | 'campaign',
    sourceId: string,
    expansionCriteria?: {
      includeSimilarThreatActors?: boolean;
      includeSimilarIOCs?: boolean;
      includeSimilarCampaigns?: boolean;
      timeWindow?: string; // e.g., '30d', '90d'
      confidenceThreshold?: 'low' | 'medium' | 'high';
      maxResults?: number;
    }
  ): Promise<{
    success: boolean;
    relatedIntel?: {
      relatedIOCs: IOC[];
      relatedThreatActors: ThreatActor[];
      relatedCampaigns: Campaign[];
      correlationScore: number;
      huntOpportunities: Array<{
        title: string;
        description: string;
        potentialFindings: string[];
        confidence: string;
      }>;
    };
    error?: string;
  }> {
    try {
      const response = await apiRequest.post<{
        relatedIOCs: IOC[];
        relatedThreatActors: ThreatActor[];
        relatedCampaigns: Campaign[];
        correlationScore: number;
        huntOpportunities: Array<{
          title: string;
          description: string;
          potentialFindings: string[];
          confidence: string;
        }>;
      }>(`/threat-intel/${sourceType}s/${sourceId}/related-intel`, expansionCriteria || {});

      return {
        success: true,
        relatedIntel: response.data || response as any
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch related threat intelligence';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get threat intelligence timeline for temporal hunt planning
   */
  async getThreatIntelTimeline(
    sourceType: 'ioc' | 'threat_actor' | 'campaign',
    sourceId: string,
    timeRange?: {
      startDate?: string;
      endDate?: string;
      granularity?: 'hour' | 'day' | 'week' | 'month';
    }
  ): Promise<{
    success: boolean;
    timeline?: {
      events: Array<{
        timestamp: string;
        type: 'ioc_first_seen' | 'campaign_start' | 'technique_observed' | 'actor_activity';
        title: string;
        description: string;
        severity: string;
        confidence: string;
        relatedData: any;
      }>;
      huntingOpportunities: Array<{
        timeWindow: string;
        opportunity: string;
        reason: string;
        priority: string;
      }>;
      patterns: Array<{
        pattern: string;
        occurrences: number;
        huntImplication: string;
      }>;
    };
    error?: string;
  }> {
    try {
      const response = await apiRequest.post<{
        events: Array<{
          timestamp: string;
          type: 'ioc_first_seen' | 'campaign_start' | 'technique_observed' | 'actor_activity';
          title: string;
          description: string;
          severity: string;
          confidence: string;
          relatedData: any;
        }>;
        huntingOpportunities: Array<{
          timeWindow: string;
          opportunity: string;
          reason: string;
          priority: string;
        }>;
        patterns: Array<{
          pattern: string;
          occurrences: number;
          huntImplication: string;
        }>;
      }>(`/threat-intel/${sourceType}s/${sourceId}/timeline`, timeRange || {});

      return {
        success: true,
        timeline: response.data || response as any
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch threat intelligence timeline';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export default new ThreatIntelService();