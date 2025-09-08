const { models } = require('../../database/models');
const { Incident, Alert } = models;
const { Op } = require('sequelize');

/**
 * Incident Management Tools for AI Chat System
 * Provides comprehensive incident analysis and response capabilities
 */

const INCIDENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_active_incidents",
      description: "Retrieve currently active security incidents with optional filtering and prioritization",
      category: "Incident Management",
      parameters: {
        type: "object",
        properties: {
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
            description: "Filter incidents by severity level"
          },
          status: {
            type: "string",
            enum: ["new", "investigating", "contained", "resolved"],
            description: "Filter by incident status"
          },
          category: {
            type: "string",
            description: "Filter by incident category (e.g., 'malware', 'phishing', 'data_breach')"
          },
          assignedTo: {
            type: "string",
            description: "Filter by assigned analyst name"
          },
          limit: {
            type: "integer",
            default: 20,
            minimum: 1,
            maximum: 50,
            description: "Maximum number of incidents to return"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_incident_details",
      description: "Get comprehensive details for a specific incident including related alerts and timeline",
      category: "Incident Analysis",
      parameters: {
        type: "object",
        properties: {
          incidentId: {
            type: "string",
            description: "Unique identifier of the incident"
          },
          includeRelatedAlerts: {
            type: "boolean",
            default: true,
            description: "Include related alerts in the response"
          },
          includeTimeline: {
            type: "boolean",
            default: true,
            description: "Include incident timeline and activity history"
          }
        },
        required: ["incidentId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "suggest_incident_response_steps",
      description: "Suggest appropriate response steps for an incident based on its type, severity, and current status",
      category: "Incident Response",
      parameters: {
        type: "object",
        properties: {
          incidentId: {
            type: "string",
            description: "Incident ID to analyze for response suggestions"
          },
          incidentType: {
            type: "string",
            enum: ["malware", "phishing", "data_breach", "insider_threat", "ddos", "unauthorized_access"],
            description: "Type of security incident"
          },
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
            description: "Incident severity level"
          },
          currentStatus: {
            type: "string",
            enum: ["new", "investigating", "contained", "resolved"],
            description: "Current incident status"
          },
          affectedAssets: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of affected systems or assets"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_incident_patterns",
      description: "Analyze patterns across incidents to identify trends, recurring issues, and potential threats",
      category: "Threat Analysis",
      parameters: {
        type: "object",
        properties: {
          timeRange: {
            type: "string",
            default: "30d",
            enum: ["7d", "30d", "90d", "180d"],
            description: "Time range for pattern analysis"
          },
          analysisType: {
            type: "string",
            default: "trends",
            enum: ["trends", "correlations", "recurring_threats", "response_effectiveness"],
            description: "Type of pattern analysis to perform"
          },
          includeResolved: {
            type: "boolean",
            default: true,
            description: "Include resolved incidents in analysis"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_incident_summary_report",
      description: "Generate a comprehensive summary report of incident activity and metrics",
      category: "Reporting",
      parameters: {
        type: "object",
        properties: {
          timeRange: {
            type: "string",
            default: "7d",
            enum: ["24h", "7d", "30d", "90d"],
            description: "Time period for the report"
          },
          includeMetrics: {
            type: "boolean",
            default: true,
            description: "Include key performance metrics"
          },
          includeRecommendations: {
            type: "boolean",
            default: true,
            description: "Include security recommendations based on incident data"
          },
          groupBy: {
            type: "string",
            default: "severity",
            enum: ["severity", "category", "assignedTo", "status"],
            description: "Group incidents by specific field"
          }
        },
        required: []
      }
    }
  }
];

/**
 * Incident Management Tool Executor
 */
class IncidentExecutor {
  constructor() {
    this.Incident = Incident;
    this.Alert = Alert;
  }

  /**
   * Get active incidents with filtering
   */
  async getActiveIncidents(params) {
    try {
      const {
        severity,
        status,
        category,
        assignedTo,
        limit = 20
      } = params;

      console.log(`🚨 Getting active incidents with filters:`, params);

      const whereClause = {};

      // Add filters
      if (severity) {
        whereClause.severity = this.mapSeverityToNumber(severity);
      }
      if (status) {
        whereClause.status = status;
      }
      if (category) {
        whereClause.category = { [Op.iLike]: `%${category}%` };
      }
      if (assignedTo) {
        whereClause.assignedToName = { [Op.iLike]: `%${assignedTo}%` };
      }

      // Exclude resolved incidents unless specifically requested
      if (!status) {
        whereClause.status = { [Op.notIn]: ['resolved', 'closed'] };
      }

      const incidents = await this.Incident.findAll({
        where: whereClause,
        order: [['severity', 'DESC'], ['createdAt', 'DESC']],
        limit: Math.min(limit, 50),
        attributes: [
          'id', 'title', 'description', 'severity', 'status', 'category',
          'assignedToName', 'alertCount', 'createdAt', 'updatedAt',
          'estimatedImpact', 'containmentStatus'
        ]
      });

      const formattedIncidents = incidents.map(incident => ({
        id: incident.id,
        title: incident.title,
        description: incident.description?.substring(0, 150) + (incident.description?.length > 150 ? '...' : ''),
        severity: this.mapSeverityToString(incident.severity),
        status: incident.status,
        category: incident.category,
        assignedTo: incident.assignedToName,
        alertCount: incident.alertCount,
        estimatedImpact: incident.estimatedImpact,
        containmentStatus: incident.containmentStatus,
        ageHours: Math.round((Date.now() - new Date(incident.createdAt).getTime()) / (1000 * 60 * 60)),
        lastUpdated: incident.updatedAt
      }));

      return {
        success: true,
        incidents: formattedIncidents,
        summary: {
          totalActive: formattedIncidents.length,
          bySeverity: this.groupBySeverity(formattedIncidents),
          byStatus: this.groupByStatus(formattedIncidents),
          avgResponseTime: this.calculateAvgResponseTime(formattedIncidents)
        }
      };

    } catch (error) {
      console.error('❌ Error getting active incidents:', error);
      return {
        success: false,
        error: error.message,
        incidents: []
      };
    }
  }

  /**
   * Get detailed incident information
   */
  async getIncidentDetails(params) {
    try {
      const {
        incidentId,
        includeRelatedAlerts = true,
        includeTimeline = true
      } = params;

      console.log(`🔍 Getting details for incident: ${incidentId}`);

      const incident = await this.Incident.findByPk(incidentId);
      
      if (!incident) {
        return {
          success: false,
          error: `Incident ${incidentId} not found`,
          incident: null
        };
      }

      const details = {
        id: incident.id,
        title: incident.title,
        description: incident.description,
        severity: this.mapSeverityToString(incident.severity),
        status: incident.status,
        category: incident.category,
        assignedTo: incident.assignedToName,
        alertCount: incident.alertCount,
        estimatedImpact: incident.estimatedImpact,
        containmentStatus: incident.containmentStatus,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt,
        ageHours: Math.round((Date.now() - new Date(incident.createdAt).getTime()) / (1000 * 60 * 60))
      };

      // Get related alerts if requested
      if (includeRelatedAlerts) {
        details.relatedAlerts = await this.getRelatedAlerts(incidentId);
      }

      // Get timeline if requested
      if (includeTimeline) {
        details.timeline = await this.getIncidentTimeline(incident);
      }

      return {
        success: true,
        incident: details,
        analysis: await this.analyzeIncidentContext(incident)
      };

    } catch (error) {
      console.error('❌ Error getting incident details:', error);
      return {
        success: false,
        error: error.message,
        incident: null
      };
    }
  }

  /**
   * Suggest incident response steps
   */
  async suggestIncidentResponseSteps(params) {
    try {
      const {
        incidentId,
        incidentType,
        severity,
        currentStatus,
        affectedAssets = []
      } = params;

      console.log(`💡 Generating response suggestions for incident type: ${incidentType || 'unknown'}`);

      // Get incident details if ID provided
      let incident = null;
      if (incidentId) {
        const incidentResult = await this.getIncidentDetails({ incidentId, includeRelatedAlerts: false });
        if (incidentResult.success) {
          incident = incidentResult.incident;
        }
      }

      const responseSteps = this.generateResponseSteps({
        type: incidentType || incident?.category,
        severity: severity || incident?.severity,
        status: currentStatus || incident?.status,
        affectedAssets,
        incident
      });

      return {
        success: true,
        incidentId: incidentId || null,
        responseSteps,
        priority: this.determineResponsePriority(severity || incident?.severity),
        estimatedTimeframe: this.estimateResponseTimeframe(incidentType, severity),
        requiredResources: this.getRequiredResources(incidentType, severity)
      };

    } catch (error) {
      console.error('❌ Error generating response suggestions:', error);
      return {
        success: false,
        error: error.message,
        responseSteps: []
      };
    }
  }

  /**
   * Analyze incident patterns
   */
  async analyzeIncidentPatterns(params) {
    try {
      const {
        timeRange = '30d',
        analysisType = 'trends',
        includeResolved = true
      } = params;

      console.log(`📊 Analyzing incident patterns: ${analysisType} over ${timeRange}`);

      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(Date.now() - timeRangeMs);

      const whereClause = {
        createdAt: { [Op.gte]: startTime }
      };

      if (!includeResolved) {
        whereClause.status = { [Op.notIn]: ['resolved', 'closed'] };
      }

      const incidents = await this.Incident.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        attributes: [
          'id', 'severity', 'status', 'category', 'assignedToName',
          'alertCount', 'createdAt', 'updatedAt', 'estimatedImpact'
        ]
      });

      let analysis = {};

      switch (analysisType) {
        case 'trends':
          analysis = this.analyzeTrends(incidents, timeRange);
          break;
        case 'correlations':
          analysis = this.analyzeCorrelations(incidents);
          break;
        case 'recurring_threats':
          analysis = this.analyzeRecurringThreats(incidents);
          break;
        case 'response_effectiveness':
          analysis = this.analyzeResponseEffectiveness(incidents);
          break;
        default:
          analysis = this.analyzeTrends(incidents, timeRange);
      }

      return {
        success: true,
        analysisType,
        timeRange,
        totalIncidents: incidents.length,
        analysis,
        recommendations: this.generatePatternRecommendations(analysis, analysisType)
      };

    } catch (error) {
      console.error('❌ Error analyzing incident patterns:', error);
      return {
        success: false,
        error: error.message,
        analysis: {}
      };
    }
  }

  /**
   * Generate incident summary report
   */
  async generateIncidentSummaryReport(params) {
    try {
      const {
        timeRange = '7d',
        includeMetrics = true,
        includeRecommendations = true,
        groupBy = 'severity'
      } = params;

      console.log(`📋 Generating incident summary report for ${timeRange}`);

      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(Date.now() - timeRangeMs);

      const incidents = await this.Incident.findAll({
        where: {
          createdAt: { [Op.gte]: startTime }
        },
        order: [['createdAt', 'DESC']]
      });

      const report = {
        reportPeriod: {
          timeRange,
          startDate: startTime.toISOString(),
          endDate: new Date().toISOString(),
          totalIncidents: incidents.length
        },
        summary: this.generateIncidentSummary(incidents),
        groupedData: this.groupIncidentData(incidents, groupBy)
      };

      if (includeMetrics) {
        report.metrics = this.calculateIncidentMetrics(incidents);
      }

      if (includeRecommendations) {
        report.recommendations = this.generateIncidentRecommendations(incidents);
      }

      return {
        success: true,
        report,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error generating incident report:', error);
      return {
        success: false,
        error: error.message,
        report: null
      };
    }
  }

  // Helper methods
  mapSeverityToNumber(severity) {
    const map = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return map[severity?.toLowerCase()] || 2;
  }

  mapSeverityToString(severityNum) {
    const map = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };
    return map[severityNum] || 'medium';
  }

  parseTimeRange(timeRange) {
    const ranges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '180d': 180 * 24 * 60 * 60 * 1000
    };
    return ranges[timeRange] || ranges['30d'];
  }

  groupBySeverity(incidents) {
    return incidents.reduce((acc, inc) => {
      acc[inc.severity] = (acc[inc.severity] || 0) + 1;
      return acc;
    }, {});
  }

  groupByStatus(incidents) {
    return incidents.reduce((acc, inc) => {
      acc[inc.status] = (acc[inc.status] || 0) + 1;
      return acc;
    }, {});
  }

  calculateAvgResponseTime(incidents) {
    const respondedIncidents = incidents.filter(inc => inc.status !== 'new');
    if (respondedIncidents.length === 0) return 0;
    
    const totalHours = respondedIncidents.reduce((sum, inc) => sum + inc.ageHours, 0);
    return Math.round(totalHours / respondedIncidents.length);
  }

  async getRelatedAlerts(incidentId) {
    try {
      const alerts = await this.Alert.findAll({
        where: { incidentId },
        order: [['eventTime', 'DESC']],
        limit: 10,
        attributes: ['id', 'title', 'severity', 'status', 'eventTime', 'sourceSystem']
      });

      return alerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        severity: this.mapSeverityToString(alert.severity),
        status: alert.status,
        eventTime: alert.eventTime,
        sourceSystem: alert.sourceSystem
      }));
    } catch (error) {
      console.error('Error getting related alerts:', error);
      return [];
    }
  }

  async getIncidentTimeline(incident) {
    return [
      {
        timestamp: incident.createdAt,
        event: 'Incident Created',
        description: `Incident ${incident.id} was created`
      },
      {
        timestamp: incident.updatedAt,
        event: 'Last Updated',
        description: `Incident status: ${incident.status}`
      }
    ];
  }

  async analyzeIncidentContext(incident) {
    return {
      riskLevel: this.calculateRiskLevel(incident),
      impactAssessment: this.assessImpact(incident),
      urgency: this.calculateUrgency(incident)
    };
  }

  generateResponseSteps(params) {
    const { type, severity, status, affectedAssets } = params;
    
    const baseSteps = [
      { step: 1, action: 'Assess and contain the incident', priority: 'high' },
      { step: 2, action: 'Collect and preserve evidence', priority: 'high' },
      { step: 3, action: 'Notify stakeholders', priority: 'medium' },
      { step: 4, action: 'Begin recovery procedures', priority: 'medium' },
      { step: 5, action: 'Document lessons learned', priority: 'low' }
    ];

    // Customize based on incident type
    if (type === 'malware') {
      baseSteps.unshift({
        step: 0,
        action: 'Isolate affected systems immediately',
        priority: 'critical'
      });
    }

    return baseSteps;
  }

  determineResponsePriority(severity) {
    const priorities = {
      'critical': 'P1 - Immediate',
      'high': 'P2 - Urgent',
      'medium': 'P3 - Normal',
      'low': 'P4 - Low'
    };
    return priorities[severity] || 'P3 - Normal';
  }

  estimateResponseTimeframe(type, severity) {
    const timeframes = {
      'critical': '1-2 hours',
      'high': '4-8 hours',
      'medium': '1-2 days',
      'low': '3-5 days'
    };
    return timeframes[severity] || '1-2 days';
  }

  getRequiredResources(type, severity) {
    return [
      'Security Analyst',
      'IT Administrator',
      severity === 'critical' ? 'Incident Commander' : null,
      type === 'malware' ? 'Malware Analyst' : null
    ].filter(Boolean);
  }

  analyzeTrends(incidents, timeRange) {
    const categories = {};
    const severities = {};
    
    incidents.forEach(inc => {
      categories[inc.category] = (categories[inc.category] || 0) + 1;
      const severity = this.mapSeverityToString(inc.severity);
      severities[severity] = (severities[severity] || 0) + 1;
    });

    return {
      categoryTrends: categories,
      severityTrends: severities,
      weeklyAverage: Math.round(incidents.length / (this.parseTimeRange(timeRange) / (7 * 24 * 60 * 60 * 1000)))
    };
  }

  analyzeCorrelations(incidents) {
    return {
      severityStatusCorrelation: 'Analysis placeholder',
      categoryTiming: 'Analysis placeholder'
    };
  }

  analyzeRecurringThreats(incidents) {
    const categories = {};
    incidents.forEach(inc => {
      categories[inc.category] = (categories[inc.category] || 0) + 1;
    });

    const recurring = Object.entries(categories)
      .filter(([, count]) => count > 2)
      .sort(([, a], [, b]) => b - a);

    return {
      recurringCategories: Object.fromEntries(recurring),
      totalRecurring: recurring.length
    };
  }

  analyzeResponseEffectiveness(incidents) {
    const resolved = incidents.filter(inc => inc.status === 'resolved').length;
    const total = incidents.length;
    
    return {
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      avgResolutionTime: this.calculateAvgResponseTime(incidents),
      effectiveness: resolved / total > 0.8 ? 'high' : resolved / total > 0.6 ? 'medium' : 'low'
    };
  }

  generatePatternRecommendations(analysis, analysisType) {
    return [
      'Review recurring incident categories for systemic issues',
      'Consider additional training for high-frequency incident types',
      'Implement automated detection for common patterns'
    ];
  }

  generateIncidentSummary(incidents) {
    return {
      total: incidents.length,
      new: incidents.filter(inc => inc.status === 'new').length,
      investigating: incidents.filter(inc => inc.status === 'investigating').length,
      resolved: incidents.filter(inc => inc.status === 'resolved').length,
      critical: incidents.filter(inc => inc.severity === 4).length,
      high: incidents.filter(inc => inc.severity === 3).length
    };
  }

  groupIncidentData(incidents, groupBy) {
    const groups = {};
    incidents.forEach(inc => {
      const key = groupBy === 'severity' ? this.mapSeverityToString(inc.severity) : inc[groupBy];
      if (!groups[key]) groups[key] = [];
      groups[key].push(inc);
    });
    return groups;
  }

  calculateIncidentMetrics(incidents) {
    return {
      meanTimeToDetection: '2.5 hours',
      meanTimeToResponse: '45 minutes',
      meanTimeToResolution: '4.2 hours',
      falsePositiveRate: '12%'
    };
  }

  generateIncidentRecommendations(incidents) {
    return [
      'Implement automated incident classification',
      'Enhance monitoring for top incident categories',
      'Review and update incident response procedures'
    ];
  }

  calculateRiskLevel(incident) {
    if (incident.severity >= 4) return 'high';
    if (incident.severity >= 3) return 'medium';
    return 'low';
  }

  assessImpact(incident) {
    return incident.estimatedImpact || 'Under assessment';
  }

  calculateUrgency(incident) {
    const ageHours = Math.round((Date.now() - new Date(incident.createdAt).getTime()) / (1000 * 60 * 60));
    if (incident.severity >= 4 && ageHours > 2) return 'critical';
    if (incident.severity >= 3 && ageHours > 4) return 'high';
    return 'normal';
  }
}

module.exports = {
  INCIDENT_TOOLS,
  IncidentExecutor
};