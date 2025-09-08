const { models, sequelize } = require('../database/models');
const { Op } = require('sequelize');
const embeddingService = require('./embeddingService');

/**
 * Unified Search Service
 * Supports keyword search, vector/semantic search, and hybrid search
 * across alerts, incidents, assets, threat intelligence (IOCs), and playbooks
 */
class SearchService {
  constructor() {
    this.searchableEntities = {
      alerts: {
        model: models.Alert,
        searchFields: ['title', 'description', 'sourceSystem', 'assetName'],
        vectorField: 'embedding',
        includes: [{ model: models.Asset, as: 'asset', attributes: ['name', 'type'] }]
      },
      incidents: {
        model: models.Incident,
        searchFields: ['title', 'description'],
        vectorField: 'embedding',
        includes: [
          { model: models.User, as: 'assignedUser', attributes: ['firstName', 'lastName'] }
        ]
      },
      assets: {
        model: models.Asset,
        searchFields: ['name', 'description', 'ipAddress', 'hostname'],
        vectorField: 'embedding',
        includes: []
      },
      iocs: {
        model: models.IOC,
        searchFields: ['value', 'description'],
        vectorField: 'embedding',
        includes: []
      },
      playbooks: {
        model: models.Playbook,
        searchFields: ['name', 'description', 'category'],
        vectorField: 'embedding',
        includes: [{ model: models.User, as: 'creator', attributes: ['firstName', 'lastName'] }]
      }
    };
  }

  /**
   * Perform unified search across all entities
   * @param {Object} options Search options
   * @param {string} options.query Search query
   * @param {string} options.searchType 'keyword' | 'vector' | 'hybrid'
   * @param {string[]} options.entities Filter by entity types
   * @param {string} options.organizationId User's organization ID
   * @param {number} options.limit Maximum results per entity type
   * @param {number} options.offset Results offset
   * @returns {Promise<Object>} Search results grouped by entity type
   */
  async search({
    query,
    searchType = 'hybrid',
    entities = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
    organizationId,
    limit = 10,
    offset = 0
  }) {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    const results = {};
    const searchPromises = [];

    // Filter entities to search
    const entitiesToSearch = entities.filter(entity => 
      this.searchableEntities.hasOwnProperty(entity)
    );

    for (const entityType of entitiesToSearch) {
      const entityConfig = this.searchableEntities[entityType];
      
      let searchPromise;
      switch (searchType) {
        case 'keyword':
          searchPromise = this._keywordSearch(entityType, entityConfig, query, organizationId, limit, offset);
          break;
        case 'vector':
          searchPromise = this._vectorSearch(entityType, entityConfig, query, organizationId, limit, offset);
          break;
        case 'hybrid':
        default:
          searchPromise = this._hybridSearch(entityType, entityConfig, query, organizationId, limit, offset);
          break;
      }

      searchPromises.push(
        searchPromise.then(entityResults => ({
          entityType,
          results: entityResults
        }))
      );
    }

    // Execute all searches in parallel
    const searchResults = await Promise.all(searchPromises);
    
    // Organize results by entity type
    for (const { entityType, results: entityResults } of searchResults) {
      results[entityType] = entityResults;
    }

    // Calculate total results count
    const totalResults = Object.values(results).reduce((sum, entityResults) => 
      sum + (entityResults.count || 0), 0
    );

    return {
      results,
      totalResults,
      searchType,
      query: query.trim(),
      entities: entitiesToSearch
    };
  }

