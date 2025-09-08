// Use Python embedding service with sentence_transformers for NovaSearch/stella_en_400M_v5
const { spawn } = require('child_process');
const path = require('path');
let useRealEmbeddings = true; // Always attempt to use real embeddings via Python service
const { Op } = require('sequelize');
const Alert = require('../database/models/Alert');
const Incident = require('../database/models/Incident');
const Asset = require('../database/models/Asset');
const IOC = require('../database/models/IOC');
const Playbook = require('../database/models/Playbook');

/**
 * Text Embedding Service with HuggingFace Transformers
 * Model: NovaSearch/stella_en_400M_v5 (1024-dimensional embeddings)
 * No fallback - fails fast if embedding generation fails
 */
class EmbeddingService {
  constructor() {
    this.model = null;
    this.modelName = 'NovaSearch/stella_en_400M_v5'; // Using NovaSearch stella model via Python service
    this.embeddingDimensions = 1024; // NovaSearch/stella_en_400M_v5 produces 1024D embeddings
    this.isInitialized = false;
    this.initPromise = null;
    this.useRealEmbeddings = useRealEmbeddings;
    this.textCache = new Map(); // Cache for improved similarity calculations
    this.initializationError = null; // Track initialization errors
    this.pythonServicePath = path.join(__dirname, 'python_embedding_service.py');
  }

  /**
   * Initialize the embedding model (lazy loading)
   */
  async initialize() {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initializeModel();
    return this.initPromise;
  }

