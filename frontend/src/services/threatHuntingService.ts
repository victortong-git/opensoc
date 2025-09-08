import { apiRequest } from './api';

// New simplified ThreatHunt interface matching redesigned schema
export interface ThreatHunt {
  id: string;
  // Core identification
  name: string;
  description: string;
  
  // Hunt classification
  huntType: 'proactive_exploration' | 'hypothesis_driven' | 'intel_driven' | 
            'behavioral_analysis' | 'infrastructure_hunt' | 'campaign_tracking' | 
            'threat_reaction' | 'compliance_hunt' | 'red_team_verification' | 
            'threat_landscape';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  
  // Hunt definition
  hypothesis?: string;
  scope: string;
  targetSystems?: string;
  timeframe?: string;
  
  // Professional methodology
  methodology?: string;
  successCriteria?: string;
  businessJustification?: string;
  
  // Results & findings
  findings?: string;
  recommendations?: string;
  evidence?: string;
  lessonsLearned?: string;
  
  // Assignment & tracking
  hunterId: string;
  assignedAnalysts?: string[];
  startDate?: string;
  endDate?: string;
  
  // Threat intelligence context
  sourceIntelType?: 'ioc' | 'threat_actor' | 'campaign' | 'manual' | 'scheduled';
  sourceIntelId?: string;
  sourceIntelContext?: any;
  
  // AI enhancement tracking
  aiEnhanced?: boolean;
  aiEnhancementSections?: string[];
  
