const { models, sequelize } = require('../database/models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');
const TestDataFactory = require('../services/testData/testDataFactory');

// Initialize factory
const testDataFactory = new TestDataFactory();

/**
 * Check AI connection status
 * GET /api/test-data/ai-status
 */
const getAIStatus = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const status = await testDataFactory.checkAIStatus();
    const responseTime = Date.now() - startTime;
    
    res.status(200).json({
      ...status,
      responseTime,
      checkedAt: new Date().toISOString(),
      endpoint: `${process.env.OLLAMA_HOST || '192.168.8.21'}:${process.env.OLLAMA_PORT || '11434'}`,
      targetModel: process.env.OLLAMA_MODEL || 'gpt-oss:20b'
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('AI status check failed:', error);
    
    res.status(200).json({
      connected: false,
      modelAvailable: false,
      error: error.message,
      responseTime,
      checkedAt: new Date().toISOString(),
      endpoint: `${process.env.OLLAMA_HOST || '192.168.8.21'}:${process.env.OLLAMA_PORT || '11434'}`,
      targetModel: process.env.OLLAMA_MODEL || 'gpt-oss:20b'
    });
  }
});

/**
 * Generate test data using AI and automatically save to database
 * POST /api/test-data/generate
 */
const generateTestData = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    dataType,
    quantity = 5,
    severityDistribution = {
      critical: 10,
      high: 20,
      medium: 30,
      low: 25,
      info: 15
    },
    scenario = 'mixed',
    timeRange = 'last_24h',
    preview = true,
  } = req.body;

  // Validate input
  if (!['alert', 'incident', 'asset', 'ioc', 'playbook', 'threat_actor', 'threat_campaign'].includes(dataType)) {
    throw new ValidationError('Invalid data type. Must be alert, incident, asset, ioc, playbook, threat_actor, or threat_campaign.');
  }

  if (quantity < 1 || quantity > 5) {
    throw new ValidationError('Quantity must be between 1 and 5.');
  }

  const config = {
    dataType,
    quantity,
    severityDistribution,
    scenario,
    timeRange,
    organizationId,
    userId: req.user.id,
    // Include custom enhancement fields for all data types
    customDescription: req.body.customDescription,
    customRequirements: req.body.customRequirements,
    customExamples: req.body.customExamples,
  };


  try {
    console.log(`🤖 Generating and creating AI test data for ${dataType}...`);
    const result = await testDataFactory.generateAndCreateTestData(config, req.user);
    
    if (result.success) {
      // Success case
      res.status(200).json({
        success: true,
        dataType,
        aiGenerated: result.aiGenerated,
        databaseSaved: result.databaseSaved,
        createdIds: result.createdIds,
        data: preview ? result.data.slice(0, 5) : result.data,
        fullData: preview ? undefined : result.data,
        verification: result.verification
      });
    } else {
      // Failure case
      console.error(`❌ Generation failed:`, result.error);
      
      res.status(500).json({
        success: false,
        error: result.error,
        dataType,
        aiGenerated: result.aiGenerated || 0,
        databaseSaved: result.databaseSaved || 0,
        verification: result.verification || null,
        stage: result.stage || 'unknown'
      });
    }

  } catch (error) {
    console.error(`❌ Test data generation failed for ${dataType}:`, error);
    
    // Comprehensive error response
    res.status(500).json({
      success: false,
      error: error.message,
      dataType,
      aiGenerated: 0,
      databaseSaved: 0,
      stage: 'initialization'
    });
  }
});

/**
 * Get test data statistics
 * GET /api/test-data/stats
 */
const getTestDataStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  try {
    const [testAlerts, testIncidents, testAssets, testIOCs, testPlaybooks] = await Promise.all([
      models.Alert.count({ 
        where: { 
          organizationId,
          [Op.or]: [
            { isTestData: true },
            { sourceSystem: 'TestDataGenerator' }
          ]
        }
      }),
      models.Incident.count({ 
        where: { 
          organizationId, 
          isTestData: true 
        }
      }),
      models.Asset.count({ 
        where: { 
          organizationId, 
          isTestData: true 
        }
      }),
      models.IOC.count({ 
        where: { 
          organizationId, 
          isTestData: true 
        }
      }),
      models.Playbook.count({ 
        where: { 
          organizationId, 
          isTestData: true 
        }
      }),
    ]);

    // Get test data by creation date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentTestAlerts, recentTestIncidents, recentTestAssets, recentTestIOCs, recentTestPlaybooks] = await Promise.all([
      models.Alert.count({
        where: {
          organizationId,
          sourceSystem: 'TestDataGenerator',
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
      }),
      models.Incident.count({
        where: {
          organizationId,
          isTestData: true,
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
      }),
      models.Asset.count({
        where: {
          organizationId,
          isTestData: true,
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
      }),
      models.IOC.count({
        where: {
          organizationId,
          isTestData: true,
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
      }),
      models.Playbook.count({
        where: {
          organizationId,
          isTestData: true,
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
      }),
    ]);

    // Get AI generation statistics
    const aiStats = await testDataFactory.getGenerationStats(organizationId);

    res.status(200).json({
      total: {
        alerts: testAlerts,
        incidents: testIncidents,
        assets: testAssets,
        iocs: testIOCs,
        playbooks: testPlaybooks,
      },
      recent: {
        alerts: recentTestAlerts,
        incidents: recentTestIncidents,
        assets: recentTestAssets,
        iocs: recentTestIOCs,
        playbooks: recentTestPlaybooks,
      },
      summary: {
        totalTestDataRecords: testAlerts + testIncidents + testAssets + testIOCs + testPlaybooks,
        recentTestDataRecords: recentTestAlerts + recentTestIncidents + recentTestAssets + recentTestIOCs + recentTestPlaybooks,
      },
      aiGenerationStats: aiStats
    });
  } catch (error) {
    console.error('Error getting test data stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch test data statistics',
      details: error.message
    });
  }
});

/**
 * Clean up test data
 * DELETE /api/test-data/cleanup
 */
