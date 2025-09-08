export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'analyst' | 'viewer';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'incident' | 'system' | 'security' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  actionRequired: boolean;
  relatedId?: string;
  relatedType?: 'alert' | 'incident' | 'asset' | 'user';
  createdAt: Date;
  expiresAt?: Date;
}

export interface EventTag {
  tag: string;
  category: 'technical' | 'behavioral' | 'contextual' | 'correlation' | 'general';
  confidence: number;
  reasoning?: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
  status: 'new' | 'incident_likely' | 'analysis_uncertain' | 'review_required' | 'investigating' | 'resolved' | 'false_positive';
  sourceSystem: string;
  eventTime: Date;
  assetId: string;
  assetName: string;
  organizationId: string;
  rawData: Record<string, any>;
  enrichmentData: Record<string, any>;
  assignedAgent: string;
  securityEventType?: string;
  eventTags?: EventTag[];
  tagsGeneratedAt?: string;
  tagsConfidence?: number;
  aiInsights?: AIDecisionInsight;
  aiAnalysis?: any; // Keep for backward compatibility - will contain AIAnalysisResult
  aiClassification?: any; // Will contain AIClassificationResult
  aiAnalysisTimestamp?: Date;
  mitreAnalysis?: any; // MitreAnalysisResponse - using any to avoid circular imports
  mitreAnalysisTimestamp?: Date;
  resolveRemarks?: ResolveRemarksData;
  incidentConfirmationDetails?: any;
  triageRemarks?: TriageRemarksData;
  triageTimestamp?: Date;
  isTestData?: boolean;
  // Human feedback fields for AI model fine-tuning
  humanReviewStatus?: 'pending' | 'reviewed' | 'verified';
  aiClassificationFeedback?: AIClassificationFeedback;
  humanCorrectedClassification?: any;
  feedbackTimestamp?: Date;
  reviewerUserId?: string;
  reviewerUserName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResolveRemarksData {
  resolvedBy: 'AI_AUTO_RESOLUTION' | 'MANUAL_USER_RESOLUTION';
  resolvedAt: string;
  resolutionType: 'resolved' | 'false_positive';
  remarks?: string;
  reasoning?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  aiConfidence?: number;
  aiAnalysisId?: string;
  autoResolved: boolean;
}

export interface TriageRemarksData {
  aiAnalysisConfidence?: number;
  riskLevel?: string;
  riskScore?: number;
  triageReason?: string;
  assignedBy?: string;
  assignedAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  previousStatus?: string;
  securityEventType?: string;
  recommendedActions?: any;
  needsHumanReview?: boolean;
  manualUpdate?: boolean;
  notes?: string;
}

export interface AIClassificationFeedback {
  securityEventTypeCorrect?: boolean;
  eventTagsCorrect?: boolean;
  riskAssessmentCorrect?: boolean;
  recommendedActionsCorrect?: boolean;
  overallConfidence: number;
  correctedSecurityEventType?: string;
  correctedEventTags?: string[];
  comments?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
  status: 'open' | 'investigating' | 'contained' | 'resolved';
  category: 'malware' | 'intrusion' | 'data_breach' | 'policy_violation' | 'insider_threat';
  assignedTo: string;
  assignedToName: string;
  organizationId: string;
  alertIds: string[];
  alertCount: number;
  timeline: TimelineEvent[];
  metadata: Record<string, any>;
  resolvedAt?: Date;
  isTestData?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'alert' | 'action' | 'note' | 'status_change';
  title: string;
  description: string;
  userId: string;
  userName: string;
  metadata?: Record<string, any>;
}

export interface AlertTimelineEvent {
  id: string;
  timestamp: Date;
  type: 'alert_created' | 'ai_analysis_completed' | 'ai_auto_resolved' | 'status_change' | 'user_action' | 'note';
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  alertId: string;
  metadata?: Record<string, any>;
  aiSource?: string;
  aiConfidence?: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Asset {
  id: string;
  name: string;
  assetType: 'server' | 'workstation' | 'network_device' | 'mobile_device' | 'iot_device' | 'virtual_machine' | 'container' | 'cloud_service';
  ipAddress: string;
  hostname: string;
  osType: string; // Backend field name
  os?: string; // Computed field for display
  osVersion: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  organizationId: string;
  metadata: Record<string, any>;
  isActive?: boolean; // Optional as it may not be in backend model
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  vulnerabilityCount?: number; // May be computed from metadata
  riskScore?: number; // May be computed from metadata
  location: string;
  owner: string;
  lastSeen: Date;
  isTestData?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityEvent {
  id: string;
  eventTime: Date;
  source: string;
  eventType: string;
  severity: 1 | 2 | 3 | 4 | 5;
  sourceIp: string;
  destinationIp?: string;
  userName?: string;
  assetId: string;
  assetName: string;
  rawLog: string;
  parsedData: Record<string, any>;
  organizationId: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalAlerts: number;
  newAlerts: number;
  criticalAlerts: number;
  activeIncidents: number;
  resolvedIncidents: number;
  totalAssets: number;
  onlineAssets: number;
  offlineAssets: number;
  compromisedAssets: number;
  averageResponseTime: number;
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface AlertFilter {
  severity?: number[];
  status?: string[];
  sourceSystem?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface IncidentFilter {
  severity?: number[];
  status?: string[];
  category?: string[];
  assignedTo?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface AssetFilter {
  assetType?: string[];
  status?: string[];
  criticality?: ('low' | 'medium' | 'high' | 'critical')[];
  location?: string[];
  search?: string;
}

// Threat Intelligence Types
export interface IOC {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'file_hash' | 'email' | 'registry_key';
  value: string;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  severity: 1 | 2 | 3 | 4 | 5;
  description: string;
  source: string;
  tags: string[];
  firstSeen: Date;
  lastSeen: Date;
  isActive: boolean;
  relatedCampaign?: string;
  mitreAttack?: string[];
  isTestData?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  motivation: string[];
  sophistication: 'minimal' | 'intermediate' | 'advanced' | 'expert';
  origin: string;
  targetSectors: string[];
  techniques: string[];
  campaigns: string[];
  isActive: boolean;
  firstSeen: Date;
  lastSeen: Date;
  isTestData?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  threatActor: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  targetSectors: string[];
  techniques: string[];
  iocs: string[];
  affectedAssets: number;
  severity: 1 | 2 | 3 | 4 | 5;
  isTestData?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export interface SecurityMetrics {
  alertTrends: {
    date: string;
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }[];
  incidentTrends: {
    date: string;
    total: number;
    resolved: number;
    open: number;
  }[];
  mttrData: {
    date: string;
    value: number;
  }[];
  topThreats: {
    name: string;
    count: number;
    trend: number;
  }[];
  attackVectors: {
    vector: string;
    count: number;
    percentage: number;
  }[];
  mitreAttack: {
    tactic: string;
    techniques: number;
    coverage: number;
  }[];
}

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  version: string;
  controls: ComplianceControl[];
  overallScore: number;
  lastAssessment: Date;
  nextAssessment: Date;
  isActive: boolean;
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
  score: number;
  evidence: string[];
  lastReview: Date;
  nextReview: Date;
  owner: string;
  notes: string;
}

// User Management Types
export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, any>;
}

export interface UserSession {
  id: string;
  userId: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  location: string;
}

// Settings Types
export interface SystemSettings {
  id: string;
  category: string;
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  isEditable: boolean;
  updatedBy: string;
  updatedAt: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  severity: 1 | 2 | 3 | 4 | 5;
  category: string;
  conditions: AlertCondition[];
  actions: AlertAction[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  logicOperator?: 'AND' | 'OR';
}

export interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'create_incident';
  parameters: Record<string, any>;
  isEnabled: boolean;
}

// Playbook Types
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
  isTestData?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaybookStep {
  id: string;
  name: string;
  type: 'manual' | 'automated' | 'approval' | 'condition';
  description: string;
  parameters: Record<string, any>;
  timeout?: number;
  isRequired: boolean;
  order: number;
}

// Vulnerability Types
export interface Vulnerability {
  id: string;
  cveId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cvssScore: number;
  cvssVector: string;
  affectedAssets: string[];
  patchAvailable: boolean;
  patchReleaseDate?: Date;
  exploitAvailable: boolean;
  inTheWild: boolean;
  publishedDate: Date;
  discoveredDate: Date;
  status: 'open' | 'patched' | 'mitigated' | 'accepted';
  assignedTo: string;
  dueDate?: Date;
}

// AI Agent Types
export interface AIAgent {
  id: string;
  name: string;
  type: 'soc_analyst' | 'incident_response' | 'threat_intel' | 'report_generation';
  status: 'online' | 'processing' | 'maintenance' | 'offline';
  description: string;
  capabilities: AgentCapability[];
  primaryFunctions: string[];
  metrics: AgentMetrics;
  currentTasks: AgentTask[];
  assignedHumans: string[];
  version: string;
  lastUpdated: Date;
  createdAt: Date;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  type: 'analysis' | 'automation' | 'prediction' | 'learning';
  enabled: boolean;
  accuracy: number;
  learningProgress: number;
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  successRate: number;
  averageProcessingTime: number;
  falsePositiveReduction?: number;
  learningAccuracy: number;
  uptime: number;
  collaborationScore: number;
  humanFeedbackScore: number;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  type: 'alert_triage' | 'incident_response' | 'threat_analysis' | 'report_generation' | 'investigation';
  status: 'pending' | 'processing' | 'completed' | 'requires_human' | 'failed';
  priority: 1 | 2 | 3 | 4 | 5;
  assignedAgent: string;
  collaboratingHuman?: string;
  startTime: Date;
  completedTime?: Date;
  confidence: number;
  humanValidation?: boolean;
  results?: Record<string, any>;
  feedback?: AgentTaskFeedback;
}

export interface AgentTaskFeedback {
  id: string;
  taskId: string;
  humanAnalyst: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback: string;
  approved: boolean;
  suggestedImprovements?: string;
  createdAt: Date;
}

export interface SOCTeam {
  id: string;
  name: string;
  humanAnalysts: string[];
  aiAgents: string[];
  specialization: 'general' | 'malware' | 'network' | 'forensics' | 'threat_hunting';
  performance: TeamMetrics;
  currentWorkload: number;
  maxWorkload: number;
}

export interface TeamMetrics {
  collaborationEfficiency: number;
  taskCompletionRate: number;
  averageResponseTime: number;
  humanSatisfactionScore: number;
  aiAccuracyImprovement: number;
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

// AI False Positive Learning System Types
export interface AIFalsePositiveEvent {
  id: string;
  alertId: string;
  agentId: string;
  agentName: string;
  agentDecision: 'true_positive' | 'false_positive' | 'needs_investigation';
  agentConfidence: number;
  agentReasoning: string;
  humanReview?: FalsePositiveHumanReview;
  eventDetails: {
    alertTitle: string;
    alertSeverity: number;
    sourceSystem: string;
    eventTime: Date;
    assetName: string;
  };
  status: 'pending_review' | 'reviewed' | 'disputed' | 'approved';
  createdAt: Date;
  updatedAt: Date;
}

export interface FalsePositiveHumanReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  humanDecision: 'agree_true_positive' | 'agree_false_positive' | 'disagree' | 'needs_more_info';
  confidence: number;
  reasoning: string;
  feedbackCategory: 'accurate' | 'partially_accurate' | 'inaccurate' | 'missing_context';
  suggestedImprovements?: string;
  additionalContext?: string;
  reviewTime: number; // Time spent reviewing in seconds
  reviewedAt: Date;
}

export interface AIDecisionInsight {
  id: string;
  alertId: string;
  agentId: string;
  agentName: string;
  decisionType: 'alert_classification' | 'risk_assessment' | 'threat_detection' | 'incident_priority';
  aiDecision: string;
  confidence: number;
  reasoning: string;
  evidenceUsed: string[];
  alternativeOptions: {
    option: string;
    confidence: number;
    reasoning: string;
  }[];
  modelVersion: string;
  processingTime: number;
  humanOverride?: {
    overriddenBy: string;
    newDecision: string;
    reason: string;
    timestamp: Date;
  };
  createdAt: Date;
}

// Persistent AI Analysis Data Structure
// Legacy interface - replaced by AIAnalysisResult and AIClassificationResult in alertService.ts
// Keeping for backward compatibility during transition
export interface AlertAIAnalysisData {
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
  analysisTimestamp: string;
  processingTimeMs?: number;
  aiModel?: string;
  note?: string;
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