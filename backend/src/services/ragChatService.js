const { Op } = require('sequelize');
const embeddingService = require('./embeddingService');
const Alert = require('../database/models/Alert');
const Incident = require('../database/models/Incident');
const Asset = require('../database/models/Asset');
const IOC = require('../database/models/IOC');
const Playbook = require('../database/models/Playbook');

/**
 * RAG (Retrieval-Augmented Generation) Chat Service
 * Handles vector similarity search and context retrieval for AI chat
 */
class RAGChatService {
  constructor() {
    this.models = {
      'alerts': Alert,
      'incidents': Incident,
      'assets': Asset,
      'iocs': IOC,
      'playbooks': Playbook
    };
    
    this.defaultSimilarityThreshold = 0.25;  // More permissive for enhanced stub
    this.maxContextItems = 10;
  }

  /**
   * Perform semantic search across specified data sources
   */
  async semanticSearch(query, options = {}) {
    const {
      dataSources = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
      organizationId,
      maxResults = this.maxContextItems,
      similarityThreshold = this.defaultSimilarityThreshold,
      progressCallback = null
    } = options;

    try {
      // Generate embedding for the query
      console.log('🔍 Generating query embedding...');
      if (progressCallback) {
        progressCallback({
          stage: 'embedding',
          message: 'Generating query embedding...',
          progress: 0,
          totalSources: dataSources.length
        });
      }
      
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      const searchResults = [];
      const searchBreakdown = [];
      
      // Search across each enabled data source
      for (let i = 0; i < dataSources.length; i++) {
        const dataSource = dataSources[i];
        
        if (!this.models[dataSource]) {
          console.warn(`⚠️ Unknown data source: ${dataSource}`);
          
          // Add to breakdown even for skipped sources
          searchBreakdown.push({
            dataSource,
            resultsFound: 0,
            error: 'Unknown data source',
            searchTime: 0
          });

          if (progressCallback) {
            progressCallback({
              stage: 'searching',
              dataSource,
              message: `Skipping unknown data source: ${dataSource}`,
              progress: i + 1,
              totalSources: dataSources.length,
              resultsFound: 0,
              error: 'Unknown data source',
              searchBreakdown: [...searchBreakdown]  // Send cumulative breakdown
            });
          }
          continue;
        }

        try {
          if (progressCallback) {
            progressCallback({
              stage: 'searching',
              dataSource,
              message: `Searching ${dataSource}...`,
              progress: i + 1,
              totalSources: dataSources.length,
              resultsFound: 0,
              searchBreakdown: [...searchBreakdown]  // Send current cumulative breakdown
            });
          }

          const searchStartTime = Date.now();
          const results = await this.searchInDataSource(
            dataSource,
            queryEmbedding,
            organizationId,
            Math.ceil(maxResults / dataSources.length),
            similarityThreshold
          );
          const searchTime = Date.now() - searchStartTime;
          
          searchResults.push(...results);
          
          // Track search breakdown for each source
          const breakdownItem = {
            dataSource,
            resultsFound: results.length,
            searchTime,
            topSimilarity: results.length > 0 ? results[0].similarity : 0
          };
          searchBreakdown.push(breakdownItem);

          if (progressCallback) {
            progressCallback({
              stage: 'searching',
              dataSource,
              message: `Found ${results.length} results in ${dataSource}`,
              progress: i + 1,
              totalSources: dataSources.length,
              resultsFound: results.length,
              searchTime,
              searchBreakdown: [...searchBreakdown]  // Send updated cumulative breakdown
            });
          }
        } catch (error) {
          console.error(`❌ Error searching in ${dataSource}:`, error);
          
          const errorBreakdownItem = {
            dataSource,
            resultsFound: 0,
            error: error.message,
            searchTime: 0
          };
          searchBreakdown.push(errorBreakdownItem);
          
          if (progressCallback) {
            progressCallback({
              stage: 'searching',
              dataSource,
              message: `Error searching ${dataSource}: ${error.message}`,
              progress: i + 1,
              totalSources: dataSources.length,
              resultsFound: 0,
              error: error.message,
              searchBreakdown: [...searchBreakdown]  // Send updated cumulative breakdown
            });
          }
        }
      }

      // Sort by similarity score and limit results
      const sortedResults = searchResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults);

      console.log(`✅ Semantic search completed: ${sortedResults.length} relevant items found`);
      
      if (progressCallback) {
        progressCallback({
          stage: 'completed',
          message: `Search completed: ${sortedResults.length} relevant items found`,
          progress: dataSources.length,
          totalSources: dataSources.length,
          totalResults: sortedResults.length,
          searchBreakdown
        });
      }

      // Add search metadata to results
      sortedResults._searchMetadata = {
        query: query.substring(0, 100),
        searchBreakdown,
        totalSearchTime: searchBreakdown.reduce((sum, item) => sum + (item.searchTime || 0), 0),
        similarityThreshold,
        maxResults,
        completedAt: new Date().toISOString()
      };

      return sortedResults;
      
    } catch (error) {
      console.error('❌ Semantic search failed:', error);
      if (progressCallback) {
        progressCallback({
          stage: 'error',
          message: `Search failed: ${error.message}`,
          error: error.message
        });
      }
      throw new Error(`Semantic search failed: ${error.message}`);
    }
  }

  /**
   * Search within a specific data source
   */
  async searchInDataSource(dataSource, queryEmbedding, organizationId, limit, threshold) {
    const Model = this.models[dataSource];
    const whereClause = {
      embedding: { [Op.not]: null }
    };
    
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    // Get all records with embeddings
    const records = await Model.findAll({
      where: whereClause,
      limit: 1000, // Reasonable limit for similarity calculation
      order: [['createdAt', 'DESC']]
    });

    if (records.length === 0) {
      return [];
    }

    // Calculate similarities and filter
    const results = [];
    
    for (const record of records) {
      // Parse embedding from PostgreSQL vector format to array
      let recordEmbedding;
      try {
        if (typeof record.embedding === 'string') {
          // Handle PostgreSQL vector format: [1.0,2.0,3.0] or JSON array
          if (record.embedding.startsWith('[') && record.embedding.endsWith(']')) {
            recordEmbedding = record.embedding
              .slice(1, -1)  // Remove brackets
              .split(',')    // Split by comma
              .map(parseFloat); // Convert to numbers
          } else {
            recordEmbedding = JSON.parse(record.embedding);
          }
        } else if (Array.isArray(record.embedding)) {
          recordEmbedding = record.embedding;
        } else {
          console.warn(`⚠️ Unexpected embedding format for ${dataSource} ${record.id}`);
          continue;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to parse embedding for ${dataSource} ${record.id}:`, error.message);
        continue;
      }

      const similarity = embeddingService.cosineSimilarity(
        queryEmbedding,
        recordEmbedding
      );

      if (similarity >= threshold) {
        results.push({
          id: record.id,
          type: dataSource.slice(0, -1), // Remove 's' from plural
          similarity,
          data: this.formatRecordForContext(record, dataSource),
          record // Keep full record for potential use
        });
      }
    }

    // Sort by similarity and limit
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Format record data for context inclusion
   */
  formatRecordForContext(record, dataSource) {
    const baseData = {
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };

    switch (dataSource) {
      case 'alerts':
        return {
          ...baseData,
          title: record.title,
          description: record.description,
          severity: record.severity,
          status: record.status,
          sourceSystem: record.sourceSystem,
          eventTime: record.eventTime,
          assetName: record.assetName
        };
        
      case 'incidents':
        return {
          ...baseData,
          title: record.title,
          description: record.description,
          severity: record.severity,
          status: record.status,
          category: record.category,
          assignedToName: record.assignedToName,
          alertCount: record.alertCount
        };
        
      case 'assets':
        return {
          ...baseData,
          name: record.name,
          description: record.description,
          assetType: record.assetType,
          ipAddress: record.ipAddress,
          hostname: record.hostname,
          osType: record.osType,
          criticality: record.criticality,
          location: record.location,
          department: record.department,
          status: record.status
        };
        
      case 'iocs':
        return {
          ...baseData,
          type: record.type,
          value: record.value,
          description: record.description,
          confidence: record.confidence,
          severity: record.severity,
          source: record.source,
          tags: record.tags,
          firstSeen: record.firstSeen,
          lastSeen: record.lastSeen
        };
        
      case 'playbooks':
        return {
          ...baseData,
          name: record.name,
          description: record.description,
          category: record.category,
          triggerType: record.triggerType,
          steps: record.steps,
          executionCount: record.executionCount,
          successRate: record.successRate
        };
        
      default:
        return baseData;
    }
  }

  /**
   * Build context string from search results for LLM
   */
  buildContextForLLM(searchResults) {
    if (!searchResults || searchResults.length === 0) {
      return null;
    }

    let context = "## Relevant SOC Data Context\n\n";
    
    // Group results by type
    const groupedResults = {};
    for (const result of searchResults) {
      if (!groupedResults[result.type]) {
        groupedResults[result.type] = [];
      }
      groupedResults[result.type].push(result);
    }

    // Build context for each type
    for (const [type, results] of Object.entries(groupedResults)) {
      context += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
      
      for (const result of results.slice(0, 3)) { // Limit to top 3 per type
        context += this.formatContextEntry(result, type);
        context += "\n---\n\n";
      }
    }

    return context;
  }

  /**
   * Format a single context entry
   */
  formatContextEntry(result, type) {
    const { data, similarity } = result;
    let entry = `**${type.toUpperCase()} ID**: ${data.id} (Similarity: ${similarity.toFixed(3)})\n\n`;

    switch (type) {
      case 'alert':
        entry += `**Title**: ${data.title}\n`;
        if (data.description) entry += `**Description**: ${data.description}\n`;
        entry += `**Severity**: ${data.severity}/5\n`;
        entry += `**Status**: ${data.status}\n`;
        entry += `**Source**: ${data.sourceSystem}\n`;
        if (data.assetName) entry += `**Asset**: ${data.assetName}\n`;
        entry += `**Event Time**: ${new Date(data.eventTime).toLocaleString()}\n`;
        break;
        
      case 'incident':
        entry += `**Title**: ${data.title}\n`;
        if (data.description) entry += `**Description**: ${data.description}\n`;
        entry += `**Severity**: ${data.severity}/5\n`;
        entry += `**Status**: ${data.status}\n`;
        if (data.category) entry += `**Category**: ${data.category}\n`;
        if (data.assignedToName) entry += `**Assigned To**: ${data.assignedToName}\n`;
        entry += `**Related Alerts**: ${data.alertCount}\n`;
        break;
        
      case 'asset':
        entry += `**Name**: ${data.name}\n`;
        if (data.description) entry += `**Description**: ${data.description}\n`;
        entry += `**Type**: ${data.assetType}\n`;
        if (data.ipAddress) entry += `**IP Address**: ${data.ipAddress}\n`;
        if (data.hostname) entry += `**Hostname**: ${data.hostname}\n`;
        if (data.osType) entry += `**OS**: ${data.osType}\n`;
        entry += `**Criticality**: ${data.criticality}\n`;
        if (data.location) entry += `**Location**: ${data.location}\n`;
        if (data.department) entry += `**Department**: ${data.department}\n`;
        entry += `**Status**: ${data.status}\n`;
        break;
        
      case 'ioc':
        entry += `**Type**: ${data.type}\n`;
        entry += `**Value**: ${data.value}\n`;
        if (data.description) entry += `**Description**: ${data.description}\n`;
        entry += `**Confidence**: ${data.confidence}\n`;
        entry += `**Severity**: ${data.severity}/5\n`;
        entry += `**Source**: ${data.source}\n`;
        if (data.tags && data.tags.length) entry += `**Tags**: ${data.tags.join(', ')}\n`;
        entry += `**First Seen**: ${new Date(data.firstSeen).toLocaleString()}\n`;
        entry += `**Last Seen**: ${new Date(data.lastSeen).toLocaleString()}\n`;
        break;
        
      case 'playbook':
        entry += `**Name**: ${data.name}\n`;
        if (data.description) entry += `**Description**: ${data.description}\n`;
        entry += `**Category**: ${data.category}\n`;
        entry += `**Trigger Type**: ${data.triggerType}\n`;
        if (data.steps && data.steps.length) {
          entry += `**Steps**: ${data.steps.length} steps defined\n`;
        }
        entry += `**Execution Count**: ${data.executionCount}\n`;
        if (data.successRate) entry += `**Success Rate**: ${data.successRate}%\n`;
        break;
    }

    entry += `**Last Updated**: ${new Date(data.updatedAt).toLocaleString()}\n`;
    return entry;
  }

  /**
   * Get conversation history for context
   */
  async getConversationHistory(conversationId, limit = 10) {
    // For now, this is a placeholder. In a production system,
    // you would implement conversation storage in database
    console.log(`📜 Retrieving conversation history for ${conversationId} (${limit} messages)`);
    return [];
  }

  /**
   * Build complete prompt for LLM including context and conversation history
   */
  async buildRAGPrompt(userMessage, options = {}) {
    const {
      dataSources,
      organizationId,
      conversationId,
      ragEnabled = true,
      maxResults = this.maxContextItems,
      progressCallback = null
    } = options;

    let prompt = "";
    
    // Add system context
    prompt += `You are an AI Security Operations Center (SOC) Consultant. You help security analysts understand and respond to security events, incidents, and threats.

When providing responses:
- Be precise and actionable
- Cite specific data from the context when available
- Suggest next steps for investigation or response
- Explain security implications clearly
- Use security terminology appropriately

`;

    // Add RAG context if enabled
    if (ragEnabled && dataSources && dataSources.length > 0) {
      try {
        const searchResults = await this.semanticSearch(userMessage, {
          dataSources,
          organizationId,
          maxResults,
          progressCallback
        });

        const contextStr = this.buildContextForLLM(searchResults);
        if (contextStr) {
          prompt += contextStr + "\n";
          prompt += "Please use the above context data when answering the user's question. Reference specific alerts, incidents, assets, IOCs, or playbooks when relevant.\n\n";
        } else {
          prompt += "No relevant context data was found in the SOC database for this query.\n\n";
        }
      } catch (error) {
        console.error('❌ Failed to retrieve RAG context:', error);
        prompt += "Error retrieving context data from SOC database.\n\n";
      }
    }

    // Add conversation history if available
    if (conversationId) {
      try {
        const history = await this.getConversationHistory(conversationId);
        if (history.length > 0) {
          prompt += "## Conversation History\n\n";
          for (const msg of history) {
            prompt += `**${msg.role}**: ${msg.content}\n\n`;
          }
        }
      } catch (error) {
        console.error('❌ Failed to retrieve conversation history:', error);
      }
    }

    // Add current user message
    prompt += `## Current Question\n\n**User**: ${userMessage}\n\n**Assistant**: `;

    return prompt;
  }

  /**
   * Build complete prompt for LLM and return both prompt and search results
   */
  async buildRAGPromptWithResults(userMessage, options = {}) {
    const {
      dataSources,
      organizationId,
      conversationId,
      ragEnabled = true,
      maxResults = this.maxContextItems,
      progressCallback = null
    } = options;

    let prompt = "";
    let searchResults = [];
    
    // Add system context
    prompt += `You are an AI Security Operations Center (SOC) Consultant. You help security analysts understand and respond to security events, incidents, and threats.

When providing responses:
- Be precise and actionable
- Cite specific data from the context when available
- Suggest next steps for investigation or response
- Explain security implications clearly
- Use security terminology appropriately

`;

    // Add RAG context if enabled
    if (ragEnabled && dataSources && dataSources.length > 0) {
      try {
        searchResults = await this.semanticSearch(userMessage, {
          dataSources,
          organizationId,
          maxResults,
          progressCallback
        });

        const contextStr = this.buildContextForLLM(searchResults);
        if (contextStr) {
          prompt += contextStr + "\n";
          prompt += "Please use the above context data when answering the user's question. Reference specific alerts, incidents, assets, IOCs, or playbooks when relevant.\n\n";
        } else {
          prompt += "No relevant context data was found in the SOC database for this query.\n\n";
        }
      } catch (error) {
        console.error('❌ Failed to retrieve RAG context:', error);
        prompt += "Error retrieving context data from SOC database.\n\n";
      }
    }

    // Add conversation history if available
    if (conversationId) {
      try {
        const history = await this.getConversationHistory(conversationId);
        if (history.length > 0) {
          prompt += "## Conversation History\n\n";
          for (const msg of history) {
            prompt += `**${msg.role}**: ${msg.content}\n\n`;
          }
        }
      } catch (error) {
        console.error('❌ Failed to retrieve conversation history:', error);
      }
    }

    // Add current user message
    prompt += `## Current Question\n\n**User**: ${userMessage}\n\n**Assistant**: `;

    return {
      prompt,
      searchResults
    };
  }

  /**
   * Get statistics about RAG capabilities
   */
  async getRAGStats(organizationId = null) {
    try {
      const embeddingStatus = await embeddingService.getEmbeddingStatus(organizationId);
      
      const stats = {
        totalRecords: 0,
        embeddedRecords: 0,
        searchCapabilities: {},
        modelInfo: embeddingService.getModelInfo()
      };

      // Calculate totals and search capabilities
      for (const [tableName, status] of Object.entries(embeddingStatus)) {
        stats.totalRecords += status.total;
        stats.embeddedRecords += status.embedded;
        
        stats.searchCapabilities[tableName] = {
          available: status.embedded > 0,
          coverage: status.percentage,
          count: status.embedded
        };
      }

      stats.overallCoverage = stats.totalRecords > 0 
        ? Math.round((stats.embeddedRecords / stats.totalRecords) * 100)
        : 0;

      return stats;
    } catch (error) {
      console.error('❌ Failed to get RAG stats:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const ragChatService = new RAGChatService();
module.exports = ragChatService;