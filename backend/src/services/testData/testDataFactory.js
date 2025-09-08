const DataGenerators = require('../ai/dataGenerators');
const GenerationLogger = require('../ai/generationLogger');
const RecordCreator = require('./recordCreator');

class TestDataFactory {
  constructor() {
    this.dataGenerators = new DataGenerators();
    this.logger = new GenerationLogger();
    this.recordCreator = new RecordCreator();
  }

  /**
   * Generate and create test data with comprehensive logging
   */
  async generateAndCreateTestData(config, user) {
    const { dataType, quantity, organizationId } = config;
    let logId = null;
    let aiMetadata = null;
    let generatedData = [];
    let createdIds = [];
    
    console.log(`🚀 Starting AI test data generation: ${dataType} x${quantity}`);

    try {
      // Step 1: Log generation start
      const startLog = await this.logger.logGenerationStart(
        user.id, 
        organizationId, 
        dataType, 
        config
      );
      logId = startLog?.id;

      // Step 2: Generate AI data
      console.log(`🤖 Generating AI data for ${dataType}...`);
      
      
      const generationResult = await this.generateData(dataType, config);
      generatedData = generationResult.data;
      aiMetadata = generationResult.metadata;

      if (!generatedData || generatedData.length === 0) {
        throw new Error('AI generation returned no data');
      }

      console.log(`✅ AI generated ${generatedData.length} ${dataType} records`);

      // Step 3: Log AI response
      if (logId) {
        const actualPrompt = this.getLastPrompt(dataType, config);
        
        await this.logger.logAIResponse(
          logId,
          actualPrompt,
          JSON.stringify(generatedData),
          aiMetadata
        );
      }

      // Step 4: Create records using manual APIs
      console.log(`💾 Creating ${dataType} records in database...`);
      const creationResult = await this.recordCreator.createRecords(dataType, generatedData, user);
      
      if (!creationResult.success) {
        throw new Error(`Database creation failed: ${creationResult.errors.join('; ')}`);
      }

      createdIds = creationResult.createdIds;
      console.log(`💾 Database creation returned ${createdIds.length} IDs`);

      // Step 5: Wait for database transactions to commit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 6: Verify records exist in database
      console.log(`🔍 Verifying records exist in database...`);
      const verification = await this.recordCreator.verifyRecords(dataType, createdIds, organizationId);
      
      console.log(`🔍 Database verification: ${verification.verified}/${verification.expected} records found`);

      // Step 7: Log final result
      const overallSuccess = verification.success && createdIds.length === generatedData.length;
      
      if (logId) {
        await this.logger.logDatabaseResult(
          logId, 
          overallSuccess, 
          verification, 
          verification.existing || createdIds,
          overallSuccess ? null : new Error(verification.error || 'Unknown error')
        );
      }

      // Step 8: Trigger embedding if successful
      if (overallSuccess && this.shouldTriggerEmbedding(dataType)) {
        console.log(`🔄 Triggering automatic embedding for ${verification.verified} ${dataType} records...`);
        await this.triggerEmbedding(dataType, verification.existing || createdIds);
      }

      if (overallSuccess) {
        console.log(`✅ Test data generation completed successfully`);
        return {
          success: true,
          dataType,
          aiGenerated: generatedData.length,
          databaseSaved: verification.verified,
          createdIds: verification.existing || createdIds,
          data: generatedData,
          verification: {
            databaseSuccess: true,
            recordsCreated: verification.verified,
            expectedRecords: generatedData.length,
            verificationDetails: verification
          }
        };
      } else {
        const errorMessage = verification.error || 
                            `Database save failed: Expected ${generatedData.length} records but only ${verification.verified} found`;
        console.error(`❌ Generation failed:`, errorMessage);
        
        return {
          success: false,
          error: errorMessage,
          dataType,
          aiGenerated: generatedData.length,
          databaseSaved: verification.verified,
          verification: {
            databaseSuccess: false,
            recordsCreated: verification.verified,
            expectedRecords: generatedData.length,
            verificationDetails: verification,
            missingRecords: verification.missing
          }
        };
      }

    } catch (error) {
      console.error(`❌ Test data generation failed for ${dataType}:`, error.message);
      
      // Log failure
      if (logId) {
        await this.logger.logDatabaseResult(logId, false, null, [], error);
      }
      
      return {
        success: false,
        error: error.message,
        dataType,
        aiGenerated: generatedData.length || 0,
        databaseSaved: 0,
        stage: generatedData.length === 0 ? 'ai_generation' : 'database_save'
      };
    }
  }

