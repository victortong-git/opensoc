/**
 * Enhanced stub for embedding service with text-based semantic similarity
 * Provides more realistic similarity scores than pure random values
 */
class EmbeddingService {
  constructor() {
    this.modelName = 'Enhanced-Text-Stub';
    this.embeddingDimensions = 384;
    this.isInitialized = false;
    this.textCache = new Map(); // Cache for text content to improve similarity calculations
  }

  async initialize() {
    console.log('🔧 Using enhanced embedding service stub with text-based similarity');
    this.isInitialized = true;
  }

  /**
   * Generate a text-based embedding that encodes semantic information
   */
  async generateEmbedding(text) {
    await this.initialize();
    console.log('🔧 Enhanced stub: generateEmbedding for:', text.substring(0, 50) + '...');
    
    // Create a deterministic embedding based on text content
    const embedding = this.createTextBasedEmbedding(text);
    
    // Cache the text content for later similarity calculations
    const textHash = this.hashText(text);
    this.textCache.set(textHash, text.toLowerCase());
    
    return embedding;
  }

  /**
   * Create a deterministic embedding based on text characteristics
   */
  createTextBasedEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    // Use word characteristics to create semi-realistic embeddings
    for (let i = 0; i < words.length && i < 100; i++) {
      const word = words[i];
      const wordHash = this.simpleHash(word);
      
      // Distribute word influence across the embedding
      for (let dim = 0; dim < 384; dim++) {
        const influence = Math.sin(wordHash + dim) * 0.1;
        embedding[dim] += influence;
      }
    }
    
    // Add some text length and keyword-based features
    embedding[0] += Math.log(text.length + 1) * 0.01; // Text length feature
    embedding[1] += words.length * 0.01; // Word count feature
    
    // Add keyword-based features
    const securityKeywords = ['alert', 'incident', 'threat', 'vulnerability', 'security', 'malware', 'attack'];
    const keywordCount = securityKeywords.filter(keyword => text.toLowerCase().includes(keyword)).length;
    embedding[2] += keywordCount * 0.1; // Security context feature
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }

  /**
   * Simple hash function for text
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Create a hash for caching text content
   */
  hashText(text) {
    return this.simpleHash(text.toLowerCase().trim()).toString();
  }

  async generateBatchEmbeddings(texts) {
    console.log('🔧 Enhanced stub: generateBatchEmbeddings for', texts.length, 'texts');
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }

  extractTextForEmbedding(record, modelType) {
    switch (modelType.toLowerCase()) {
      case 'alert':
        return [record.title, record.description, record.sourceSystem].filter(Boolean).join(' ');
      case 'incident':
        return [record.title, record.description, record.category].filter(Boolean).join(' ');
      case 'asset':
        return [record.name, record.description, record.assetType].filter(Boolean).join(' ');
      case 'ioc':
        return [record.value, record.description, record.type].filter(Boolean).join(' ');
      case 'playbook':
        return [record.name, record.description, record.category].filter(Boolean).join(' ');
      default:
        return 'No text available';
    }
  }

  async updateEmbeddingsForTable(modelType, organizationId = null, batchSize = 50) {
    console.log('⚠️ Stub: updateEmbeddingsForTable called for:', modelType, 'with real database operations');
    
    // Import models and Sequelize operators
    const { Op } = require('sequelize');
    const Alert = require('../database/models/Alert');
    const Incident = require('../database/models/Incident');
    const Asset = require('../database/models/Asset');
    const IOC = require('../database/models/IOC');
    const Playbook = require('../database/models/Playbook');
    
    const models = {
      'alert': Alert,
      'incident': Incident,
      'asset': Asset,
      'ioc': IOC,
      'playbook': Playbook
    };
    
    const Model = models[modelType.toLowerCase()];
    if (!Model) {
      throw new Error(`Unknown model type: ${modelType}`);
    }

    try {
      // Find records without embeddings
      const whereClause = {
        embedding: { [Op.is]: null }
      };
      
      if (organizationId) {
        whereClause.organizationId = organizationId;
      }

      // Get records that need embedding
      const recordsToProcess = await Model.findAll({
        where: whereClause,
        limit: batchSize,
        order: [['createdAt', 'ASC']]
      });

      console.log(`Found ${recordsToProcess.length} ${modelType} records to process`);

      let updated = 0;
      let errors = 0;

      // Process each record
      for (const record of recordsToProcess) {
        try {
          // Extract text content from the record
          const text = this.extractTextForEmbedding(record, modelType);
          
          if (!text || text.trim().length === 0) {
            console.warn(`⚠️ No text content for ${modelType} ${record.id}, skipping`);
            continue;
          }
          
          // Generate enhanced text-based embedding
          const embedding = await this.generateEmbedding(text);
          
          // Update the record with the embedding
          await record.update({ 
            embedding: `[${embedding.join(',')}]` 
          });
          
          updated++;
          console.log(`✅ Generated enhanced embedding for ${modelType} ${record.id}`);
        } catch (error) {
          console.error(`❌ Error updating ${modelType} ${record.id}:`, error);
          errors++;
        }
      }

      console.log(`⚠️ Stub: Updated ${updated} ${modelType} records with stub embeddings`);
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { updated, errors };
      
    } catch (error) {
      console.error(`❌ Error in updateEmbeddingsForTable for ${modelType}:`, error);
      return { updated: 0, errors: 1 };
    }
  }

  async getEmbeddingStatus(organizationId = null) {
    console.log('⚠️ Stub: getEmbeddingStatus called - using real database counts');
    
    // Import models for real database queries
    const { Op } = require('sequelize');
    const Alert = require('../database/models/Alert');
    const Incident = require('../database/models/Incident');
    const Asset = require('../database/models/Asset');
    const IOC = require('../database/models/IOC');
    const Playbook = require('../database/models/Playbook');
    
    const models = {
      'alerts': Alert,
      'incidents': Incident,
      'assets': Asset,
      'iocs': IOC,
      'playbooks': Playbook
    };

    const status = {};
    
    for (const [tableName, Model] of Object.entries(models)) {
      try {
        const whereClause = organizationId ? { organizationId } : {};
        
        const [total, embedded] = await Promise.all([
          Model.count({ where: whereClause }),
          Model.count({ 
            where: {
              ...whereClause,
              embedding: { [Op.not]: null }
            }
          })
        ]);

        status[tableName] = {
          total,
          embedded,
          pending: total - embedded,
          percentage: total > 0 ? Math.round((embedded / total) * 100) : 0
        };
      } catch (error) {
        console.error(`Error getting status for ${tableName}:`, error);
        status[tableName] = { total: 0, embedded: 0, pending: 0, percentage: 0 };
      }
    }

    return status;
  }

  /**
   * Enhanced cosine similarity calculation using actual vector math
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    
    // Clamp similarity to reasonable range and add small random variation
    const clampedSimilarity = Math.max(0, Math.min(1, similarity));
    return clampedSimilarity;
  }
}

const embeddingService = new EmbeddingService();
module.exports = embeddingService;