  // Organization & metadata
  organizationId: string;
  isTestData?: boolean;
  tags: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Related data
  hunter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

// Legacy interface for backwards compatibility
export interface ThreatHuntingEvent {
  id: string;
  name: string;
  description: string;
  huntingType: 'proactive' | 'reactive' | 'intel_driven' | 'scheduled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  hypothesis?: string;
  scope: string;
  targetAssets: string[];
  huntingTechniques: string[];
  relatedThreatIntel: any;
  mitreTactics: string[];
  mitreTechniques: string[];
  planPhase: any;
  executionPhase: any;
  analysisPhase: any;
  investigationWorkflow: any;
  findings: any;
  iocsDiscovered: string[];
  recommendedActions: string[];
  hunterId: string;
  assignedAnalysts: string[];
  startDate?: string;
  endDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  relatedIncidents: string[];
  relatedAlerts: string[];
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  severity: number;
  falsePositiveRate?: number;
  organizationId: string;
  isTestData: boolean;
  tags: string[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
  hunter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

// Professional Hunt Types
export interface HuntType {
  name: string;
  description: string;
}

export interface HuntTypes {
  [key: string]: HuntType;
}

// TTP interface for MITRE ATT&CK integration
export interface ThreatHuntTTP {
  id: string;
  threatHuntId: string;
  tacticId: string;
  tacticName: string;
  techniqueId: string;
  techniqueName: string;
  subTechnique?: string;
  huntingHypothesis?: string;
  huntingApproach: string;
  detectionStrategy?: string;
  dataSources: string[];
  huntingQueries: any;
  indicators: string[];
  platforms: string[];
  environments: string[];
  prerequisites: string[];
  falsePositiveConsiderations?: string;
  validationCriteria: string[];
  confidenceLevel: 'low' | 'medium' | 'high' | 'very_high';
  huntingResults?: string;
  evidenceFound: string[];
  effectivenessRating?: number;
  isCustomTechnique: boolean;
  aiGenerated: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

// Professional Hunt Report interface
export interface ThreatHuntReport {
  id: string;
  threatHuntId: string;
  reportTitle: string;
  reportType: 'executive_summary' | 'technical_findings' | 'methodology_review' | 
              'comprehensive' | 'incident_response' | 'compliance_assessment';
  version: string;
  
  // Executive summary
  executiveSummary?: string;
  businessImpact?: string;
  keyFindings: string[];
  riskAssessment?: string;
  
  // Technical findings
  technicalSummary?: string;
  methodologyUsed?: string;
  toolsAndTechniques: string[];
  dataSourcesAnalyzed: string[];
  
  // Detailed findings
  threatsIdentified: any[];
  indicatorsOfCompromise: string[];
  suspiciousActivities: any[];
  falsePositives: any[];
  
  // Evidence & forensics
  evidenceSummary?: string;
  evidenceChain: any[];
  artifactsCollected: string[];
  preservationNotes?: string;
  
  // Recommendations
  strategicRecommendations: string[];
  tacticalRecommendations: string[];
  technicalRecommendations: string[];
  prioritizedActions: any[];
  
  // Assessment & metrics
  confidenceLevel: 'low' | 'medium' | 'high' | 'very_high';
  severityAssessment: 'informational' | 'low' | 'medium' | 'high' | 'critical';
  coverageAssessment?: string;
  metricsAndKPIs: any;
  
  // Lessons learned
  lessonsLearned?: string;
  improvementOpportunities: string[];
  futureConsiderations?: string;
  
  // Compliance & regulatory
  complianceNotes?: string;
  legalConsiderations?: string;
  retentionRequirements?: string;
  
  // Report generation
  generatedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  status: 'draft' | 'under_review' | 'approved' | 'published' | 'archived';
  
  // AI enhancement
  aiGenerated: boolean;
  aiGeneratedSections: string[];
  
  // Organization
  organizationId: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreatHuntingStats {
  overview: {
    totalEvents: number;
    plannedEvents: number;
    inProgressEvents: number;
    completedEvents: number;
    cancelledEvents: number;
    highPriorityEvents: number;
    criticalPriorityEvents: number;
    averageDuration: number;
  };
  huntingTypeDistribution: {
    [key: string]: number;
  };
  recentCompletedEvents: ThreatHuntingEvent[];
  topHunters: {
    hunter: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    eventCount: number;
  }[];
}

export interface Asset {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  assetType: string;
  criticality: string;
  status: string;
  location: string;
}

export interface MitreTechnique {
  id: string;
  mitreId: string;
  name: string;
  description: string;
  platforms: string[];
  dataSources: string[];
  tactic?: {
    id: string;
    mitreId: string;
    name: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  huntingType?: string;
  hunterId?: string;
  confidence?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class ThreatHuntingService {
  // === NEW SIMPLIFIED API METHODS ===
  
  // Get professional hunt types
  async getHuntTypes(): Promise<ApiResponse<HuntTypes>> {
    const response = await apiRequest.get('/threat-hunting/types');
    return response;
  }

  // Get all threat hunts with pagination and filters (new simplified API)
  async getThreatHunts(params: PaginationParams = {}): Promise<PaginatedResponse<ThreatHunt>> {
    const response = await apiRequest.get('/threat-hunting/hunts', { params });
    return response;
  }

  // Get single threat hunt by ID (new simplified API)
  async getThreatHuntById(id: string): Promise<ApiResponse<ThreatHunt>> {
    const response = await apiRequest.get(`/threat-hunting/hunts/${id}`);
    return response;
  }

  // Create new threat hunt (new simplified API)
  async createThreatHunt(huntData: Partial<ThreatHunt>): Promise<ApiResponse<ThreatHunt>> {
    const response = await apiRequest.post('/threat-hunting/hunts', huntData);
    return response;
  }

  // Update existing threat hunt (new simplified API)
  async updateThreatHunt(id: string, huntData: Partial<ThreatHunt>): Promise<ApiResponse<ThreatHunt>> {
    const response = await apiRequest.put(`/threat-hunting/hunts/${id}`, huntData);
    return response;
  }

  // Delete threat hunt (new simplified API)
  async deleteThreatHunt(id: string): Promise<ApiResponse<null>> {
    const response = await apiRequest.delete(`/threat-hunting/hunts/${id}`);
    return response;
  }

  // Clone existing threat hunt (new simplified API)
  async cloneThreatHunt(id: string): Promise<ApiResponse<ThreatHunt>> {
    const response = await apiRequest.post(`/threat-hunting/hunts/${id}/clone`);
    return response;
  }

  // === TTP MANAGEMENT METHODS ===

  // Get TTPs for a specific threat hunt
  async getHuntTTPs(huntId: string): Promise<ApiResponse<ThreatHuntTTP[]>> {
    const response = await apiRequest.get(`/threat-hunting/hunts/${huntId}/ttps`);
    return response;
  }

  // Add TTPs to a threat hunt
  async addHuntTTPs(huntId: string, ttps: Partial<ThreatHuntTTP>[]): Promise<ApiResponse<ThreatHuntTTP[]>> {
    const response = await apiRequest.post(`/threat-hunting/hunts/${huntId}/ttps`, { ttps });
    return response;
  }

  // === PROFESSIONAL REPORTING METHODS ===

  // Get reports for a specific threat hunt
  async getHuntReports(huntId: string): Promise<ApiResponse<ThreatHuntReport[]>> {
    const response = await apiRequest.get(`/threat-hunting/hunts/${huntId}/reports`);
    return response;
  }

  // Generate a professional threat hunt report
  async generateHuntReport(
    huntId: string, 
    reportData: Partial<ThreatHuntReport>
  ): Promise<ApiResponse<ThreatHuntReport>> {
    const response = await apiRequest.post(`/threat-hunting/hunts/${huntId}/reports`, reportData);
    return response;
  }

  // === AI ENHANCEMENT METHODS ===

  // Enhance threat hunt content with AI (updated)
  async enhanceThreatHuntContent(
    huntId: string, 
    section: string, 
    currentContent: string, 
    context?: any
  ): Promise<ApiResponse<any>> {
    const response = await apiRequest.post(`/threat-hunting/hunts/${huntId}/enhance-content`, {
      section,
      currentContent,
      context
    }, {
      timeout: 120000 // 2 minutes for AI enhancement
    });
    return response;
  }

  // === BACKWARDS COMPATIBILITY METHODS ===

  // Get all threat hunting events with pagination and filters (legacy)
  async getThreatHuntingEvents(params: PaginationParams = {}): Promise<PaginatedResponse<ThreatHuntingEvent>> {
    // Use new API endpoint to get hunts from new database tables
    const response = await apiRequest.get('/threat-hunting/hunts', { params });
    return response;
  }

  // Get single threat hunting event by ID (legacy)
  async getThreatHuntingEventById(id: string): Promise<ApiResponse<ThreatHuntingEvent>> {
    // Use new API endpoint to get hunt from new database tables
    const response = await apiRequest.get(`/threat-hunting/hunts/${id}`);
    return response;
  }

  // Create new threat hunting event (legacy)
  async createThreatHuntingEvent(eventData: Partial<ThreatHuntingEvent>): Promise<ApiResponse<ThreatHuntingEvent>> {
    // Use new API endpoint to create hunt in new database tables
    const response = await apiRequest.post('/threat-hunting/hunts', eventData);
    return response;
  }

  // Update existing threat hunting event (legacy)
  async updateThreatHuntingEvent(id: string, eventData: Partial<ThreatHuntingEvent>): Promise<ApiResponse<ThreatHuntingEvent>> {
    // Use new API endpoint to update hunt in new database tables
    const response = await apiRequest.put(`/threat-hunting/hunts/${id}`, eventData);
    return response;
  }

  // Delete threat hunting event (legacy)
  async deleteThreatHuntingEvent(id: string): Promise<ApiResponse<null>> {
    // Use new API endpoint to delete hunt from new database tables
    const response = await apiRequest.delete(`/threat-hunting/hunts/${id}`);
    return response;
  }

  // Clone existing threat hunting event (legacy)
  async cloneThreatHuntingEvent(id: string): Promise<ApiResponse<ThreatHuntingEvent>> {
    // Use new API endpoint to clone hunt from new database tables
    const response = await apiRequest.post(`/threat-hunting/hunts/${id}/clone`);
    return response;
  }

  // === SHARED UTILITY METHODS ===

  // Get threat hunting statistics
  async getThreatHuntingStats(): Promise<ApiResponse<ThreatHuntingStats>> {
    const response = await apiRequest.get('/threat-hunting/stats');
    return response;
  }

  // Get assets for threat hunting scope selection
  async getAssetsForHunting(params: {
    search?: string;
    assetType?: string;
    criticality?: string;
    status?: string;
  } = {}): Promise<ApiResponse<Asset[]>> {
    const response = await apiRequest.get('/threat-hunting/assets', { params });
    return response;
  }

  // Get MITRE techniques for threat hunting planning
  async getMitreTechniquesForHunting(params: {
    search?: string;
    tacticId?: string;
  } = {}): Promise<ApiResponse<MitreTechnique[]>> {
    const response = await apiRequest.get('/threat-hunting/mitre-techniques', { params });
    return response;
  }

  // Enhance all threat hunt content sections with AI (legacy)
  async enhanceAllThreatHuntContent(huntId: string): Promise<ApiResponse<{
    enhancedSections: {
      [key: string]: {
        sectionName: string;
        enhancement: any;
        processingTime: number;
      };
    };
    totalProcessingTime: number;
    sectionsProcessed: number;
    totalSections: number;
    errors?: any[];
    huntId: string;
  }>> {
    const response = await apiRequest.post(`/threat-hunting/${huntId}/enhance-all-content`, {}, {
      timeout: 300000 // 5 minutes for AI enhancement of all sections
    });
    return response;
  }

  // === THREAT INTELLIGENCE INTEGRATION ===

  // Create threat hunt from threat intelligence context
  async createHuntFromThreatIntel(
    sourceType: 'ioc' | 'threat_actor' | 'campaign',
    sourceId: string,
    huntData: Partial<ThreatHunt>
  ): Promise<ApiResponse<ThreatHunt>> {
    const huntWithContext: Partial<ThreatHunt> = {
      ...huntData,
      sourceIntelType: sourceType,
      sourceIntelId: sourceId,
      // Automatically set appropriate hunt type based on source
      huntType: sourceType === 'ioc' ? 'intel_driven' : 
                sourceType === 'threat_actor' ? 'campaign_tracking' : 
                'intel_driven'
    };

    return this.createThreatHunt(huntWithContext);
  }

  // Get threat hunts filtered by threat intelligence source
  async getHuntsByThreatIntel(
    sourceType: 'ioc' | 'threat_actor' | 'campaign',
    sourceId?: string
  ): Promise<ApiResponse<ThreatHunt[]>> {
    const params: any = { sourceIntelType: sourceType };
    if (sourceId) {
      params.sourceIntelId = sourceId;
    }
    
    const response = await apiRequest.get('/threat-hunting/hunts', { params });
    return response;
  }
}

export default new ThreatHuntingService();