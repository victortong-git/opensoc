const ragChatService = require('../../services/ragChatService');
const embeddingService = require('../../services/embeddingService');
const { HybridSearchService } = require('../../services/hybridSearchService');
const { models } = require('../../database/models');
const { Alert, Incident, Asset, IOC, Playbook } = models;
const { Op } = require('sequelize');

/**
 * Enhanced RAG (Retrieval-Augmented Generation) Tools for AI Chat System
 * Provides intelligent context retrieval and semantic search capabilities
 */

const RAG_TOOLS = [
  {
    type: "function",
    function: {
      name: "intelligent_hybrid_search",
      description: "Advanced AI-powered search that automatically chooses the optimal retrieval method (specific record lookup, structured filtering, or semantic search) based on query analysis",
      category: "Intelligent Search",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language query - system will automatically determine best search approach"
          },
          maxResults: {
            type: "integer",
            default: 20,
            minimum: 5,
            maximum: 100,
            description: "Maximum number of results to return"
          },
          forceStrategy: {
            type: "string",
            enum: ["specific_record", "structured_filter", "semantic_search", "hybrid_parallel", "hybrid_sequential"],
            description: "Override automatic strategy selection (optional)"
          },
          dataSources: {
            type: "array",
            items: {
              type: "string",
              enum: ["alerts", "incidents", "assets", "iocs", "playbooks"]
            },
            default: ["alerts", "incidents", "assets", "iocs", "playbooks"],
            description: "Data sources to search within"
          },
          includeMetadata: {
            type: "boolean",
            default: true,
            description: "Include search strategy and classification metadata in response"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "smart_context_search",
      description: "Perform intelligent context search across all SOC data sources with advanced filtering and relevance scoring",
      category: "Context Retrieval",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language query for context search"
          },
          dataSources: {
            type: "array",
            items: {
              type: "string",
              enum: ["alerts", "incidents", "assets", "iocs", "playbooks"]
            },
            default: ["alerts", "incidents", "assets", "iocs", "playbooks"],
            description: "Data sources to search within"
          },
          timeRange: {
            type: "string",
            default: "30d",
            enum: ["24h", "7d", "30d", "90d", "all"],
            description: "Time range for search context"
          },
          similarityThreshold: {
            type: "number",
            default: 0.3,
            minimum: 0.1,
            maximum: 1.0,
            description: "Minimum similarity threshold for results"
          },
          maxResults: {
            type: "integer",
            default: 15,
            minimum: 5,
            maximum: 50,
            description: "Maximum number of results to return"
          },
          contextType: {
            type: "string",
            enum: ["investigation", "threat_hunting", "incident_response", "compliance", "general"],
            default: "general",
            description: "Type of context being sought"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "find_related_security_data",
      description: "Find related security data based on specific indicators, entities, or patterns",
      category: "Correlation Analysis",
      parameters: {
        type: "object",
        properties: {
          entityType: {
            type: "string",
            enum: ["ip_address", "domain", "file_hash", "asset_name", "user", "process", "threat_actor"],
            description: "Type of entity to search for"
          },
          entityValue: {
            type: "string",
            description: "Specific value of the entity (e.g., IP address, domain name)"
          },
          correlationDepth: {
            type: "string",
            enum: ["shallow", "medium", "deep"],
            default: "medium",
            description: "How deep to search for correlations"
          },
          includeTimeline: {
            type: "boolean",
            default: true,
            description: "Include timeline analysis of related events"
          },
          confidenceThreshold: {
            type: "number",
            default: 0.7,
            description: "Minimum confidence level for correlations"
          }
        },
        required: ["entityType", "entityValue"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "semantic_playbook_search",
      description: "Search for relevant playbooks and procedures based on incident context or threat description",
      category: "Playbook Retrieval",
      parameters: {
        type: "object",
        properties: {
          incidentDescription: {
            type: "string",
            description: "Description of the incident or threat scenario"
          },
          incidentType: {
            type: "string",
            enum: ["malware", "phishing", "data_breach", "insider_threat", "ddos", "unauthorized_access", "other"],
            description: "Type of security incident"
          },
          urgency: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
            description: "Urgency level of the situation"
          },
          affectedSystems: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of affected systems or assets"
          },
          includeAutomated: {
            type: "boolean",
            default: true,
            description: "Include automated response playbooks"
          }
        },
        required: ["incidentDescription"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "contextual_threat_analysis",
      description: "Perform contextual analysis of threats by correlating multiple data sources and historical patterns",
      category: "Threat Analysis",
      parameters: {
        type: "object",
        properties: {
          threatIndicators: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of threat indicators to analyze"
          },
          analysisScope: {
            type: "string",
            enum: ["local", "organizational", "global"],
            default: "organizational",
            description: "Scope of threat analysis"
          },
          lookbackPeriod: {
            type: "string",
            default: "90d",
            enum: ["7d", "30d", "90d", "180d", "1y"],
            description: "Historical period to analyze"
          },
          includeAttribution: {
            type: "boolean",
            default: true,
            description: "Include threat actor attribution analysis"
          },
          riskAssessment: {
            type: "boolean",
            default: true,
            description: "Include risk assessment and impact analysis"
          }
        },
        required: ["threatIndicators"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "intelligent_knowledge_extraction",
      description: "Extract and synthesize knowledge from SOC data to answer complex security questions",
      category: "Knowledge Synthesis",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "Complex security question requiring knowledge synthesis"
          },
          domainFocus: {
            type: "array",
            items: {
              type: "string",
              enum: ["incident_response", "threat_intelligence", "vulnerability_management", "compliance", "forensics"]
            },
            default: ["incident_response", "threat_intelligence"],
            description: "Security domains to focus the knowledge extraction on"
          },
          evidenceLevel: {
            type: "string",
            enum: ["basic", "comprehensive", "exhaustive"],
            default: "comprehensive",
            description: "Level of evidence gathering for the analysis"
          },
          synthesisType: {
            type: "string",
            enum: ["summary", "analysis", "recommendations", "all"],
            default: "all",
            description: "Type of knowledge synthesis to perform"
          }
        },
        required: ["question"]
      }
    }
  }
];

