import { apiRequest } from './api';

// Interface definitions
export interface TestDataConfig {
  dataType: 'alert' | 'incident' | 'asset' | 'ioc' | 'playbook' | 'threat_actor' | 'threat_campaign';
  quantity: number;
  severityDistribution?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  scenario: string;
  timeRange: 'last_24h' | 'last_7d' | 'last_30d' | 'custom';
  customTimeStart?: string;
  customTimeEnd?: string;
  preview?: boolean;
  customDescription?: string;
  customRequirements?: string;
  customExamples?: string;
}

export interface GeneratedAlert {
  id?: string;
  title: string;
  description: string;
  severity: number;
  sourceSystem: string;
  eventTime: string;
  assetName?: string;
  rawData?: {
    sourceIP?: string;
    destIP?: string;
    protocol?: string;
    additionalDetails?: string;
  };
  enrichmentData?: {
    [key: string]: any;
  };
}

export interface GeneratedIncident {
  id?: string;
  title: string;
  description: string;
  severity: number;
  category: 'malware' | 'intrusion' | 'data_breach' | 'policy_violation' | 'insider_threat';
  status: 'open' | 'investigating' | 'contained' | 'resolved';
  alertIds?: string[];
  alertCount?: number;
  assignedTo?: string;
  assignedToName?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface GeneratedAsset {
  id?: string;
  name: string;
  assetType: 'server' | 'workstation' | 'network_device' | 'mobile_device' | 'iot_device' | 'virtual_machine' | 'container' | 'cloud_service';
  ipAddress?: string;
  hostname?: string;
  macAddress?: string;
  osType?: string;
  osVersion?: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  department?: string;
  owner?: string;
  description?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  tags?: string[];
  metadata?: {
    [key: string]: any;
  };
  lastSeen?: string;
  firstDiscovered?: string;
}

export interface GeneratedIOC {
  id?: string;
  type: 'ip' | 'domain' | 'url' | 'file_hash' | 'email' | 'registry_key';
  value: string;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  severity: number;
  description?: string;
  source: string;
  tags?: string[];
  firstSeen?: string;
  lastSeen?: string;
  isActive?: boolean;
  mitreAttack?: string[];
  metadata?: {
    [key: string]: any;
  };
}

export interface GeneratedPlaybook {
  id?: string;
  name: string;
  description?: string;
  category: string;
  triggerType: 'manual' | 'automatic';
  steps: PlaybookStep[];
  isActive?: boolean;
  executionCount?: number;
  successRate?: number;
  averageExecutionTime?: number;
  metadata?: {
    [key: string]: any;
  };
}

export interface PlaybookStep {
  id: string;
  name: string;
  type: 'automated' | 'manual';
  description: string;
  timeout: number;
  isRequired: boolean;
  order: number;
}

export interface GeneratedThreatActor {
  id?: string;
  name: string;
  aliases?: string[];
  description: string;
  motivation?: string[];
  sophistication: 'basic' | 'intermediate' | 'advanced' | 'expert';
  origin?: string;
  targetSectors?: string[];
  techniques?: string[];
  campaigns?: string[];
  isActive?: boolean;
  firstSeen?: string;
  lastSeen?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface GeneratedThreatCampaign {
  id?: string;
  name: string;
  description: string;
  threatActorId?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  targetSectors?: string[];
  targetGeographies?: string[];
  techniques?: string[];
  objectives?: string[];
  severity: number;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  victimCount?: number;
  estimatedImpact?: string;
  associatedIOCs?: string[];
  relatedIncidents?: string[];
  tags?: string[];
  metadata?: {
    [key: string]: any;
  };
}

export interface AIStatus {
  connected: boolean;
  modelAvailable: boolean;
  availableModels?: string[];
  error?: string;
  // Enhanced fields from backend
  serverVersion?: string;
  connectionTime?: number;
  totalModels?: number;
  endpoint?: string;
  checkedAt?: string;
  responseTime?: number;
  targetModel?: string;
  targetModelInfo?: {
    name: string;
    size: number;
    modified: string;
    family: string;
  };
  errorCategory?: string;
}

export interface GenerationResponse {
  success: boolean;
  dataType: string;
  quantity: number;
  data: (GeneratedAlert | GeneratedIncident | GeneratedAsset | GeneratedIOC | GeneratedPlaybook | GeneratedThreatActor | GeneratedThreatCampaign)[];
  fullData?: (GeneratedAlert | GeneratedIncident | GeneratedAsset | GeneratedIOC | GeneratedPlaybook | GeneratedThreatActor | GeneratedThreatCampaign)[];
  error?: string;
}

export interface TestDataStats {
  total: {
    alerts: number;
    incidents: number;
    assets: number;
    iocs: number;
    playbooks: number;
    threatActors: number;
    threatCampaigns: number;
  };
  recent: {
    alerts: number;
    incidents: number;
    assets: number;
    iocs: number;
    playbooks: number;
    threatActors: number;
    threatCampaigns: number;
  };
}

export interface CreateTestDataRequest {
  alerts?: GeneratedAlert[];
  incidents?: GeneratedIncident[];
  assets?: GeneratedAsset[];
  iocs?: GeneratedIOC[];
  playbooks?: GeneratedPlaybook[];
  threat_actors?: GeneratedThreatActor[];
  threat_campaigns?: GeneratedThreatCampaign[];
}

export interface CreateTestDataResponse {
  success: boolean;
  message: string;
  alertIds?: string[];
  incidentIds?: string[];
  assetIds?: string[];
  iocIds?: string[];
  playbookIds?: string[];
  threatActorIds?: string[];
  threatCampaignIds?: string[];
}

export interface CleanupOptions {
  dataType?: 'alert' | 'incident' | 'asset' | 'ioc' | 'playbook' | 'threat_actor' | 'threat_campaign';
  olderThan?: number; // days
}

export interface CleanupResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}

class TestDataService {
  /**
   * Check AI connection status
   */
  async checkAIStatus(): Promise<AIStatus> {
    const response = await apiRequest.get('/test-data/ai-status');
    return response; // Fixed: removed double .data accessor
  }