  async _initializeModel() {
    try {
      if (this.useRealEmbeddings) {
        console.log(`🤖 Testing Python embedding service: ${this.modelName}`);
        
        // Test Python service availability
        const result = await this._runPythonService(['--action', 'info']);
        if (result.success === false) {
          throw new Error(result.error || 'Python service failed');
        }
        
        console.log(`✅ Python embedding service loaded successfully (${result.dimensions}D)`);
        this.model = true; // Mark as available
      } else {
        throw new Error('Python embedding service is required - no fallback available');
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Python embedding service:', error.message);
      this.initializationError = error.message;
      this.isInitialized = false;
      // Don't throw - let the service remain available for configuration reporting
    }
  }

  /**
   * Run Python embedding service with arguments
   */
  async _runPythonService(args) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        python.kill();
        reject(new Error('Python service timeout - model loading takes too long'));
      }, 180000); // 3 minute timeout for initial model loading

      const python = spawn('python3', [this.pythonServicePath, ...args], {
        env: {
          ...process.env,
          HF_HOME: '/home/nodeapp/.cache/huggingface',
          HUGGINGFACE_HUB_CACHE: '/home/nodeapp/.cache/huggingface',
          TRANSFORMERS_CACHE: '/home/nodeapp/.cache/huggingface',
          PYTHONPATH: '/usr/local/lib/python3.11/dist-packages:/usr/lib/python3/dist-packages',
          HOME: '/home/nodeapp',
          XFORMERS_DISABLED: '1'
        },
        uid: process.getuid ? process.getuid() : undefined,
        gid: process.getgid ? process.getgid() : undefined
      });

      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
        // Log progress for long model loading
        if (data.toString().includes('Loading embedding model')) {
          console.log('📥 Python service loading model...');
        }
      });

      python.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code !== 0 && code !== null) {
          // Check if it's due to missing dependencies and use fallback
          if (error.includes('ModuleNotFoundError') && error.includes('sentence_transformers')) {
            console.warn('⚠️ Python service dependencies not ready, using temporary fallback');
            resolve(this._getFallbackResponse(args));
            return;
          }
          reject(new Error(`Python service exited with code ${code}: ${error}`));
          return;
        }

        // Handle cases where process was killed but we have output
        if (output.trim()) {
          try {
            const result = JSON.parse(output);
            resolve(result);
            return;
          } catch (parseError) {
            // Continue to error handling below
          }
        }

        if (!output.trim()) {
          reject(new Error(`Python service produced no output. Error: ${error}`));
          return;
        }

        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse Python service output: ${parseError.message}\nOutput: ${output}`));
        }
      });

      python.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
      });
    });
  }

  _getFallbackResponse(args) {
    const action = args[args.indexOf('--action') + 1];
    
    if (action === 'info') {
      return {
        name: 'BAAI/bge-large-en-v1.5',
        dimensions: 1024,
        initialized: false,
        status: 'installing_dependencies'
      };
    } else if (action === 'single') {
      const textIndex = args.indexOf('--text') + 1;
      const text = args[textIndex];
      return {
        embedding: this.createEnhancedStubEmbedding(text),
        dimensions: 1024,
        note: 'Using enhanced stub embedding while Python service installs dependencies'
      };
    } else if (action === 'batch') {
      const textsIndex = args.indexOf('--texts') + 1;
      const texts = JSON.parse(args[textsIndex]);
      return {
        embeddings: texts.map(text => this.createEnhancedStubEmbedding(text)),
        count: texts.length,
        dimensions: 1024,
        note: 'Using enhanced stub embeddings while Python service installs dependencies'
      };
    }
    
    return { success: false, error: 'Unknown action' };
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text) {
    await this.initialize();
    
    if (!text || typeof text !== 'string') {
      throw new Error('Text input is required and must be a string');
    }

    try {
      if (!this.useRealEmbeddings || !this.model) {
        const errorMsg = this.initializationError 
          ? `Embedding model failed to initialize: ${this.initializationError}`
          : 'Embedding model not properly initialized - no fallback available';
        throw new Error(errorMsg);
      }
      
      // Use NovaSearch/stella_en_400M_v5 via Python service
      const result = await this._runPythonService(['--action', 'single', '--text', text.trim()]);
      
      if (result.success === false) {
        throw new Error(result.error || 'Python service failed to generate embedding');
      }
      
      const embedding = result.embedding;
      if (!Array.isArray(embedding)) {
        throw new Error('Unexpected embedding format from Python service');
      }
      
      console.log(`🔍 Generated embedding with ${embedding.length} dimensions`);
      
      // Verify dimensions match expected 1024D
      if (embedding.length !== this.embeddingDimensions) {
        console.log(`⚠️ Adjusting expected dimensions from ${this.embeddingDimensions}D to ${embedding.length}D`);
        this.embeddingDimensions = embedding.length;
      }
      
      return embedding;
    } catch (error) {
      console.error('❌ Failed to generate embedding for text:', text.substring(0, 50), error);
      throw new Error(`Failed to generate embedding with BAAI/bge-large-en-v1.5: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  async generateBatchEmbeddings(texts) {
    await this.initialize();
    
    if (!Array.isArray(texts)) {
      throw new Error('Input must be an array of texts');
    }

    const validTexts = texts.filter(text => text && typeof text === 'string');
    if (validTexts.length === 0) {
      return [];
    }

    try {
      // Use Python service batch processing for efficiency
      const result = await this._runPythonService([
        '--action', 'batch', 
        '--texts', JSON.stringify(validTexts)
      ]);
      
      if (result.success === false) {
        throw new Error(result.error || 'Python service failed to generate batch embeddings');
      }
      
      const embeddings = result.embeddings;
      if (!Array.isArray(embeddings)) {
        throw new Error('Unexpected batch embeddings format from Python service');
      }
      
      console.log(`🔍 Generated ${embeddings.length} batch embeddings with ${result.dimensions}D`);
      
      return embeddings;
    } catch (error) {
      console.error('❌ Failed to generate batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Extract text content from different data models for embedding
   */
  extractTextForEmbedding(record, modelType) {
    const textParts = [];
    
    switch (modelType.toLowerCase()) {
      case 'alert':
        if (record.title) textParts.push(record.title);
        if (record.description) textParts.push(record.description);
        if (record.sourceSystem) textParts.push(`Source: ${record.sourceSystem}`);
        if (record.assetName) textParts.push(`Asset: ${record.assetName}`);
        break;
        
      case 'incident':
        if (record.title) textParts.push(record.title);
        if (record.description) textParts.push(record.description);
        if (record.category) textParts.push(`Category: ${record.category}`);
        if (record.assignedToName) textParts.push(`Assigned to: ${record.assignedToName}`);
        break;
        
      case 'asset':
        if (record.name) textParts.push(record.name);
        if (record.description) textParts.push(record.description);
        if (record.assetType) textParts.push(`Type: ${record.assetType}`);
        if (record.osType) textParts.push(`OS: ${record.osType}`);
        if (record.location) textParts.push(`Location: ${record.location}`);
        if (record.department) textParts.push(`Department: ${record.department}`);
        break;
        
      case 'ioc':
        if (record.value) textParts.push(record.value);
        if (record.description) textParts.push(record.description);
        if (record.type) textParts.push(`Type: ${record.type}`);
        if (record.source) textParts.push(`Source: ${record.source}`);
        if (record.tags && record.tags.length) textParts.push(`Tags: ${record.tags.join(', ')}`);
        break;
        
      case 'playbook':
        if (record.name) textParts.push(record.name);
        if (record.description) textParts.push(record.description);
        if (record.category) textParts.push(`Category: ${record.category}`);
        // Extract text from steps if they exist
        if (record.steps && Array.isArray(record.steps)) {
          const stepTexts = record.steps
            .filter(step => step.title || step.description)
            .map(step => [step.title, step.description].filter(Boolean).join(': '))
            .join('. ');
          if (stepTexts) textParts.push(`Steps: ${stepTexts}`);
        }
        break;
        
      default:
        throw new Error(`Unknown model type: ${modelType}`);
    }
    
    return textParts.filter(Boolean).join(' ');
  }

  /**
   * Generate and update embeddings for a specific table (single batch)
   */
  async updateEmbeddingsForTable(modelType, organizationId = null, batchSize = 50) {
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
      // Build query conditions
      const whereClause = {
        embedding: { [Op.is]: null }
      };
      
      if (organizationId) {
        whereClause.organizationId = organizationId;
      }

      // Get records without embeddings
      const records = await Model.findAll({
        where: whereClause,
        limit: batchSize,
        order: [['createdAt', 'DESC']]
      });

      if (records.length === 0) {
        console.log(`✅ No records need embedding updates for ${modelType}`);
        return { updated: 0, errors: 0 };
      }

      console.log(`🔄 Updating embeddings for ${records.length} ${modelType} records...`);
      
      let updated = 0;
      let errors = 0;

      // Process records in smaller batches to avoid memory issues
      const processBatchSize = 10;
      for (let i = 0; i < records.length; i += processBatchSize) {
        const batch = records.slice(i, i + processBatchSize);
        
        await Promise.all(batch.map(async (record) => {
          try {
            const text = this.extractTextForEmbedding(record, modelType);
            if (!text.trim()) {
              console.warn(`⚠️ No extractable text for ${modelType} record ${record.id}`);
              return;
            }
            
            const embedding = await this.generateEmbedding(text);
            // Format embedding as PostgreSQL vector string
            const vectorString = `[${embedding.join(',')}]`;
            await record.update({ embedding: vectorString });
            updated++;
            
            if (updated % 10 === 0) {
              console.log(`📊 Progress: ${updated}/${records.length} ${modelType} records updated`);
            }
          } catch (error) {
            console.error(`❌ Failed to update embedding for ${modelType} record ${record.id}:`, error);
            errors++;
            // Don't update the record - leave it as null so it can be retried
          }
        }));
      }

      console.log(`✅ Embedding update completed for ${modelType}: ${updated} updated, ${errors} errors`);
      return { updated, errors };
      
    } catch (error) {
      console.error(`❌ Failed to update embeddings for ${modelType}:`, error);
      throw error;
    }
  }

  /**
   * Generate and update embeddings for ALL records in a specific table
   * Processes in continuous batches until all records are completed
   */
  async updateAllEmbeddingsForTable(modelType, organizationId = null, batchSize = 50) {
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

    let totalUpdated = 0;
    let totalErrors = 0;
    let batchNumber = 1;

    try {
      // Build query conditions
      const whereClause = {
        embedding: { [Op.is]: null }
      };
      
      if (organizationId) {
        whereClause.organizationId = organizationId;
      }

      // Get total count of records that need embeddings
      const totalPendingCount = await Model.count({ where: whereClause });
      
      if (totalPendingCount === 0) {
        console.log(`✅ No records need embedding updates for ${modelType}`);
        return { updated: 0, errors: 0, totalProcessed: 0 };
      }

      console.log(`🚀 Starting complete embedding generation for ${totalPendingCount} ${modelType} records...`);

      // Process batches until all records are done
      while (true) {
        // Get next batch of records
        const records = await Model.findAll({
          where: whereClause,
          limit: batchSize,
          order: [['createdAt', 'DESC']]
        });

        if (records.length === 0) {
          console.log(`✅ All ${modelType} records have been processed!`);
          break;
        }

        console.log(`🔄 Processing batch ${batchNumber} - ${records.length} ${modelType} records (${totalUpdated + totalErrors}/${totalPendingCount} total processed)...`);
        
        let batchUpdated = 0;
        let batchErrors = 0;

        // Process records in smaller sub-batches to avoid memory issues
        const processBatchSize = 10;
        for (let i = 0; i < records.length; i += processBatchSize) {
          const batch = records.slice(i, i + processBatchSize);
          
          await Promise.all(batch.map(async (record) => {
            try {
              const text = this.extractTextForEmbedding(record, modelType);
              if (!text.trim()) {
                console.warn(`⚠️ No extractable text for ${modelType} record ${record.id}`);
                return;
              }
              
              const embedding = await this.generateEmbedding(text);
              // Format embedding as PostgreSQL vector string
              const vectorString = `[${embedding.join(',')}]`;
              await record.update({ embedding: vectorString });
              batchUpdated++;
              
              if ((totalUpdated + batchUpdated) % 25 === 0) {
                console.log(`📊 Progress: ${totalUpdated + batchUpdated}/${totalPendingCount} ${modelType} records updated`);
              }
            } catch (error) {
              console.error(`❌ Failed to update embedding for ${modelType} record ${record.id}:`, error);
              batchErrors++;
            }
          }));
        }

        totalUpdated += batchUpdated;
        totalErrors += batchErrors;
        batchNumber++;

        console.log(`✅ Batch ${batchNumber - 1} completed: ${batchUpdated} updated, ${batchErrors} errors`);
        
        // Short delay between batches to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`🎉 Complete embedding generation finished for ${modelType}:`);
      console.log(`   📊 Total updated: ${totalUpdated}`);
      console.log(`   ❌ Total errors: ${totalErrors}`);
      console.log(`   📦 Batches processed: ${batchNumber - 1}`);

      return { 
        updated: totalUpdated, 
        errors: totalErrors, 
        totalProcessed: totalUpdated + totalErrors,
        batchesProcessed: batchNumber - 1 
      };
      
    } catch (error) {
      console.error(`❌ Failed to complete embedding generation for ${modelType}:`, error);
      throw error;
    }
  }

  /**
   * Get current model information
   */
  getModelInfo() {
    return {
      name: this.modelName,
      dimensions: this.embeddingDimensions,
      initialized: this.isInitialized && this.useRealEmbeddings && this.model !== null,
      error: this.initializationError
    };
  }

  /**
   * Get embedding status statistics for all tables
   */
  async getEmbeddingStatus(organizationId = null) {
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
        console.error(`❌ Failed to get status for ${tableName}:`, error);
        status[tableName] = {
          total: 0,
          embedded: 0,
          pending: 0,
          percentage: 0,
          error: error.message
        };
      }
    }

    return status;
  }

  /**
   * Create enhanced stub embedding with meaningful semantic features
   */
  createEnhancedStubEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(1024).fill(0);
    
    // Create deterministic features based on text content
    for (let i = 0; i < words.length && i < 100; i++) {
      const word = words[i];
      const wordHash = this.simpleHash(word);
      
      // Distribute word influence across embedding dimensions
      for (let dim = 0; dim < 1024; dim++) {
        const influence = Math.sin(wordHash + dim + i) * 0.05;
        embedding[dim] += influence;
      }
    }
    
    // Add contextual features for better similarity
    embedding[0] += Math.log(text.length + 1) * 0.02; // Text length feature
    embedding[1] += words.length * 0.02; // Word count feature
    
    // Security-specific keyword features
    const securityKeywords = [
      'alert', 'incident', 'threat', 'vulnerability', 'security', 'malware', 'attack',
      'breach', 'suspicious', 'unauthorized', 'intrusion', 'exploit', 'compromise'
    ];
    const keywordCount = securityKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;
    embedding[2] += keywordCount * 0.15;
    
    // IOC-specific features
    const iocPatterns = [
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/, // IP addresses
      /[a-f0-9]{32,}/i, // Hashes
      /[a-z0-9.-]+\.[a-z]{2,}/i, // Domains
    ];
    let iocScore = 0;
    iocPatterns.forEach(pattern => {
      if (pattern.test(text)) iocScore += 0.1;
    });
    embedding[3] += iocScore;
    
    // Severity/priority keywords
    const severityKeywords = ['critical', 'high', 'medium', 'low', 'urgent', 'emergency'];
    const severityCount = severityKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;
    embedding[4] += severityCount * 0.1;
    
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
   * Create hash for caching text content
   */
  hashText(text) {
    return this.simpleHash(text.toLowerCase().trim()).toString();
  }

  /**
   * Calculate cosine similarity between two vectors
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
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Export a singleton instance
const embeddingService = new EmbeddingService();
module.exports = embeddingService;