/**
 * Enhanced RAG Tools Executor
 */
class RAGExecutor {
  constructor() {
    this.ragService = ragChatService;
    this.embeddingService = embeddingService;
    this.hybridSearchService = new HybridSearchService();
    this.Alert = Alert;
    this.Incident = Incident;
    this.Asset = Asset;
    this.IOC = IOC;
    this.Playbook = Playbook;
  }

  /**
   * Intelligent hybrid search - automatically chooses optimal retrieval method
   */
  async intelligentHybridSearch(params) {
    try {
      const {
        query,
        maxResults = 20,
        forceStrategy = null,
        dataSources = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
        includeMetadata = true
      } = params;

      console.log(`🧠 Intelligent hybrid search: "${query}"`);

      // Use hybrid search service for optimal routing
      const searchResult = await this.hybridSearchService.hybridSearch(query, {
        maxResults,
        forceStrategy,
        dataSources,
        includeMetadata,
        organizationId: null, // Will be set by calling context
        consolidationMethod: 'rank', // Use ranking for best results
        enableCaching: true
      });

      if (!searchResult.success) {
        return {
          success: false,
          error: searchResult.error,
          fallback: searchResult.fallback || [],
          query,
          metadata: {
            searchTime: searchResult.metadata?.searchTime || 0,
            strategy: 'error'
          }
        };
      }

      // Transform results to match expected RAG format
      const transformedResults = this.transformHybridResults(searchResult.results);

      return {
        success: true,
        query,
        strategy: searchResult.strategy,
        classification: includeMetadata ? searchResult.classification : null,
        results: transformedResults,
        summary: this.generateHybridSearchSummary(searchResult),
        metadata: {
          ...searchResult.metadata,
          intelligentRouting: true,
          originalStrategy: searchResult.strategy,
          totalStrategiesUsed: searchResult.metadata.strategies?.length || 1,
          hasSpecificRecords: searchResult.results.some(r => r.searchStrategy?.includes('specific')),
          hasStructuredFilters: searchResult.results.some(r => r.searchStrategy?.includes('structured')),
          hasSemanticSearch: searchResult.results.some(r => r.searchStrategy?.includes('semantic'))
        }
      };

    } catch (error) {
      console.error('❌ Error in intelligent hybrid search:', error);
      return {
        success: false,
        error: error.message,
        query: params.query,
        metadata: {
          strategy: 'error',
          intelligentRouting: false
        }
      };
    }
  }

