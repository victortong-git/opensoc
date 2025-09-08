const { v4: uuidv4 } = require('uuid');

const sampleAIAgents = [
  {
    id: uuidv4(),
    name: 'SOC-Analyst-Alpha',
    type: 'soc_analyst',
    description: 'Advanced AI agent specialized in security alert analysis and threat triage. Capable of processing thousands of alerts per hour with high accuracy.',
    capabilities: ['ALERT_ANALYSIS', 'THREAT_DETECTION', 'CORRELATION'],
    configuration: {
      alertProcessingRate: 1200,
      accuracyThreshold: 0.85,
      falsePositiveReduction: 60
    },
    status: 'online',
    model_version: '2.1.4',
    accuracy_score: 94.5,
    total_tasks: 2847,
    successful_tasks: 2691,
    failed_tasks: 156,
    last_activity: new Date(),
    performance_metrics: {
      averageResponseTime: 2.3,
      alertsProcessedToday: 156,
      falsePositiveRate: 0.08
    },
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: uuidv4(),
    name: 'Incident-Response-Beta',
    type: 'incident_response',
    description: 'Specialized incident response agent that automates containment procedures and coordinates response activities across security teams.',
    capabilities: ['AUTOMATED_RESPONSE', 'CONTAINMENT', 'FORENSICS'],
    configuration: {
      responseTime: 30,
      isolationCapability: true,
      evidenceCollection: true
    },
    status: 'processing',
    model_version: '1.8.2',
    accuracy_score: 91.2,
    total_tasks: 1456,
    successful_tasks: 1398,
    failed_tasks: 58,
    last_activity: new Date(),
    performance_metrics: {
      averageContainmentTime: 45,
      successfulIsolations: 234,
      evidenceItemsCollected: 1847
    },
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: uuidv4(),
    name: 'ThreatIntel-Gamma',
    type: 'threat_intel',
    description: 'Intelligence-focused agent that monitors threat feeds, analyzes IOCs, and provides actionable threat intelligence to security teams.',
    capabilities: ['IOC_ANALYSIS', 'THREAT_HUNTING', 'INTELLIGENCE_CORRELATION'],
    configuration: {
      threatFeedSources: 47,
      iocProcessingRate: 5000,
      correlationAccuracy: 0.89
    },
    status: 'online',
    model_version: '3.0.1',
    accuracy_score: 89.7,
    total_tasks: 3291,
    successful_tasks: 3102,
    failed_tasks: 189,
    last_activity: new Date(),
    performance_metrics: {
      threatsIdentified: 423,
      iocProcessed: 12847,
      correlationMatches: 2891
    },
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: uuidv4(),
    name: 'ReportGen-Delta',
    type: 'report_generation',
    description: 'Automated reporting agent that generates comprehensive security reports, executive summaries, and compliance documentation.',
    capabilities: ['REPORT_GENERATION', 'DATA_VISUALIZATION', 'COMPLIANCE_DOCS'],
    configuration: {
      reportFormats: ['PDF', 'HTML', 'JSON'],
      scheduledReports: 15,
      executiveSummaries: true
    },
    status: 'online',
    model_version: '1.5.7',
    accuracy_score: 96.3,
    total_tasks: 892,
    successful_tasks: 859,
    failed_tasks: 33,
    last_activity: new Date(),
    performance_metrics: {
      reportsGenerated: 234,
      executiveBriefings: 89,
      complianceDocuments: 156
    },
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    created_at: new Date(),
    updated_at: new Date()
  }
];

const sampleActivities = [
  {
    id: uuidv4(),
    user_id: null,
    agent_id: sampleAIAgents[0].id,
    action: 'alert_analysis',
    description: 'Analyzed 47 new security alerts and classified 12 as high priority',
    metadata: {
      alertsProcessed: 47,
      highPriority: 12,
      falsePositives: 8,
      processingTime: 2.3
    },
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    ip_address: null,
    user_agent: null,
    title: 'Alert Analysis Complete',
    activity_type: 'task_completed',
    impact: 'medium',
    agent_name: 'SOC-Analyst-Alpha',
    agent_type: 'soc_analyst',
    human_involved: 'Alice Johnson'
  },
  {
    id: uuidv4(),
    user_id: null,
    agent_id: sampleAIAgents[1].id,
    action: 'incident_containment',
    description: 'Successfully isolated compromised endpoint and collected forensic evidence',
    metadata: {
      endpointId: 'WS-2847-PC',
      containmentTime: 45,
      evidenceItems: 23,
      isolationMethod: 'network_quarantine'
    },
    timestamp: new Date(Date.now() - 900000), // 15 minutes ago
    ip_address: null,
    user_agent: null,
    title: 'Incident Containment Success',
    activity_type: 'task_completed',
    impact: 'high',
    agent_name: 'Incident-Response-Beta',
    agent_type: 'incident_response',
    human_involved: 'Bob Smith'
  },
  {
    id: uuidv4(),
    user_id: null,
    agent_id: sampleAIAgents[2].id,
    action: 'threat_intelligence',
    description: 'Processed 234 new IOCs and identified 3 active threat campaigns',
    metadata: {
      iocProcessed: 234,
      threatCampaigns: 3,
      correlationMatches: 67,
      riskLevel: 'medium'
    },
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    ip_address: null,
    user_agent: null,
    title: 'Threat Intelligence Update',
    activity_type: 'learning_update',
    impact: 'medium',
    agent_name: 'ThreatIntel-Gamma',
    agent_type: 'threat_intel',
    human_involved: null
  },
  {
    id: uuidv4(),
    user_id: null,
    agent_id: sampleAIAgents[3].id,
    action: 'report_generation',
    description: 'Generated weekly security summary and executive briefing',
    metadata: {
      reportType: 'weekly_summary',
      pages: 15,
      charts: 8,
      executiveSummary: true
    },
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    ip_address: null,
    user_agent: null,
    title: 'Weekly Report Generated',
    activity_type: 'task_completed',
    impact: 'low',
    agent_name: 'ReportGen-Delta',
    agent_type: 'report_generation',
    human_involved: 'Carol Davis'
  }
];

module.exports = { sampleAIAgents, sampleActivities };