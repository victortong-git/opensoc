/**
 * Hybrid Search Service
 * Orchestrates multiple search strategies for optimal RAG performance
 * Combines specific record lookup, structured filtering, and semantic search
 */

const ragChatService = require('./ragChatService');
const { QueryClassificationService } = require('./queryClassificationService');
const { SpecificRecordExecutor } = require('../tools/security/specificRecordTools');

/**
 * Search Strategy Types
 */
const SEARCH_STRATEGIES = {
  SPECIFIC_RECORD: 'specific_record',
  STRUCTURED_FILTER: 'structured_filter', 
  SEMANTIC_SEARCH: 'semantic_search',
  HYBRID_PARALLEL: 'hybrid_parallel',
  HYBRID_SEQUENTIAL: 'hybrid_sequential'
};

/**
 * Result Consolidation Methods
 */
const CONSOLIDATION_METHODS = {
  MERGE: 'merge',           // Combine all results
  RANK: 'rank',            // Rank by relevance across strategies
  FALLBACK: 'fallback',    // Use best strategy only
  WEIGHTED: 'weighted'     // Weight results by strategy confidence
};

class HybridSearchService {
  constructor() {
    this.ragChatService = ragChatService;
    this.queryClassificationService = new QueryClassificationService();
    this.specificRecordExecutor = new SpecificRecordExecutor();
    
    // Set up dependency injection
    this.specificRecordExecutor.setQueryClassificationService(this.queryClassificationService);
    
    // Performance tracking
    this.performanceMetrics = {
      totalQueries: 0,
      strategySuccess: {
        [SEARCH_STRATEGIES.SPECIFIC_RECORD]: { hits: 0, total: 0 },
        [SEARCH_STRATEGIES.STRUCTURED_FILTER]: { hits: 0, total: 0 },
        [SEARCH_STRATEGIES.SEMANTIC_SEARCH]: { hits: 0, total: 0 },
        [SEARCH_STRATEGIES.HYBRID_PARALLEL]: { hits: 0, total: 0 },
        [SEARCH_STRATEGIES.HYBRID_SEQUENTIAL]: { hits: 0, total: 0 }
      },
      avgResponseTimes: {},
      cacheHits: 0
    };

    // Simple query result cache
    this.queryCache = new Map();
    this.cacheMaxSize = 100;
    this.cacheMaxAge = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Main hybrid search method - intelligently routes and executes search
   */
  async hybridSearch(query, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Starting hybrid search for: "${query}"`);
      this.performanceMetrics.totalQueries++;

      const {
        organizationId,
        maxResults = 20,
        consolidationMethod = CONSOLIDATION_METHODS.RANK,
        forceStrategy = null,
        includeMetadata = true,
        enableCaching = true
      } = options;

      // Check cache first
      if (enableCaching) {
        const cacheKey = this.generateCacheKey(query, options);
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
          console.log('📦 Returning cached result');
          this.performanceMetrics.cacheHits++;
          return cached;
        }
      }

      // Step 1: Classify query to determine optimal strategy
      const classification = await this.queryClassificationService.classifyQuery(query, { organizationId });
      
      let searchStrategy;
      if (forceStrategy && Object.values(SEARCH_STRATEGIES).includes(forceStrategy)) {
        searchStrategy = forceStrategy;
        console.log(`🎯 Using forced strategy: ${searchStrategy}`);
      } else {
        searchStrategy = this.determineSearchStrategy(classification);
        console.log(`🧠 Selected strategy: ${searchStrategy} (${Math.round(classification.confidence * 100)}% confidence)`);
      }

      // Step 2: Execute search based on strategy
      const searchResults = await this.executeSearchStrategy(
        searchStrategy,
        query,
        classification,
        { ...options, organizationId }
      );

      // Step 3: Consolidate and rank results
      const consolidatedResults = this.consolidateResults(
        searchResults,
        consolidationMethod,
        maxResults
      );

      // Step 4: Build comprehensive response
      const response = {
        success: true,
        query,
        strategy: searchStrategy,
        classification: includeMetadata ? classification : undefined,
        results: consolidatedResults.results,
        metadata: {
          totalFound: consolidatedResults.totalFound,
          searchTime: Date.now() - startTime,
          strategies: searchResults.map(r => ({ 
            name: r.strategy, 
            found: r.results.length, 
            confidence: r.confidence 
          })),
          consolidationMethod,
          cached: false
        }
      };

      // Cache successful results
      if (enableCaching && response.success) {
        this.cacheResult(this.generateCacheKey(query, options), response);
      }

      // Update performance metrics
      this.updatePerformanceMetrics(searchStrategy, Date.now() - startTime, response.results.length > 0);

      return response;

    } catch (error) {
      console.error('❌ Error in hybrid search:', error);
      return {
        success: false,
        query,
        error: error.message,
        fallback: await this.performFallbackSearch(query, options),
        metadata: {
          searchTime: Date.now() - startTime,
          error: true
        }
      };
    }
  }

  /**
   * Determine optimal search strategy based on classification
   */
  determineSearchStrategy(classification) {
    const { queryType, confidence, extractedFields, metadata } = classification;

    // High-confidence specific record queries
    if (queryType === 'specific_record' && confidence >= 0.8) {
      return SEARCH_STRATEGIES.SPECIFIC_RECORD;
    }

    // High-confidence structured queries
    if (queryType === 'structured_filter' && confidence >= 0.7) {
      return SEARCH_STRATEGIES.STRUCTURED_FILTER;
    }

    // Complex queries or hybrid requirements
    if (queryType === 'hybrid' || confidence < 0.6 || metadata.complexity === 'complex') {
      return SEARCH_STRATEGIES.HYBRID_PARALLEL;
    }

    // Medium confidence queries - use sequential hybrid for safety
    if (confidence >= 0.5 && confidence < 0.7) {
      return SEARCH_STRATEGIES.HYBRID_SEQUENTIAL;
    }

    // Default to semantic search
    return SEARCH_STRATEGIES.SEMANTIC_SEARCH;
  }

  /**
   * Execute search based on determined strategy
   */
  async executeSearchStrategy(strategy, query, classification, options) {
    switch (strategy) {
      case SEARCH_STRATEGIES.SPECIFIC_RECORD:
        return await this.executeSpecificRecordSearch(query, classification, options);

      case SEARCH_STRATEGIES.STRUCTURED_FILTER:
        return await this.executeStructuredFilterSearch(query, classification, options);

      case SEARCH_STRATEGIES.SEMANTIC_SEARCH:
        return await this.executeSemanticSearch(query, classification, options);

      case SEARCH_STRATEGIES.HYBRID_PARALLEL:
        return await this.executeHybridParallelSearch(query, classification, options);

      case SEARCH_STRATEGIES.HYBRID_SEQUENTIAL:
        return await this.executeHybridSequentialSearch(query, classification, options);

      default:
        console.warn(`Unknown strategy: ${strategy}, falling back to semantic search`);
        return await this.executeSemanticSearch(query, classification, options);
    }
  }

  /**
   * Execute specific record search
   */
  async executeSpecificRecordSearch(query, classification, options) {
    const results = [];

    try {
      const { extractedFields } = classification;

      // Try direct ID lookups first
      if (extractedFields.ids && extractedFields.ids.length > 0) {
        for (const idGroup of extractedFields.ids) {
          if (idGroup.uuid) {
            // Try alert lookup
            const alertResult = await this.specificRecordExecutor.getSpecificAlertById({
              identifier: idGroup.uuid
            });
            if (alertResult.success) {
              results.push({
                strategy: 'specific_alert_lookup',
                results: [alertResult.alert],
                confidence: 0.95,
                metadata: alertResult.metadata
              });
            }

            // Try incident lookup
            const incidentResult = await this.specificRecordExecutor.getSpecificIncidentById({
              identifier: idGroup.uuid
            });
            if (incidentResult.success) {
              results.push({
                strategy: 'specific_incident_lookup',
                results: [incidentResult.incident],
                confidence: 0.95,
                metadata: incidentResult.metadata
              });
            }
          }

          if (idGroup.recordId) {
            // Try record ID pattern matching
            const alertResult = await this.specificRecordExecutor.getSpecificAlertById({
              identifier: idGroup.recordId
            });
            if (alertResult.success) {
              results.push({
                strategy: 'specific_record_lookup',
                results: [alertResult.alert],
                confidence: 0.85,
                metadata: alertResult.metadata
              });
            }
          }
        }
      }

      // If no ID-based results, try text-based specific record lookup
      if (results.length === 0) {
        const alertResult = await this.specificRecordExecutor.getSpecificAlertById({
          identifier: query
        });
        if (alertResult.success) {
          results.push({
            strategy: 'specific_text_lookup',
            results: [alertResult.alert],
            confidence: 0.7,
            metadata: alertResult.metadata
          });
        }
      }

    } catch (error) {
      console.error('Error in specific record search:', error);
      results.push({
        strategy: 'specific_record_error',
        results: [],
        confidence: 0,
        error: error.message
      });
    }

    return results;
  }

  /**
   * Execute structured filter search
   */
  async executeStructuredFilterSearch(query, classification, options) {
    const results = [];

    try {
      const { extractedFields } = classification;
      const searchParams = this.buildStructuredSearchParams(extractedFields, query);

      // Search alerts by criteria
      const alertResults = await this.specificRecordExecutor.getAlertsByCriteria({
        ...searchParams,
        limit: Math.min(options.maxResults || 20, 50)
      });

      if (alertResults.success && alertResults.alerts.length > 0) {
        results.push({
          strategy: 'structured_alert_filter',
          results: alertResults.alerts,
          confidence: 0.8,
          metadata: alertResults.metadata
        });
      }

      // Search incidents by criteria
      const incidentParams = {
        ...searchParams,
        limit: Math.min(options.maxResults || 10, 30)
      };
      
      const incidentResults = await this.specificRecordExecutor.getIncidentsByCriteria(incidentParams);

      if (incidentResults.success && incidentResults.incidents.length > 0) {
        results.push({
          strategy: 'structured_incident_filter',
          results: incidentResults.incidents,
          confidence: 0.8,
          metadata: incidentResults.metadata
        });
      }

      // If network-related, search assets
      if (extractedFields.network && extractedFields.network.length > 0) {
        const assetParams = {
          limit: Math.min(options.maxResults || 20, 50)
        };

        extractedFields.network.forEach(net => {
          if (net.ip) assetParams.ipAddress = net.ip;
          if (net.domain) assetParams.hostname = net.domain;
        });

        const assetResults = await this.specificRecordExecutor.searchAssetsByAttributes(assetParams);

        if (assetResults.success && assetResults.assets.length > 0) {
          results.push({
            strategy: 'structured_asset_filter',
            results: assetResults.assets,
            confidence: 0.75,
            metadata: assetResults.metadata
          });
        }
      }

    } catch (error) {
      console.error('Error in structured filter search:', error);
      results.push({
        strategy: 'structured_filter_error',
        results: [],
        confidence: 0,
        error: error.message
      });
    }

    return results;
  }

  /**
   * Execute semantic search
   */
  async executeSemanticSearch(query, classification, options) {
    try {
      console.log('🔍 Executing semantic search');
      
      const semanticResults = await this.ragChatService.semanticSearch(query, {
        dataSources: options.dataSources || ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
        organizationId: options.organizationId,
        maxResults: options.maxResults || 20,
        similarityThreshold: options.similarityThreshold || 0.25
      });

      return [{
        strategy: 'semantic_search',
        results: semanticResults,
        confidence: 0.7,
        metadata: {
          searchType: 'vector_similarity',
          threshold: options.similarityThreshold || 0.25
        }
      }];

    } catch (error) {
      console.error('Error in semantic search:', error);
      return [{
        strategy: 'semantic_search_error',
        results: [],
        confidence: 0,
        error: error.message
      }];
    }
  }

  /**
   * Execute hybrid parallel search - run multiple strategies simultaneously
   */
  async executeHybridParallelSearch(query, classification, options) {
    console.log('🚀 Executing hybrid parallel search');

    const searchPromises = [];

    // Always include semantic search as baseline
    searchPromises.push(this.executeSemanticSearch(query, classification, {
      ...options,
      maxResults: Math.floor((options.maxResults || 20) * 0.6) // 60% of results from semantic
    }));

    // Add specific record search if there are potential IDs
    if (classification.extractedFields.ids) {
      searchPromises.push(this.executeSpecificRecordSearch(query, classification, {
        ...options,
        maxResults: Math.floor((options.maxResults || 20) * 0.2) // 20% from specific records
      }));
    }

    // Add structured search if there are extractable criteria
    if (this.hasStructuredCriteria(classification.extractedFields)) {
      searchPromises.push(this.executeStructuredFilterSearch(query, classification, {
        ...options,
        maxResults: Math.floor((options.maxResults || 20) * 0.3) // 30% from structured filters
      }));
    }

    try {
      const allResults = await Promise.allSettled(searchPromises);
      
      const successfulResults = [];
      allResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successfulResults.push(...result.value);
        } else {
          console.warn(`Parallel search ${index} failed:`, result.reason);
        }
      });

      return successfulResults;

    } catch (error) {
      console.error('Error in hybrid parallel search:', error);
      return [{
        strategy: 'hybrid_parallel_error',
        results: [],
        confidence: 0,
        error: error.message
      }];
    }
  }

  /**
   * Execute hybrid sequential search - try strategies in order with fallbacks
   */
  async executeHybridSequentialSearch(query, classification, options) {
    console.log('⚡ Executing hybrid sequential search');

    const results = [];
    const { suggestedTools, fallbackStrategy } = classification;

    // Step 1: Try primary strategy
    const primaryStrategy = this.mapToolToStrategy(suggestedTools[0]);
    const primaryResults = await this.executeSearchStrategy(
      primaryStrategy,
      query,
      classification,
      { ...options, maxResults: options.maxResults || 20 }
    );

    results.push(...primaryResults);

    // Step 2: If primary strategy didn't yield sufficient results, try fallbacks
    const totalResults = primaryResults.reduce((sum, r) => sum + r.results.length, 0);
    const targetResults = options.maxResults || 20;

    if (totalResults < targetResults * 0.5) { // Less than 50% of target
      console.log(`🔄 Primary strategy yielded ${totalResults} results, trying fallbacks`);

      for (const fallback of fallbackStrategy) {
        if (results.reduce((sum, r) => sum + r.results.length, 0) >= targetResults) break;

        const fallbackStrategy = this.mapToolToStrategy(fallback);
        if (fallbackStrategy !== primaryStrategy) {
          const fallbackResults = await this.executeSearchStrategy(
            fallbackStrategy,
            query,
            classification,
            { ...options, maxResults: targetResults - totalResults }
          );
          results.push(...fallbackResults);
        }
      }
    }

    return results;
  }

  /**
   * Consolidate results from multiple search strategies
   */
  consolidateResults(searchResults, method, maxResults) {
    const allResults = [];
    let totalFound = 0;

    // Flatten all results
    searchResults.forEach(searchResult => {
      totalFound += searchResult.results.length;
      searchResult.results.forEach(result => {
        allResults.push({
          ...result,
          searchStrategy: searchResult.strategy,
          confidence: searchResult.confidence,
          metadata: {
            ...result.metadata,
            strategy: searchResult.strategy,
            strategyConfidence: searchResult.confidence
          }
        });
      });
    });

    let consolidatedResults = [];

    switch (method) {
      case CONSOLIDATION_METHODS.MERGE:
        consolidatedResults = this.deduplicateResults(allResults);
        break;

      case CONSOLIDATION_METHODS.RANK:
        consolidatedResults = this.rankResults(allResults);
        break;

      case CONSOLIDATION_METHODS.FALLBACK:
        consolidatedResults = this.selectBestStrategy(searchResults);
        break;

      case CONSOLIDATION_METHODS.WEIGHTED:
        consolidatedResults = this.weightResults(allResults);
        break;

      default:
        consolidatedResults = this.rankResults(allResults);
    }

    return {
      results: consolidatedResults.slice(0, maxResults),
      totalFound
    };
  }

  /**
   * Helper methods for result consolidation
   */

  deduplicateResults(results) {
    const seen = new Set();
    const deduplicated = [];

    results.forEach(result => {
      const id = result.id || result.uuid || JSON.stringify(result);
      if (!seen.has(id)) {
        seen.add(id);
        deduplicated.push(result);
      }
    });

    return deduplicated;
  }

  rankResults(results) {
    // Sort by strategy confidence, then by result relevance
    return results.sort((a, b) => {
      // Specific record results get highest priority
      if (a.searchStrategy?.includes('specific') && !b.searchStrategy?.includes('specific')) return -1;
      if (!a.searchStrategy?.includes('specific') && b.searchStrategy?.includes('specific')) return 1;
      
      // Then by confidence
      if (a.confidence !== b.confidence) return b.confidence - a.confidence;
      
      // Then by similarity score if available
      if (a.similarity && b.similarity) return b.similarity - a.similarity;
      
      // Finally by creation time (most recent first)
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      
      return 0;
    });
  }

  selectBestStrategy(searchResults) {
    // Find strategy with best results
    const bestStrategy = searchResults.reduce((best, current) => {
      const currentScore = current.confidence * Math.log(current.results.length + 1);
      const bestScore = best ? best.confidence * Math.log(best.results.length + 1) : 0;
      return currentScore > bestScore ? current : best;
    }, null);

    return bestStrategy ? bestStrategy.results : [];
  }

  weightResults(results) {
    // Assign weighted scores and sort
    return results.map(result => ({
      ...result,
      weightedScore: this.calculateWeightedScore(result)
    })).sort((a, b) => b.weightedScore - a.weightedScore);
  }

  calculateWeightedScore(result) {
    let score = result.confidence || 0.5;
    
    // Boost specific record results
    if (result.searchStrategy?.includes('specific')) score += 0.3;
    
    // Boost high similarity results
    if (result.similarity) score += result.similarity * 0.2;
    
    // Boost recent results
    if (result.createdAt) {
      const ageInDays = (Date.now() - new Date(result.createdAt)) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 0.1 - (ageInDays / 100)); // Small boost for recent items
    }

    return score;
  }

  /**
   * Helper methods
   */

  buildStructuredSearchParams(extractedFields, query) {
    const params = {};

    // Time range
    if (extractedFields.time_ranges) {
      const timeRange = extractedFields.time_ranges[0];
      if (timeRange.preset) {
        params.timeRange = { preset: timeRange.preset };
      } else if (timeRange.value && timeRange.unit) {
        params.timeRange = { start: `${timeRange.value}${timeRange.unit[0]}` };
      }
    }

    // Severity
    if (extractedFields.severity) {
      const severity = extractedFields.severity[0];
      params.severity = {
        operator: severity.level ? 'equals' : 'gte',
        value: severity.value || this.severityLevelToValue(severity.level)
      };
    }

    // Status
    if (extractedFields.status) {
      params.status = extractedFields.status.map(s => s.status);
    }

    // Network information
    if (extractedFields.network) {
      extractedFields.network.forEach(net => {
        if (net.ip) {
          params.ipAddresses = params.ipAddresses || [];
          params.ipAddresses.push(net.ip);
        }
        if (net.domain) {
          params.domains = params.domains || [];
          params.domains.push(net.domain);
        }
      });
    }

    // Text search if no specific criteria found
    if (Object.keys(params).length === 0) {
      params.containsText = query;
    }

    return params;
  }

  hasStructuredCriteria(extractedFields) {
    return extractedFields.time_ranges || 
           extractedFields.severity || 
           extractedFields.status || 
           extractedFields.network;
  }

  mapToolToStrategy(tool) {
    const toolStrategyMap = {
      'get_specific_alert_by_id': SEARCH_STRATEGIES.SPECIFIC_RECORD,
      'get_specific_incident_by_id': SEARCH_STRATEGIES.SPECIFIC_RECORD,
      'find_related_security_data': SEARCH_STRATEGIES.SPECIFIC_RECORD,
      'get_alerts_by_criteria': SEARCH_STRATEGIES.STRUCTURED_FILTER,
      'get_incidents_by_criteria': SEARCH_STRATEGIES.STRUCTURED_FILTER,
      'search_assets_by_attributes': SEARCH_STRATEGIES.STRUCTURED_FILTER,
      'smart_context_search': SEARCH_STRATEGIES.SEMANTIC_SEARCH,
      'intelligent_knowledge_extraction': SEARCH_STRATEGIES.SEMANTIC_SEARCH,
      'contextual_threat_analysis': SEARCH_STRATEGIES.SEMANTIC_SEARCH
    };

    return toolStrategyMap[tool] || SEARCH_STRATEGIES.SEMANTIC_SEARCH;
  }

  severityLevelToValue(level) {
    const levelMap = { low: 1, medium: 2, high: 4, critical: 5 };
    return levelMap[level?.toLowerCase()] || 3;
  }

  /**
   * Caching methods
   */

  generateCacheKey(query, options) {
    const keyComponents = [
      query,
      options.organizationId,
      options.maxResults,
      JSON.stringify(options.dataSources)
    ];
    return keyComponents.join('|');
  }

  getCachedResult(cacheKey) {
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return { ...cached.result, metadata: { ...cached.result.metadata, cached: true } };
    }
    if (cached) {
      this.queryCache.delete(cacheKey);
    }
    return null;
  }

  cacheResult(cacheKey, result) {
    // Clean old entries if cache is full
    if (this.queryCache.size >= this.cacheMaxSize) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }

    this.queryCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Fallback search when main hybrid search fails
   */
  async performFallbackSearch(query, options) {
    try {
      console.log('🔄 Performing fallback semantic search');
      return await this.ragChatService.semanticSearch(query, {
        dataSources: ['alerts', 'incidents'],
        organizationId: options.organizationId,
        maxResults: Math.min(options.maxResults || 10, 10),
        similarityThreshold: 0.2 // Lower threshold for fallback
      });
    } catch (error) {
      console.error('Fallback search also failed:', error);
      return [];
    }
  }

  /**
   * Performance tracking
   */

  updatePerformanceMetrics(strategy, responseTime, hasResults) {
    const strategyMetrics = this.performanceMetrics.strategySuccess[strategy];
    if (strategyMetrics) {
      strategyMetrics.total++;
      if (hasResults) strategyMetrics.hits++;
    }

    // Update average response times
    const current = this.performanceMetrics.avgResponseTimes[strategy] || { total: 0, count: 0 };
    current.total += responseTime;
    current.count++;
    this.performanceMetrics.avgResponseTimes[strategy] = current;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const metrics = { ...this.performanceMetrics };
    
    // Calculate averages
    Object.entries(metrics.avgResponseTimes).forEach(([strategy, data]) => {
      metrics.avgResponseTimes[strategy] = Math.round(data.total / data.count);
    });

    // Calculate success rates
    Object.entries(metrics.strategySuccess).forEach(([strategy, data]) => {
      metrics.strategySuccess[strategy] = {
        ...data,
        successRate: data.total > 0 ? Math.round((data.hits / data.total) * 100) : 0
      };
    });

    return metrics;
  }
}

module.exports = {
  HybridSearchService,
  SEARCH_STRATEGIES,
  CONSOLIDATION_METHODS
};