  /**
   * Generate test data using AI
   */
  async generateTestData(config: TestDataConfig): Promise<GenerationResponse> {
    const response = await apiRequest.post('/test-data/generate', config);
    return response.data;
  }

  /**
   * Create test alerts in database
   */
  async createTestAlerts(alerts: GeneratedAlert[]): Promise<CreateTestDataResponse> {
    const response = await apiRequest.post('/test-data/alerts', { alerts });
    return response.data;
  }

  /**
   * Create test incidents in database
   */
  async createTestIncidents(incidents: GeneratedIncident[]): Promise<CreateTestDataResponse> {
    const response = await apiRequest.post('/test-data/incidents', { incidents });
    return response.data;
  }

  /**
   * Create test assets in database
   */
  async createTestAssets(assets: GeneratedAsset[]): Promise<CreateTestDataResponse> {
    const response = await apiRequest.post('/test-data/assets', { assets });
    return response.data;
  }

  /**
   * Create test IOCs in database
   */
  async createTestIOCs(iocs: GeneratedIOC[]): Promise<CreateTestDataResponse> {
    const response = await apiRequest.post('/test-data/iocs', { iocs });
    return response.data;
  }

  /**
   * Create test playbooks in database
   */
  async createTestPlaybooks(playbooks: GeneratedPlaybook[]): Promise<CreateTestDataResponse> {
    const response = await apiRequest.post('/test-data/playbooks', { playbooks });
    return response.data;
  }

  /**
   * Create test threat actors in database
   */
  async createTestThreatActors(threatActors: GeneratedThreatActor[]): Promise<CreateTestDataResponse> {
    const response = await apiRequest.post('/test-data/threat-actors', { threat_actors: threatActors });
    return response.data;
  }