  /**
   * Keyword-based search using PostgreSQL full-text search
   */
  async _keywordSearch(entityType, entityConfig, query, organizationId, limit, offset) {
    const { model, searchFields, includes } = entityConfig;
    
    // Get model attributes to identify ENUM fields
    const modelAttributes = model.rawAttributes || {};
    
    // Build OR conditions for each searchable field
    const searchConditions = searchFields.map(field => {
      const attribute = modelAttributes[field];
      
      // Handle ENUM, INET, and ARRAY fields by casting to text
      if (attribute && attribute.type && 
          (attribute.type.constructor.name === 'ENUM' || 
           attribute.type.constructor.name === 'INET' ||
           attribute.type.constructor.name === 'ARRAY')) {
        const fieldName = attribute.field || field;
        return sequelize.where(
          sequelize.cast(sequelize.col(`${model.name}.${fieldName}`), 'text'),
          Op.iLike,
          `%${query}%`
        );
      }
      
      // Handle regular fields
      return {
        [field]: {
          [Op.iLike]: `%${query}%`
        }
      };
    });

    const whereClause = {
      organizationId,
      [Op.or]: searchConditions
    };

    try {
      const results = await model.findAndCountAll({
        where: whereClause,
        include: includes || [],
        limit,
        offset,
        order: [['created_at', 'DESC']],
        distinct: true
      });

      return {
        rows: results.rows.map(row => ({
          ...row.toJSON(),
          _searchMeta: {
            entityType,
            searchType: 'keyword',
            relevanceScore: this._calculateKeywordRelevance(row, searchFields, query)
          }
        })),
        count: results.count
      };

    } catch (error) {
      console.error(`Keyword search failed for ${entityType} with includes:`, error);
      console.error('Error details:', {
        message: error.message,
        sql: error.sql,
        original: error.original
      });
      
      // Fallback: try without includes if they failed
      try {
        const results = await model.findAndCountAll({
          where: whereClause,
          limit,
          offset,
          order: [['created_at', 'DESC']],
          distinct: true
        });

        return {
          rows: results.rows.map(row => ({
            ...row.toJSON(),
            _searchMeta: {
              entityType,
              searchType: 'keyword',
              relevanceScore: this._calculateKeywordRelevance(row, searchFields, query)
            }
          })),
          count: results.count
        };
      } catch (fallbackError) {
        console.error(`Keyword search completely failed for ${entityType}:`, fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Vector-based semantic search using embeddings
   */
  async _vectorSearch(entityType, entityConfig, query, organizationId, limit, offset) {
    const { model, vectorField, includes } = entityConfig;

    try {
      // Generate embedding for search query
      await embeddingService.initialize();
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      if (!queryEmbedding || queryEmbedding.length === 0) {
        console.warn(`Failed to generate embedding for query: ${query}`);
        return { rows: [], count: 0 };
      }

      // Perform vector similarity search
      const vectorQuery = `
        SELECT *, 
        (${vectorField} <-> $queryVector) as distance,
        (1 - (${vectorField} <-> $queryVector)) as similarity
        FROM ${model.tableName}
        WHERE organization_id = $organizationId 
        AND ${vectorField} IS NOT NULL
        ORDER BY ${vectorField} <-> $queryVector
        LIMIT $limit OFFSET $offset
      `;

      const results = await sequelize.query(vectorQuery, {
        bind: {
          queryVector: JSON.stringify(queryEmbedding),
          organizationId,
          limit,
          offset
        },
        type: sequelize.QueryTypes.SELECT
      });

      // Get count query
      const countQuery = `
        SELECT COUNT(*) as count
        FROM ${model.tableName}
        WHERE organization_id = $organizationId 
        AND ${vectorField} IS NOT NULL
      `;

      const countResult = await sequelize.query(countQuery, {
        bind: { organizationId },
        type: sequelize.QueryTypes.SELECT
      });

      // Hydrate results with model instances for includes
      const hydratedResults = await this._hydrateResults(model, results, includes);

      return {
        rows: hydratedResults.map(row => ({
          ...row,
          _searchMeta: {
            entityType,
            searchType: 'vector',
            relevanceScore: row.similarity || 0,
            distance: row.distance || 1
          }
        })),
        count: parseInt(countResult[0].count)
      };

    } catch (error) {
      console.error(`Vector search failed for ${entityType}:`, error);
      // Fallback to keyword search
      return this._keywordSearch(entityType, entityConfig, query, organizationId, limit, offset);
    }
  }

  /**
   * Hybrid search combining keyword and vector results
   */
  async _hybridSearch(entityType, entityConfig, query, organizationId, limit, offset) {
    try {
      // Execute both searches in parallel
      const [keywordResults, vectorResults] = await Promise.all([
        this._keywordSearch(entityType, entityConfig, query, organizationId, Math.ceil(limit * 1.5), 0),
        this._vectorSearch(entityType, entityConfig, query, organizationId, Math.ceil(limit * 1.5), 0)
      ]);

      // Combine and deduplicate results
      const combinedResults = this._combineSearchResults(
        keywordResults.rows,
        vectorResults.rows,
        0.6, // keyword weight
        0.4  // vector weight
      );

      // Apply pagination to combined results
      const paginatedResults = combinedResults.slice(offset, offset + limit);

      return {
        rows: paginatedResults.map(row => ({
          ...row,
          _searchMeta: {
            ...row._searchMeta,
            searchType: 'hybrid'
          }
        })),
        count: Math.max(keywordResults.count, vectorResults.count)
      };

    } catch (error) {
      console.error(`Hybrid search failed for ${entityType}:`, error);
      // Fallback to keyword search only
      return this._keywordSearch(entityType, entityConfig, query, organizationId, limit, offset);
    }
  }

  /**
   * Calculate keyword relevance score
   */
  _calculateKeywordRelevance(record, searchFields, query) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    let totalMatches = 0;
    let totalTerms = queryTerms.length * searchFields.length;

    for (const field of searchFields) {
      const fieldValue = (record[field] || '').toLowerCase();
      for (const term of queryTerms) {
        if (fieldValue.includes(term)) {
          totalMatches++;
        }
      }
    }

    return totalMatches / totalTerms;
  }

  /**
   * Combine keyword and vector search results
   */
  _combineSearchResults(keywordResults, vectorResults, keywordWeight, vectorWeight) {
    const resultMap = new Map();

    // Add keyword results
    keywordResults.forEach(result => {
      const id = result.id;
      resultMap.set(id, {
        ...result,
        _searchMeta: {
          ...result._searchMeta,
          combinedScore: result._searchMeta.relevanceScore * keywordWeight,
          keywordScore: result._searchMeta.relevanceScore,
          vectorScore: 0
        }
      });
    });

    // Add or update with vector results
    vectorResults.forEach(result => {
      const id = result.id;
      if (resultMap.has(id)) {
        // Update existing result
        const existing = resultMap.get(id);
        existing._searchMeta.combinedScore += result._searchMeta.relevanceScore * vectorWeight;
        existing._searchMeta.vectorScore = result._searchMeta.relevanceScore;
      } else {
        // Add new result
        resultMap.set(id, {
          ...result,
          _searchMeta: {
            ...result._searchMeta,
            combinedScore: result._searchMeta.relevanceScore * vectorWeight,
            keywordScore: 0,
            vectorScore: result._searchMeta.relevanceScore
          }
        });
      }
    });

    // Convert back to array and sort by combined score
    return Array.from(resultMap.values())
      .sort((a, b) => b._searchMeta.combinedScore - a._searchMeta.combinedScore);
  }

  /**
   * Hydrate raw query results with model associations
   */
  async _hydrateResults(model, rawResults, includes) {
    if (!includes || includes.length === 0) {
      return rawResults;
    }

    const ids = rawResults.map(r => r.id);
    if (ids.length === 0) return rawResults;

    try {
      const hydratedRecords = await model.findAll({
        where: { id: { [Op.in]: ids } },
        include: includes
      });

      // Map hydrated records back to original order with similarity scores
      const recordMap = new Map();
      hydratedRecords.forEach(record => recordMap.set(record.id, record));

      return rawResults.map(rawResult => {
        const hydratedRecord = recordMap.get(rawResult.id);
        if (hydratedRecord) {
          const json = hydratedRecord.toJSON();
          // Preserve similarity scores from raw result
          return {
            ...json,
            similarity: rawResult.similarity,
            distance: rawResult.distance
          };
        }
        return rawResult;
      });

    } catch (error) {
      console.error(`Failed to hydrate results for ${model.name}:`, error);
      // Fallback: return raw results without associations
      console.log(`Falling back to raw results without includes for ${model.name}`);
      return rawResults;
    }
  }

  /**
   * Get search suggestions based on query
   */
  async getSuggestions(query, organizationId, limit = 5) {
    if (!query || query.length < 2) {
      return [];
    }

    const suggestions = [];
    const queryPrefix = `${query}%`;

    // Get suggestions from each entity type
    for (const [entityType, config] of Object.entries(this.searchableEntities)) {
      const { model, searchFields } = config;
      
      for (const field of searchFields.slice(0, 2)) { // Limit to first 2 fields per entity
        try {
          const results = await model.findAll({
            where: {
              organizationId,
              [field]: { [Op.iLike]: queryPrefix }
            },
            attributes: [field],
            limit: 2,
            raw: true
          });

          results.forEach(result => {
            const value = result[field];
            if (value && !suggestions.find(s => s.text === value)) {
              suggestions.push({
                text: value,
                entityType,
                field
              });
            }
          });
        } catch (error) {
          console.error(`Error getting suggestions from ${entityType}.${field}:`, error);
        }
      }
    }

    return suggestions.slice(0, limit);
  }
}

module.exports = new SearchService();