const { models } = require('../models/index');

const seedPlaybooks = async (organizationId, createdByUserId) => {
  const playbooksData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440060',
      name: 'Malware Incident Response',
      description: 'Comprehensive playbook for responding to malware incidents including isolation, analysis, and remediation',
      category: 'Malware Response',
      triggerType: 'automatic',
      steps: [
        {
          id: 'step-001',
          name: 'Initial Assessment',
          type: 'automated',
          description: 'Assess the severity and scope of malware infection',
          parameters: {
            timeoutMinutes: 5,
            requiredInputs: ['assetId', 'alertSeverity'],
            automatedActions: ['gatherSystemInfo', 'checkNetworkConnections']
          },
          timeout: 300,
          isRequired: true,
          order: 1
        },
        {
          id: 'step-002',
          name: 'Asset Isolation',
          type: 'automated',
          description: 'Isolate infected asset from network to prevent spread',
          parameters: {
            timeoutMinutes: 2,
            isolationMethod: 'networkSegmentation',
            preserveForensics: true
          },
          timeout: 120,
          isRequired: true,
          order: 2
        },
        {
          id: 'step-003',
          name: 'Malware Analysis',
          type: 'manual',
          description: 'Analyze malware sample and determine attack vector',
          parameters: {
            analysisType: 'staticAndDynamic',
            sandboxEnvironment: 'isolated',
            reportRequired: true
          },
          timeout: 1800,
          isRequired: true,
          order: 3
        },
        {
          id: 'step-004',
          name: 'Human Review',
          type: 'approval',
          description: 'Security analyst reviews findings and approves remediation plan',
          parameters: {
            approvalLevel: 'seniorAnalyst',
            documentationRequired: true
          },
          timeout: 3600,
          isRequired: true,
          order: 4
        },
        {
          id: 'step-005',
          name: 'System Remediation',
          type: 'automated',
          description: 'Clean infected system and restore from backup if necessary',
          parameters: {
            cleaningMethod: 'comprehensive',
            backupRestoration: true,
            integrityCheck: true
          },
          timeout: 1800,
          isRequired: true,
          order: 5
        },
        {
          id: 'step-006',
          name: 'Network Reconnection',
          type: 'manual',
          description: 'Verify system is clean and reconnect to network',
          parameters: {
            verificationTests: ['antivirusScan', 'behaviorAnalysis'],
            monitoringPeriod: 24
          },
          timeout: 600,
          isRequired: true,
          order: 6
        }
      ],
      isActive: true,
      executionCount: 15,
      successRate: 93.33,
      averageExecutionTime: 4200,
      createdBy: createdByUserId,
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440061',
      name: 'Data Breach Response',
      description: 'Comprehensive data breach incident response including containment, assessment, and notification procedures',
      category: 'Data Protection',
      triggerType: 'manual',
      steps: [
        {
          id: 'step-001',
          name: 'Breach Assessment',
          type: 'manual',
          description: 'Assess scope and severity of data breach',
          parameters: {
            dataTypes: ['PII', 'PHI', 'PCI', 'confidential'],
            impactAssessment: true,
            legalReview: true
          },
          timeout: 1800,
          isRequired: true,
          order: 1
        },
        {
          id: 'step-002',
          name: 'Immediate Containment',
          type: 'automated',
          description: 'Contain the breach to prevent further data exposure',
          parameters: {
            containmentMethods: ['accessRevocation', 'systemIsolation', 'dataEncryption'],
            preserveEvidence: true
          },
          timeout: 600,
          isRequired: true,
          order: 2
        },
        {
          id: 'step-003',
          name: 'Legal and Compliance Notification',
          type: 'manual',
          description: 'Notify legal team and prepare compliance reports',
          parameters: {
            notifications: ['legal', 'compliance', 'privacy'],
            timeFrames: {
              'GDPR': 72,
              'CCPA': 24,
              'HIPAA': 60
            }
          },
          timeout: 3600,
          isRequired: true,
          order: 3
        },
        {
          id: 'step-004',
          name: 'Customer Notification',
          type: 'approval',
          description: 'Prepare and approve customer breach notifications',
          parameters: {
            approvalLevel: 'executive',
            communicationChannels: ['email', 'website', 'mail'],
            legalReview: true
          },
          timeout: 7200,
          isRequired: true,
          order: 4
        }
      ],
      isActive: true,
      executionCount: 3,
      successRate: 100.0,
      averageExecutionTime: 18000,
      createdBy: createdByUserId,
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440062',
      name: 'Network Intrusion Response',
      description: 'Response playbook for network-based attacks and unauthorized access attempts',
      category: 'Network Security',
      triggerType: 'automatic',
      steps: [
        {
          id: 'step-001',
          name: 'Traffic Analysis',
          type: 'automated',
          description: 'Analyze network traffic to understand attack vector',
          parameters: {
            analysisDepth: 'deep',
            timeWindow: 24,
            protocolAnalysis: true
          },
          timeout: 900,
          isRequired: true,
          order: 1
        },
        {
          id: 'step-002',
          name: 'Firewall Rules Update',
          type: 'automated',
          description: 'Block malicious IPs and update firewall rules',
          parameters: {
            blockingSources: ['maliciousIPs', 'suspiciousCountries'],
            ruleType: 'deny',
            logTraffic: true
          },
          timeout: 300,
          isRequired: true,
          order: 2
        },
        {
          id: 'step-003',
          name: 'Affected System Investigation',
          type: 'manual',
          description: 'Investigate potentially compromised systems',
          parameters: {
            investigationScope: 'comprehensive',
            forensicCapture: true,
            memoryAnalysis: true
          },
          timeout: 3600,
          isRequired: true,
          order: 3
        }
      ],
      isActive: true,
      executionCount: 8,
      successRate: 87.5,
      averageExecutionTime: 5400,
      createdBy: createdByUserId,
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440063',
      name: 'Phishing Email Response',
      description: 'Automated response to phishing email attacks including user notification and email security updates',
      category: 'Email Security',
      triggerType: 'automatic',
      steps: [
        {
          id: 'step-001',
          name: 'Email Analysis',
          type: 'automated',
          description: 'Analyze phishing email content and extract IOCs',
          parameters: {
            analysisTypes: ['headerAnalysis', 'contentAnalysis', 'attachmentScanning'],
            iocExtraction: true,
            reputationCheck: true
          },
          timeout: 300,
          isRequired: true,
          order: 1
        },
        {
          id: 'step-002',
          name: 'Email Quarantine',
          type: 'automated',
          description: 'Quarantine similar emails and update email security rules',
          parameters: {
            quarantineScope: 'organization',
            similarityThreshold: 0.8,
            updateRules: true
          },
          timeout: 180,
          isRequired: true,
          order: 2
        },
        {
          id: 'step-003',
          name: 'User Notification',
          type: 'automated',
          description: 'Notify affected users and provide security awareness guidance',
          parameters: {
            notificationMethod: 'email',
            includeGuidance: true,
            trackingEnabled: true
          },
          timeout: 300,
          isRequired: true,
          order: 3
        }
      ],
      isActive: true,
      executionCount: 42,
      successRate: 95.24,
      averageExecutionTime: 780,
      createdBy: createdByUserId,
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440064',
      name: 'Vulnerability Management',
      description: 'Systematic approach to vulnerability assessment, prioritization, and remediation',
      category: 'Vulnerability Management',
      triggerType: 'manual',
      steps: [
        {
          id: 'step-001',
          name: 'Vulnerability Assessment',
          type: 'automated',
          description: 'Scan systems for known vulnerabilities',
          parameters: {
            scanType: 'authenticated',
            scope: 'all',
            scanDepth: 'comprehensive'
          },
          timeout: 7200,
          isRequired: true,
          order: 1
        },
        {
          id: 'step-002',
          name: 'Risk Prioritization',
          type: 'automated',
          description: 'Prioritize vulnerabilities based on risk score',
          parameters: {
            riskFactors: ['cvssScore', 'exploitability', 'businessImpact'],
            priorityLevels: 5,
            businessContext: true
          },
          timeout: 1800,
          isRequired: true,
          order: 2
        },
        {
          id: 'step-003',
          name: 'Patch Management',
          type: 'manual',
          description: 'Plan and execute vulnerability remediation',
          parameters: {
            patchTesting: true,
            rollbackPlan: true,
            maintenanceWindow: true
          },
          timeout: 14400,
          isRequired: true,
          order: 3
        }
      ],
      isActive: true,
      executionCount: 12,
      successRate: 91.67,
      averageExecutionTime: 23400,
      createdBy: createdByUserId,
      organizationId,
    },
  ];

  const playbooks = await models.Playbook.bulkCreate(playbooksData, {
    returning: true,
  });

  return playbooks;
};

module.exports = { seedPlaybooks };