  /**
   * Create test threat campaigns in database
   */
  async createTestThreatCampaigns(threatCampaigns: GeneratedThreatCampaign[]): Promise<CreateTestDataResponse> {
    const response = await apiRequest.post('/test-data/threat-campaigns', { threat_campaigns: threatCampaigns });
    return response.data;
  }

  /**
   * Get test data statistics
   */
  async getTestDataStats(): Promise<TestDataStats> {
    const response = await apiRequest.get('/test-data/stats');
    return response.data;
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(options?: CleanupOptions): Promise<CleanupResponse> {
    const params = new URLSearchParams();
    if (options?.dataType) {
      params.append('dataType', options.dataType);
    }
    if (options?.olderThan) {
      params.append('olderThan', options.olderThan.toString());
    }

    const response = await apiRequest.delete(`/test-data/cleanup?${params.toString()}`);
    return response.data;
  }

  /**
   * Parse and validate generated data
   */
  validateGeneratedAlerts(alerts: any[]): GeneratedAlert[] {
    return alerts.filter(alert => 
      alert &&
      typeof alert.title === 'string' &&
      typeof alert.description === 'string' &&
      typeof alert.severity === 'number' &&
      alert.severity >= 1 &&
      alert.severity <= 5
    );
  }

  /**
   * Parse and validate generated incidents
   */
  validateGeneratedIncidents(incidents: any[]): GeneratedIncident[] {
    const validCategories = ['malware', 'intrusion', 'data_breach', 'policy_violation', 'insider_threat'];
    const validStatuses = ['open', 'investigating', 'contained', 'resolved'];

    return incidents.filter(incident => 
      incident &&
      typeof incident.title === 'string' &&
      typeof incident.description === 'string' &&
      typeof incident.severity === 'number' &&
      incident.severity >= 1 &&
      incident.severity <= 5 &&
      validCategories.includes(incident.category) &&
      validStatuses.includes(incident.status)
    );
  }

  /**
   * Parse and validate generated assets
   */
  validateGeneratedAssets(assets: any[]): GeneratedAsset[] {
    const validAssetTypes = ['server', 'workstation', 'network_device', 'mobile_device', 'iot_device', 'virtual_machine', 'container', 'cloud_service'];
    const validCriticalities = ['low', 'medium', 'high', 'critical'];
    const validStatuses = ['active', 'inactive', 'maintenance', 'decommissioned'];

    return assets.map(asset => {
      // Fix common AI generation issues
      if (asset) {
        // Set default status if missing
        if (!asset.status || !validStatuses.includes(asset.status)) {
          asset.status = 'active';
        }
        
        // Handle operatingSystem -> osType/osVersion split
        if (asset.operatingSystem && !asset.osType) {
          const os = asset.operatingSystem.toString();
          if (os.includes('Windows')) {
            asset.osType = 'Windows';
            asset.osVersion = os.replace('Windows ', '');
          } else if (os.includes('Linux') || os.includes('Ubuntu') || os.includes('CentOS')) {
            asset.osType = 'Linux';
            asset.osVersion = os;
          } else if (os.includes('Android')) {
            asset.osType = 'Android';
            asset.osVersion = os.replace('Android ', '');
          } else if (os.includes('iOS')) {
            asset.osType = 'iOS';
            asset.osVersion = os.replace('iOS ', '');
          } else {
            asset.osType = os;
          }
        }
      }
      
      return asset;
    }).filter(asset => 
      asset &&
      typeof asset.name === 'string' &&
      validAssetTypes.includes(asset.assetType) &&
      validCriticalities.includes(asset.criticality) &&
      validStatuses.includes(asset.status)
    );
  }

  /**
   * Parse and validate generated IOCs
   */
  validateGeneratedIOCs(iocs: any[]): GeneratedIOC[] {
    const validTypes = ['ip', 'domain', 'url', 'file_hash', 'email', 'registry_key'];
    const validConfidences = ['low', 'medium', 'high', 'very_high'];

    return iocs.filter(ioc => 
      ioc &&
      validTypes.includes(ioc.type) &&
      typeof ioc.value === 'string' &&
      validConfidences.includes(ioc.confidence) &&
      typeof ioc.severity === 'number' &&
      ioc.severity >= 1 &&
      ioc.severity <= 5
    );
  }

  /**
   * Parse and validate generated playbooks
   */
  validateGeneratedPlaybooks(playbooks: any[]): GeneratedPlaybook[] {
    const validTriggerTypes = ['manual', 'automatic'];

    return playbooks.filter(playbook => 
      playbook &&
      typeof playbook.name === 'string' &&
      typeof playbook.category === 'string' &&
      validTriggerTypes.includes(playbook.triggerType) &&
      Array.isArray(playbook.steps)
    );
  }

  /**
   * Parse and validate generated threat actors
   */
  validateGeneratedThreatActors(threatActors: any[]): GeneratedThreatActor[] {
    const validSophistications = ['basic', 'intermediate', 'advanced', 'expert'];

    return threatActors.filter(actor => 
      actor &&
      typeof actor.name === 'string' &&
      typeof actor.description === 'string' &&
      validSophistications.includes(actor.sophistication)
    );
  }

  /**
   * Parse and validate generated threat campaigns
   */
  validateGeneratedThreatCampaigns(threatCampaigns: any[]): GeneratedThreatCampaign[] {
    const validConfidences = ['low', 'medium', 'high', 'very_high'];

    return threatCampaigns.filter(campaign => 
      campaign &&
      typeof campaign.name === 'string' &&
      campaign.name.trim().length >= 2 &&
      campaign.name.trim().length <= 200 &&
      typeof campaign.description === 'string' &&
      campaign.description.trim().length >= 10 &&
      campaign.description.trim().length <= 5000 &&
      validConfidences.includes(campaign.confidence) &&
      typeof campaign.severity === 'number' &&
      campaign.severity >= 1 &&
      campaign.severity <= 5
    );
  }

  /**
   * Get severity color class
   */
  getSeverityColorClass(severity: number): string {
    switch (severity) {
      case 5: return 'text-red-400 bg-red-500/20';
      case 4: return 'text-orange-400 bg-orange-500/20';
      case 3: return 'text-yellow-400 bg-yellow-500/20';
      case 2: return 'text-blue-400 bg-blue-500/20';
      case 1: return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  }

  /**
   * Get severity label
   */
  getSeverityLabel(severity: number): string {
    switch (severity) {
      case 5: return 'Critical';
      case 4: return 'High';
      case 3: return 'Medium';
      case 2: return 'Low';
      case 1: return 'Info';
      default: return 'Unknown';
    }
  }

  /**
   * Format test scenarios for display
   */
  getTestScenarios() {
    return {
      alert: [
        { id: 'mixed', name: 'Mixed Security Events', description: 'Variety of security alerts across all categories' },
        { id: 'malware', name: 'Malware Campaign', description: 'Malware detection and response scenarios' },
        { id: 'brute_force', name: 'Brute Force Attack', description: 'Authentication attacks and failed logins' },
        { id: 'data_exfil', name: 'Data Exfiltration', description: 'Data theft and unauthorized transfers' },
        { id: 'insider_threat', name: 'Insider Threat', description: 'Internal security policy violations' },
        { id: 'network_intrusion', name: 'Network Intrusion', description: 'Unauthorized network access attempts' },
      ],
      incident: [
        { id: 'apt_campaign', name: 'APT Campaign', description: 'Advanced Persistent Threat investigation' },
        { id: 'ransomware', name: 'Ransomware Attack', description: 'Ransomware infection and recovery' },
        { id: 'data_breach', name: 'Data Breach', description: 'Data compromise investigation' },
        { id: 'insider_threat', name: 'Insider Threat', description: 'Internal threat investigation' },
        { id: 'supply_chain', name: 'Supply Chain Attack', description: 'Third-party compromise scenario' },
      ],
      asset: [
        { id: 'mixed_assets', name: 'Mixed Infrastructure', description: 'Variety of servers, workstations, and network devices' },
        { id: 'critical_servers', name: 'Critical Servers', description: 'High-value server infrastructure' },
        { id: 'workstations', name: 'User Workstations', description: 'Employee desktop and laptop systems' },
        { id: 'network_devices', name: 'Network Equipment', description: 'Routers, switches, and firewalls' },
      ],
      ioc: [
        { id: 'mixed_iocs', name: 'Mixed Indicators', description: 'Variety of IPs, domains, hashes, and URLs' },
        { id: 'malware_campaign', name: 'Malware Campaign', description: 'Malicious file hashes and C2 domains' },
        { id: 'phishing_campaign', name: 'Phishing Campaign', description: 'Suspicious URLs and email addresses' },
        { id: 'apt_indicators', name: 'APT Indicators', description: 'Advanced threat intelligence indicators' },
      ],
      playbook: [
        { id: 'incident_response', name: 'Incident Response', description: 'Standard incident response procedures' },
        { id: 'malware_containment', name: 'Malware Containment', description: 'Malware detection and containment steps' },
        { id: 'data_breach_response', name: 'Data Breach Response', description: 'Data breach investigation and response' },
        { id: 'phishing_response', name: 'Phishing Response', description: 'Email phishing detection and response' },
      ],
      threat_actor: [
        { id: 'mixed', name: 'Mixed Threat Actors', description: 'Variety of threat actors across all categories' },
        { id: 'apt', name: 'Advanced Persistent Threats', description: 'State-sponsored APT groups with sophisticated capabilities' },
        { id: 'cybercrime', name: 'Cybercriminal Organizations', description: 'Financially motivated cybercriminal syndicates' },
        { id: 'nation_state', name: 'Nation-State Actors', description: 'Government-sponsored cyber warfare groups' },
        { id: 'ransomware', name: 'Ransomware Groups', description: 'Ransomware-as-a-service operators and affiliates' },
        { id: 'hacktivist', name: 'Hacktivist Groups', description: 'Ideologically motivated hacktivist collectives' },
      ],
      threat_campaign: [
        { id: 'mixed', name: 'Mixed Campaigns', description: 'Variety of threat campaigns with different objectives' },
        { id: 'espionage', name: 'Cyber Espionage', description: 'Intelligence collection and intellectual property theft campaigns' },
        { id: 'ransomware', name: 'Ransomware Campaigns', description: 'Encryption and extortion operations' },
        { id: 'supply_chain', name: 'Supply Chain Attacks', description: 'Third-party vendor compromise campaigns' },
        { id: 'election_interference', name: 'Election Interference', description: 'Political influence and disinformation campaigns' },
        { id: 'critical_infrastructure', name: 'Critical Infrastructure', description: 'Attacks targeting utilities and essential services' },
        { id: 'covid_themed', name: 'COVID-19 Themed', description: 'Pandemic-related social engineering campaigns' },
      ],
    };
  }

  /**
   * Generate summary text for test data configuration
   */
  getConfigSummary(config: TestDataConfig): string {
    const scenarios = this.getTestScenarios();
    const scenarioName = scenarios[config.dataType].find(s => s.id === config.scenario)?.name || config.scenario;
    
    let summary = `Generate ${config.quantity} ${config.dataType}${config.quantity !== 1 ? 's' : ''} for "${scenarioName}" scenario`;
    
    if (config.dataType === 'alert' && config.severityDistribution) {
      const distribution = Object.entries(config.severityDistribution)
        .filter(([_, value]) => value > 0)
        .map(([level, value]) => `${level}: ${value}%`)
        .join(', ');
      if (distribution) {
        summary += ` with severity distribution: ${distribution}`;
      }
    }
    
    return summary;
  }
}

export default new TestDataService();