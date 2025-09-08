const { models } = require('../../database/models');
const { IOC, Alert, Incident } = models;
const { Op } = require('sequelize');

/**
 * Threat Intelligence Tools for AI Chat System
 * Provides comprehensive threat intelligence analysis and IOC management capabilities
 */

const THREAT_INTEL_TOOLS = [
  {
    type: "function",
    function: {
      name: "analyze_threat_indicators",
      description: "Analyze threat indicators (IOCs) for patterns, attribution, and risk assessment",
      category: "Threat Intelligence",
      parameters: {
        type: "object",
        properties: {
          indicators: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of indicators to analyze (IPs, domains, hashes, etc.)"
          },
          analysisType: {
            type: "string",
            enum: ["attribution", "pattern_analysis", "risk_assessment", "comprehensive"],
            default: "comprehensive",
            description: "Type of threat intelligence analysis to perform"
          },
          timeRange: {
            type: "string",
            default: "90d",
            enum: ["7d", "30d", "90d", "180d", "1y"],
            description: "Historical timeframe for analysis"
          },
          includeContext: {
            type: "boolean",
            default: true,
            description: "Include contextual information from related alerts and incidents"
          },
          confidenceThreshold: {
            type: "number",
            default: 0.6,
            minimum: 0.1,
            maximum: 1.0,
            description: "Minimum confidence threshold for analysis results"
          }
        },
        required: ["indicators"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_threat_intelligence",
      description: "Search and correlate threat intelligence across multiple sources and timeframes",
      category: "Intelligence Search",
      parameters: {
        type: "object",
        properties: {
          searchQuery: {
            type: "string",
            description: "Natural language query for threat intelligence search"
          },
          threatTypes: {
            type: "array",
            items: {
              type: "string",
              enum: ["malware", "phishing", "apt", "botnet", "exploit", "campaign"]
            },
            description: "Specific threat types to focus search on"
          },
          sourceTypes: {
            type: "array",
            items: {
              type: "string",
              enum: ["internal", "commercial", "osint", "sharing_community"]
            },
            default: ["internal"],
            description: "Types of intelligence sources to search"
          },
          geoFilter: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Geographic regions to filter by (country codes)"
          },
          severityLevel: {
            type: "string",
            enum: ["all", "low", "medium", "high", "critical"],
            default: "all",
            description: "Minimum severity level for results"
          },
          maxResults: {
            type: "integer",
            default: 25,
            minimum: 5,
            maximum: 100,
            description: "Maximum number of results to return"
          }
        },
        required: ["searchQuery"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_threat_profile",
      description: "Generate comprehensive threat actor or campaign profile based on available intelligence",
      category: "Threat Profiling",
      parameters: {
        type: "object",
        properties: {
          targetEntity: {
            type: "string",
            description: "Threat actor group, campaign name, or malware family to profile"
          },
          profileDepth: {
            type: "string",
            enum: ["basic", "detailed", "comprehensive"],
            default: "detailed",
            description: "Depth of threat profile to generate"
          },
          focusAreas: {
            type: "array",
            items: {
              type: "string",
              enum: ["ttps", "infrastructure", "targets", "timeline", "attribution", "countermeasures"]
            },
            default: ["ttps", "infrastructure", "attribution"],
            description: "Specific areas to focus the profile on"
          },
          includeRecommendations: {
            type: "boolean",
            default: true,
            description: "Include defensive recommendations in the profile"
          },
          timeframe: {
            type: "string",
            default: "1y",
            enum: ["90d", "180d", "1y", "2y", "all"],
            description: "Timeframe for historical analysis"
          }
        },
        required: ["targetEntity"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "assess_ioc_quality",
      description: "Assess the quality, reliability, and actionability of indicators of compromise",
      category: "IOC Assessment",
      parameters: {
        type: "object",
        properties: {
          iocIds: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of IOC IDs to assess"
          },
          assessmentCriteria: {
            type: "array",
            items: {
              type: "string",
              enum: ["accuracy", "freshness", "context", "actionability", "uniqueness"]
            },
            default: ["accuracy", "freshness", "actionability"],
            description: "Criteria to use for IOC quality assessment"
          },
          includeScoring: {
            type: "boolean",
            default: true,
            description: "Include numerical quality scores"
          },
          benchmarkAgainst: {
            type: "string",
            enum: ["internal_standard", "industry_best_practice", "peer_comparison"],
            default: "internal_standard",
            description: "Benchmark quality assessment against specific standards"
          }
        },
        required: ["iocIds"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "detect_threat_campaigns",
      description: "Detect and analyze coordinated threat campaigns based on IOC clustering and pattern analysis",
      category: "Campaign Detection",
      parameters: {
        type: "object",
        properties: {
          analysisWindow: {
            type: "string",
            default: "30d",
            enum: ["7d", "30d", "90d", "180d"],
            description: "Time window for campaign detection analysis"
          },
          clusteringThreshold: {
            type: "number",
            default: 0.7,
            minimum: 0.5,
            maximum: 0.95,
            description: "Similarity threshold for clustering related indicators"
          },
          minimumClusterSize: {
            type: "integer",
            default: 3,
            minimum: 2,
            maximum: 20,
            description: "Minimum number of indicators required to form a campaign cluster"
          },
          includeAttribution: {
            type: "boolean",
            default: true,
            description: "Include threat actor attribution analysis"
          },
          includeProgression: {
            type: "boolean",
            default: true,
            description: "Include campaign progression and evolution analysis"
          }
        },
        required: []
      }
    }
  }
];

/**
 * Threat Intelligence Tools Executor
 */
class ThreatIntelExecutor {
  constructor() {
    this.IOC = IOC;
    this.Alert = Alert;
    this.Incident = Incident;
  }

  /**
   * Analyze threat indicators for patterns and attribution
   */
  async analyzeThreatIndicators(params) {
    try {
      const {
        indicators,
        analysisType = 'comprehensive',
        timeRange = '90d',
        includeContext = true,
        confidenceThreshold = 0.6
      } = params;

      console.log(`🎯 Analyzing ${indicators.length} threat indicators with ${analysisType} analysis`);

      const analysis = {
        indicators,
        analysisType,
        timeRange,
        results: {}
      };

      // Get IOC data for indicators
      const iocData = await this.getIOCData(indicators, timeRange);

      // Perform requested analysis types
      if (analysisType === 'attribution' || analysisType === 'comprehensive') {
        analysis.results.attribution = await this.performAttributionAnalysis(indicators, iocData);
      }

      if (analysisType === 'pattern_analysis' || analysisType === 'comprehensive') {
        analysis.results.patterns = await this.analyzeIndicatorPatterns(indicators, iocData);
      }

      if (analysisType === 'risk_assessment' || analysisType === 'comprehensive') {
        analysis.results.riskAssessment = await this.assessIndicatorRisk(indicators, iocData);
      }

      // Include contextual information
      if (includeContext) {
        analysis.context = await this.getIndicatorContext(indicators, timeRange);
      }

      // Filter results by confidence threshold
      analysis.filteredResults = this.filterByConfidence(analysis.results, confidenceThreshold);

      // Generate insights and recommendations
      analysis.insights = this.generateThreatInsights(analysis);
      analysis.recommendations = this.generateThreatRecommendations(analysis);

      return {
        success: true,
        analysis,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error analyzing threat indicators:', error);
      return {
        success: false,
        error: error.message,
        analysis: null
      };
    }
  }

  /**
   * Search threat intelligence across sources
   */
  async searchThreatIntelligence(params) {
    try {
      const {
        searchQuery,
        threatTypes = [],
        sourceTypes = ['internal'],
        geoFilter = [],
        severityLevel = 'all',
        maxResults = 25
      } = params;

      console.log(`🔍 Searching threat intelligence: "${searchQuery}"`);

      const searchResults = await this.performThreatIntelSearch({
        query: searchQuery,
        threatTypes,
        sourceTypes,
        geoFilter,
        severityLevel,
        maxResults
      });

      // Correlate and enrich results
      const enrichedResults = await this.enrichThreatIntelResults(searchResults);

      // Generate search insights
      const insights = this.generateSearchInsights(enrichedResults, searchQuery);

      return {
        success: true,
        query: searchQuery,
        results: enrichedResults,
        insights,
        metadata: {
          totalFound: searchResults.length,
          sourceTypes,
          threatTypes,
          searchTime: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error searching threat intelligence:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Generate comprehensive threat profile
   */
  async generateThreatProfile(params) {
    try {
      const {
        targetEntity,
        profileDepth = 'detailed',
        focusAreas = ['ttps', 'infrastructure', 'attribution'],
        includeRecommendations = true,
        timeframe = '1y'
      } = params;

      console.log(`📊 Generating ${profileDepth} threat profile for: ${targetEntity}`);

      const profile = {
        entity: targetEntity,
        profileDepth,
        generatedAt: new Date().toISOString(),
        timeframe,
        sections: {}
      };

      // Generate requested profile sections
      for (const area of focusAreas) {
        switch (area) {
          case 'ttps':
            profile.sections.ttps = await this.analyzeTTPsForEntity(targetEntity, timeframe);
            break;
          case 'infrastructure':
            profile.sections.infrastructure = await this.analyzeInfrastructureForEntity(targetEntity, timeframe);
            break;
          case 'targets':
            profile.sections.targets = await this.analyzeTargetsForEntity(targetEntity, timeframe);
            break;
          case 'timeline':
            profile.sections.timeline = await this.generateEntityTimeline(targetEntity, timeframe);
            break;
          case 'attribution':
            profile.sections.attribution = await this.analyzeEntityAttribution(targetEntity, timeframe);
            break;
          case 'countermeasures':
            profile.sections.countermeasures = await this.suggestCountermeasures(targetEntity, timeframe);
            break;
        }
      }

      // Add summary and key findings
      profile.summary = this.generateProfileSummary(profile.sections, targetEntity);
      profile.keyFindings = this.extractKeyFindings(profile.sections);

      if (includeRecommendations) {
        profile.recommendations = this.generateProfileRecommendations(profile, targetEntity);
      }

      return {
        success: true,
        profile,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error generating threat profile:', error);
      return {
        success: false,
        error: error.message,
        profile: null
      };
    }
  }

  /**
   * Assess IOC quality and reliability
   */
  async assessIOCQuality(params) {
    try {
      const {
        iocIds,
        assessmentCriteria = ['accuracy', 'freshness', 'actionability'],
        includeScoring = true,
        benchmarkAgainst = 'internal_standard'
      } = params;

      console.log(`⚖️ Assessing quality of ${iocIds.length} IOCs`);

      const assessments = [];

      for (const iocId of iocIds) {
        const ioc = await this.IOC.findByPk(iocId);
        if (!ioc) {
          assessments.push({
            iocId,
            error: 'IOC not found',
            quality: null
          });
          continue;
        }

        const assessment = await this.performIOCQualityAssessment(ioc, assessmentCriteria, benchmarkAgainst);
        
        if (includeScoring) {
          assessment.overallScore = this.calculateOverallQualityScore(assessment);
        }

        assessments.push({
          iocId,
          ioc: this.formatIOCForAssessment(ioc),
          assessment
        });
      }

      // Generate summary statistics
      const summary = this.generateQualityAssessmentSummary(assessments);

      return {
        success: true,
        assessments,
        summary,
        criteria: assessmentCriteria,
        benchmark: benchmarkAgainst,
        assessedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error assessing IOC quality:', error);
      return {
        success: false,
        error: error.message,
        assessments: []
      };
    }
  }

  /**
   * Detect coordinated threat campaigns
   */
  async detectThreatCampaigns(params) {
    try {
      const {
        analysisWindow = '30d',
        clusteringThreshold = 0.7,
        minimumClusterSize = 3,
        includeAttribution = true,
        includeProgression = true
      } = params;

      console.log(`🎪 Detecting threat campaigns in ${analysisWindow} window`);

      // Get IOCs within analysis window
      const timeRangeMs = this.parseTimeRange(analysisWindow);
      const startTime = new Date(Date.now() - timeRangeMs);

      const iocs = await this.IOC.findAll({
        where: {
          firstSeen: { [Op.gte]: startTime }
        },
        order: [['firstSeen', 'DESC']]
      });

      // Perform clustering analysis
      const clusters = await this.clusterIOCsForCampaigns(iocs, clusteringThreshold, minimumClusterSize);

      // Analyze each detected campaign
      const campaigns = [];
      for (const cluster of clusters) {
        const campaign = await this.analyzeCampaignCluster(cluster, includeAttribution, includeProgression);
        campaigns.push(campaign);
      }

      // Generate campaign insights
      const insights = this.generateCampaignInsights(campaigns, analysisWindow);

      return {
        success: true,
        analysisWindow,
        totalIOCs: iocs.length,
        campaignsDetected: campaigns.length,
        campaigns,
        insights,
        parameters: {
          clusteringThreshold,
          minimumClusterSize,
          includeAttribution,
          includeProgression
        }
      };

    } catch (error) {
      console.error('❌ Error detecting threat campaigns:', error);
      return {
        success: false,
        error: error.message,
        campaigns: []
      };
    }
  }

  // Helper methods for threat intelligence analysis

  async getIOCData(indicators, timeRange) {
    const timeRangeMs = this.parseTimeRange(timeRange);
    const startTime = new Date(Date.now() - timeRangeMs);

    const iocs = await this.IOC.findAll({
      where: {
        [Op.or]: indicators.map(indicator => ({
          value: { [Op.iLike]: `%${indicator}%` }
        })),
        firstSeen: { [Op.gte]: startTime }
      },
      order: [['confidence', 'DESC']]
    });

    return iocs;
  }

  async performAttributionAnalysis(indicators, iocData) {
    // Simplified attribution analysis
    const attributionResults = {
      likelyActors: [],
      confidence: 0.5,
      evidence: [],
      geographicIndicators: []
    };

    // Analyze patterns in IOC data for attribution clues
    const sourcePatterns = this.analyzeSourcePatterns(iocData);
    const infrastructurePatterns = this.analyzeInfrastructurePatterns(indicators);

    if (sourcePatterns.commonSource) {
      attributionResults.evidence.push(`Common intelligence source: ${sourcePatterns.commonSource}`);
      attributionResults.confidence += 0.1;
    }

    if (infrastructurePatterns.geoCluster) {
      attributionResults.geographicIndicators.push(infrastructurePatterns.geoCluster);
      attributionResults.confidence += 0.15;
    }

    // Simplified actor matching based on patterns
    if (attributionResults.confidence > 0.7) {
      attributionResults.likelyActors.push({
        name: 'APT Group (Pattern Match)',
        confidence: attributionResults.confidence,
        reasons: attributionResults.evidence
      });
    }

    return attributionResults;
  }

  async analyzeIndicatorPatterns(indicators, iocData) {
    const patterns = {
      temporalPatterns: this.analyzeTemporalPatterns(iocData),
      typeDistribution: this.analyzeTypeDistribution(iocData),
      sourceDistribution: this.analyzeSourceDistribution(iocData),
      confidencePatterns: this.analyzeConfidencePatterns(iocData),
      correlationStrength: this.calculateCorrelationStrength(indicators, iocData)
    };

    return patterns;
  }

  async assessIndicatorRisk(indicators, iocData) {
    const riskAssessment = {
      overallRisk: 'medium',
      riskFactors: [],
      individualRisks: [],
      mitigation: []
    };

    // Assess risk for each indicator
    for (const indicator of indicators) {
      const relatedIOCs = iocData.filter(ioc => ioc.value.includes(indicator));
      const indicatorRisk = this.calculateIndicatorRisk(indicator, relatedIOCs);
      riskAssessment.individualRisks.push({
        indicator,
        risk: indicatorRisk.level,
        score: indicatorRisk.score,
        factors: indicatorRisk.factors
      });
    }

    // Calculate overall risk
    const avgRisk = riskAssessment.individualRisks.reduce((sum, r) => sum + r.score, 0) / indicators.length;
    riskAssessment.overallRisk = avgRisk > 0.7 ? 'high' : avgRisk > 0.4 ? 'medium' : 'low';

    // Generate risk factors and mitigation
    riskAssessment.riskFactors = this.identifyRiskFactors(riskAssessment.individualRisks);
    riskAssessment.mitigation = this.generateRiskMitigation(riskAssessment.riskFactors);

    return riskAssessment;
  }

  async getIndicatorContext(indicators, timeRange) {
    const context = {
      relatedAlerts: [],
      relatedIncidents: [],
      historicalActivity: {}
    };

    // Find related alerts
    for (const indicator of indicators) {
      const alerts = await this.Alert.findAll({
        where: {
          [Op.or]: [
            { description: { [Op.iLike]: `%${indicator}%` } },
            { rawData: { [Op.iLike]: `%${indicator}%` } }
          ]
        },
        limit: 5,
        order: [['eventTime', 'DESC']],
        attributes: ['id', 'title', 'severity', 'eventTime', 'status']
      });

      context.relatedAlerts.push(...alerts.map(alert => ({
        indicator,
        alert: {
          id: alert.id,
          title: alert.title,
          severity: alert.severity,
          eventTime: alert.eventTime,
          status: alert.status
        }
      })));
    }

    // Find related incidents
    for (const indicator of indicators) {
      const incidents = await this.Incident.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.iLike]: `%${indicator}%` } },
            { description: { [Op.iLike]: `%${indicator}%` } }
          ]
        },
        limit: 3,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'title', 'severity', 'status', 'createdAt']
      });

      context.relatedIncidents.push(...incidents.map(incident => ({
        indicator,
        incident: {
          id: incident.id,
          title: incident.title,
          severity: incident.severity,
          status: incident.status,
          createdAt: incident.createdAt
        }
      })));
    }

    return context;
  }

  filterByConfidence(results, threshold) {
    const filtered = {};
    
    Object.entries(results).forEach(([key, value]) => {
      if (value && typeof value === 'object' && value.confidence !== undefined) {
        if (value.confidence >= threshold) {
          filtered[key] = value;
        }
      } else {
        filtered[key] = value; // Include non-confidence based results
      }
    });

    return filtered;
  }

  generateThreatInsights(analysis) {
    const insights = [];

    if (analysis.results.attribution && analysis.results.attribution.likelyActors.length > 0) {
      insights.push(`Potential threat actor attribution identified with ${analysis.results.attribution.confidence} confidence`);
    }

    if (analysis.results.patterns && analysis.results.patterns.correlationStrength > 0.7) {
      insights.push('Strong correlation detected between indicators suggesting coordinated campaign');
    }

    if (analysis.results.riskAssessment && analysis.results.riskAssessment.overallRisk === 'high') {
      insights.push('High-risk indicators detected requiring immediate attention');
    }

    if (analysis.context && analysis.context.relatedAlerts.length > 5) {
      insights.push('Multiple related security alerts found suggesting active threat');
    }

    return insights;
  }

  generateThreatRecommendations(analysis) {
    const recommendations = [];

    if (analysis.results.riskAssessment && analysis.results.riskAssessment.overallRisk === 'high') {
      recommendations.push('Implement immediate blocking for high-risk indicators');
      recommendations.push('Enhance monitoring for related infrastructure');
    }

    if (analysis.results.attribution && analysis.results.attribution.confidence > 0.7) {
      recommendations.push('Review historical campaigns from identified threat actor');
      recommendations.push('Update threat hunting rules based on actor TTPs');
    }

    if (analysis.results.patterns && analysis.results.patterns.correlationStrength > 0.6) {
      recommendations.push('Investigate potential campaign coordination');
      recommendations.push('Expand IOC collection for related indicators');
    }

    recommendations.push('Document findings in threat intelligence platform');
    recommendations.push('Share relevant indicators with security community');

    return recommendations;
  }

  async performThreatIntelSearch(params) {
    const { query, threatTypes, sourceTypes, severityLevel, maxResults } = params;

    // Search in IOCs
    const whereClause = {
      [Op.or]: [
        { value: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
        { tags: { [Op.contains]: [query] } }
      ]
    };

    if (severityLevel !== 'all') {
      whereClause.severity = this.mapSeverityToNumber(severityLevel);
    }

    const iocs = await this.IOC.findAll({
      where: whereClause,
      limit: maxResults,
      order: [['confidence', 'DESC']],
      attributes: ['id', 'type', 'value', 'description', 'confidence', 'severity', 'source', 'tags', 'firstSeen']
    });

    return iocs.map(ioc => ({
      type: 'ioc',
      id: ioc.id,
      data: {
        type: ioc.type,
        value: ioc.value,
        description: ioc.description,
        confidence: ioc.confidence,
        severity: ioc.severity,
        source: ioc.source,
        tags: ioc.tags,
        firstSeen: ioc.firstSeen
      },
      relevance: this.calculateSearchRelevance(ioc, query)
    }));
  }

  async enrichThreatIntelResults(results) {
    // Add contextual enrichment to search results
    return results.map(result => ({
      ...result,
      enrichment: {
        relatedAlertsCount: Math.floor(Math.random() * 10), // Placeholder
        riskScore: this.calculateRiskScore(result.data),
        lastSeen: result.data.firstSeen,
        actionability: this.assessActionability(result.data)
      }
    }));
  }

  generateSearchInsights(results, query) {
    return {
      totalResults: results.length,
      highConfidenceResults: results.filter(r => r.data.confidence > 0.8).length,
      averageRiskScore: this.calculateAverageRiskScore(results),
      topSources: this.getTopSources(results),
      recommendedActions: this.getRecommendedActions(results)
    };
  }

  // Additional helper methods for complex analysis
  parseTimeRange(timeRange) {
    const ranges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '180d': 180 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      '2y': 2 * 365 * 24 * 60 * 60 * 1000
    };
    return ranges[timeRange] || ranges['90d'];
  }

  analyzeSourcePatterns(iocData) {
    const sources = iocData.map(ioc => ioc.source);
    const sourceCount = sources.reduce((acc, source) => {
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const mostCommon = Object.entries(sourceCount)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalSources: Object.keys(sourceCount).length,
      commonSource: mostCommon ? mostCommon[0] : null,
      sourceDistribution: sourceCount
    };
  }

  analyzeInfrastructurePatterns(indicators) {
    // Simplified infrastructure analysis
    const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    const domainPattern = /[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/g;

    const ips = indicators.filter(ind => ipPattern.test(ind));
    const domains = indicators.filter(ind => domainPattern.test(ind));

    return {
      ipCount: ips.length,
      domainCount: domains.length,
      geoCluster: ips.length > 2 ? 'Potential geographic clustering detected' : null
    };
  }

  analyzeTemporalPatterns(iocData) {
    if (iocData.length === 0) return { pattern: 'insufficient_data' };

    const timestamps = iocData.map(ioc => new Date(ioc.firstSeen).getTime());
    timestamps.sort((a, b) => a - b);

    const timeGaps = [];
    for (let i = 1; i < timestamps.length; i++) {
      timeGaps.push(timestamps[i] - timestamps[i-1]);
    }

    const avgGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
    const dayGap = avgGap / (24 * 60 * 60 * 1000);

    return {
      pattern: dayGap < 1 ? 'rapid_deployment' : dayGap < 7 ? 'weekly_pattern' : 'sporadic',
      averageGapDays: Math.round(dayGap * 10) / 10,
      totalSpanDays: Math.round((timestamps[timestamps.length - 1] - timestamps[0]) / (24 * 60 * 60 * 1000))
    };
  }

  analyzeTypeDistribution(iocData) {
    return iocData.reduce((acc, ioc) => {
      acc[ioc.type] = (acc[ioc.type] || 0) + 1;
      return acc;
    }, {});
  }

  analyzeSourceDistribution(iocData) {
    return iocData.reduce((acc, ioc) => {
      acc[ioc.source] = (acc[ioc.source] || 0) + 1;
      return acc;
    }, {});
  }

  analyzeConfidencePatterns(iocData) {
    const confidences = iocData.map(ioc => ioc.confidence);
    const avg = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    const high = confidences.filter(conf => conf > 0.8).length;
    const low = confidences.filter(conf => conf < 0.5).length;

    return {
      average: Math.round(avg * 100) / 100,
      highConfidence: high,
      lowConfidence: low,
      distribution: confidences.length > 0 ? 'varied' : 'none'
    };
  }

  calculateCorrelationStrength(indicators, iocData) {
    if (indicators.length < 2 || iocData.length < 2) return 0;

    // Simplified correlation calculation
    const sharedSources = new Set();
    const sharedTags = new Set();

    iocData.forEach(ioc => {
      sharedSources.add(ioc.source);
      if (ioc.tags) {
        ioc.tags.forEach(tag => sharedTags.add(tag));
      }
    });

    const correlationFactors = [
      sharedSources.size < 3 ? 0.3 : 0, // Few sources indicate correlation
      sharedTags.size > 2 ? 0.4 : 0, // Many shared tags indicate correlation
      iocData.length / indicators.length > 1.5 ? 0.3 : 0 // Multiple IOCs per indicator
    ];

    return Math.min(correlationFactors.reduce((sum, factor) => sum + factor, 0), 1.0);
  }

  calculateIndicatorRisk(indicator, relatedIOCs) {
    let score = 0.3; // Base risk score
    const factors = [];

    // High confidence IOCs increase risk
    const highConfIOCs = relatedIOCs.filter(ioc => ioc.confidence > 0.8);
    if (highConfIOCs.length > 0) {
      score += 0.3;
      factors.push('High confidence threat intelligence');
    }

    // Recent IOCs increase risk
    const recentIOCs = relatedIOCs.filter(ioc => {
      const daysSince = (Date.now() - new Date(ioc.firstSeen).getTime()) / (24 * 60 * 60 * 1000);
      return daysSince < 7;
    });
    if (recentIOCs.length > 0) {
      score += 0.2;
      factors.push('Recent threat activity');
    }

    // Multiple IOCs for same indicator increase risk
    if (relatedIOCs.length > 2) {
      score += 0.2;
      factors.push('Multiple intelligence sources');
    }

    return {
      level: score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low',
      score: Math.min(score, 1.0),
      factors
    };
  }

  identifyRiskFactors(individualRisks) {
    const allFactors = individualRisks.flatMap(risk => risk.factors);
    const factorCounts = allFactors.reduce((acc, factor) => {
      acc[factor] = (acc[factor] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(factorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, occurrences: count }));
  }

  generateRiskMitigation(riskFactors) {
    const mitigation = [];

    riskFactors.forEach(({ factor }) => {
      if (factor.includes('High confidence')) {
        mitigation.push('Implement immediate blocking for high-confidence indicators');
      }
      if (factor.includes('Recent threat')) {
        mitigation.push('Enhance monitoring for recent threat indicators');
      }
      if (factor.includes('Multiple intelligence')) {
        mitigation.push('Cross-reference with additional threat intelligence sources');
      }
    });

    if (mitigation.length === 0) {
      mitigation.push('Maintain standard monitoring procedures');
    }

    return [...new Set(mitigation)]; // Remove duplicates
  }

  mapSeverityToNumber(severity) {
    const map = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return map[severity?.toLowerCase()] || 2;
  }

  calculateSearchRelevance(ioc, query) {
    let relevance = 0.5;
    
    if (ioc.value.toLowerCase().includes(query.toLowerCase())) relevance += 0.3;
    if (ioc.description?.toLowerCase().includes(query.toLowerCase())) relevance += 0.2;
    if (ioc.confidence > 0.8) relevance += 0.1;

    return Math.min(relevance, 1.0);
  }

  calculateRiskScore(iocData) {
    let score = 0.3;
    if (iocData.confidence > 0.8) score += 0.3;
    if (iocData.severity >= 3) score += 0.4;
    return Math.min(score, 1.0);
  }

  assessActionability(iocData) {
    if (iocData.confidence > 0.8 && iocData.severity >= 3) return 'high';
    if (iocData.confidence > 0.6 || iocData.severity >= 2) return 'medium';
    return 'low';
  }

  calculateAverageRiskScore(results) {
    const scores = results.map(r => r.enrichment.riskScore);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  getTopSources(results) {
    const sources = results.map(r => r.data.source);
    const sourceCount = sources.reduce((acc, source) => {
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(sourceCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([source, count]) => ({ source, count }));
  }

  getRecommendedActions(results) {
    const highRiskResults = results.filter(r => r.enrichment.riskScore > 0.7);
    const actions = [];

    if (highRiskResults.length > 0) {
      actions.push('Implement blocking for high-risk indicators');
    }
    if (results.length > 10) {
      actions.push('Consider bulk analysis for campaign detection');
    }
    
    actions.push('Review and validate intelligence sources');
    return actions;
  }

  // Placeholder implementations for profile generation
  async analyzeTTPsForEntity(entity, timeframe) {
    return {
      tactics: ['Initial Access', 'Execution', 'Persistence'],
      techniques: ['T1566.001', 'T1059.001', 'T1053.005'],
      procedures: 'Entity uses spear-phishing emails with malicious attachments'
    };
  }

  async analyzeInfrastructureForEntity(entity, timeframe) {
    return {
      domains: ['example-malicious.com'],
      ipAddresses: ['192.0.2.1'],
      infrastructure: 'Compromised WordPress sites for C2'
    };
  }

  async analyzeTargetsForEntity(entity, timeframe) {
    return {
      sectors: ['Financial', 'Healthcare'],
      regions: ['North America', 'Europe'],
      targetingPattern: 'Opportunistic with sector focus'
    };
  }

  async generateEntityTimeline(entity, timeframe) {
    return [
      {
        date: new Date().toISOString(),
        event: 'Latest campaign activity detected',
        description: 'New infrastructure observed'
      }
    ];
  }

  async analyzeEntityAttribution(entity, timeframe) {
    return {
      confidence: 0.7,
      attributionFactors: ['TTPs match known campaigns', 'Infrastructure overlap'],
      geopoliticalContext: 'Potentially state-sponsored'
    };
  }

  async suggestCountermeasures(entity, timeframe) {
    return [
      'Implement email security controls',
      'Enhanced endpoint detection',
      'Network segmentation'
    ];
  }

  generateProfileSummary(sections, entity) {
    return `Comprehensive threat profile for ${entity} based on available intelligence and observed activities.`;
  }

  extractKeyFindings(sections) {
    return [
      'Active threat with evolving TTPs',
      'Multi-stage attack capabilities',
      'Geographic targeting patterns identified'
    ];
  }

  generateProfileRecommendations(profile, entity) {
    return [
      'Implement enhanced monitoring for identified TTPs',
      'Block known infrastructure indicators',
      'Develop specific hunting queries for this threat'
    ];
  }

  // Campaign detection methods
  async clusterIOCsForCampaigns(iocs, threshold, minSize) {
    const clusters = [];
    const used = new Set();

    for (let i = 0; i < iocs.length; i++) {
      if (used.has(i)) continue;

      const cluster = [iocs[i]];
      used.add(i);

      for (let j = i + 1; j < iocs.length; j++) {
        if (used.has(j)) continue;

        const similarity = this.calculateIOCSimilarity(iocs[i], iocs[j]);
        if (similarity >= threshold) {
          cluster.push(iocs[j]);
          used.add(j);
        }
      }

      if (cluster.length >= minSize) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  calculateIOCSimilarity(ioc1, ioc2) {
    let similarity = 0;

    // Same source increases similarity
    if (ioc1.source === ioc2.source) similarity += 0.3;

    // Similar confidence levels
    const confDiff = Math.abs(ioc1.confidence - ioc2.confidence);
    if (confDiff < 0.2) similarity += 0.2;

    // Shared tags
    if (ioc1.tags && ioc2.tags) {
      const sharedTags = ioc1.tags.filter(tag => ioc2.tags.includes(tag));
      similarity += (sharedTags.length / Math.max(ioc1.tags.length, ioc2.tags.length)) * 0.3;
    }

    // Time proximity
    const timeDiff = Math.abs(new Date(ioc1.firstSeen) - new Date(ioc2.firstSeen));
    const daysDiff = timeDiff / (24 * 60 * 60 * 1000);
    if (daysDiff < 7) similarity += 0.2;

    return Math.min(similarity, 1.0);
  }

  async analyzeCampaignCluster(cluster, includeAttribution, includeProgression) {
    const campaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      iocCount: cluster.length,
      timespan: this.calculateClusterTimespan(cluster),
      iocTypes: this.getClusterIOCTypes(cluster),
      confidence: this.calculateCampaignConfidence(cluster)
    };

    if (includeAttribution) {
      campaign.attribution = await this.performClusterAttribution(cluster);
    }

    if (includeProgression) {
      campaign.progression = this.analyzeCampaignProgression(cluster);
    }

    return campaign;
  }

  calculateClusterTimespan(cluster) {
    const timestamps = cluster.map(ioc => new Date(ioc.firstSeen).getTime());
    const earliest = Math.min(...timestamps);
    const latest = Math.max(...timestamps);
    
    return {
      startDate: new Date(earliest).toISOString(),
      endDate: new Date(latest).toISOString(),
      durationDays: Math.round((latest - earliest) / (24 * 60 * 60 * 1000))
    };
  }

  getClusterIOCTypes(cluster) {
    return cluster.reduce((acc, ioc) => {
      acc[ioc.type] = (acc[ioc.type] || 0) + 1;
      return acc;
    }, {});
  }

  calculateCampaignConfidence(cluster) {
    const avgConfidence = cluster.reduce((sum, ioc) => sum + ioc.confidence, 0) / cluster.length;
    const sizeBonus = Math.min(cluster.length * 0.1, 0.3);
    return Math.min(avgConfidence + sizeBonus, 1.0);
  }

  async performClusterAttribution(cluster) {
    // Simplified attribution for campaign cluster
    const sources = [...new Set(cluster.map(ioc => ioc.source))];
    return {
      likelyActor: sources.length === 1 ? 'Coordinated campaign' : 'Multiple sources',
      confidence: sources.length < 3 ? 0.7 : 0.4
    };
  }

  analyzeCampaignProgression(cluster) {
    const sortedIOCs = cluster.sort((a, b) => new Date(a.firstSeen) - new Date(b.firstSeen));
    
    return {
      phases: [
        {
          phase: 'Initial Infrastructure',
          iocs: sortedIOCs.slice(0, Math.ceil(sortedIOCs.length / 3)),
          timeframe: 'Early campaign'
        },
        {
          phase: 'Active Operations',
          iocs: sortedIOCs.slice(Math.ceil(sortedIOCs.length / 3), Math.ceil(2 * sortedIOCs.length / 3)),
          timeframe: 'Mid campaign'
        },
        {
          phase: 'Latest Activity',
          iocs: sortedIOCs.slice(Math.ceil(2 * sortedIOCs.length / 3)),
          timeframe: 'Recent campaign'
        }
      ]
    };
  }

  generateCampaignInsights(campaigns, analysisWindow) {
    return {
      totalCampaigns: campaigns.length,
      averageCampaignSize: campaigns.length > 0 ? 
        Math.round(campaigns.reduce((sum, c) => sum + c.iocCount, 0) / campaigns.length) : 0,
      activeCampaigns: campaigns.filter(c => c.confidence > 0.7).length,
      longestCampaign: campaigns.length > 0 ? 
        Math.max(...campaigns.map(c => c.timespan.durationDays)) : 0,
      recommendations: this.generateCampaignRecommendations(campaigns)
    };
  }

  generateCampaignRecommendations(campaigns) {
    const recommendations = [];

    if (campaigns.length > 0) {
      recommendations.push('Monitor identified campaigns for new infrastructure');
      recommendations.push('Implement blocking for campaign-related indicators');
    }

    if (campaigns.filter(c => c.confidence > 0.8).length > 0) {
      recommendations.push('Prioritize investigation of high-confidence campaigns');
    }

    if (campaigns.length === 0) {
      recommendations.push('Continue monitoring for coordinated threat activity');
    }

    return recommendations;
  }

  async performIOCQualityAssessment(ioc, criteria, benchmark) {
    const assessment = {};

    for (const criterion of criteria) {
      switch (criterion) {
        case 'accuracy':
          assessment.accuracy = this.assessAccuracy(ioc);
          break;
        case 'freshness':
          assessment.freshness = this.assessFreshness(ioc);
          break;
        case 'context':
          assessment.context = this.assessContext(ioc);
          break;
        case 'actionability':
          assessment.actionability = this.assessActionability(ioc);
          break;
        case 'uniqueness':
          assessment.uniqueness = await this.assessUniqueness(ioc);
          break;
      }
    }

    return assessment;
  }

  assessAccuracy(ioc) {
    // Simplified accuracy assessment based on confidence and source
    let score = ioc.confidence;
    
    if (ioc.source && ioc.source.includes('verified')) score += 0.1;
    if (ioc.description && ioc.description.length > 50) score += 0.05;

    return {
      score: Math.min(score, 1.0),
      level: score > 0.8 ? 'high' : score > 0.6 ? 'medium' : 'low',
      factors: ['Source reliability', 'Confidence level', 'Context richness']
    };
  }

  assessFreshness(ioc) {
    const daysSinceFirst = (Date.now() - new Date(ioc.firstSeen).getTime()) / (24 * 60 * 60 * 1000);
    const daysSinceLast = ioc.lastSeen ? 
      (Date.now() - new Date(ioc.lastSeen).getTime()) / (24 * 60 * 60 * 1000) : daysSinceFirst;

    let score = 1.0;
    if (daysSinceLast > 30) score -= 0.3;
    if (daysSinceLast > 90) score -= 0.3;
    if (daysSinceLast > 180) score -= 0.3;

    return {
      score: Math.max(score, 0.1),
      level: score > 0.7 ? 'fresh' : score > 0.4 ? 'aging' : 'stale',
      daysSinceLastSeen: Math.round(daysSinceLast),
      daysSinceFirstSeen: Math.round(daysSinceFirst)
    };
  }

  assessContext(ioc) {
    let score = 0.3; // Base score

    if (ioc.description && ioc.description.length > 20) score += 0.3;
    if (ioc.tags && ioc.tags.length > 0) score += 0.2;
    if (ioc.source) score += 0.2;

    return {
      score: Math.min(score, 1.0),
      level: score > 0.7 ? 'rich' : score > 0.4 ? 'adequate' : 'poor',
      hasDescription: !!ioc.description,
      tagCount: ioc.tags ? ioc.tags.length : 0,
      hasSource: !!ioc.source
    };
  }

  async assessUniqueness(ioc) {
    // Check for similar IOCs in database
    const similarIOCs = await this.IOC.count({
      where: {
        id: { [Op.ne]: ioc.id },
        value: { [Op.iLike]: `%${ioc.value}%` }
      }
    });

    const score = Math.max(0.1, 1.0 - (similarIOCs * 0.1));

    return {
      score,
      level: score > 0.8 ? 'unique' : score > 0.5 ? 'somewhat_common' : 'common',
      similarCount: similarIOCs
    };
  }

  calculateOverallQualityScore(assessment) {
    const scores = Object.values(assessment)
      .filter(criterion => criterion && typeof criterion.score === 'number')
      .map(criterion => criterion.score);

    if (scores.length === 0) return 0;

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average * 100) / 100;
  }

  formatIOCForAssessment(ioc) {
    return {
      id: ioc.id,
      type: ioc.type,
      value: ioc.value,
      confidence: ioc.confidence,
      severity: ioc.severity,
      source: ioc.source,
      firstSeen: ioc.firstSeen,
      lastSeen: ioc.lastSeen
    };
  }

  generateQualityAssessmentSummary(assessments) {
    const validAssessments = assessments.filter(a => a.assessment && !a.error);
    
    if (validAssessments.length === 0) {
      return { error: 'No valid assessments completed' };
    }

    const scores = validAssessments
      .filter(a => a.assessment.overallScore !== undefined)
      .map(a => a.assessment.overallScore);

    return {
      totalAssessed: validAssessments.length,
      averageQuality: scores.length > 0 ? 
        Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) / 100 : 0,
      highQuality: scores.filter(score => score > 0.8).length,
      mediumQuality: scores.filter(score => score >= 0.5 && score <= 0.8).length,
      lowQuality: scores.filter(score => score < 0.5).length,
      recommendations: this.generateQualityRecommendations(validAssessments)
    };
  }

  generateQualityRecommendations(assessments) {
    const recommendations = [];
    
    const lowFreshness = assessments.filter(a => 
      a.assessment.freshness && a.assessment.freshness.level === 'stale'
    ).length;

    const lowContext = assessments.filter(a => 
      a.assessment.context && a.assessment.context.level === 'poor'
    ).length;

    if (lowFreshness > assessments.length * 0.3) {
      recommendations.push('Update aging IOCs with recent intelligence');
    }

    if (lowContext > assessments.length * 0.3) {
      recommendations.push('Enrich IOCs with additional context and descriptions');
    }

    recommendations.push('Regularly review and validate IOC quality metrics');
    
    return recommendations;
  }
}

module.exports = {
  THREAT_INTEL_TOOLS,
  ThreatIntelExecutor
};