  /**
   * Generate data using appropriate generator
   */
  async generateData(dataType, config) {
    switch (dataType) {
      case 'alert':
        return await this.dataGenerators.generateAlerts(config);
      case 'incident':
        return await this.dataGenerators.generateIncidents(config);
      case 'asset':
        return await this.dataGenerators.generateAssets(config);
      case 'ioc':
        return await this.dataGenerators.generateIOCs(config);
      case 'playbook':
        return await this.dataGenerators.generatePlaybooks(config);
      case 'threat_actor':
        return await this.dataGenerators.generateThreatActors(config);
      case 'threat_campaign':
        return await this.dataGenerators.generateThreatCampaigns(config);
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
  }

  /**
   * Get the last used prompt for logging
   */
  getLastPrompt(dataType, config) {
    const { quantity, severityDistribution, scenario, timeRange } = config;
    
    switch (dataType) {
      case 'alert':
        return this.dataGenerators.buildAlertPrompt(quantity, severityDistribution, scenario, timeRange, config);
      case 'incident':
        return this.dataGenerators.buildIncidentPrompt(quantity, scenario, timeRange, config);
      case 'asset':
        return this.dataGenerators.buildAssetPrompt(quantity, scenario, config);
      case 'ioc':
        return this.dataGenerators.buildIOCPrompt(quantity, scenario, config);
      case 'playbook':
        return this.dataGenerators.buildPlaybookPrompt(quantity, scenario, config);
      case 'threat_actor':
        return this.dataGenerators.buildThreatActorPrompt(quantity, scenario, config);
      case 'threat_campaign':
        return this.dataGenerators.buildThreatCampaignPrompt(quantity, scenario, config);
      default:
        return `Generate ${quantity} ${dataType} records for scenario: ${scenario}`;
    }
  }

  /**
   * Check if embedding should be triggered for data type
   */
  shouldTriggerEmbedding(dataType) {
    return ['alert', 'incident', 'asset', 'ioc', 'playbook'].includes(dataType);
  }

  /**
   * Trigger embedding for created records
   */
  async triggerEmbedding(dataType, recordIds) {
    try {
      const embeddingHelper = require('../embeddingHelper');
      
      recordIds.forEach(recordId => {
        console.log(`  📋 Queuing embedding for ${dataType} ${recordId}`);
        embeddingHelper.triggerEmbeddingForRecord(dataType, recordId, 'create');
      });
    } catch (error) {
      console.error(`❌ Failed to trigger embedding for ${dataType}:`, error.message);
      // Don't throw - embedding failure shouldn't break the main flow
    }
  }

  /**
   * Get generation statistics
   */
  async getGenerationStats(organizationId, timeRange = '30d') {
    return await this.logger.getGenerationStats(organizationId, timeRange);
  }

  /**
   * Get recent generation logs
   */
  async getRecentLogs(organizationId, limit = 50) {
    return await this.logger.getRecentLogs(organizationId, limit);
  }

  /**
   * Clean up old generation logs
   */
  async cleanupOldLogs(organizationId, olderThanDays = 90) {
    return await this.logger.cleanupOldLogs(organizationId, olderThanDays);
  }

  /**
   * Check AI status
   */
  async checkAIStatus() {
    return await this.dataGenerators.aiGenerator.checkConnection();
  }
}

module.exports = TestDataFactory;