const { models } = require('../../database/models');
const { Alert } = models;
const { Op } = require('sequelize');

/**
 * Security Alerts Tools for AI Chat System
 * Provides comprehensive alert analysis and management capabilities
 */

const SECURITY_ALERT_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_latest_critical_alerts",
      description: "Retrieve latest critical security alerts with optional filtering by severity, time range, and source system",
      category: "Security Alerts",
      parameters: {
        type: "object",
        properties: {
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
            description: "Filter alerts by severity level"
          },
          limit: {
            type: "integer",
            default: 10,
            minimum: 1,
            maximum: 50,
            description: "Maximum number of alerts to return"
          },
          timeRange: {
            type: "string",
            default: "24h",
            enum: ["1h", "6h", "24h", "7d", "30d"],
            description: "Time range for alert retrieval"
          },
          sourceSystem: {
            type: "string",
            description: "Filter by source system (e.g., 'Endpoint Detection', 'Network Monitor')"
          },
          status: {
            type: "string",
            enum: ["new", "investigating", "resolved", "false_positive"],
            description: "Filter by alert status"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_alert_trends",
      description: "Analyze security alert trends and patterns over time to identify emerging threats",
      category: "Security Analysis",
      parameters: {
        type: "object",
        properties: {
          timeRange: {
            type: "string",
            default: "7d",
            enum: ["24h", "7d", "30d", "90d"],
            description: "Time range for trend analysis"
          },
          groupBy: {
            type: "string",
            default: "severity",
            enum: ["severity", "sourceSystem", "assetName", "category"],
            description: "Group alerts by specific field for analysis"
          },
          includeResolved: {
            type: "boolean",
            default: false,
            description: "Include resolved alerts in trend analysis"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_alerts_by_asset",
      description: "Retrieve all security alerts related to a specific asset or hostname",
      category: "Asset Security",
      parameters: {
        type: "object",
        properties: {
          assetName: {
            type: "string",
            description: "Name or hostname of the asset to search for"
          },
          timeRange: {
            type: "string",
            default: "30d",
            enum: ["24h", "7d", "30d", "90d"],
            description: "Time range for alert search"
          },
          includeThreatIntel: {
            type: "boolean",
            default: true,
            description: "Include threat intelligence context for alerts"
          }
        },
        required: ["assetName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_alerts_by_indicators",
      description: "Search for alerts containing specific indicators (IPs, domains, file hashes, etc.)",
      category: "Threat Hunting",
      parameters: {
        type: "object",
        properties: {
          indicators: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of indicators to search for (IPs, domains, hashes, etc.)"
          },
          searchFields: {
            type: "array",
            items: {
              type: "string",
              enum: ["description", "rawData", "title", "all"]
            },
            default: ["all"],
            description: "Fields to search within alerts"
          },
          timeRange: {
            type: "string",
            default: "30d",
            enum: ["24h", "7d", "30d", "90d"],
            description: "Time range for indicator search"
          }
        },
        required: ["indicators"]
      }
    }
  }
];

/**
 * Security Alerts Tool Executor
 */
class SecurityAlertsExecutor {
  constructor() {
    this.Alert = Alert;
  }

  /**
   * Get latest critical alerts with filtering
   */
  async getLatestCriticalAlerts(params) {
    try {
      const {
        severity,
        limit = 10,
        timeRange = '24h',
        sourceSystem,
        status
      } = params;

      console.log(`🚨 Getting latest alerts: severity=${severity}, limit=${limit}, timeRange=${timeRange}`);

      // Build time range filter
      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(Date.now() - timeRangeMs);

      const whereClause = {
        eventTime: { [Op.gte]: startTime }
      };

      // Add filters
      if (severity) {
        whereClause.severity = this.mapSeverityToNumber(severity);
      }
      if (sourceSystem) {
        whereClause.sourceSystem = { [Op.iLike]: `%${sourceSystem}%` };
      }
      if (status) {
        whereClause.status = status;
      }

      const alerts = await this.Alert.findAll({
        where: whereClause,
        order: [['eventTime', 'DESC'], ['severity', 'DESC']],
        limit: Math.min(limit, 50),
        attributes: [
          'id', 'title', 'description', 'severity', 'status', 
          'sourceSystem', 'assetName', 'eventTime', 'createdAt',
          'category', 'confidence'
        ]
      });

      const formattedAlerts = alerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        description: alert.description?.substring(0, 200) + (alert.description?.length > 200 ? '...' : ''),
        severity: this.mapSeverityToString(alert.severity),
        status: alert.status,
        sourceSystem: alert.sourceSystem,
        assetName: alert.assetName,
        eventTime: alert.eventTime,
        category: alert.category,
        confidence: alert.confidence,
        ageHours: Math.round((Date.now() - new Date(alert.eventTime).getTime()) / (1000 * 60 * 60))
      }));

      return {
        success: true,
        alerts: formattedAlerts,
        summary: {
          totalFound: formattedAlerts.length,
          timeRange,
          filters: { severity, sourceSystem, status },
          criticalCount: formattedAlerts.filter(a => a.severity === 'critical').length,
          highCount: formattedAlerts.filter(a => a.severity === 'high').length
        }
      };

    } catch (error) {
      console.error('❌ Error getting latest alerts:', error);
      return {
        success: false,
        error: error.message,
        alerts: []
      };
    }
  }

  /**
   * Analyze alert trends and patterns
   */
  async analyzeAlertTrends(params) {
    try {
      const {
        timeRange = '7d',
        groupBy = 'severity',
        includeResolved = false
      } = params;

      console.log(`📊 Analyzing alert trends: timeRange=${timeRange}, groupBy=${groupBy}`);

      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(Date.now() - timeRangeMs);

      const whereClause = {
        eventTime: { [Op.gte]: startTime }
      };

      if (!includeResolved) {
        whereClause.status = { [Op.notIn]: ['resolved', 'false_positive'] };
      }

      // Get raw data for analysis
      const alerts = await this.Alert.findAll({
        where: whereClause,
        attributes: ['severity', 'sourceSystem', 'assetName', 'category', 'eventTime', 'status'],
        order: [['eventTime', 'DESC']]
      });

      // Perform trend analysis
      const trends = this.analyzeTrendData(alerts, groupBy, timeRange);
      
      return {
        success: true,
        trends,
        summary: {
          totalAlerts: alerts.length,
          timeRange,
          groupBy,
          includeResolved,
          analysisDate: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error analyzing alert trends:', error);
      return {
        success: false,
        error: error.message,
        trends: {}
      };
    }
  }

  /**
   * Get alerts by asset
   */
  async getAlertsByAsset(params) {
    try {
      const {
        assetName,
        timeRange = '30d',
        includeThreatIntel = true
      } = params;

      console.log(`🖥️ Getting alerts for asset: ${assetName}`);

      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(Date.now() - timeRangeMs);

      const whereClause = {
        eventTime: { [Op.gte]: startTime },
        [Op.or]: [
          { assetName: { [Op.iLike]: `%${assetName}%` } },
          { description: { [Op.iLike]: `%${assetName}%` } },
          { rawData: { [Op.iLike]: `%${assetName}%` } }
        ]
      };

      const alerts = await this.Alert.findAll({
        where: whereClause,
        order: [['eventTime', 'DESC']],
        limit: 100
      });

      const analysis = this.analyzeAssetAlerts(alerts, assetName);

      return {
        success: true,
        assetName,
        alerts: alerts.slice(0, 20).map(alert => this.formatAlertSummary(alert)),
        analysis,
        threatIntelContext: includeThreatIntel ? await this.getThreatIntelForAsset(assetName) : null
      };

    } catch (error) {
      console.error('❌ Error getting alerts by asset:', error);
      return {
        success: false,
        error: error.message,
        alerts: []
      };
    }
  }

  /**
   * Search alerts by indicators
   */
  async searchAlertsByIndicators(params) {
    try {
      const {
        indicators,
        searchFields = ['all'],
        timeRange = '30d'
      } = params;

      console.log(`🔍 Searching alerts for indicators: ${indicators.join(', ')}`);

      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(Date.now() - timeRangeMs);

      // Build search conditions
      const searchConditions = [];
      
      for (const indicator of indicators) {
        const indicatorConditions = [];
        
        if (searchFields.includes('all') || searchFields.includes('description')) {
          indicatorConditions.push({ description: { [Op.iLike]: `%${indicator}%` } });
        }
        if (searchFields.includes('all') || searchFields.includes('rawData')) {
          indicatorConditions.push({ rawData: { [Op.iLike]: `%${indicator}%` } });
        }
        if (searchFields.includes('all') || searchFields.includes('title')) {
          indicatorConditions.push({ title: { [Op.iLike]: `%${indicator}%` } });
        }
        
        if (indicatorConditions.length > 0) {
          searchConditions.push({ [Op.or]: indicatorConditions });
        }
      }

      const whereClause = {
        eventTime: { [Op.gte]: startTime },
        [Op.or]: searchConditions
      };

      const alerts = await this.Alert.findAll({
        where: whereClause,
        order: [['eventTime', 'DESC']],
        limit: 50
      });

      const matches = this.analyzeIndicatorMatches(alerts, indicators);

      return {
        success: true,
        indicators,
        searchFields,
        alerts: alerts.map(alert => this.formatAlertSummary(alert)),
        matches,
        summary: {
          totalMatches: alerts.length,
          timeRange,
          searchDate: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error searching alerts by indicators:', error);
      return {
        success: false,
        error: error.message,
        alerts: []
      };
    }
  }

  // Helper methods
  parseTimeRange(timeRange) {
    const ranges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    return ranges[timeRange] || ranges['24h'];
  }

  mapSeverityToNumber(severity) {
    const map = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return map[severity.toLowerCase()] || 3;
  }

  mapSeverityToString(severityNum) {
    const map = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };
    return map[severityNum] || 'medium';
  }

  analyzeTrendData(alerts, groupBy, timeRange) {
    const groups = {};
    alerts.forEach(alert => {
      const key = alert[groupBy] || 'unknown';
      if (!groups[key]) groups[key] = 0;
      groups[key]++;
    });

    const sortedGroups = Object.entries(groups)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      groupBy,
      distribution: Object.fromEntries(sortedGroups),
      totalAlerts: alerts.length,
      timeRange
    };
  }

  analyzeAssetAlerts(alerts, assetName) {
    const severityDist = {};
    const sourceDist = {};
    
    alerts.forEach(alert => {
      const severity = this.mapSeverityToString(alert.severity);
      severityDist[severity] = (severityDist[severity] || 0) + 1;
      sourceDist[alert.sourceSystem] = (sourceDist[alert.sourceSystem] || 0) + 1;
    });

    return {
      totalAlerts: alerts.length,
      severityDistribution: severityDist,
      sourceDistribution: sourceDist,
      riskLevel: this.calculateAssetRiskLevel(alerts)
    };
  }

  calculateAssetRiskLevel(alerts) {
    const criticalCount = alerts.filter(a => a.severity === 4).length;
    const highCount = alerts.filter(a => a.severity === 3).length;
    
    if (criticalCount > 3) return 'high';
    if (criticalCount > 0 || highCount > 5) return 'medium';
    return 'low';
  }

  analyzeIndicatorMatches(alerts, indicators) {
    const matches = {};
    indicators.forEach(indicator => {
      matches[indicator] = alerts.filter(alert => 
        alert.description?.includes(indicator) ||
        alert.rawData?.includes(indicator) ||
        alert.title?.includes(indicator)
      ).length;
    });
    return matches;
  }

  formatAlertSummary(alert) {
    return {
      id: alert.id,
      title: alert.title,
      severity: this.mapSeverityToString(alert.severity),
      status: alert.status,
      sourceSystem: alert.sourceSystem,
      assetName: alert.assetName,
      eventTime: alert.eventTime,
      ageHours: Math.round((Date.now() - new Date(alert.eventTime).getTime()) / (1000 * 60 * 60))
    };
  }

  async getThreatIntelForAsset(assetName) {
    // Placeholder for threat intel integration
    return {
      riskScore: 'medium',
      knownThreats: [],
      recommendations: ['Monitor for suspicious activity', 'Review access logs']
    };
  }
}

module.exports = {
  SECURITY_ALERT_TOOLS,
  SecurityAlertsExecutor
};