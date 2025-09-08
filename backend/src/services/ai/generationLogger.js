const { models } = require('../../database/models');

class GenerationLogger {
  /**
   * Log AI generation result with comprehensive tracking
   */
  async logGeneration(config) {
    const {
      userId,
      organizationId,
      dataType,
      quantity,
      scenario,
      prompt,
      aiResponse,
      success,
      errorMessage,
      executionTime,
      aiModel,
      aiProvider,
      aiEndpoint,
      modelVersion,
      providerMetadata,
      databaseSuccess,
      databaseError,
      verificationDetails,
      createdRecordIds = [],
      metadata = {}
    } = config;

    try {
      // Determine validation status based on database success
      let validation = 'Pending';
      if (databaseSuccess === true) {
        validation = 'Pass';
      } else if (databaseSuccess === false) {
        validation = 'Fail';
      }

      const logEntry = await models.AIGenerationLog.create({
        userId,
        organizationId,
        dataType,
        quantity: quantity || 1,
        scenario: scenario || 'mixed',
        prompt: prompt || '',
        aiResponse: aiResponse || '',
        success: success || false,
        validation,
        errorMessage: errorMessage || databaseError || null,
        executionTime: executionTime || 0,
        aiModel: aiModel || 'unknown',
        aiProvider: aiProvider || 'Ollama',
        aiEndpoint: aiEndpoint || 'unknown',
        modelVersion: modelVersion || null,
        providerMetadata: providerMetadata || null,
        metadata: {
          ...metadata,
          databaseSuccess,
          verificationDetails,
          createdRecordIds,
          loggedAt: new Date().toISOString()
        }
      });

      console.log(`✅ AI generation logged: ${dataType} - ${validation} (ID: ${logEntry.id})`);
      return logEntry;
    } catch (error) {
      console.error('❌ Failed to log AI generation:', error.message);
      // Don't throw - logging should not break main functionality
      return null;
    }
  }

  /**
   * Log generation start
   */
  async logGenerationStart(userId, organizationId, dataType, config) {
    return this.logGeneration({
      userId,
      organizationId,
      dataType,
      quantity: config.quantity,
      scenario: config.scenario,
      prompt: 'Generation started',
      success: false,
      metadata: {
        stage: 'started',
        config
      }
    });
  }

  /**
   * Log AI response received
   */
  async logAIResponse(logId, prompt, aiResponse, aiMetadata) {
    try {
      if (!logId) return null;

      await models.AIGenerationLog.update({
        prompt,
        aiResponse,
        success: true,
        executionTime: aiMetadata.executionTime,
        aiModel: aiMetadata.model,
        aiProvider: aiMetadata.provider,
        aiEndpoint: aiMetadata.endpoint,
        modelVersion: aiMetadata.modelVersion,
        providerMetadata: aiMetadata.metadata,
        metadata: {
          stage: 'ai_completed',
          aiMetadata
        }
      }, {
        where: { id: logId }
      });

      console.log(`📝 AI response logged for ID: ${logId}`);
      return logId;
    } catch (error) {
      console.error('❌ Failed to log AI response:', error.message);
      return null;
    }
  }

  /**
   * Log database creation results
   */
  async logDatabaseResult(logId, databaseSuccess, verificationDetails, createdRecordIds = [], error = null) {
    try {
      if (!logId) return null;

      const validation = databaseSuccess ? 'Pass' : 'Fail';
      
      await models.AIGenerationLog.update({
        validation,
        errorMessage: error?.message || null,
        metadata: {
          stage: 'completed',
          databaseSuccess,
          verificationDetails,
          createdRecordIds,
          completedAt: new Date().toISOString()
        }
      }, {
        where: { id: logId }
      });

      console.log(`💾 Database result logged for ID: ${logId} - ${validation}`);
      return logId;
    } catch (error) {
      console.error('❌ Failed to log database result:', error.message);
      return null;
    }
  }