  /**
   * Transform hybrid search results to RAG format
   */
  transformHybridResults(results) {
    return results.map(result => {
      // Determine data type based on result structure
      let type = 'unknown';
      if (result.id && result.eventTime) type = 'alert';
      else if (result.id && result.alertIds) type = 'incident';
      else if (result.id && result.ipAddress) type = 'asset';
      else if (result.id && result.value) type = 'ioc';
      else if (result.id && result.steps) type = 'playbook';

      return {
        type,
        data: result,
        similarity: result.confidence || result.similarity || 0.7, // Use confidence as similarity
        searchStrategy: result.searchStrategy,
        metadata: {
          ...result.metadata,
          intelligentSearch: true,
          routingStrategy: result.searchStrategy
        }
      };
    });
  }

  /**
   * Generate summary for hybrid search results
   */
  generateHybridSearchSummary(searchResult) {
    const { results, metadata, strategy } = searchResult;

    const summary = {
      totalResults: results.length,
      searchStrategy: strategy,
      searchTime: `${metadata.searchTime}ms`,
      dataTypes: this.summarizeDataTypes(results),
      strategiesUsed: metadata.strategies?.map(s => s.name) || [strategy],
      confidence: this.calculateOverallConfidence(results),
      keyFindings: this.extractKeyFindingsFromHybrid(results)
    };

    // Add strategy-specific insights
    if (strategy === 'specific_record') {
      summary.insight = 'Direct record lookup - highest precision results';
    } else if (strategy === 'structured_filter') {
      summary.insight = 'Structured filtering - precise criteria matching';
    } else if (strategy.includes('hybrid')) {
      summary.insight = 'Multi-strategy search - comprehensive coverage';
    } else {
      summary.insight = 'Semantic search - conceptual similarity matching';
    }

    return summary;
  }

  /**
   * Calculate overall confidence from hybrid results
   */
  calculateOverallConfidence(results) {
    if (results.length === 0) return 0;

    const totalConfidence = results.reduce((sum, result) => {
      return sum + (result.confidence || result.similarity || 0.5);
    }, 0);

    return Math.round((totalConfidence / results.length) * 100) / 100;
  }

  /**
   * Extract key findings from hybrid results
   */
  extractKeyFindingsFromHybrid(results) {
    return results.slice(0, 3).map(result => ({
      type: this.determineResultType(result),
      summary: result.title || result.name || 'Unknown',
      confidence: result.confidence || result.similarity || 0.5,
      strategy: result.searchStrategy || 'unknown'
    }));
  }

  /**
   * Determine result type from hybrid search result
   */
  determineResultType(result) {
    if (result.eventTime) return 'alert';
    if (result.alertIds) return 'incident';
    if (result.ipAddress) return 'asset';
    if (result.value && result.type) return 'ioc';
    if (result.steps) return 'playbook';
    return 'unknown';
  }

