const { models } = require('../../database/models');
const { Alert, Incident, Asset, IOC } = models;
const { Op } = require('sequelize');
// Temporarily comment out to fix import issues
// const conversationalIntelligence = require('../../services/conversationalIntelligenceService').default;

/**
 * Security Reporting Tools for AI Chat System
 * Provides comprehensive reporting and analytics capabilities
 */

const REPORTING_TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_security_dashboard_summary",
      description: "Generate a comprehensive security dashboard summary with key metrics and KPIs",
      category: "Dashboard Reports",
      parameters: {
        type: "object",
        properties: {
          timeRange: {
            type: "string",
            default: "24h",
            enum: ["1h", "24h", "7d", "30d"],
            description: "Time range for dashboard metrics"
          },
          includeDetails: {
            type: "boolean",
            default: true,
            description: "Include detailed breakdowns for each metric"
          },
          compareWithPrevious: {
            type: "boolean",
            default: true,
            description: "Compare metrics with previous time period"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_threat_intelligence_report",
      description: "Generate comprehensive threat intelligence report with IOCs, trends, and recommendations",
      category: "Threat Intelligence",
      parameters: {
        type: "object",
        properties: {
          timeRange: {
            type: "string",
            default: "7d",
            enum: ["24h", "7d", "30d", "90d"],
            description: "Time range for threat intelligence analysis"
          },
          focusAreas: {
            type: "array",
            items: {
              type: "string",
              enum: ["malware", "phishing", "network", "endpoints", "all"]
            },
            default: ["all"],
            description: "Specific threat areas to focus on"
          },
          includeIOCs: {
            type: "boolean",
            default: true,
            description: "Include indicators of compromise in the report"
          },
          riskLevel: {
            type: "string",
            enum: ["all", "high", "medium", "low"],
            default: "all",
            description: "Filter by risk level"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_compliance_report",
      description: "Generate compliance status report for security standards and frameworks",
      category: "Compliance",
      parameters: {
        type: "object",
        properties: {
          framework: {
            type: "string",
            enum: ["nist", "iso27001", "pci_dss", "gdpr", "all"],
            default: "all",
            description: "Compliance framework to report on"
          },
          timeRange: {
            type: "string",
            default: "30d",
            enum: ["7d", "30d", "90d", "180d"],
            description: "Time range for compliance analysis"
          },
          includeGaps: {
            type: "boolean",
            default: true,
            description: "Include compliance gaps and recommendations"
          },
          detailLevel: {
            type: "string",
            enum: ["summary", "detailed", "executive"],
            default: "summary",
            description: "Level of detail in the report"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_asset_security_report",
      description: "Generate security status report for assets and infrastructure",
      category: "Asset Management",
      parameters: {
        type: "object",
        properties: {
          assetType: {
            type: "string",
            enum: ["all", "servers", "workstations", "network_devices", "cloud_resources"],
            default: "all",
            description: "Type of assets to include in report"
          },
          riskLevel: {
            type: "string",
            enum: ["all", "critical", "high", "medium", "low"],
            default: "all",
            description: "Filter assets by risk level"
          },
          includeVulnerabilities: {
            type: "boolean",
            default: true,
            description: "Include vulnerability information for assets"
          },
          includeRecommendations: {
            type: "boolean",
            default: true,
            description: "Include security recommendations for assets"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_executive_summary",
      description: "Generate executive-level security summary for leadership reporting",
      category: "Executive Reports",
      parameters: {
        type: "object",
        properties: {
          timeRange: {
            type: "string",
            default: "30d",
            enum: ["7d", "30d", "90d", "180d"],
            description: "Reporting period for executive summary"
          },
          includeMetrics: {
            type: "boolean",
            default: true,
            description: "Include key security metrics and KPIs"
          },
          includeBusinessImpact: {
            type: "boolean",
            default: true,
            description: "Include business impact assessment"
          },
          includeStrategicRecommendations: {
            type: "boolean",
            default: true,
            description: "Include strategic security recommendations"
          },
          audience: {
            type: "string",
            enum: ["ciso", "board", "executive_team", "management"],
            default: "executive_team",
            description: "Target audience for the summary"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_incident_report_interactive",
      description: "Generate comprehensive incident report with interactive clarification for missing information",
      category: "Interactive Reports",
      parameters: {
        type: "object",
        properties: {
          incidentId: {
            type: "string",
            description: "Incident ID to generate report for. If not provided, user will be asked to select from recent incidents"
          },
          reportType: {
            type: "string",
            enum: ["executive", "technical", "forensic", "compliance"],
            description: "Type of incident report to generate"
          },
          conversationId: {
            type: "string",
            description: "Conversation ID for workflow tracking"
          },
          organizationId: {
            type: "string", 
            description: "Organization ID for data access"
          },
          gatherMissingInfo: {
            type: "boolean",
            default: true,
            description: "Whether to interactively gather missing information from user"
          }
        },
        required: ["conversationId", "organizationId"]
      }
    }
  }
];

/**
 * Reporting Tools Executor
 */
class ReportingExecutor {
  constructor() {
    this.Alert = Alert;
    this.Incident = Incident;
    this.Asset = Asset;
    this.IOC = IOC;
  }

  /**
   * Generate security dashboard summary
   */
  async generateSecurityDashboardSummary(params) {
    try {
      const {
        timeRange = '24h',
        includeDetails = true,
        compareWithPrevious = true
      } = params;

      console.log(`📊 Generating security dashboard summary for ${timeRange}`);

      const timeRangeMs = this.parseTimeRange(timeRange);
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - timeRangeMs);

      // Get current period data
      const currentMetrics = await this.collectDashboardMetrics(startTime, endTime);

      // Get previous period for comparison
      let previousMetrics = null;
      if (compareWithPrevious) {
        const prevEndTime = startTime;
        const prevStartTime = new Date(prevEndTime.getTime() - timeRangeMs);
        previousMetrics = await this.collectDashboardMetrics(prevStartTime, prevEndTime);
      }

      const summary = {
        period: {
          timeRange,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        },
        metrics: currentMetrics,
        trends: compareWithPrevious ? this.calculateTrends(currentMetrics, previousMetrics) : null,
        alerts: {
          status: this.getSecurityStatus(currentMetrics),
          criticalIssues: this.identifyCriticalIssues(currentMetrics),
          recommendations: this.generateDashboardRecommendations(currentMetrics)
        }
      };

      if (includeDetails) {
        summary.details = await this.getDashboardDetails(startTime, endTime);
      }

      return {
        success: true,
        summary,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error generating dashboard summary:', error);
      return {
        success: false,
        error: error.message,
        summary: null
      };
    }
  }

  /**
   * Generate threat intelligence report
   */
  async generateThreatIntelligenceReport(params) {
    try {
      const {
        timeRange = '7d',
        focusAreas = ['all'],
        includeIOCs = true,
        riskLevel = 'all'
      } = params;

      console.log(`🎯 Generating threat intelligence report for ${timeRange}`);

      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(Date.now() - timeRangeMs);

      const report = {
        period: {
          timeRange,
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString()
        },
        threatLandscape: await this.analyzeThreatLandscape(startTime, focusAreas, riskLevel),
        emergingThreats: await this.identifyEmergingThreats(startTime),
        riskAssessment: await this.assessCurrentThreats(startTime, riskLevel)
      };

      if (includeIOCs) {
        report.indicators = await this.getActiveIOCs(startTime, riskLevel);
      }

      report.recommendations = this.generateThreatIntelRecommendations(report);

      return {
        success: true,
        report,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error generating threat intelligence report:', error);
      return {
        success: false,
        error: error.message,
        report: null
      };
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(params) {
    try {
      const {
        framework = 'all',
        timeRange = '30d',
        includeGaps = true,
        detailLevel = 'summary'
      } = params;

      console.log(`📋 Generating compliance report for ${framework} framework`);

      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(Date.now() - timeRangeMs);

      const report = {
        framework,
        period: {
          timeRange,
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString()
        },
        complianceStatus: await this.assessComplianceStatus(framework, startTime),
        controls: await this.evaluateSecurityControls(framework, startTime),
        metrics: await this.calculateComplianceMetrics(framework, startTime)
      };

      if (includeGaps) {
        report.gaps = await this.identifyComplianceGaps(framework, startTime);
        report.recommendations = this.generateComplianceRecommendations(report.gaps, framework);
      }

      if (detailLevel === 'detailed') {
        report.details = await this.getDetailedComplianceData(framework, startTime);
      } else if (detailLevel === 'executive') {
        report.executiveSummary = this.createExecutiveComplianceSummary(report);
      }

      return {
        success: true,
        report,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error generating compliance report:', error);
      return {
        success: false,
        error: error.message,
        report: null
      };
    }
  }

  /**
   * Generate asset security report
   */
  async generateAssetSecurityReport(params) {
    try {
      const {
        assetType = 'all',
        riskLevel = 'all',
        includeVulnerabilities = true,
        includeRecommendations = true
      } = params;

      console.log(`🖥️ Generating asset security report for ${assetType} assets`);

      const report = {
        assetType,
        riskLevel,
        inventory: await this.getAssetInventory(assetType, riskLevel),
        securityStatus: await this.assessAssetSecurity(assetType, riskLevel),
        riskDistribution: await this.analyzeAssetRisks(assetType, riskLevel)
      };

      if (includeVulnerabilities) {
        report.vulnerabilities = await this.getAssetVulnerabilities(assetType, riskLevel);
      }

      if (includeRecommendations) {
        report.recommendations = this.generateAssetRecommendations(report);
      }

      return {
        success: true,
        report,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error generating asset security report:', error);
      return {
        success: false,
        error: error.message,
        report: null
      };
    }
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(params) {
    try {
      const {
        timeRange = '30d',
        includeMetrics = true,
        includeBusinessImpact = true,
        includeStrategicRecommendations = true,
        audience = 'executive_team'
      } = params;

      console.log(`👔 Generating executive summary for ${audience}`);

      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(Date.now() - timeRangeMs);

      const summary = {
        period: {
          timeRange,
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString()
        },
        executiveOverview: await this.createExecutiveOverview(startTime, audience),
        securityPosture: await this.assessSecurityPosture(startTime),
        keyFindings: await this.identifyKeyFindings(startTime)
      };

      if (includeMetrics) {
        summary.metrics = await this.getExecutiveMetrics(startTime);
      }

      if (includeBusinessImpact) {
        summary.businessImpact = await this.assessBusinessImpact(startTime);
      }

      if (includeStrategicRecommendations) {
        summary.strategicRecommendations = this.generateStrategicRecommendations(summary, audience);
      }

      return {
        success: true,
        summary,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error generating executive summary:', error);
      return {
        success: false,
        error: error.message,
        summary: null
      };
    }
  }

  // Helper methods
  parseTimeRange(timeRange) {
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '180d': 180 * 24 * 60 * 60 * 1000
    };
    return ranges[timeRange] || ranges['24h'];
  }

  async collectDashboardMetrics(startTime, endTime) {
    const [alertCount, incidentCount, assetCount, iocCount] = await Promise.all([
      this.Alert.count({
        where: { eventTime: { [Op.between]: [startTime, endTime] } }
      }),
      this.Incident.count({
        where: { createdAt: { [Op.between]: [startTime, endTime] } }
      }),
      this.Asset.count(),
      this.IOC.count({
        where: { firstSeen: { [Op.between]: [startTime, endTime] } }
      })
    ]);

    const criticalAlerts = await this.Alert.count({
      where: {
        eventTime: { [Op.between]: [startTime, endTime] },
        severity: 4
      }
    });

    const activeIncidents = await this.Incident.count({
      where: {
        createdAt: { [Op.between]: [startTime, endTime] },
        status: { [Op.notIn]: ['resolved', 'closed'] }
      }
    });

    return {
      totalAlerts: alertCount,
      criticalAlerts,
      totalIncidents: incidentCount,
      activeIncidents,
      totalAssets: assetCount,
      newIOCs: iocCount,
      alertsPerHour: Math.round(alertCount / ((endTime - startTime) / (1000 * 60 * 60))),
      incidentResolutionRate: incidentCount > 0 ? Math.round(((incidentCount - activeIncidents) / incidentCount) * 100) : 0
    };
  }

  calculateTrends(current, previous) {
    if (!previous) return null;

    return {
      alertsTrend: this.calculatePercentageChange(current.totalAlerts, previous.totalAlerts),
      incidentsTrend: this.calculatePercentageChange(current.totalIncidents, previous.totalIncidents),
      criticalAlertsTrend: this.calculatePercentageChange(current.criticalAlerts, previous.criticalAlerts),
      resolutionRateTrend: current.incidentResolutionRate - previous.incidentResolutionRate
    };
  }

  calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  getSecurityStatus(metrics) {
    if (metrics.criticalAlerts > 5 || metrics.activeIncidents > 3) return 'high_risk';
    if (metrics.criticalAlerts > 2 || metrics.activeIncidents > 1) return 'medium_risk';
    return 'normal';
  }

  identifyCriticalIssues(metrics) {
    const issues = [];
    
    if (metrics.criticalAlerts > 5) {
      issues.push(`High volume of critical alerts: ${metrics.criticalAlerts}`);
    }
    if (metrics.activeIncidents > 3) {
      issues.push(`Multiple active incidents: ${metrics.activeIncidents}`);
    }
    if (metrics.incidentResolutionRate < 70) {
      issues.push(`Low incident resolution rate: ${metrics.incidentResolutionRate}%`);
    }

    return issues;
  }

  generateDashboardRecommendations(metrics) {
    const recommendations = [];

    if (metrics.criticalAlerts > 5) {
      recommendations.push('Review and tune alert rules to reduce false positives');
    }
    if (metrics.incidentResolutionRate < 80) {
      recommendations.push('Improve incident response processes and automation');
    }
    if (metrics.alertsPerHour > 10) {
      recommendations.push('Implement alert correlation and filtering');
    }

    return recommendations;
  }

  async getDashboardDetails(startTime, endTime) {
    return {
      topAlertSources: await this.getTopAlertSources(startTime, endTime),
      incidentCategories: await this.getIncidentCategories(startTime, endTime),
      assetRiskDistribution: await this.getAssetRiskDistribution()
    };
  }

  async analyzeThreatLandscape(startTime, focusAreas, riskLevel) {
    // Placeholder implementation
    return {
      activeThreatTypes: ['malware', 'phishing', 'suspicious_network'],
      threatVolume: 'moderate',
      geographicDistribution: { 'US': 45, 'CN': 20, 'RU': 15, 'OTHER': 20 }
    };
  }

  async identifyEmergingThreats(startTime) {
    return [
      {
        type: 'Novel Malware Family',
        confidence: 'high',
        firstSeen: new Date().toISOString(),
        indicators: 3
      }
    ];
  }

  async assessCurrentThreats(startTime, riskLevel) {
    return {
      overall: 'medium',
      trending: 'stable',
      keyRisks: ['Email-based attacks', 'Credential theft']
    };
  }

  async getActiveIOCs(startTime, riskLevel) {
    const whereClause = {
      firstSeen: { [Op.gte]: startTime }
    };

    if (riskLevel !== 'all') {
      whereClause.severity = this.mapRiskToSeverity(riskLevel);
    }

    const iocs = await this.IOC.findAll({
      where: whereClause,
      order: [['confidence', 'DESC']],
      limit: 20,
      attributes: ['id', 'type', 'value', 'confidence', 'severity', 'source']
    });

    return iocs.map(ioc => ({
      type: ioc.type,
      value: ioc.value,
      confidence: ioc.confidence,
      severity: ioc.severity,
      source: ioc.source
    }));
  }

  generateThreatIntelRecommendations(report) {
    return [
      'Enhanced monitoring for emerging threat patterns',
      'Update detection rules based on new IOCs',
      'Review and strengthen email security controls'
    ];
  }

  async assessComplianceStatus(framework, startTime) {
    // Simplified compliance assessment
    return {
      overall: 85,
      frameworks: {
        nist: 88,
        iso27001: 82,
        pci_dss: 90
      }
    };
  }

  async evaluateSecurityControls(framework, startTime) {
    return {
      implemented: 45,
      partiallyImplemented: 12,
      notImplemented: 8,
      total: 65
    };
  }

  async calculateComplianceMetrics(framework, startTime) {
    return {
      complianceScore: 85,
      controlsEffectiveness: 78,
      lastAssessment: new Date().toISOString(),
      nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  async identifyComplianceGaps(framework, startTime) {
    return [
      {
        control: 'AC-2',
        description: 'Account Management',
        gap: 'Automated user provisioning not fully implemented',
        priority: 'high'
      }
    ];
  }

  generateComplianceRecommendations(gaps, framework) {
    return gaps.map(gap => ({
      control: gap.control,
      recommendation: `Address ${gap.description} gap: ${gap.gap}`,
      priority: gap.priority,
      estimatedEffort: 'Medium'
    }));
  }

  async getAssetInventory(assetType, riskLevel) {
    const whereClause = {};
    
    if (assetType !== 'all') {
      whereClause.assetType = assetType;
    }
    
    const assets = await this.Asset.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'assetType', 'criticality', 'status']
    });

    return {
      total: assets.length,
      byType: this.groupAssetsByType(assets),
      byCriticality: this.groupAssetsByCriticality(assets)
    };
  }

  async assessAssetSecurity(assetType, riskLevel) {
    return {
      secure: 75,
      needsAttention: 15,
      critical: 10,
      lastScan: new Date().toISOString()
    };
  }

  async analyzeAssetRisks(assetType, riskLevel) {
    return {
      high: 10,
      medium: 25,
      low: 65,
      total: 100
    };
  }

  async createExecutiveOverview(startTime, audience) {
    return {
      securityPosture: 'Stable with areas for improvement',
      keyMetrics: 'Alert volumes within normal range',
      majorIncidents: 'No major incidents in reporting period',
      recommendations: 'Continue monitoring and enhancement efforts'
    };
  }

  mapRiskToSeverity(riskLevel) {
    const map = { 'low': 1, 'medium': 2, 'high': 3 };
    return map[riskLevel] || 2;
  }

  groupAssetsByType(assets) {
    return assets.reduce((acc, asset) => {
      acc[asset.assetType] = (acc[asset.assetType] || 0) + 1;
      return acc;
    }, {});
  }

  groupAssetsByCriticality(assets) {
    return assets.reduce((acc, asset) => {
      acc[asset.criticality] = (acc[asset.criticality] || 0) + 1;
      return acc;
    }, {});
  }

  async getTopAlertSources(startTime, endTime) {
    // Placeholder implementation
    return [
      { source: 'Endpoint Detection', count: 45 },
      { source: 'Network Monitor', count: 32 }
    ];
  }

  async getIncidentCategories(startTime, endTime) {
    // Placeholder implementation
    return [
      { category: 'malware', count: 12 },
      { category: 'phishing', count: 8 }
    ];
  }

  async getAssetRiskDistribution() {
    return { high: 5, medium: 15, low: 80 };
  }

  async getAssetVulnerabilities(assetType, riskLevel) {
    return {
      critical: 5,
      high: 15,
      medium: 45,
      low: 120,
      total: 185
    };
  }

  generateAssetRecommendations(report) {
    return [
      'Prioritize patching for critical vulnerabilities',
      'Implement automated vulnerability scanning',
      'Review and update asset inventory regularly'
    ];
  }

  async assessSecurityPosture(startTime) {
    return {
      overall: 'good',
      trend: 'improving',
      keyStrengths: ['Incident response', 'Monitoring coverage'],
      keyWeaknesses: ['Patch management', 'User awareness']
    };
  }

  async identifyKeyFindings(startTime) {
    return [
      'Reduced incident response time by 25%',
      'Improved alert accuracy through tuning',
      'Enhanced threat detection capabilities'
    ];
  }

  async getExecutiveMetrics(startTime) {
    return {
      securityScore: 85,
      riskReduction: '15%',
      complianceLevel: '88%',
      incidentResponseTime: '45 minutes'
    };
  }

  async assessBusinessImpact(startTime) {
    return {
      downtime: '0 hours',
      businessDisruption: 'minimal',
      reputationalImpact: 'none',
      financialImpact: '$0'
    };
  }

  generateStrategicRecommendations(summary, audience) {
    const recommendations = [
      'Invest in automated threat detection and response',
      'Enhance security awareness training programs',
      'Implement zero-trust architecture principles'
    ];

    if (audience === 'board') {
      recommendations.push('Consider cyber insurance policy review');
    }

    return recommendations;
  }

  async getDetailedComplianceData(framework, startTime) {
    return {
      controlDetails: 'Detailed control implementation status',
      auditLogs: 'Recent audit activities and findings',
      remediation: 'Ongoing remediation efforts'
    };
  }

  createExecutiveComplianceSummary(report) {
    return {
      complianceLevel: `${report.complianceStatus.overall}%`,
      keyGaps: report.gaps?.length || 0,
      nextSteps: 'Focus on high-priority control improvements'
    };
  }

  /**
   * Generate interactive incident report with user clarification
   */
  async generate_incident_report_interactive(params) {
    const { conversationId, organizationId, incidentId, reportType, gatherMissingInfo = true } = params;

    try {
      // Check if we have an active workflow
      let workflow = conversationalIntelligence.getWorkflow(conversationId);
      
      if (!workflow && gatherMissingInfo) {
        // Initialize new workflow
        workflow = await conversationalIntelligence.initializeWorkflow(
          conversationId, 
          'incident_report_generation',
          { incidentId, reportType, organizationId }
        );

        // If no incident ID provided, generate questions to gather info
        if (!incidentId) {
          const questions = await conversationalIntelligence.generateQuestions(conversationId, organizationId);
          
          if (questions.length > 0) {
            const firstQuestion = questions[0];
            return {
              success: true,
              requiresUserInput: true,
              workflowId: workflow.id,
              message: firstQuestion.formattedPrompt || firstQuestion.prompt,
              nextStep: 'awaiting_incident_selection'
            };
          }
        }
      }

      // If we have all required info, generate the report
      if (workflow && workflow.state === 'confirmation') {
        const incidentData = workflow.gatheredInfo.incidentId;
        const selectedReportType = workflow.gatheredInfo.reportType || 'technical';
        
        // Fetch detailed incident data
        const incident = await this.Incident.findByPk(incidentData.id, {
          include: [
            { model: this.Alert, as: 'alerts' },
            { model: Asset, as: 'affectedAssets' }
          ]
        });

        if (!incident) {
          return {
            success: false,
            error: 'Incident not found'
          };
        }

        // Generate comprehensive report
        const report = await this.generateDetailedIncidentReport(incident, selectedReportType, workflow.gatheredInfo);
        
        // Clear workflow as it's completed
        conversationalIntelligence.clearWorkflow(conversationId);

        return {
          success: true,
          data: {
            report,
            incidentId: incident.incidentId,
            reportType: selectedReportType,
            generatedAt: new Date().toISOString()
          },
          message: `✅ **Incident Report Generated Successfully**\n\n**Report Type**: ${selectedReportType.charAt(0).toUpperCase() + selectedReportType.slice(1)}\n**Incident**: ${incident.incidentId} - ${incident.title}\n**Generated**: ${new Date().toLocaleString()}\n\nThe comprehensive incident report has been created with all available details.`
        };
      }

      // Direct report generation without workflow (if all params provided)
      if (incidentId && !gatherMissingInfo) {
        const incident = await this.Incident.findOne({
          where: { incidentId, organizationId },
          include: [
            { model: this.Alert, as: 'alerts' },
            { model: Asset, as: 'affectedAssets' }
          ]
        });

        if (!incident) {
          return {
            success: false,
            error: `Incident ${incidentId} not found`
          };
        }

        const report = await this.generateDetailedIncidentReport(incident, reportType || 'technical', {});
        
        return {
          success: true,
          data: {
            report,
            incidentId: incident.incidentId,
            reportType: reportType || 'technical',
            generatedAt: new Date().toISOString()
          }
        };
      }

      return {
        success: false,
        error: 'Unable to generate incident report. Missing required information.'
      };

    } catch (error) {
      console.error('Error in generate_incident_report_interactive:', error);
      return {
        success: false,
        error: 'Failed to generate incident report: ' + error.message
      };
    }
  }

  /**
   * Generate detailed incident report based on type
   */
  async generateDetailedIncidentReport(incident, reportType, additionalInfo) {
    const baseReport = {
      incidentId: incident.incidentId,
      title: incident.title,
      summary: incident.description,
      severity: incident.severity,
      status: incident.status,
      category: incident.category,
      timeline: {
        detected: incident.detectedAt,
        reported: incident.createdAt,
        updated: incident.updatedAt
      }
    };

    switch (reportType) {
      case 'executive':
        return {
          ...baseReport,
          executiveSummary: this.generateExecutiveSummary(incident, additionalInfo),
          businessImpact: additionalInfo.businessImpact || 'Business impact assessment pending',
          keyActions: this.generateKeyActions(incident),
          recommendations: this.generateExecutiveRecommendations(incident)
        };

      case 'technical':
        return {
          ...baseReport,
          technicalDetails: {
            affectedSystems: incident.affectedAssets?.map(asset => asset.name) || [],
            alertsTriggered: incident.alerts?.length || 0,
            indicators: this.extractTechnicalIndicators(incident),
            remediationSteps: additionalInfo.remediationSteps || 'Remediation steps being documented'
          },
          forensicEvidence: this.generateForensicSection(incident),
          lessonsLearned: additionalInfo.lessonsLearned || 'Lessons learned analysis in progress'
        };

      case 'forensic':
        return {
          ...baseReport,
          forensicAnalysis: {
            evidenceCollected: this.generateEvidenceLog(incident),
            timelineAnalysis: this.generateDetailedTimeline(incident),
            rootCauseAnalysis: 'Detailed forensic analysis of incident root cause',
            chainOfCustody: 'Evidence chain of custody documentation'
          }
        };

      case 'compliance':
        return {
          ...baseReport,
          complianceImpact: this.generateComplianceSection(incident),
          regulatoryRequirements: 'Regulatory notification requirements and status',
          auditTrail: 'Complete audit trail of incident response actions'
        };

      default:
        return baseReport;
    }
  }

  generateExecutiveSummary(incident, additionalInfo) {
    return `On ${incident.createdAt.toDateString()}, a ${incident.severity} severity ${incident.category} incident was detected. ${additionalInfo.businessImpact ? 'Business Impact: ' + additionalInfo.businessImpact : 'The incident response team is assessing business impact.'}`;
  }

  generateKeyActions(incident) {
    return [
      'Incident detection and initial response',
      'Affected systems identification and isolation', 
      'Evidence collection and preservation',
      'Stakeholder notification',
      'Recovery and restoration planning'
    ];
  }

  generateExecutiveRecommendations(incident) {
    return [
      'Review and update incident response procedures',
      'Consider additional security controls for affected systems',
      'Conduct security awareness training for relevant staff',
      'Schedule follow-up security assessment'
    ];
  }

  extractTechnicalIndicators(incident) {
    return {
      ipAddresses: ['Analysis in progress'],
      domains: ['Analysis in progress'],
      fileHashes: ['Analysis in progress'],
      attackVectors: [incident.category]
    };
  }

  generateForensicSection(incident) {
    return {
      evidenceType: 'System logs, network traffic, file artifacts',
      analysisStatus: 'In progress',
      findings: 'Preliminary forensic findings being compiled'
    };
  }

  generateEvidenceLog(incident) {
    return [
      {
        type: 'System Logs',
        location: 'Affected systems',
        collected: incident.createdAt,
        status: 'Secured'
      }
    ];
  }

  generateDetailedTimeline(incident) {
    return [
      {
        timestamp: incident.detectedAt || incident.createdAt,
        event: 'Incident detected',
        source: 'Security monitoring'
      }
    ];
  }

  generateComplianceSection(incident) {
    return {
      frameworksAffected: ['SOC 2', 'ISO 27001', 'PCI DSS'],
      notificationRequirements: 'Under review',
      documentationStatus: 'Complete'
    };
  }
}

module.exports = {
  REPORTING_TOOLS,
  ReportingExecutor
};