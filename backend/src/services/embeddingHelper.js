const embeddingService = require('./embeddingService');
const { models } = require('../database/models');

/**
 * Embedding Helper Service
 * Handles automatic embedding generation for records after creation/update
 * Uses fire-and-forget pattern to avoid blocking main operations
 */
class EmbeddingHelper {
  constructor() {
    this.pendingQueue = new Map(); // Simple in-memory queue
    this.processingQueue = false;
    this.batchSize = 5;
    this.batchDelay = 2000; // 2 seconds delay between batches
  }

  /**
   * Trigger embedding generation for a record
   * Uses fire-and-forget pattern - doesn't block the caller
   */
  async triggerEmbeddingForRecord(modelType, recordId, action = 'create') {
    try {
      // Skip embedding for test data to avoid issues
      if (process.env.NODE_ENV === 'test') {
        console.log(`⏭️ Skipping embedding generation for test environment`);
        return;
      }

      // Validate model type
      const validTypes = ['alert', 'incident', 'asset', 'ioc', 'playbook'];
      if (!validTypes.includes(modelType.toLowerCase())) {
        console.warn(`⚠️ Invalid model type for embedding: ${modelType}`);
        return;
      }

      // Add to queue for background processing
      const queueKey = `${modelType.toLowerCase()}-${recordId}`;
      this.pendingQueue.set(queueKey, {
        modelType: modelType.toLowerCase(),
        recordId,
        action,
        timestamp: new Date()
      });

      console.log(`📋 Queued embedding generation for ${modelType} record ${recordId} (${action})`);

      // Start processing if not already running
      if (!this.processingQueue) {
        // Use setTimeout to make it truly fire-and-forget
        setTimeout(() => this.processEmbeddingQueue(), 0);
      }
    } catch (error) {
      // Log error but don't throw - embedding failures shouldn't block main operations
      console.error(`❌ Failed to queue embedding for ${modelType} record ${recordId}:`, error);
    }
  }

  /**
   * Background processor for embedding queue
   * Processes embeddings in batches to avoid overwhelming the service
   */
  async processEmbeddingQueue() {
    if (this.processingQueue) return;

    this.processingQueue = true;
    console.log(`🔄 Starting embedding queue processor...`);

    try {
      while (this.pendingQueue.size > 0) {
        const batch = [];
        const queueEntries = Array.from(this.pendingQueue.entries());
        
        // Take up to batchSize items from queue
        for (let i = 0; i < Math.min(this.batchSize, queueEntries.length); i++) {
          const [key, item] = queueEntries[i];
          batch.push({ key, ...item });
          this.pendingQueue.delete(key);
        }

        console.log(`📦 Processing embedding batch of ${batch.length} items...`);

        // Process batch in parallel
        await Promise.allSettled(
          batch.map(item => this.generateEmbeddingForRecord(item))
        );

        // Delay between batches if there are more items
        if (this.pendingQueue.size > 0) {
          console.log(`⏳ Waiting ${this.batchDelay}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, this.batchDelay));
        }
      }

      console.log(`✅ Embedding queue processing completed`);
    } catch (error) {
      console.error(`❌ Error in embedding queue processor:`, error);
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Generate embedding for a specific record
   */
  async generateEmbeddingForRecord(queueItem) {
    const { modelType, recordId, action } = queueItem;
    
    try {
      // Get the model class
      const models_map = {
        'alert': models.Alert,
        'incident': models.Incident,
        'asset': models.Asset,
        'ioc': models.IOC,
        'playbook': models.Playbook
      };

      const Model = models_map[modelType];
      if (!Model) {
        throw new Error(`Unknown model type: ${modelType}`);
      }

      // Find the record
      const record = await Model.findByPk(recordId);
      if (!record) {
        console.warn(`⚠️ Record ${modelType}:${recordId} not found for embedding generation`);
        return;
      }

      // Skip if already has embedding and this is a create action
      if (action === 'create' && record.embedding) {
        console.log(`⏭️ Skipping ${modelType}:${recordId} - already has embedding`);
        return;
      }

      // Extract text content for embedding
      const text = embeddingService.extractTextForEmbedding(record, modelType);
      if (!text || !text.trim()) {
        console.warn(`⚠️ No extractable text for ${modelType} record ${recordId}`);
        return;
      }

      // Generate embedding
      console.log(`🔍 Generating embedding for ${modelType} record ${recordId}...`);
      const embedding = await embeddingService.generateEmbedding(text);
      
      // Format for PostgreSQL pgvector extension
      // Use raw array format instead of string to avoid parsing issues
      const vectorArray = embedding;
      
      // Update record with embedding - let Sequelize handle the proper formatting
      await record.update({ embedding: vectorArray });
      
      console.log(`✅ Successfully generated embedding for ${modelType} record ${recordId} (${action})`);
      
    } catch (error) {
      console.error(`❌ Failed to generate embedding for ${modelType} record ${recordId}:`, error);
      
      // For test data specifically, we'll disable embedding to prevent blocking
      if (record && record.isTestData) {
        console.log(`⏭️ Skipping embedding for test data record ${modelType}:${recordId}`);
        return;
      }
      // Don't rethrow - log error and continue with other items
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return {
      pendingCount: this.pendingQueue.size,
      isProcessing: this.processingQueue,
      batchSize: this.batchSize,
      batchDelay: this.batchDelay
    };
  }

  /**
   * Clear the queue (for testing or emergency purposes)
   */
  clearQueue() {
    this.pendingQueue.clear();
    console.log(`🧹 Embedding queue cleared`);
  }
}

// Export singleton instance
const embeddingHelper = new EmbeddingHelper();
module.exports = embeddingHelper;