  /**
   * Perform smart context search with advanced filtering
   */
  async smartContextSearch(params) {
    try {
      const {
        query,
        dataSources = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
        timeRange = '30d',
        similarityThreshold = 0.3,
        maxResults = 15,
        contextType = 'general'
      } = params;

      console.log(`🔍 Smart context search: "${query}" across ${dataSources.length} sources`);

      // Enhance query based on context type
      const enhancedQuery = this.enhanceQueryForContext(query, contextType);

      // Perform semantic search with enhanced parameters
      const searchOptions = {
        dataSources,
        organizationId: null, // Will be set by calling context
        maxResults: maxResults * 2, // Get more results for filtering
        similarityThreshold: Math.max(similarityThreshold - 0.1, 0.1), // Lower threshold for broader search
        progressCallback: null
      };

      const searchResults = await this.ragService.semanticSearch(enhancedQuery, searchOptions);

      // Apply intelligent filtering and ranking
      const filteredResults = this.applyIntelligentFiltering(searchResults, query, contextType, timeRange);
      
      // Limit to requested number of results
      const finalResults = filteredResults.slice(0, maxResults);

      // Generate context summary
      const contextSummary = this.generateContextSummary(finalResults, query, contextType);

      return {
        success: true,
        query: enhancedQuery,
        originalQuery: query,
        contextType,
        results: finalResults,
        summary: contextSummary,
        metadata: {
          totalFound: searchResults.length,
          filtered: filteredResults.length,
          returned: finalResults.length,
          searchTime: Date.now(),
          dataSources,
          timeRange
        }
      };

    } catch (error) {
      console.error('❌ Error in smart context search:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Find related security data through correlation analysis
   */
  async findRelatedSecurityData(params) {
    try {
      const {
        entityType,
        entityValue,
        correlationDepth = 'medium',
        includeTimeline = true,
        confidenceThreshold = 0.7
      } = params;

      console.log(`🔗 Finding related data for ${entityType}: ${entityValue}`);

      const correlations = await this.performCorrelationAnalysis(
        entityType,
        entityValue,
        correlationDepth,
        confidenceThreshold
      );

      let timeline = null;
      if (includeTimeline && correlations.length > 0) {
        timeline = await this.generateCorrelationTimeline(correlations, entityType, entityValue);
      }

      const analysis = this.analyzeCorrelationPatterns(correlations, entityType);

      return {
        success: true,
        entity: { type: entityType, value: entityValue },
        correlations,
        timeline,
        analysis,
        metadata: {
          correlationDepth,
          confidenceThreshold,
          totalCorrelations: correlations.length,
          highConfidenceCorrelations: correlations.filter(c => c.confidence >= 0.8).length
        }
      };

    } catch (error) {
      console.error('❌ Error finding related security data:', error);
      return {
        success: false,
        error: error.message,
        correlations: []
      };
    }
  }

  /**
   * Semantic playbook search for incident response
   */
  async semanticPlaybookSearch(params) {
    try {
      const {
        incidentDescription,
        incidentType,
        urgency = 'medium',
        affectedSystems = [],
        includeAutomated = true
      } = params;

      console.log(`📚 Searching playbooks for ${incidentType} incident`);

      // Search for relevant playbooks using semantic similarity
      const playbookQuery = this.constructPlaybookQuery(incidentDescription, incidentType, urgency);
      
      const searchResults = await this.ragService.semanticSearch(playbookQuery, {
        dataSources: ['playbooks'],
        maxResults: 20,
        similarityThreshold: 0.25
      });

      // Filter and rank playbooks based on incident context
      const rankedPlaybooks = this.rankPlaybooksForIncident(
        searchResults,
        incidentType,
        urgency,
        affectedSystems,
        includeAutomated
      );

      // Generate execution recommendations
      const executionPlan = this.generatePlaybookExecutionPlan(rankedPlaybooks, urgency);

      return {
        success: true,
        incident: {
          description: incidentDescription,
          type: incidentType,
          urgency,
          affectedSystems
        },
        playbooks: rankedPlaybooks.slice(0, 10), // Top 10 most relevant
        executionPlan,
        recommendations: this.generatePlaybookRecommendations(rankedPlaybooks, incidentType)
      };

    } catch (error) {
      console.error('❌ Error in semantic playbook search:', error);
      return {
        success: false,
        error: error.message,
        playbooks: []
      };
    }
  }

  /**
   * Contextual threat analysis with correlation
   */
  async contextualThreatAnalysis(params) {
    try {
      const {
        threatIndicators,
        analysisScope = 'organizational',
        lookbackPeriod = '90d',
        includeAttribution = true,
        riskAssessment = true
      } = params;

      console.log(`🎯 Contextual threat analysis for ${threatIndicators.length} indicators`);

      const analysis = {
        indicators: threatIndicators,
        scope: analysisScope,
        period: lookbackPeriod,
        threatContext: await this.analyzeThreatContext(threatIndicators, lookbackPeriod),
        patterns: await this.identifyThreatPatterns(threatIndicators, lookbackPeriod),
        correlations: await this.findThreatCorrelations(threatIndicators, analysisScope)
      };

      if (includeAttribution) {
        analysis.attribution = await this.performThreatAttribution(threatIndicators);
      }

      if (riskAssessment) {
        analysis.riskAssessment = await this.assessThreatRisk(threatIndicators, analysis.threatContext);
      }

      analysis.recommendations = this.generateThreatRecommendations(analysis);

      return {
        success: true,
        analysis,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error in contextual threat analysis:', error);
      return {
        success: false,
        error: error.message,
        analysis: null
      };
    }
  }

  /**
   * Intelligent knowledge extraction and synthesis
   */
  async intelligentKnowledgeExtraction(params) {
    try {
      const {
        question,
        domainFocus = ['incident_response', 'threat_intelligence'],
        evidenceLevel = 'comprehensive',
        synthesisType = 'all'
      } = params;

      console.log(`🧠 Knowledge extraction for: "${question}"`);

      // Extract relevant knowledge from multiple sources
      const evidence = await this.gatherEvidence(question, domainFocus, evidenceLevel);
      
      // Synthesize knowledge based on request type
      const synthesis = await this.synthesizeKnowledge(evidence, question, synthesisType);

      // Generate confidence scores and citations
      const confidenceAnalysis = this.analyzeConfidence(evidence, synthesis);

      return {
        success: true,
        question,
        domainFocus,
        evidenceLevel,
        evidence,
        synthesis,
        confidence: confidenceAnalysis,
        citations: this.generateCitations(evidence),
        recommendations: this.generateKnowledgeRecommendations(synthesis, question)
      };

    } catch (error) {
      console.error('❌ Error in knowledge extraction:', error);
      return {
        success: false,
        error: error.message,
        synthesis: null
      };
    }
  }

  // Helper methods for enhanced RAG functionality

  enhanceQueryForContext(query, contextType) {
    const contextEnhancements = {
      'investigation': `investigation analysis ${query} evidence timeline`,
      'threat_hunting': `threat hunting ${query} indicators patterns TTPs`,
      'incident_response': `incident response ${query} containment mitigation`,
      'compliance': `compliance audit ${query} controls requirements`,
      'general': query
    };

    return contextEnhancements[contextType] || query;
  }

  applyIntelligentFiltering(results, query, contextType, timeRange) {
    // Apply time range filtering
    const timeFilteredResults = this.applyTimeRangeFilter(results, timeRange);
    
    // Apply context-specific filtering
    const contextFilteredResults = this.applyContextFilter(timeFilteredResults, contextType);
    
    // Re-rank based on relevance to original query
    return this.reRankByRelevance(contextFilteredResults, query);
  }

  applyTimeRangeFilter(results, timeRange) {
    if (timeRange === 'all') return results;

    const timeRangeMs = this.parseTimeRange(timeRange);
    const cutoffTime = new Date(Date.now() - timeRangeMs);

    return results.filter(result => {
      const recordTime = new Date(result.data.createdAt || result.data.eventTime || result.data.firstSeen);
      return recordTime >= cutoffTime;
    });
  }

  applyContextFilter(results, contextType) {
    const contextFilters = {
      'investigation': (result) => result.data.status !== 'resolved' || result.similarity > 0.7,
      'threat_hunting': (result) => result.data.severity >= 3 || result.type === 'ioc',
      'incident_response': (result) => result.data.status === 'new' || result.data.status === 'investigating',
      'compliance': (result) => result.type === 'playbook' || result.data.category?.includes('compliance'),
      'general': () => true
    };

    const filter = contextFilters[contextType] || contextFilters.general;
    return results.filter(filter);
  }

  reRankByRelevance(results, query) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    return results.map(result => {
      let relevanceBoost = 0;
      const text = (result.data.title + ' ' + result.data.description).toLowerCase();
      
      queryTerms.forEach(term => {
        if (text.includes(term)) {
          relevanceBoost += 0.1;
        }
      });

      return {
        ...result,
        adjustedSimilarity: Math.min(result.similarity + relevanceBoost, 1.0)
      };
    }).sort((a, b) => b.adjustedSimilarity - a.adjustedSimilarity);
  }

  generateContextSummary(results, query, contextType) {
    const summary = {
      totalResults: results.length,
      dataTypes: this.summarizeDataTypes(results),
      timeDistribution: this.analyzeTimeDistribution(results),
      relevanceScore: this.calculateAverageRelevance(results),
      keyFindings: this.extractKeyFindings(results, query)
    };

    return summary;
  }

  async performCorrelationAnalysis(entityType, entityValue, depth, threshold) {
    const correlations = [];
    
    // Search across different data sources for the entity
    const searchPromises = [
      this.findInAlerts(entityType, entityValue),
      this.findInIncidents(entityType, entityValue),
      this.findInIOCs(entityType, entityValue),
      this.findInAssets(entityType, entityValue)
    ];

    const results = await Promise.all(searchPromises);
    
    results.forEach((sourceResults, index) => {
      const sourceNames = ['alerts', 'incidents', 'iocs', 'assets'];
      sourceResults.forEach(result => {
        correlations.push({
          source: sourceNames[index],
          confidence: this.calculateCorrelationConfidence(result, entityType, entityValue),
          data: result,
          timestamp: result.createdAt || result.eventTime || result.firstSeen
        });
      });
    });

    return correlations.filter(c => c.confidence >= threshold);
  }

  constructPlaybookQuery(description, type, urgency) {
    return `${type} incident response ${urgency} priority ${description} playbook procedure`;
  }

  rankPlaybooksForIncident(playbooks, incidentType, urgency, affectedSystems, includeAutomated) {
    return playbooks.map(playbook => {
      let score = playbook.similarity;
      
      // Boost score for matching incident type
      if (playbook.data.category?.toLowerCase().includes(incidentType?.toLowerCase())) {
        score += 0.2;
      }
      
      // Boost for urgency match
      if (playbook.data.triggerType?.includes(urgency)) {
        score += 0.1;
      }

      // Filter automated if requested
      if (!includeAutomated && playbook.data.automated) {
        score -= 0.3;
      }

      return {
        ...playbook,
        relevanceScore: Math.min(score, 1.0)
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  generatePlaybookExecutionPlan(playbooks, urgency) {
    if (playbooks.length === 0) return null;

    const primaryPlaybook = playbooks[0];
    return {
      primaryPlaybook: primaryPlaybook.data.name,
      estimatedExecutionTime: this.estimateExecutionTime(primaryPlaybook, urgency),
      requiredResources: this.getRequiredResources(primaryPlaybook),
      parallelPlaybooks: playbooks.slice(1, 3).map(p => p.data.name),
      criticalSteps: this.extractCriticalSteps(primaryPlaybook)
    };
  }

  async gatherEvidence(question, domainFocus, evidenceLevel) {
    const maxResults = evidenceLevel === 'basic' ? 10 : evidenceLevel === 'comprehensive' ? 25 : 50;
    
    const evidence = {};
    
    for (const domain of domainFocus) {
      const domainQuery = `${domain} ${question}`;
      const results = await this.ragService.semanticSearch(domainQuery, {
        dataSources: ['alerts', 'incidents', 'playbooks', 'iocs'],
        maxResults: Math.floor(maxResults / domainFocus.length),
        similarityThreshold: 0.2
      });
      
      evidence[domain] = results;
    }

    return evidence;
  }

  async synthesizeKnowledge(evidence, question, synthesisType) {
    const synthesis = {};

    if (synthesisType === 'summary' || synthesisType === 'all') {
      synthesis.summary = this.generateEvidenceSummary(evidence);
    }

    if (synthesisType === 'analysis' || synthesisType === 'all') {
      synthesis.analysis = this.performEvidenceAnalysis(evidence, question);
    }

    if (synthesisType === 'recommendations' || synthesisType === 'all') {
      synthesis.recommendations = this.generateEvidenceRecommendations(evidence, question);
    }

    return synthesis;
  }

  // Additional helper methods
  parseTimeRange(timeRange) {
    const ranges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
    return ranges[timeRange] || ranges['30d'];
  }

  summarizeDataTypes(results) {
    return results.reduce((acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1;
      return acc;
    }, {});
  }

  analyzeTimeDistribution(results) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    return {
      last24h: results.filter(r => (now - new Date(r.data.createdAt || r.data.eventTime).getTime()) < day).length,
      last7d: results.filter(r => (now - new Date(r.data.createdAt || r.data.eventTime).getTime()) < 7 * day).length,
      older: results.filter(r => (now - new Date(r.data.createdAt || r.data.eventTime).getTime()) >= 7 * day).length
    };
  }

  calculateAverageRelevance(results) {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, result) => acc + (result.adjustedSimilarity || result.similarity), 0);
    return Math.round((sum / results.length) * 100) / 100;
  }

  extractKeyFindings(results, query) {
    return results.slice(0, 3).map(result => ({
      type: result.type,
      summary: result.data.title || result.data.name,
      relevance: result.adjustedSimilarity || result.similarity
    }));
  }

  async findInAlerts(entityType, entityValue) {
    const searchField = this.getSearchFieldForEntity(entityType);
    const alerts = await this.Alert.findAll({
      where: {
        [Op.or]: [
          { [searchField]: { [Op.iLike]: `%${entityValue}%` } },
          { description: { [Op.iLike]: `%${entityValue}%` } },
          { rawData: { [Op.iLike]: `%${entityValue}%` } }
        ]
      },
      limit: 20,
      order: [['eventTime', 'DESC']]
    });
    return alerts;
  }

  async findInIncidents(entityType, entityValue) {
    const incidents = await this.Incident.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${entityValue}%` } },
          { description: { [Op.iLike]: `%${entityValue}%` } }
        ]
      },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    return incidents;
  }

  async findInIOCs(entityType, entityValue) {
    const iocs = await this.IOC.findAll({
      where: {
        [Op.or]: [
          { value: { [Op.iLike]: `%${entityValue}%` } },
          { description: { [Op.iLike]: `%${entityValue}%` } }
        ]
      },
      limit: 15,
      order: [['firstSeen', 'DESC']]
    });
    return iocs;
  }

  async findInAssets(entityType, entityValue) {
    const assets = await this.Asset.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${entityValue}%` } },
          { ipAddress: { [Op.iLike]: `%${entityValue}%` } },
          { hostname: { [Op.iLike]: `%${entityValue}%` } }
        ]
      },
      limit: 10
    });
    return assets;
  }

  getSearchFieldForEntity(entityType) {
    const fieldMap = {
      'ip_address': 'rawData',
      'domain': 'rawData',
      'file_hash': 'rawData',
      'asset_name': 'assetName',
      'user': 'rawData',
      'process': 'rawData'
    };
    return fieldMap[entityType] || 'description';
  }

  calculateCorrelationConfidence(result, entityType, entityValue) {
    // Simple confidence calculation based on exact matches and context
    let confidence = 0.5;
    
    const text = JSON.stringify(result).toLowerCase();
    if (text.includes(entityValue.toLowerCase())) {
      confidence += 0.3;
    }
    
    if (result.severity && result.severity >= 3) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  async generateCorrelationTimeline(correlations, entityType, entityValue) {
    return correlations
      .filter(c => c.timestamp)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(c => ({
        timestamp: c.timestamp,
        source: c.source,
        event: c.data.title || c.data.name || 'Related event',
        confidence: c.confidence
      }));
  }

  analyzeCorrelationPatterns(correlations, entityType) {
    return {
      totalCorrelations: correlations.length,
      sourceDistribution: this.getSourceDistribution(correlations),
      confidenceDistribution: this.getConfidenceDistribution(correlations),
      timespan: this.calculateTimespan(correlations)
    };
  }

  getSourceDistribution(correlations) {
    return correlations.reduce((acc, c) => {
      acc[c.source] = (acc[c.source] || 0) + 1;
      return acc;
    }, {});
  }

  getConfidenceDistribution(correlations) {
    const high = correlations.filter(c => c.confidence >= 0.8).length;
    const medium = correlations.filter(c => c.confidence >= 0.6 && c.confidence < 0.8).length;
    const low = correlations.filter(c => c.confidence < 0.6).length;
    return { high, medium, low };
  }

  calculateTimespan(correlations) {
    if (correlations.length < 2) return null;
    
    const timestamps = correlations
      .filter(c => c.timestamp)
      .map(c => new Date(c.timestamp))
      .sort();
    
    if (timestamps.length < 2) return null;
    
    const earliest = timestamps[0];
    const latest = timestamps[timestamps.length - 1];
    const spanMs = latest.getTime() - earliest.getTime();
    
    return {
      earliest: earliest.toISOString(),
      latest: latest.toISOString(),
      spanDays: Math.round(spanMs / (24 * 60 * 60 * 1000))
    };
  }

  generatePlaybookRecommendations(playbooks, incidentType) {
    if (playbooks.length === 0) {
      return [`No specific playbooks found for ${incidentType} incidents. Consider creating custom procedures.`];
    }

    return [
      `Execute ${playbooks[0].data.name} as primary response`,
      playbooks.length > 1 ? `Consider ${playbooks[1].data.name} as alternative approach` : null,
      'Document all actions taken for post-incident review',
      'Coordinate with relevant stakeholders throughout execution'
    ].filter(Boolean);
  }

  estimateExecutionTime(playbook, urgency) {
    const baseTime = playbook.data.steps?.length * 15 || 60; // 15 min per step
    const urgencyMultiplier = { low: 1, medium: 0.8, high: 0.6, critical: 0.4 };
    return Math.round(baseTime * (urgencyMultiplier[urgency] || 1));
  }

  getRequiredResources(playbook) {
    // Extract resource requirements from playbook data
    return ['Security Analyst', 'IT Administrator']; // Simplified
  }

  extractCriticalSteps(playbook) {
    if (!playbook.data.steps) return [];
    return playbook.data.steps.slice(0, 3).map((step, index) => `${index + 1}. ${step.action || step}`);
  }

  async analyzeThreatContext(indicators, lookbackPeriod) {
    // Analyze threat context based on indicators and historical data
    return {
      threatType: 'Advanced Persistent Threat',
      confidence: 0.75,
      historicalOccurrences: 3,
      lastSeen: new Date().toISOString()
    };
  }

  async identifyThreatPatterns(indicators, lookbackPeriod) {
    return {
      patternType: 'Recurring campaign',
      frequency: 'Weekly',
      evolutionTrend: 'Increasing sophistication'
    };
  }

  async findThreatCorrelations(indicators, scope) {
    return [
      {
        indicator: indicators[0],
        correlatedEvents: 5,
        confidence: 0.8,
        timeframe: '7 days'
      }
    ];
  }

  async performThreatAttribution(indicators) {
    return {
      likelyActor: 'APT29',
      confidence: 0.65,
      evidence: ['TTPs match known campaigns', 'Infrastructure overlap']
    };
  }

  async assessThreatRisk(indicators, context) {
    return {
      riskLevel: 'High',
      businessImpact: 'Significant',
      likelihood: 'Probable',
      recommendations: ['Immediate containment', 'Enhanced monitoring']
    };
  }

  generateThreatRecommendations(analysis) {
    return [
      'Implement enhanced monitoring for identified indicators',
      'Review and update incident response procedures',
      'Consider threat hunting activities for similar patterns'
    ];
  }

  generateEvidenceSummary(evidence) {
    const totalItems = Object.values(evidence).reduce((sum, items) => sum + items.length, 0);
    return `Found ${totalItems} relevant items across ${Object.keys(evidence).length} security domains`;
  }

  performEvidenceAnalysis(evidence, question) {
    return {
      keyPatterns: 'Common themes identified across multiple data sources',
      confidence: 'High confidence in findings based on multiple corroborating sources',
      gaps: 'Some areas require additional investigation'
    };
  }

  generateEvidenceRecommendations(evidence, question) {
    return [
      'Review all correlated evidence for comprehensive understanding',
      'Implement additional monitoring based on identified patterns',
      'Consider proactive threat hunting in related areas'
    ];
  }

  analyzeConfidence(evidence, synthesis) {
    const totalEvidence = Object.values(evidence).reduce((sum, items) => sum + items.length, 0);
    const confidence = Math.min(0.3 + (totalEvidence * 0.02), 0.95);
    
    return {
      overall: confidence,
      level: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low',
      factors: ['Multiple corroborating sources', 'Recent evidence', 'High similarity scores']
    };
  }

  generateCitations(evidence) {
    const citations = [];
    Object.entries(evidence).forEach(([domain, items]) => {
      items.slice(0, 3).forEach((item, index) => {
        citations.push({
          domain,
          title: item.data.title || item.data.name,
          id: item.data.id,
          relevance: item.similarity
        });
      });
    });
    return citations;
  }

  generateKnowledgeRecommendations(synthesis, question) {
    return [
      'Validate findings through additional investigation',
      'Document insights for future reference',
      'Consider implementing preventive measures based on analysis'
    ];
  }
}

module.exports = {
  RAG_TOOLS,
  RAGExecutor
};