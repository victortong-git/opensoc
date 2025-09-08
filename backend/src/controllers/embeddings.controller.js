const embeddingService = require('../services/embeddingService');
const ragChatService = require('../services/ragChatService');

/**
 * Embeddings Controller
 * Handles API endpoints for text embedding management
 */
class EmbeddingsController {
  
  /**
   * Get embedding status for all tables
   * GET /api/embeddings/status
   */
  async getEmbeddingStatus(req, res) {
    try {
      const { organizationId } = req.user || {};
      
      const status = await embeddingService.getEmbeddingStatus(organizationId);
      
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to get embedding status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve embedding status',
        message: error.message
      });
    }
  }

  /**
   * Get detailed RAG statistics
   * GET /api/embeddings/stats
   */
  async getRAGStats(req, res) {
    try {
      const { organizationId } = req.user || {};
      
      const stats = await ragChatService.getRAGStats(organizationId);
      
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to get RAG stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve RAG statistics',
        message: error.message
      });
    }
  }

  /**
   * Generate embeddings for a specific table
   * POST /api/embeddings/generate
   */
  async generateEmbeddings(req, res) {
    try {
      const { organizationId } = req.user || {};
      const { 
        modelType, 
        batchSize = 50,
        forceUpdate = false 
      } = req.body;

      if (!modelType) {
        return res.status(400).json({
          success: false,
          error: 'Model type is required',
          message: 'Please specify which model type to generate embeddings for (alert, incident, asset, ioc, playbook)'
        });
      }

      const validModelTypes = ['alert', 'incident', 'asset', 'ioc', 'playbook'];
      if (!validModelTypes.includes(modelType.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid model type',
          message: `Model type must be one of: ${validModelTypes.join(', ')}`
        });
      }

      console.log(`🚀 Starting complete embedding generation for ${modelType}...`);
      
      // Start the complete embedding generation process (all records)
      const result = await embeddingService.updateAllEmbeddingsForTable(
        modelType,
        organizationId,
        batchSize
      );

      res.json({
        success: true,
        data: {
          modelType,
          updated: result.updated,
          errors: result.errors,
          totalProcessed: result.totalProcessed,
          batchesProcessed: result.batchesProcessed,
          batchSize,
          organizationId: organizationId || 'all'
        },
        message: result.totalProcessed > 0 
          ? `Successfully processed all ${modelType} records: ${result.updated} updated, ${result.errors} errors`
          : `All ${modelType} records already have embeddings`
      });
    } catch (error) {
      console.error('❌ Failed to generate embeddings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate embeddings',
        message: error.message
      });
    }
  }

  /**
   * Generate embeddings for all tables
   * POST /api/embeddings/generate-all
   */
  async generateAllEmbeddings(req, res) {
    try {
      const { organizationId } = req.user || {};
      const { batchSize = 50 } = req.body;

      const modelTypes = ['alert', 'incident', 'asset', 'ioc', 'playbook'];
      const results = {};
      
      console.log('🚀 Starting complete embedding generation for all model types...');
      
      // Process each model type sequentially to avoid overwhelming the system
      for (const modelType of modelTypes) {
        try {
          console.log(`🔄 Processing all ${modelType}s...`);
          const result = await embeddingService.updateAllEmbeddingsForTable(
            modelType,
            organizationId,
            batchSize
          );
          
          results[modelType] = {
            success: true,
            updated: result.updated,
            errors: result.errors,
            totalProcessed: result.totalProcessed,
            batchesProcessed: result.batchesProcessed
          };
        } catch (error) {
          console.error(`❌ Failed to generate embeddings for ${modelType}:`, error);
          results[modelType] = {
            success: false,
            error: error.message,
            updated: 0,
            errors: 0
          };
        }
      }

      const totalUpdated = Object.values(results)
        .reduce((sum, result) => sum + (result.updated || 0), 0);
      const totalErrors = Object.values(results)
        .reduce((sum, result) => sum + (result.errors || 0), 0);

      console.log(`✅ Batch embedding generation completed: ${totalUpdated} updated, ${totalErrors} errors`);

      res.json({
        success: true,
        data: {
          results,
          summary: {
            totalUpdated,
            totalErrors,
            processedTypes: modelTypes.length
          },
          organizationId: organizationId || 'all'
        },
        message: `Batch embedding generation completed: ${totalUpdated} records updated`
      });
    } catch (error) {
      console.error('❌ Failed to generate all embeddings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate embeddings for all tables',
        message: error.message
      });
    }
  }

  /**
   * Test embedding generation with sample text
   * POST /api/embeddings/test
   */
  async testEmbedding(req, res) {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Text is required',
          message: 'Please provide a text string to generate embedding for'
        });
      }

      if (text.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Text too long',
          message: 'Text must be less than 1000 characters for testing'
        });
      }

      console.log('🧪 Testing embedding generation...');
      const embedding = await embeddingService.generateEmbedding(text);

      res.json({
        success: true,
        data: {
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          textLength: text.length,
          embedding: embedding.slice(0, 10).map(val => parseFloat(val.toFixed(6))), // Show first 10 dimensions
          embeddingDimensions: embedding.length,
          modelInfo: {
            name: embeddingService.modelName,
            initialized: embeddingService.isInitialized
          }
        },
        message: 'Embedding generated successfully'
      });
    } catch (error) {
      console.error('❌ Failed to test embedding:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate test embedding',
        message: error.message
      });
    }
  }

  /**
   * Search for similar content using embeddings
   * POST /api/embeddings/search
   */
  async semanticSearch(req, res) {
    try {
      const { organizationId } = req.user || {};
      const {
        query,
        dataSources = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
        maxResults = 10,
        similarityThreshold = 0.7
      } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query is required',
          message: 'Please provide a search query string'
        });
      }

      console.log(`🔍 Performing semantic search: "${query.substring(0, 50)}..."`);
      
      const searchResults = await ragChatService.semanticSearch(query, {
        dataSources,
        organizationId,
        maxResults,
        similarityThreshold
      });

      res.json({
        success: true,
        data: {
          query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
          results: searchResults.map(result => ({
            id: result.id,
            type: result.type,
            similarity: parseFloat(result.similarity.toFixed(4)),
            data: result.data
          })),
          searchParams: {
            dataSources,
            maxResults,
            similarityThreshold,
            organizationId: organizationId || 'all'
          }
        },
        message: `Found ${searchResults.length} relevant items`
      });
    } catch (error) {
      console.error('❌ Semantic search failed:', error);
      res.status(500).json({
        success: false,
        error: 'Semantic search failed',
        message: error.message
      });
    }
  }

  /**
   * Initialize embedding model
   * POST /api/embeddings/initialize
   */
  async initializeModel(req, res) {
    try {
      console.log('🤖 Initializing embedding model...');
      await embeddingService.initialize();
      
      res.json({
        success: true,
        data: {
          modelName: embeddingService.modelName,
          dimensions: embeddingService.embeddingDimensions,
          initialized: embeddingService.isInitialized
        },
        message: 'Embedding model initialized successfully'
      });
    } catch (error) {
      console.error('❌ Failed to initialize model:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initialize embedding model',
        message: error.message
      });
    }
  }
}

module.exports = new EmbeddingsController();