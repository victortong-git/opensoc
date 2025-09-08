const { models } = require('../models/index');
const { v4: uuidv4 } = require('uuid');

const seedAIAgents = async (organizationId) => {
  const aiAgentsData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440050',
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
        tasksInProgress: 12,
        successRate: 94.7,
        averageProcessingTime: 45.6,
        falsePositiveReduction: 62.3,
        learningAccuracy: 94.2,
        uptime: 99.6,
        collaborationScore: 88.9,
        humanFeedbackScore: 4.6
      },
      currentTasks: [
        {
          id: 'task-1',
          title: 'Analyze PowerShell Alert',
          description: 'Deep analysis of suspicious PowerShell activity on DC-SERVER-01',
          type: 'alert_triage',
          status: 'processing',
          priority: 5,
          assignedAgent: '550e8400-e29b-41d4-a716-446655440050',
          startTime: new Date(Date.now() - 1200000), // 20 minutes ago
          confidence: 89.7,
          humanValidation: false
        },
        {
          id: 'task-2',
          title: 'Correlate Network Anomalies',
          description: 'Correlating network traffic anomalies across multiple endpoints',
          type: 'investigation',
          status: 'processing',
          priority: 3,
          assignedAgent: '550e8400-e29b-41d4-a716-446655440050',
          startTime: new Date(Date.now() - 600000), // 10 minutes ago
          confidence: 76.4,
          humanValidation: true,
          collaboratingHuman: 'John Smith'
        }
      ],
      assignedHumans: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
      version: '2.1.3',
      lastUpdated: new Date(Date.now() - 900000), // 15 minutes ago
      organizationId,
    },
    
    {
      id: '550e8400-e29b-41d4-a716-446655440051',
      name: 'Incident Response Agent',
      type: 'incident_response',
      status: 'online',
      description: 'Specialized in automated incident response, containment actions, recovery coordination, and response plan execution.',
      capabilities: [
        {
          id: 'cap-5',
          name: 'Automated Containment',
          description: 'Rapid automated containment of security incidents',
          type: 'automation',
          enabled: true,
          accuracy: 97.3,
          learningProgress: 91.8
        },
        {
          id: 'cap-6',
          name: 'Impact Assessment',
          description: 'Real-time assessment of incident impact',
          type: 'analysis',
          enabled: true,
          accuracy: 89.6,
          learningProgress: 86.4
        },
        {
          id: 'cap-7',
          name: 'Recovery Orchestration',
          description: 'Coordinated recovery process management',
          type: 'automation',
          enabled: true,
          accuracy: 94.8,
          learningProgress: 88.1
        },
        {
          id: 'cap-8',
          name: 'Stakeholder Notification',
          description: 'Automated notification of relevant stakeholders',
          type: 'automation',
          enabled: true,
          accuracy: 98.2,
          learningProgress: 95.3
        }
      ],
      primaryFunctions: [
        'Automated incident classification',
        'Containment action coordination',
        'Impact assessment and prioritization',
        'Recovery process orchestration',
        'Stakeholder notification and updates'
      ],
      metrics: {
        tasksCompleted: 456,
        tasksInProgress: 3,
        successRate: 92.1,
        averageProcessingTime: 128.4,
        learningAccuracy: 91.7,
        uptime: 98.9,
        collaborationScore: 91.3,
        humanFeedbackScore: 4.8
      },
      currentTasks: [
        {
          id: 'task-3',
          title: 'Malware Containment',
          description: 'Executing containment for malware incident INC-2024-0234',
          type: 'incident_response',
          status: 'processing',
          priority: 5,
          assignedAgent: '550e8400-e29b-41d4-a716-446655440051',
          startTime: new Date(Date.now() - 300000), // 5 minutes ago
          confidence: 96.8,
          humanValidation: true,
          collaboratingHuman: 'Maria Wilson'
        }
      ],
      assignedHumans: ['550e8400-e29b-41d4-a716-446655440002'],
      version: '1.8.2',
      lastUpdated: new Date(Date.now() - 600000), // 10 minutes ago
      organizationId,
    },

    {
      id: '550e8400-e29b-41d4-a716-446655440052',
      name: 'Threat Intelligence Agent',
      type: 'threat_intel',
      status: 'processing',
      description: 'Advanced threat intelligence analysis, IOC enrichment, attribution research, and threat landscape monitoring.',
      capabilities: [
        {
          id: 'cap-9',
          name: 'IOC Enrichment',
          description: 'Comprehensive enrichment of indicators of compromise',
          type: 'analysis',
          enabled: true,
          accuracy: 96.3,
          learningProgress: 92.7
        },
        {
          id: 'cap-10',
          name: 'Threat Attribution',
          description: 'Attribution analysis linking threats to known groups',
          type: 'analysis',
          enabled: true,
          accuracy: 87.9,
          learningProgress: 79.4
        },
        {
          id: 'cap-11',
          name: 'Campaign Tracking',
          description: 'Long-term tracking of threat campaigns',
          type: 'analysis',
          enabled: true,
          accuracy: 91.2,
          learningProgress: 85.6
        },
        {
          id: 'cap-12',
          name: 'Predictive Threat Modeling',
          description: 'Predictive modeling of emerging threats',
          type: 'prediction',
          enabled: true,
          accuracy: 78.5,
          learningProgress: 68.9
        }
      ],
      primaryFunctions: [
        'IOC collection and enrichment',
        'Threat actor attribution',
        'Campaign correlation and tracking',
        'Predictive threat analysis',
        'Intelligence report generation'
      ],
      metrics: {
        tasksCompleted: 1893,
        tasksInProgress: 8,
        successRate: 89.4,
        averageProcessingTime: 256.7,
        learningAccuracy: 88.6,
        uptime: 99.2,
        collaborationScore: 85.7,
        humanFeedbackScore: 4.3
      },
      currentTasks: [
        {
          id: 'task-4',
          title: 'APT29 Campaign Analysis',
          description: 'Analyzing recent APT29 campaign indicators and TTPs',
          type: 'threat_analysis',
          status: 'processing',
          priority: 4,
          assignedAgent: '550e8400-e29b-41d4-a716-446655440052',
          startTime: new Date(Date.now() - 1800000), // 30 minutes ago
          confidence: 84.2,
          humanValidation: false
        },
        {
          id: 'task-5',
          title: 'IOC Database Update',
          description: 'Processing 247 new IOCs from threat intelligence feeds',
          type: 'threat_analysis',
          status: 'processing',
          priority: 2,
          assignedAgent: '550e8400-e29b-41d4-a716-446655440052',
          startTime: new Date(Date.now() - 1200000), // 20 minutes ago
          confidence: 93.8,
          humanValidation: false
        }
      ],
      assignedHumans: ['550e8400-e29b-41d4-a716-446655440001'],
      version: '1.9.7',
      lastUpdated: new Date(Date.now() - 1800000), // 30 minutes ago
      organizationId,
    },

    {
      id: '550e8400-e29b-41d4-a716-446655440053',
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
          name: 'Compliance Mapping',
          description: 'Automatic mapping of security controls to compliance frameworks',
          type: 'analysis',
          enabled: true,
          accuracy: 97.1,
          learningProgress: 92.8
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
        averageProcessingTime: 342.1,
        learningAccuracy: 94.1,
        uptime: 99.7,
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
          assignedAgent: '550e8400-e29b-41d4-a716-446655440053',
          startTime: new Date(Date.now() - 1800000), // 30 minutes ago
          confidence: 96.7,
          humanValidation: false
        },
        {
          id: 'task-7',
          title: 'Compliance Dashboard Update',
          description: 'Updating SOC 2 compliance dashboard with latest metrics',
          type: 'report_generation',
          status: 'pending',
          priority: 3,
          assignedAgent: '550e8400-e29b-41d4-a716-446655440053',
          startTime: new Date(Date.now() - 600000), // 10 minutes ago
          confidence: 89.3,
          humanValidation: true,
          collaboratingHuman: 'System Administrator'
        }
      ],
      assignedHumans: ['550e8400-e29b-41d4-a716-446655440001'],
      version: '1.5.7',
      lastUpdated: new Date(Date.now() - 2700000), // 45 minutes ago
      organizationId,
    }
  ];

  const agents = await models.AIAgent.bulkCreate(aiAgentsData, {
    returning: true,
    ignoreDuplicates: true,
  });

  return agents;
};

module.exports = { seedAIAgents };