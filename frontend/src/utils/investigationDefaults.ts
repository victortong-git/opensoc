import { InvestigationPhase } from '../types/investigationTypes';

export const createDefaultInvestigationPhases = (huntType: string = 'proactive'): InvestigationPhase[] => {
  return [
    {
      id: 'preparation',
      name: 'Preparation Phase',
      description: 'Initial planning, scope definition, and resource preparation',
      order: 1,
      status: 'pending',
      estimatedDuration: '2-4 hours',
      procedures: [
        {
          id: 'prep_001',
          title: 'Define Hunt Scope',
          description: 'Establish clear boundaries and objectives for the threat hunting activity',
          type: 'documentation',
          priority: 'high',
          requiredTools: ['Documentation Platform', 'Asset Inventory'],
          expectedOutputs: [
            'Clearly defined hunting objectives',
            'Asset inventory and scope boundaries',
            'Success criteria documentation'
          ],
          dependencies: [],
          timeEstimate: '60 minutes',
          steps: [],
          validationCriteria: [
            'Scope is clearly documented and approved',
            'All stakeholders understand the objectives',
            'Resource requirements are identified'
          ],
          deliverables: ['Scope Document', 'Resource Requirements']
        },
        {
          id: 'prep_002',
          title: 'Tool Setup and Validation',
          description: 'Configure and validate all required tools and data sources',
          type: 'validation',
          priority: 'high',
          requiredTools: ['SIEM Platform', 'EDR Tools', 'Network Monitoring'],
          expectedOutputs: [
            'Verified tool connectivity',
            'Baseline performance metrics',
            'Data source validation'
          ],
          dependencies: ['prep_001'],
          timeEstimate: '90 minutes',
          steps: [],
          validationCriteria: [
            'All tools are accessible and functional',
            'Data sources are providing current information',
            'Query performance is within acceptable limits'
          ],
          deliverables: ['Tool Readiness Report', 'Baseline Metrics']
        }
      ]
    },
    {
      id: 'collection',
      name: 'Data Collection Phase',
      description: 'Systematic gathering of relevant security data and evidence',
      order: 2,
      status: 'pending',
      estimatedDuration: '4-8 hours',
      procedures: [
        {
          id: 'coll_001',
          title: 'Log Data Aggregation',
          description: 'Collect and normalize relevant log data from multiple sources',
          type: 'collection',
          priority: 'critical',
          requiredTools: ['SIEM', 'Log Aggregation Platform', 'Custom Scripts'],
          expectedOutputs: [
            'Normalized log datasets',
            'Time-correlated events',
            'Filtered relevant entries'
          ],
          dependencies: ['prep_002'],
          timeEstimate: '180 minutes',
          steps: [],
          validationCriteria: [
            'Data completeness verification',
            'Timestamp accuracy confirmation',
            'No data corruption detected'
          ],
          deliverables: ['Aggregated Log Dataset', 'Data Quality Report']
        },
        {
          id: 'coll_002',
          title: 'Network Traffic Analysis',
          description: 'Capture and analyze network traffic patterns for anomalies',
          type: 'collection',
          priority: 'high',
          requiredTools: ['Network Monitoring Tools', 'Packet Analyzers', 'Flow Analysis'],
          expectedOutputs: [
            'Network flow records',
            'Traffic pattern baselines',
            'Anomaly indicators'
          ],
          dependencies: ['prep_002'],
          timeEstimate: '120 minutes',
          steps: [],
          validationCriteria: [
            'Complete traffic capture for specified timeframe',
            'No packet loss during collection',
            'Traffic patterns align with business operations'
          ],
          deliverables: ['Network Flow Data', 'Traffic Analysis Report']
        }
      ]
    },
    {
      id: 'analysis',
      name: 'Analysis Phase',
      description: 'Deep analysis of collected data to identify threats and patterns',
      order: 3,
      status: 'pending',
      estimatedDuration: '6-12 hours',
      procedures: [
        {
          id: 'anal_001',
          title: 'Behavioral Analysis',
          description: 'Analyze user and system behavior for deviations from normal patterns',
          type: 'analysis',
          priority: 'critical',
          requiredTools: ['UEBA Platform', 'Statistical Analysis Tools', 'Machine Learning Models'],
          expectedOutputs: [
            'Behavioral anomaly reports',
            'Risk score assignments',
            'Pattern deviation analysis'
          ],
          dependencies: ['coll_001', 'coll_002'],
          timeEstimate: '240 minutes',
          steps: [],
          validationCriteria: [
            'Anomalies are statistically significant',
            'False positive rate is within acceptable limits',
            'Findings are correlated across multiple data sources'
          ],
          deliverables: ['Behavioral Analysis Report', 'Anomaly Database']
        },
        {
          id: 'anal_002',
          title: 'IOC Correlation',
          description: 'Correlate findings with known indicators of compromise',
          type: 'analysis',
          priority: 'high',
          requiredTools: ['Threat Intelligence Platform', 'IOC Database', 'Correlation Engine'],
          expectedOutputs: [
            'IOC match reports',
            'Threat actor attribution',
            'Campaign correlation analysis'
          ],
          dependencies: ['anal_001'],
          timeEstimate: '120 minutes',
          steps: [],
          validationCriteria: [
            'IOCs are from reputable threat intelligence sources',
            'Correlation confidence scores are documented',
            'Attribution claims are supported by evidence'
          ],
          deliverables: ['IOC Correlation Report', 'Attribution Assessment']
        }
      ]
    },
    {
      id: 'documentation',
      name: 'Documentation & Reporting',
      description: 'Comprehensive documentation of findings and recommendations',
      order: 4,
      status: 'pending',
      estimatedDuration: '2-4 hours',
      procedures: [
        {
          id: 'doc_001',
          title: 'Executive Summary',
          description: 'Create executive-level summary of findings and business impact',
          type: 'documentation',
          priority: 'high',
          requiredTools: ['Reporting Platform', 'Risk Assessment Framework'],
          expectedOutputs: [
            'Executive summary document',
            'Business risk assessment',
            'High-level recommendations'
          ],
          dependencies: ['anal_002'],
          timeEstimate: '90 minutes',
          steps: [],
          validationCriteria: [
            'Summary is clear and non-technical',
            'Business impact is quantified',
            'Recommendations are actionable'
          ],
          deliverables: ['Executive Summary', 'Business Impact Assessment']
        },
        {
          id: 'doc_002',
          title: 'Technical Documentation',
          description: 'Detailed technical findings and remediation procedures',
          type: 'documentation',
          priority: 'medium',
          requiredTools: ['Technical Documentation Platform', 'Diagram Tools'],
          expectedOutputs: [
            'Technical findings report',
            'Remediation procedures',
            'Detection rule improvements'
          ],
          dependencies: ['anal_002'],
          timeEstimate: '120 minutes',
          steps: [],
          validationCriteria: [
            'Technical details are accurate and complete',
            'Remediation steps are tested and validated',
            'Documentation follows organizational standards'
          ],
          deliverables: ['Technical Report', 'Remediation Guide', 'Detection Rules']
        }
      ]
    }
  ];
};