const cleanupTestData = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { dataType, olderThan } = req.query;

  let where = { organizationId };
  
  // Add test data filter
  if (dataType === 'alert') {
    where = {
      ...where,
      [Op.or]: [
        { isTestData: true },
        { sourceSystem: 'TestDataGenerator' }
      ]
    };
  } else if (['incident', 'asset', 'ioc', 'playbook', 'threat_actor', 'threat_campaign'].includes(dataType)) {
    where = { ...where, isTestData: true };
  }

  // Add time filter if specified
  if (olderThan) {
    const cutoffDate = new Date();
    const days = parseInt(olderThan);
    cutoffDate.setDate(cutoffDate.getDate() - days);
    where.createdAt = { [Op.lt]: cutoffDate };
  }

  try {
    let deletedCount = 0;

    if (!dataType || dataType === 'alert') {
      const alertWhere = dataType ? where : {
        organizationId,
        [Op.or]: [
          { isTestData: true },
          { sourceSystem: 'TestDataGenerator' }
        ]
      };
      
      if (olderThan && !dataType) {
        const cutoffDate = new Date();
        const days = parseInt(olderThan);
        cutoffDate.setDate(cutoffDate.getDate() - days);
        alertWhere.createdAt = { [Op.lt]: cutoffDate };
      }

      const deletedAlerts = await models.Alert.destroy({ where: alertWhere });
      deletedCount += deletedAlerts;
    }

    if (!dataType || dataType === 'incident') {
      const incidentWhere = dataType ? where : {
        organizationId,
        isTestData: true
      };
      
      if (olderThan && !dataType) {
        const cutoffDate = new Date();
        const days = parseInt(olderThan);
        cutoffDate.setDate(cutoffDate.getDate() - days);
        incidentWhere.createdAt = { [Op.lt]: cutoffDate };
      }

      // Also delete related timeline events
      await models.TimelineEvent.destroy({
        where: {
          isTestData: true,
          ...(olderThan && {
            timestamp: { [Op.lt]: new Date(Date.now() - parseInt(olderThan) * 24 * 60 * 60 * 1000) }
          })
        }
      });

      const deletedIncidents = await models.Incident.destroy({ where: incidentWhere });
      deletedCount += deletedIncidents;
    }

    if (!dataType || dataType === 'asset') {
      const assetWhere = dataType ? where : {
        organizationId,
        isTestData: true
      };
      
      if (olderThan && !dataType) {
        const cutoffDate = new Date();
        const days = parseInt(olderThan);
        cutoffDate.setDate(cutoffDate.getDate() - days);
        assetWhere.createdAt = { [Op.lt]: cutoffDate };
      }

      const deletedAssets = await models.Asset.destroy({ where: assetWhere });
      deletedCount += deletedAssets;
    }

    if (!dataType || dataType === 'ioc') {
      const iocWhere = dataType ? where : {
        organizationId,
        isTestData: true
      };
      
      if (olderThan && !dataType) {
        const cutoffDate = new Date();
        const days = parseInt(olderThan);
        cutoffDate.setDate(cutoffDate.getDate() - days);
        iocWhere.createdAt = { [Op.lt]: cutoffDate };
      }

      const deletedIOCs = await models.IOC.destroy({ where: iocWhere });
      deletedCount += deletedIOCs;
    }

    if (!dataType || dataType === 'playbook') {
      const playbookWhere = dataType ? where : {
        organizationId,
        isTestData: true
      };
      
      if (olderThan && !dataType) {
        const cutoffDate = new Date();
        const days = parseInt(olderThan);
        cutoffDate.setDate(cutoffDate.getDate() - days);
        playbookWhere.createdAt = { [Op.lt]: cutoffDate };
      }

      const deletedPlaybooks = await models.Playbook.destroy({ where: playbookWhere });
      deletedCount += deletedPlaybooks;
    }

    if (!dataType || dataType === 'threat_actor') {
      const threatActorWhere = dataType ? where : {
        organizationId,
        isTestData: true
      };
      
      if (olderThan && !dataType) {
        const cutoffDate = new Date();
        const days = parseInt(olderThan);
        cutoffDate.setDate(cutoffDate.getDate() - days);
        threatActorWhere.createdAt = { [Op.lt]: cutoffDate };
      }

      const deletedThreatActors = await models.ThreatActor.destroy({ where: threatActorWhere });
      deletedCount += deletedThreatActors;
    }

    if (!dataType || dataType === 'threat_campaign') {
      const threatCampaignWhere = dataType ? where : {
        organizationId,
        isTestData: true
      };
      
      if (olderThan && !dataType) {
        const cutoffDate = new Date();
        const days = parseInt(olderThan);
        cutoffDate.setDate(cutoffDate.getDate() - days);
        threatCampaignWhere.createdAt = { [Op.lt]: cutoffDate };
      }

      const deletedThreatCampaigns = await models.ThreatCampaign.destroy({ where: threatCampaignWhere });
      deletedCount += deletedThreatCampaigns;
    }

    await logTestDataActivity(
      req.user.id,
      'test_data_cleanup',
      `Cleaned up ${deletedCount} test data items`,
      {
        deletedCount,
        dataType: dataType || 'all',
        olderThan: olderThan || 'all',
      }
    );

    res.status(200).json({
      success: true,
      message: `Cleaned up ${deletedCount} test data items`,
      deletedCount,
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw new ValidationError('Failed to cleanup test data: ' + error.message);
  }
});

/**
 * Log test data activities
 */
const logTestDataActivity = async (userId, action, description, metadata = {}) => {
  try {
    await sequelize.query(`
      INSERT INTO settings_activities (id, user_id, action, description, metadata)
      VALUES (gen_random_uuid(), :userId, :action, :description, :metadata)
    `, {
      replacements: {
        userId,
        action,
        description,
        metadata: JSON.stringify({
          ...metadata,
          component: 'test-data-generator',
        })
      }
    });
  } catch (error) {
    console.error('Failed to log test data activity:', error);
    // Don't throw - activity logging should not break main functionality
  }
};

module.exports = {
  getAIStatus,
  generateTestData,
  getTestDataStats,
  cleanupTestData,
};