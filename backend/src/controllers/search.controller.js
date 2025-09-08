const { asyncHandler, ValidationError } = require('../middleware/error.middleware');
const searchService = require('../services/searchService');

/**
 * Global search across all SOC entities
 * POST /api/search
 */
const search = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    query,
    searchType = 'hybrid',
    entities = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
    limit = 10,
    offset = 0
  } = req.body;

  // Validate request
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new ValidationError('Search query is required');
  }

  if (query.length > 500) {
    throw new ValidationError('Search query must be 500 characters or less');
  }

  const validSearchTypes = ['keyword', 'vector', 'hybrid'];
  if (!validSearchTypes.includes(searchType)) {
    throw new ValidationError(`Search type must be one of: ${validSearchTypes.join(', ')}`);
  }

  const validEntities = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'];
  const filteredEntities = Array.isArray(entities) 
    ? entities.filter(e => validEntities.includes(e))
    : validEntities;

  if (filteredEntities.length === 0) {
    throw new ValidationError(`Entities must include at least one of: ${validEntities.join(', ')}`);
  }

  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const offsetNum = Math.max(0, parseInt(offset) || 0);

  try {
    // Perform search
    const searchResults = await searchService.search({
      query: query.trim(),
      searchType,
      entities: filteredEntities,
      organizationId,
      limit: limitNum,
      offset: offsetNum
    });

    // Transform results for response
    const transformedResults = {};
    let totalItems = 0;

    for (const [entityType, entityResults] of Object.entries(searchResults.results)) {
      transformedResults[entityType] = {
        items: entityResults.rows.map(item => ({
          id: item.id,
          entityType,
          title: item.title || item.name || item.value || 'Untitled',
          description: item.description || '',
          status: item.status || null,
          severity: item.severity || null,
          type: item.type || null,
          category: item.category || null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          searchMeta: item._searchMeta,
          // Entity-specific fields
          ...(entityType === 'alerts' && {
            sourceSystem: item.sourceSystem,
            assetName: item.assetName,
            asset: item.asset
          }),
          ...(entityType === 'incidents' && {
            assignedUser: item.assignedUser,
            primaryAsset: item.primaryAsset
          }),
          ...(entityType === 'assets' && {
            ipAddress: item.ipAddress,
            hostname: item.hostname
          }),
          ...(entityType === 'iocs' && {
            tags: item.tags,
            confidence: item.confidence
          }),
          ...(entityType === 'playbooks' && {
            creator: item.creator
          })
        })),
        count: entityResults.count,
        hasMore: (offsetNum + limitNum) < entityResults.count
      };
      totalItems += entityResults.count;
    }

    res.json({
      success: true,
      data: {
        results: transformedResults,
        query: searchResults.query,
        searchType: searchResults.searchType,
        entities: searchResults.entities,
        totalItems,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          hasMore: Object.values(transformedResults).some(r => r.hasMore)
        }
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Search operation failed. Please try again.');
  }
});

/**
 * Get search suggestions for autocomplete
 * GET /api/search/suggestions
 */
const getSuggestions = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { q: query, limit = 5 } = req.query;

  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.json({
      success: true,
      data: {
        suggestions: []
      }
    });
  }

  const limitNum = Math.max(1, Math.min(20, parseInt(limit) || 5));

  try {
    const suggestions = await searchService.getSuggestions(
      query.trim(),
      organizationId,
      limitNum
    );

    res.json({
      success: true,
      data: {
        suggestions: suggestions.map(suggestion => ({
          text: suggestion.text,
          entityType: suggestion.entityType,
          field: suggestion.field
        }))
      }
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.json({
      success: true,
      data: {
        suggestions: []
      }
    });
  }
});

/**
 * Quick search for navbar (lighter version)
 * GET /api/search/quick
 */
const quickSearch = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { 
    q: query,
    type: searchType = 'hybrid',
    limit = 5
  } = req.query;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.json({
      success: true,
      data: {
        results: {},
        totalItems: 0
      }
    });
  }

  const limitNum = Math.max(1, Math.min(10, parseInt(limit) || 5));

  try {
    // Quick search with reduced limit per entity
    const searchResults = await searchService.search({
      query: query.trim(),
      searchType,
      entities: ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
      organizationId,
      limit: limitNum,
      offset: 0
    });

    // Simplified response for quick search
    const quickResults = {};
    let totalItems = 0;

    for (const [entityType, entityResults] of Object.entries(searchResults.results)) {
      if (entityResults.rows.length > 0) {
        quickResults[entityType] = entityResults.rows.slice(0, 3).map(item => ({
          id: item.id,
          entityType,
          title: item.title || item.name || item.value || 'Untitled',
          description: (item.description || '').substring(0, 100),
          status: item.status || null,
          severity: item.severity || null,
          relevanceScore: item._searchMeta?.relevanceScore || 0
        }));
        totalItems += entityResults.rows.length;
      }
    }

    res.json({
      success: true,
      data: {
        results: quickResults,
        query: query.trim(),
        searchType,
        totalItems,
        hasMore: totalItems >= limitNum
      }
    });

  } catch (error) {
    console.error('Quick search error:', error);
    res.json({
      success: true,
      data: {
        results: {},
        totalItems: 0
      }
    });
  }
});

module.exports = {
  search,
  getSuggestions,
  quickSearch
};