  /**
   * Get generation statistics
   */
  async getGenerationStats(organizationId, timeRange = '30d') {
    try {
      const since = new Date();
      const days = parseInt(timeRange.replace('d', ''));
      since.setDate(since.getDate() - days);

      const [totalGenerations, successfulGenerations, passedValidations, failedValidations] = await Promise.all([
        models.AIGenerationLog.count({
          where: {
            organizationId,
            createdAt: { [models.Sequelize.Op.gte]: since }
          }
        }),
        models.AIGenerationLog.count({
          where: {
            organizationId,
            success: true,
            createdAt: { [models.Sequelize.Op.gte]: since }
          }
        }),
        models.AIGenerationLog.count({
          where: {
            organizationId,
            validation: 'Pass',
            createdAt: { [models.Sequelize.Op.gte]: since }
          }
        }),
        models.AIGenerationLog.count({
          where: {
            organizationId,
            validation: 'Fail',
            createdAt: { [models.Sequelize.Op.gte]: since }
          }
        })
      ]);

      // Get stats by data type
      const dataTypeStats = await models.AIGenerationLog.findAll({
        where: {
          organizationId,
          createdAt: { [models.Sequelize.Op.gte]: since }
        },
        attributes: [
          'dataType',
          [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'total'],
          [models.sequelize.fn('SUM', models.sequelize.literal('CASE WHEN validation = \'Pass\' THEN 1 ELSE 0 END')), 'passed']
        ],
        group: ['dataType']
      });

      return {
        summary: {
          totalGenerations,
          successfulGenerations,
          passedValidations,
          failedValidations,
          successRate: totalGenerations > 0 ? (successfulGenerations / totalGenerations * 100).toFixed(2) : 0,
          validationPassRate: totalGenerations > 0 ? (passedValidations / totalGenerations * 100).toFixed(2) : 0
        },
        dataTypeBreakdown: dataTypeStats.map(stat => ({
          dataType: stat.dataType,
          total: parseInt(stat.dataValues.total),
          passed: parseInt(stat.dataValues.passed),
          passRate: stat.dataValues.total > 0 ? (stat.dataValues.passed / stat.dataValues.total * 100).toFixed(2) : 0
        })),
        timeRange: `${days} days`
      };
    } catch (error) {
      console.error('❌ Failed to get generation stats:', error.message);
      return {
        summary: {
          totalGenerations: 0,
          successfulGenerations: 0,
          passedValidations: 0,
          failedValidations: 0,
          successRate: 0,
          validationPassRate: 0
        },
        dataTypeBreakdown: [],
        error: error.message
      };
    }
  }

  /**
   * Get recent generation logs
   */
  async getRecentLogs(organizationId, limit = 50) {
    try {
      const logs = await models.AIGenerationLog.findAll({
        where: { organizationId },
        order: [['createdAt', 'DESC']],
        limit,
        attributes: [
          'id', 'dataType', 'quantity', 'scenario', 'success', 'validation',
          'errorMessage', 'executionTime', 'aiModel', 'createdAt'
        ]
      });

      return logs.map(log => ({
        id: log.id,
        dataType: log.dataType,
        quantity: log.quantity,
        scenario: log.scenario,
        success: log.success,
        validation: log.validation,
        errorMessage: log.errorMessage,
        executionTime: log.executionTime,
        aiModel: log.aiModel,
        createdAt: log.createdAt
      }));
    } catch (error) {
      console.error('❌ Failed to get recent logs:', error.message);
      return [];
    }
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs(organizationId, olderThanDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deletedCount = await models.AIGenerationLog.destroy({
        where: {
          organizationId,
          createdAt: { [models.Sequelize.Op.lt]: cutoffDate }
        }
      });

      console.log(`🧹 Cleaned up ${deletedCount} old AI generation logs (older than ${olderThanDays} days)`);
      return { deletedCount, cutoffDate };
    } catch (error) {
      console.error('❌ Failed to cleanup old logs:', error.message);
      return { deletedCount: 0, error: error.message };
    }
  }
}

module.exports = GenerationLogger;