import { apiRequest } from './api';
import { Alert, AlertFilter } from '../types';

export interface AlertsResponse {
  alerts: Alert[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateAlertRequest {
  title: string;
  description?: string;
  severity: number;
  sourceSystem: string;
  eventTime: Date;
  assetId?: string;
  assetName?: string;
  rawData?: Record<string, any>;
  enrichmentData?: Record<string, any>;
  assignedAgent?: string;
}

export interface UpdateAlertRequest {
  title?: string;
  description?: string;
  severity?: number;
  status?: 'new' | 'investigating' | 'resolved' | 'false_positive';
  assignedAgent?: string;
  enrichmentData?: Record<string, any>;
}

export interface BulkUpdateRequest {
  alertIds: string[];
  updateData: UpdateAlertRequest;
}

export interface EscalateAlertRequest {
  title?: string;
  description?: string;
  severity?: number;
  category?: string;
  assignedTo?: string;
}

export interface ResolveAlertRequest {
  resolution: 'resolved' | 'false_positive';
  remarks: string;
  reasoning?: string;
}

export interface ResolveAlertResponse {
  message: string;
  alert: Alert;
  resolveRemarks: {
    resolvedBy: string;
    resolvedAt: string;
    resolutionType: string;
    remarks: string;
    reasoning?: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    autoResolved: boolean;
  };
}

export interface AlertStats {
  totalAlerts: number;
  severityBreakdown: { severity: number; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  topSources: { sourceSystem: string; count: number }[];
  timeSeriesData: { date: string; count: number }[];
}

// Lightweight AI Classification Result - for quick categorization and tagging
export interface AIClassificationResult {
  securityEventType: string;
  securityEventTypeReasoning: string;
  eventTags: {
    tag: string;
    category: 'technical' | 'behavioral' | 'contextual' | 'correlation';
    confidence: number;
    reasoning?: string;
  }[];
  correlationPotential: 'low' | 'medium' | 'high';
  correlationReasoning: string;
  overallConfidence: number;
  tagCount: number;
  classificationTimestamp: string;
  processingTimeMs?: number;
  aiModel?: string;
  toolExecutionId?: string;
}

// Comprehensive AI Analysis Result - for full SOC analyst-level investigation
export interface AIAnalysisResult {
  summary: string;
  explanation: string;
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    factors: string[];
  };
  recommendedActions: {
    immediate: string[];
    followUp: string[];
  };
  confidence: number;
  autoResolutionRecommendation?: {
    shouldAutoResolve: boolean;
    resolutionType: 'resolved' | 'false_positive';
    reasoning: string;
    confidenceLevel: number;
  };
  analysisTimestamp: string;
  processingTimeMs?: number;
  aiModel?: string;
  toolExecutionId?: string;
  twoStepAnalysis?: boolean;
  incidentVerification?: {
    isLikelyIncident: boolean;
    confidence: number;
    verificationCriteria: {
      initialValidation: {
        hasReporterInfo: boolean;
        hasTimelineInfo: boolean;
        hasLocationInfo: boolean;
        hasTechnicalDetails: boolean;
        assessment: string;
      };
      falsePositiveIndicators: {
        score: number;
        indicators: string[];
        assessment: string;
      };
      impactAssessment: {
        businessCriticality: 'low' | 'medium' | 'high' | 'critical';
        affectedSystems: string[];
        dataAtRisk: string;
        operationalImpact: string;
      };
      technicalValidation: {
        hasValidIOCs: boolean;
        behaviorAnalysis: string;
        networkActivity: string;
        systemChanges: string;
      };
      contextGathering: {
        similarRecentAlerts: boolean;
        knownThreats: string[];
        environmentalFactors: string[];
      };
    };
    recommendedVerificationActions: {
      immediate: string[];
      investigation: string[];
      escalation: string;
    };
    artifactsToCollect: string[];
    reasoning: string;
  };
}

export interface AIAnalysisResponse {
  success: boolean;
  analysis?: AIAnalysisResult;
  error?: string;
  alert?: {
    id: string;
    title: string;
    severity: number;
  };
  processingTimeMs?: number;
}

export interface AIClassificationResponse {
  success: boolean;
  classification?: AIClassificationResult;
  alert?: {
    id: string;
    title: string;
    severity: number;
    status: string;
    securityEventType: string;
    eventTags: {
      tag: string;
      category: 'technical' | 'behavioral' | 'contextual' | 'correlation';
      confidence: number;
      reasoning?: string;
    }[];
    tagsConfidence: number;
  };
  error?: string;
}

export interface AIIncidentFormSuggestions {
  title: string;
  description: string;
  severity: number;
  category: 'malware' | 'intrusion' | 'data_breach' | 'policy_violation' | 'insider_threat';
  responseplan: string;
  impactAssessment: string;
  recommendedActions: string[];
  stakeholders: string[];
  estimatedTimeline: string;
  investigationPlan: string;
  containmentStrategy: string;
  confidence: number;
}

export interface AIIncidentFormResponse {
  success: boolean;
  suggestions?: AIIncidentFormSuggestions;
  error?: string;
  processingTime?: number;
  sourceAlert?: {
    id: string;
    title: string;
    severity: number;
  };
  hasExistingAnalysis?: boolean;
}

export interface ProofReadRequest {
  fields: Record<string, string>;
}

export interface ProofReadResponse {
  success: boolean;
  suggestions: Record<string, string>;
  error?: string;
  processingTime?: number;
  fieldsProcessed?: number;
  improvementsFound?: number;
  message?: string;
}

export interface AlertIncidentsResponse {
  success: boolean;
  incidents: any[]; // TODO: Replace with proper Incident type when available
  count: number;
  alert: {
    id: string;
    title: string;
    severity: number;
    status: string;
  };
  error?: string;
}

export interface GeneratePlaybooksRequest {
  forceRegenerate?: boolean;
}

export interface GeneratedPlaybook {
  id: string;
  name: string;
  description: string;
  playbookType: 'immediate_action' | 'investigation';
  category: string;
  steps: PlaybookStep[];
  createdAt: string;
  metadata?: {
    sourceAlert?: {
      id: string;
      title: string;
      severity: number;
      securityEventType: string;
    };
    assetInfo?: {
      name: string;
      type: string;
      criticality: string;
    };
    aiGenerationMetadata?: {
      generatedAt: string;
      confidence: number;
      processingModel: string;
      playbookType: string;
      estimatedTime?: string;
      prerequisites?: string[];
      successCriteria?: string[];
      deliverables?: string[];
      legalConsiderations?: string[];
    };
  };
}

export interface PlaybookStep {
  id: number;
  title: string;
  description: string;
  expectedTime?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  tools?: string[];
  commands?: string[];
  validation?: string;
  escalationCondition?: string;
  artifacts?: string[];
  documentation?: string;
}

export interface GeneratePlaybooksResponse {
  success: boolean;
  message: string;
  playbooks: GeneratedPlaybook[];
  processingTimeMs: number;
  regenerated: boolean;
  alert: {
    id: string;
    title: string;
    severity: number;
    securityEventType: string;
    riskLevel: string;
    confidence: number;
  };
  metadata: {
    playbookTypes: string[];
    hasAssetInfo: boolean;
    aiModel: string;
  };
  error?: string;
}

export interface GeneratePlaybookResponse {
  success: boolean;
  message: string;
  playbook: GeneratedPlaybook | null;
  updated: boolean;
  processingTimeMs: number;
  timestamp: string;
  alert: {
    id: string;
    title: string;
    severity: number;
    securityEventType: string;
  };
  error?: string;
}

export interface MitreAnalysisResponse {
  success: boolean;
  data?: {
    success: boolean;
    alert_id: string;
    analysis_timestamp: string;
    processing_time_ms: number;
    domain_classification: {
      success: boolean;
      classified_domains: string[];
      domain_scores: Record<string, number>;
      domain_details: Record<string, any>;
      analysis_summary: {
        primary_domain: string;
        total_domains: number;
        confidence: number;
        text_analyzed: number;
      };
    };
    ttp_mapping: {
      success: boolean;
      search_query: string;
      domains_searched: string[];
      total_techniques: number;
      techniques: MitreTechnique[];
      domain_breakdown: Record<string, any>;
      search_metadata: any;
    };
    enriched_analysis: {
      success: boolean;
      ai_analysis?: string;
      analyst_guidance: string[];
      processing_time_ms?: number;
      ai_model?: string;
    };
    summary: {
      classified_domains: string[];
      total_techniques_mapped: number;
      high_confidence_techniques: number;
      kill_chain_coverage: {
        covered_tactics: string[];
        missing_tactics: string[];
        coverage_percentage: number;
        tactic_breakdown: Record<string, string[]>;
      };
      ai_enhancement_applied: boolean;
    };
  };
  metadata?: {
    analysis_timestamp: string;
    processing_time_ms: number;
    domains_analyzed: number;
    techniques_mapped: number;
    ai_enrichment_enabled: boolean;
  };
  error?: string;
  fallback_guidance?: string[];
}

export interface MitreTechnique {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  tactics: string[];
  data_sources: string[];
  detection: string;
  is_sub_technique: boolean;
  url?: string;
  version?: string;
  source_domain: string;
  stix_id?: string;
  additional_domains?: string[];
  confidence_score?: number;
  relevance_factors?: {
    domain_score: number;
    multi_domain: number;
    platform_matches: number;
    has_detection: boolean;
  };
}

export interface GetAlertPlaybooksResponse {
  success: boolean;
  playbooks: GeneratedPlaybook[];
  count: number;
  alert: {
    id: string;
    title: string;
    severity: number;
    hasAiAnalysis: boolean;
    playbooksGeneratedAt?: string;
  };
  playbookTypes: {
    id: string;
    type: string;
    name: string;
    createdAt: string;
  }[];
}

export interface PlaybookGenerationStatusResponse {
  success: boolean;
  alert: {
    id: string;
    title: string;
  };
  status: {
    hasAiAnalysis: boolean;
    aiAnalysisTimestamp?: string;
    hasGeneratedPlaybooks: boolean;
    playbooksGeneratedAt?: string;
    canGeneratePlaybooks: boolean;
    playbookIds: string[];
  };
}

class AlertService {
  // Get alerts with filtering and pagination
  async getAlerts(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    severity?: number | number[];
    status?: string | string[];
    sourceSystem?: string | string[];
    assetId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }): Promise<AlertsResponse> {
    const response = await apiRequest.get<AlertsResponse>('/alerts', { params });
    return response;
  }

  // Get single alert
  async getAlert(id: string): Promise<Alert> {
    const response = await apiRequest.get<{ alert: Alert }>(`/alerts/${id}`);
    return response.alert;
  }

  // Create new alert
  async createAlert(data: CreateAlertRequest): Promise<Alert> {
    const response = await apiRequest.post<{ alert: Alert; message: string }>('/alerts', data);
    return response.alert;
  }

  // Update alert
  async updateAlert(id: string, data: UpdateAlertRequest): Promise<Alert> {
    const response = await apiRequest.put<{ alert: Alert; message: string }>(`/alerts/${id}`, data);
    return response.alert;
  }

  // Delete alert
  async deleteAlert(id: string): Promise<void> {
    await apiRequest.delete<{ message: string }>(`/alerts/${id}`);
  }

  // Bulk update alerts
  async bulkUpdateAlerts(data: BulkUpdateRequest): Promise<{ updatedCount: number }> {
    const response = await apiRequest.put<{ updatedCount: number; message: string }>('/alerts/bulk', data);
    return { updatedCount: response.updatedCount };
  }

  // Resolve alert with remarks
  async resolveAlert(id: string, data: ResolveAlertRequest): Promise<ResolveAlertResponse> {
    const response = await apiRequest.post<ResolveAlertResponse>(`/alerts/${id}/resolve`, data);
    return response;
  }

  // Escalate alert to incident
  async escalateAlert(id: string, data: EscalateAlertRequest): Promise<{ incident: any; alert: Alert }> {
    const response = await apiRequest.post<{ incident: any; alert: Alert; message: string }>(`/alerts/${id}/escalate`, data);
    return { incident: response.incident, alert: response.alert };
  }

  // Get alert statistics
  async getAlertStats(days?: number): Promise<AlertStats> {
    const params = days ? { days: days.toString() } : {};
    const response = await apiRequest.get<AlertStats>('/alerts/stats', { params });
    return response;
  }

  // Get AI analysis for alert
  async analyzeAlert(id: string): Promise<AIAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 Starting AI analysis for alert ${id}...`);
      const response = await apiRequest.post<AIAnalysisResponse>(`/alerts/${id}/ai-analysis`, {}, {
        timeout: 120000 // 2 minutes for AI analysis
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ AI analysis completed in ${duration}ms`);
      
      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Alert AI analysis failed after ${duration}ms:`, error);
      
      // Detailed error handling based on error type
      let errorMessage = 'AI Service is not available. Please try again later.';
      
      if (error?.code === 'ECONNABORTED' && error?.message?.includes('timeout')) {
        console.error('🕒 AI Analysis timeout detected');
        errorMessage = `AI analysis timed out after ${Math.round(duration / 1000)} seconds. The analysis may still be processing in the background.`;
      } else if (error?.response?.status === 408) {
        console.error('🕒 Server timeout');
        errorMessage = 'AI analysis is taking longer than expected. Please try again in a moment.';
      } else if (error?.response?.status === 429) {
        console.error('🚫 Rate limit exceeded');
        errorMessage = 'Too many AI analysis requests. Please wait before trying again.';
      } else if (error?.response?.status === 503) {
        console.error('🔧 Service unavailable');
        errorMessage = 'AI service is temporarily unavailable. Please try again later.';
      } else if (error?.response?.status >= 500) {
        console.error('🚨 Server error:', error?.response?.data);
        errorMessage = 'AI analysis service encountered an error. Please contact support if this persists.';
      } else if (error?.response?.data?.error) {
        console.error('📝 API error response:', error.response.data);
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        console.error('🔍 Error details:', error.message);
        if (error.message.includes('Network Error')) {
          errorMessage = 'Network error occurred during AI analysis. Please check your connection and try again.';
        }
      }
      
      // Log additional debugging info
      console.error('🔍 AI Analysis Error Debug Info:', {
        alertId: id,
        duration: `${duration}ms`,
        errorCode: error?.code,
        httpStatus: error?.response?.status,
        errorMessage: error?.message,
        responseData: error?.response?.data
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Get AI classification for alert including comprehensive tags and event type
  async aiClassification(id: string, options?: { refreshAnalysis?: boolean }): Promise<AIClassificationResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🏷️ SERVICE: Starting AI classification API call for alert ${id}`);
      console.log(`🏷️ SERVICE: Calling POST /alerts/${id}/ai-classification`);
      
      const response = await apiRequest.post<AIClassificationResponse>(`/alerts/${id}/ai-classification`, options, {
        timeout: 120000 // 2 minutes for AI classification
      });
      
      const duration = Date.now() - startTime;
      console.log(`🏷️ SERVICE: API response received in ${duration}ms`);
      console.log(`🏷️ SERVICE: Response validation:`, {
        success: response.success,
        hasClassification: !!response.classification,
        classificationKeys: response.classification ? Object.keys(response.classification) : [],
        hasContaminatedData: !!(
          response.classification?.recommendedActions ||
          response.classification?.summary ||
          response.classification?.riskAssessment
        )
      });
      
      if (response.classification?.recommendedActions) {
        console.error(`❌ SERVICE: Classification response contains recommendedActions contamination!`);
      }
      if (response.classification?.summary) {
        console.error(`❌ SERVICE: Classification response contains summary contamination!`);
      }
      if (response.classification?.riskAssessment) {
        console.error(`❌ SERVICE: Classification response contains riskAssessment contamination!`);
      }
      
      console.log(`✅ SERVICE: AI classification completed in ${duration}ms`);
      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ SERVICE: Alert AI classification failed after ${duration}ms:`, error);
      
      // Detailed error handling
      let errorMessage = 'AI Classification service is not available. Please try again later.';
      
      if (error?.code === 'ECONNABORTED' && error?.message?.includes('timeout')) {
        console.error('🕒 SERVICE: AI Classification timeout detected');
        errorMessage = `AI classification timed out after ${Math.round(duration / 1000)} seconds. The classification may still be processing in the background.`;
      } else if (error?.response?.status === 408) {
        console.error('🕒 SERVICE: Server timeout');
        errorMessage = 'AI classification is taking longer than expected. Please try again in a moment.';
      } else if (error?.response?.status === 429) {
        console.error('🚫 SERVICE: Rate limit exceeded');
        errorMessage = 'Too many AI classification requests. Please wait before trying again.';
      } else if (error?.response?.status === 503) {
        console.error('🔧 SERVICE: Service unavailable');
        errorMessage = 'AI classification service is temporarily unavailable. Please try again later.';
      } else if (error?.response?.status >= 500) {
        console.error('🚨 SERVICE: Server error:', error?.response?.data);
        errorMessage = 'AI classification service encountered an error. Please contact support if this persists.';
      } else if (error?.response?.data?.error) {
        console.error('📝 SERVICE: API error response:', error.response.data);
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        console.error('🔍 SERVICE: Error details:', error.message);
        if (error.message.includes('Network Error')) {
          errorMessage = 'Network error occurred during AI classification. Please check your connection and try again.';
        }
      }
      
      console.error('🔍 SERVICE: Classification Error Debug Info:', {
        alertId: id,
        duration: `${duration}ms`,
        errorCode: error?.code,
        httpStatus: error?.response?.status,
        errorMessage: error?.message,
        responseData: error?.response?.data
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // AI generate incident form data from alert and analysis
  async generateIncidentForm(id: string): Promise<AIIncidentFormResponse> {
    try {
      const response = await apiRequest.post<AIIncidentFormResponse>(`/alerts/${id}/ai-generate-incident-form`, {}, {
        timeout: 120000 // 2 minutes for AI incident form generation
      });
      return response;
    } catch (error: any) {
      console.error('AI incident form generation failed:', error);
      
      // Extract specific error message from API response
      let errorMessage = 'AI Service is not available. Please try again later.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status === 404) {
        errorMessage = 'Alert not found. Please refresh and try again.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'AI analysis is taking longer than expected. Please try again.';
      } else if (error?.code === 'NETWORK_ERROR') {
        errorMessage = 'Network connection error. Please check your connection.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // AI proof read incident form fields
  async proofReadIncidentFields(fields: Record<string, string>): Promise<ProofReadResponse> {
    try {
      const response = await apiRequest.post<ProofReadResponse>('/alerts/proof-read', { fields });
      return response;
    } catch (error: any) {
      console.error('AI proofreading failed:', error);
      
      // Extract specific error message from API response
      let errorMessage = 'AI proofreading service is not available. Please try again later.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred during proofreading. Please try again later.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Proofreading is taking longer than expected. Please try again.';
      } else if (error?.code === 'NETWORK_ERROR') {
        errorMessage = 'Network connection error. Please check your connection.';
      }
      
      return {
        success: false,
        suggestions: {},
        error: errorMessage
      };
    }
  }

  // Get incidents created from this alert (reverse lookup)
  async getAlertIncidents(id: string): Promise<AlertIncidentsResponse> {
    try {
      const response = await apiRequest.get<AlertIncidentsResponse>(`/alerts/${id}/incidents`);
      return response;
    } catch (error: any) {
      console.error('Failed to fetch alert incidents:', error);
      
      let errorMessage = 'Failed to fetch related incidents. Please try again later.';
      
      if (error?.response?.status === 404) {
        errorMessage = 'Alert not found. Please refresh and try again.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      }
      
      return {
        success: false,
        incidents: [],
        count: 0,
        alert: {
          id,
          title: 'Unknown',
          severity: 1,
          status: 'unknown'
        },
        error: errorMessage
      };
    }
  }

  // Get alert timeline events
  async getAlertTimeline(id: string): Promise<{
    success: boolean;
    timeline: any[];
    count: number;
    alert: {
      id: string;
      title: string;
      severity: number;
      status: string;
    };
    error?: string;
  }> {
    try {
      const response = await apiRequest.get(`/alerts/${id}/timeline`);
      return response;
    } catch (error) {
      console.error('Failed to get alert timeline:', error);
      let errorMessage = 'Failed to load alert timeline';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      } else if (error && typeof error === 'object' && 'error' in error) {
        errorMessage = String((error as any).error);
      } else if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        } else if (response?.status === 404) {
          errorMessage = 'Alert not found';
        } else if (response?.status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && error.toString && error.toString() !== '[object Object]') {
        errorMessage = error.toString();
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      }
      
      return {
        success: false,
        timeline: [],
        count: 0,
        alert: {
          id,
          title: 'Unknown',
          severity: 1,
          status: 'unknown'
        },
        error: errorMessage
      };
    }
  }

  // Update incident confirmation details for alert
  async updateIncidentConfirmation(id: string, data: { confirmationDetails: any }): Promise<{
    success: boolean;
    message?: string;
    alert?: {
      id: string;
      title: string;
      incidentConfirmationDetails: any;
    };
    error?: string;
  }> {
    try {
      const response = await apiRequest.put(`/alerts/${id}/incident-confirmation`, data);
      return response;
    } catch (error: any) {
      console.error('Failed to update incident confirmation:', error);
      
      let errorMessage = 'Failed to update incident confirmation. Please try again later.';
      
      if (error?.response?.status === 404) {
        errorMessage = 'Alert not found. Please refresh and try again.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'You do not have permission to update incident confirmation.';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Get incident confirmation details for alert
  async getIncidentConfirmation(id: string): Promise<{
    success: boolean;
    alert?: {
      id: string;
      title: string;
      severity: number;
      status: string;
      incidentConfirmationDetails: any;
      aiAnalysis: any;
    };
    error?: string;
  }> {
    try {
      const response = await apiRequest.get(`/alerts/${id}/incident-confirmation`);
      return response;
    } catch (error: any) {
      console.error('Failed to fetch incident confirmation:', error);
      
      let errorMessage = 'Failed to fetch incident confirmation. Please try again later.';
      
      if (error?.response?.status === 404) {
        errorMessage = 'Alert not found. Please refresh and try again.';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Generate AI-powered playbooks for alert
  async generatePlaybooks(id: string, options: GeneratePlaybooksRequest = {}): Promise<GeneratePlaybooksResponse> {
    try {
      // Use extended timeout for AI operations (2 minutes)
      const response = await apiRequest.post(`/alerts/${id}/generate-playbooks`, options, {
        timeout: 120000 // 2 minutes for AI generation
      });
      return response;
    } catch (error: any) {
      console.error('Failed to generate playbooks:', error);
      
      let errorMessage = 'Failed to generate playbooks. Please try again later.';
      
      if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.error || 'AI analysis must be completed before generating playbooks.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Alert not found. Please refresh and try again.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'You do not have permission to generate playbooks.';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Server error occurred during playbook generation. Please try again later.';
      }
      
      return {
        success: false,
        message: 'Playbook generation failed',
        playbooks: [],
        processingTimeMs: 0,
        regenerated: false,
        alert: {
          id: id,
          title: '',
          severity: 1,
          securityEventType: '',
          riskLevel: '',
          confidence: 0
        },
        metadata: {
          playbookTypes: [],
          hasAssetInfo: false,
          aiModel: ''
        },
        error: errorMessage
      };
    }
  }

  // Get generated playbooks for alert
  async getAlertPlaybooks(id: string): Promise<GetAlertPlaybooksResponse> {
    try {
      const response = await apiRequest.get(`/alerts/${id}/playbooks`);
      return response;
    } catch (error: any) {
      console.error('Failed to fetch alert playbooks:', error);
      
      let errorMessage = 'Failed to fetch alert playbooks. Please try again later.';
      
      if (error?.response?.status === 404) {
        errorMessage = 'Alert not found. Please refresh and try again.';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      }
      
      return {
        success: false,
        playbooks: [],
        count: 0,
        alert: {
          id: id,
          title: '',
          severity: 1,
          hasAiAnalysis: false
        },
        playbookTypes: []
      };
    }
  }

  // Delete generated playbooks for alert
  async deleteAlertPlaybooks(id: string): Promise<{ success: boolean; message: string; deletedCount?: number; error?: string }> {
    try {
      const response = await apiRequest.delete(`/alerts/${id}/playbooks`);
      return response;
    } catch (error: any) {
      console.error('Failed to delete alert playbooks:', error);
      
      let errorMessage = 'Failed to delete alert playbooks. Please try again later.';
      
      if (error?.response?.status === 404) {
        errorMessage = 'Alert not found. Please refresh and try again.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'You do not have permission to delete playbooks.';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      }
      
      return {
        success: false,
        message: 'Failed to delete playbooks',
        error: errorMessage
      };
    }
  }

  // Get playbook generation status for alert
  async getPlaybookGenerationStatus(id: string): Promise<PlaybookGenerationStatusResponse> {
    try {
      const response = await apiRequest.get(`/alerts/${id}/playbooks/status`);
      return response;
    } catch (error: any) {
      console.error('Failed to fetch playbook generation status:', error);
      
      return {
        success: false,
        alert: {
          id: id,
          title: ''
        },
        status: {
          hasAiAnalysis: false,
          hasGeneratedPlaybooks: false,
          canGeneratePlaybooks: false,
          playbookIds: []
        }
      };
    }
  }

  // Preview playbook generation context (debugging/validation)
  async previewPlaybookContext(id: string): Promise<{
    success: boolean;
    contextPreview?: any;
    readyForGeneration?: boolean;
    estimatedTokens?: number;
    error?: string;
  }> {
    try {
      const response = await apiRequest.get(`/alerts/${id}/playbooks/preview`);
      return response;
    } catch (error: any) {
      console.error('Failed to fetch playbook context preview:', error);
      
      let errorMessage = 'Failed to fetch playbook context preview.';
      
      if (error?.response?.status === 404) {
        errorMessage = 'Alert not found.';
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.error || 'AI analysis required for preview.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Generate immediate action playbook for alert
  async generateImmediatePlaybook(id: string): Promise<GeneratePlaybookResponse> {
    try {
      // Use extended timeout for AI operations (2 minutes)
      const response = await apiRequest.post(`/alerts/${id}/generate-immediate-playbook`, {}, {
        timeout: 120000 // 2 minutes for AI generation
      });
      return response;
    } catch (error: any) {
      console.error('Failed to generate immediate action playbook:', error);
      
      let errorMessage = 'Failed to generate immediate action playbook. Please try again later.';
      
      if (error?.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid request. Please check alert requirements.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Alert not found.';
      } else if (error?.response?.status === 500) {
        errorMessage = error.response.data?.error || 'Server error occurred during playbook generation. Please try again later.';
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        errorMessage = 'Playbook generation is taking longer than expected. Please check back in a few moments.';
      }
      
      return {
        success: false,
        message: 'Immediate action playbook generation failed',
        playbook: null,
        updated: false,
        processingTimeMs: 0,
        timestamp: new Date().toISOString(),
        alert: {
          id: id,
          title: '',
          severity: 1,
          securityEventType: ''
        },
        error: errorMessage
      };
    }
  }

  // Generate investigation playbook for alert
  async generateInvestigationPlaybook(id: string): Promise<GeneratePlaybookResponse> {
    try {
      // Use extended timeout for AI operations (3 minutes for complex investigation playbooks)
      const response = await apiRequest.post(`/alerts/${id}/generate-investigation-playbook`, {}, {
        timeout: 180000 // 3 minutes for AI generation
      });
      return response;
    } catch (error: any) {
      console.error('Failed to generate investigation playbook:', error);
      
      let errorMessage = 'Failed to generate investigation playbook. Please try again later.';
      
      if (error?.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid request. Please check alert requirements.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Alert not found.';
      } else if (error?.response?.status === 500) {
        errorMessage = error.response.data?.error || 'Server error occurred during playbook generation. Please try again later.';
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        errorMessage = 'Investigation playbook generation is taking longer than expected. Please check back in a few moments.';
      }
      
      return {
        success: false,
        message: 'Investigation playbook generation failed',
        playbook: null,
        updated: false,
        processingTimeMs: 0,
        timestamp: new Date().toISOString(),
        alert: {
          id: id,
          title: '',
          severity: 1,
          securityEventType: ''
        },
        error: errorMessage
      };
    }
  }

  // Analyze alert using multi-domain MITRE ATT&CK framework
  async analyzeMitreAttack(id: string): Promise<MitreAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🎯 Starting MITRE ATT&CK analysis for alert ${id}...`);
      
      const response = await apiRequest.post<MitreAnalysisResponse>(`/mitre/analyze-alert`, {
        alert_id: id
      }, {
        timeout: 300000 // 5 minutes for comprehensive analysis
      });

      const duration = Date.now() - startTime;
      console.log(`✅ MITRE analysis completed in ${duration}ms`);
      
      if (response.success) {
        console.log(`🎯 Analysis results:`, {
          domains: response.data?.domain_classification?.classified_domains,
          techniques: response.data?.ttp_mapping?.total_techniques,
          processingTime: response.data?.processing_time_ms
        });
      }

      return response;
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ MITRE Analysis failed:', error);
      
      let errorMessage = 'MITRE ATT&CK analysis failed. Please try again later.';
      
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        console.error('🕒 MITRE Analysis timeout detected');
        errorMessage = `MITRE analysis timed out after ${Math.round(duration / 1000)} seconds. The analysis may still be processing in the background.`;
      } else if (error?.response?.status === 404) {
        console.error('🔍 Alert not found');
        errorMessage = 'Alert not found. Please check the alert ID.';
      } else if (error?.response?.status === 429) {
        console.error('🚫 Rate limit exceeded');
        errorMessage = 'Too many MITRE analysis requests. Please wait before trying again.';
      } else if (error?.response?.status === 503) {
        console.error('🔧 Service unavailable');
        errorMessage = 'MITRE analysis service is temporarily unavailable. Please try again later.';
      } else if (error?.response?.status >= 500) {
        console.error('🚨 Server error:', error?.response?.data);
        errorMessage = 'MITRE analysis service encountered an error. Please contact support if this persists.';
      } else if (error?.response?.data?.error) {
        console.error('📝 API error response:', error.response.data);
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        console.error('🔍 Error details:', error.message);
        if (error.message.includes('Network Error')) {
          errorMessage = 'Network error occurred during MITRE analysis. Please check your connection and try again.';
        }
      }
      
      console.error('🔍 MITRE Analysis Error Debug Info:', {
        alertId: id,
        duration: `${duration}ms`,
        errorCode: error?.code,
        httpStatus: error?.response?.status,
        errorMessage: error?.message,
        responseData: error?.response?.data
      });
      
      return {
        success: false,
        error: errorMessage,
        fallback_guidance: [
          'Manual MITRE analysis recommended',
          'Review alert against Enterprise domain techniques',
          'Consider threat hunting based on alert indicators',
          'Consult MITRE ATT&CK framework documentation'
        ]
      };
    }
  }

  // Export playbook as PDF
  async exportPlaybookPDF(alertId: string, playbookId: string): Promise<Blob> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/playbooks/${playbookId}/export-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error: any) {
      console.error('Failed to export playbook PDF:', error);
      throw new Error('Failed to export playbook as PDF. Please try again.');
    }
  }

  /**
   * Submit human feedback for AI classification
   */
  async submitAIFeedback(alertId: string, feedbackData: any): Promise<any> {
    let cleanedFeedbackData: any;
    
    try {
      console.log('🎯 Starting AI feedback submission for alert:', alertId);
      console.log('📊 Original feedback data:', feedbackData);
      
      // Clean the feedback data to remove null values and undefined values
      cleanedFeedbackData = Object.fromEntries(
        Object.entries(feedbackData).filter(([_, value]) => value !== null && value !== undefined)
      );
      
      // Ensure required fields are present
      if (!cleanedFeedbackData.overallConfidence || typeof cleanedFeedbackData.overallConfidence !== 'number') {
        cleanedFeedbackData.overallConfidence = 5; // Default confidence
      }
      
      // Ensure overallConfidence is within valid range
      cleanedFeedbackData.overallConfidence = Math.max(1, Math.min(10, cleanedFeedbackData.overallConfidence));
      
      console.log('🧹 Cleaned feedback data:', cleanedFeedbackData);
      
      const response = await apiRequest.post(`/ai-tools/fine-tuning/feedback/${alertId}`, cleanedFeedbackData);
      console.log('📨 API response received:', response);

      if (response.success) {
        console.log('✅ AI feedback submitted successfully');
        return response.data;
      } else {
        console.error('❌ API returned error:', response.error);
        throw new Error(response.error || 'Failed to submit feedback');
      }
    } catch (error: any) {
      console.error('❌ Failed to submit AI feedback - full error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        serverError: error.response?.data?.error,
        validationDetails: error.response?.data?.details,
        alertId: alertId,
        originalFeedbackData: feedbackData,
        cleanedFeedbackData: cleanedFeedbackData
      });
      
      // Provide more specific error messages
      if (error.response?.status === 400) {
        const details = error.response?.data?.details;
        if (details && Array.isArray(details)) {
          const fieldErrors = details.map((d: any) => `${d.field}: ${d.message}`).join('; ');
          throw new Error(`Validation failed: ${fieldErrors}`);
        }
        throw new Error(error.response?.data?.message || 'Invalid feedback data. Please check your input.');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Failed to submit feedback. Please try again.');
    }
  }

  /**
   * Clear human feedback for AI classification
   */
  async clearAIFeedback(alertId: string): Promise<any> {
    try {
      console.log('🗑️ Starting AI feedback clear for alert:', alertId);
      
      const response = await apiRequest.delete(`/ai-tools/fine-tuning/feedback/${alertId}`);
      console.log('📨 Clear feedback API response received:', response);

      if (response.success) {
        console.log('✅ AI feedback cleared successfully');
        return response.data;
      } else {
        console.error('❌ API returned error:', response.error);
        throw new Error(response.error || 'Failed to clear feedback');
      }
    } catch (error: any) {
      console.error('❌ Failed to clear AI feedback - full error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        serverError: error.response?.data?.error,
        validationDetails: error.response?.data?.details,
        alertId: alertId
      });
      
      // Provide more specific error messages
      if (error.response?.status === 404) {
        throw new Error('Alert not found or no feedback exists to clear.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to clear this feedback.');
      } else if (error.response?.status === 400) {
        const details = error.response?.data?.details;
        if (details && Array.isArray(details)) {
          const fieldErrors = details.map((d: any) => `${d.field}: ${d.message}`).join('; ');
          throw new Error(`Validation failed: ${fieldErrors}`);
        }
        throw new Error(error.response?.data?.message || 'Invalid request. Please check your input.');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Failed to clear feedback. Please try again.');
    }
  }
}

export const alertService = new AlertService();
export default alertService;