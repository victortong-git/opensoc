const { models, sequelize } = require('../database/models');
const { Op } = require('sequelize');

class AILLMLogService {
  constructor() {
    this.pendingLogs = new Map(); // Store logs before completion
  }

  /**
   * Create a new AI LLM log entry for a request that's about to be made
   * Returns the log ID for later updates
   */
  async createLogEntry(options) {
    const {
      organizationId,
      providerId,
      providerName,
      providerType,
      providerUrl,
      modelName,
      maxTokens,
      tokenWindow,
      temperature,
      rawPrompt,
      userId,
      contextType,
      contextId,
      requestHeaders
    } = options;

    try {
      const logEntry = await models.AILLMLog.create({
        organizationId,
        providerId,
        providerName,
        providerType,
        providerUrl,
        modelName,
        maxTokens,
        tokenWindow,
        temperature,
        rawPrompt,
        userId,
        contextType,
        contextId,
        requestHeaders,
        requestTimestamp: new Date(),
        success: false // Will be updated on completion
      });

      // Store in pending logs for later update
      this.pendingLogs.set(logEntry.id, {
        id: logEntry.id,
        startTime: Date.now()
      });

      console.log(`📝 Created AI LLM log entry ${logEntry.id} for ${providerName}/${modelName}`);
      return logEntry.id;
    } catch (error) {
      console.error('❌ Failed to create AI LLM log entry:', error);
      throw error;
    }
  }

  /**
   * Update log entry with successful response
   */
  async logSuccess(logId, responseData) {
    const {
      rawResponse,
      inputTokens,
      outputTokens,
      responseHeaders,
      providerMetadata,
      httpStatusCode = 200
    } = responseData;

    try {
      const pendingLog = this.pendingLogs.get(logId);
      const responseTimestamp = new Date();
      const durationMs = pendingLog ? Date.now() - pendingLog.startTime : null;

      await models.AILLMLog.update({
        rawResponse,
        inputTokens: inputTokens || this.estimateTokens(responseData.rawPrompt),
        outputTokens: outputTokens || this.estimateTokens(rawResponse),
        responseHeaders,
        providerMetadata,
        httpStatusCode,
        responseTimestamp,
        durationMs,
        success: true
      }, {
        where: { id: logId }
      });

      // Remove from pending logs
      this.pendingLogs.delete(logId);

      console.log(`✅ Updated AI LLM log ${logId} with successful response (${durationMs}ms)`);
    } catch (error) {
      console.error(`❌ Failed to update AI LLM log ${logId} with success:`, error);
      throw error;
    }
  }

  /**
   * Update log entry with failure information
   */
  async logFailure(logId, errorData) {
    const {
      errorMessage,
      httpStatusCode,
      responseHeaders
    } = errorData;

    try {
      const pendingLog = this.pendingLogs.get(logId);
      const responseTimestamp = new Date();
      const durationMs = pendingLog ? Date.now() - pendingLog.startTime : null;

      await models.AILLMLog.update({
        errorMessage,
        httpStatusCode: httpStatusCode || 500,
        responseHeaders,
        responseTimestamp,
        durationMs,
        success: false
      }, {
        where: { id: logId }
      });

      // Remove from pending logs
      this.pendingLogs.delete(logId);

      console.log(`❌ Updated AI LLM log ${logId} with failure: ${errorMessage}`);
    } catch (error) {
      console.error(`❌ Failed to update AI LLM log ${logId} with failure:`, error);
      throw error;
    }
  }

  /**
   * Get provider information from AI provider settings
   */
  async getProviderInfo(organizationId, providerId) {
    try {
      if (!providerId) {
        // Return fallback info if no provider ID (fallback scenario)
        return {
          id: null,
          name: 'Fallback Provider',
          type: 'unknown',
          url: 'unknown'
        };
      }

      const provider = await models.AIProvider.findOne({
        where: {
          id: providerId,
          organizationId
        }
      });

      if (!provider) {
        console.warn(`Provider ${providerId} not found for organization ${organizationId}`);
        return {
          id: providerId,
          name: 'Unknown Provider',
          type: 'unknown',
          url: 'unknown'
        };
      }

      return {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        url: `http://${provider.host}:${provider.port}`
      };
    } catch (error) {
      console.error('Failed to get provider info:', error);
      return {
        id: providerId,
        name: 'Error Loading Provider',
        type: 'unknown',
        url: 'unknown'
      };
    }
  }

  /**
   * Estimate token count for text (approximate)
   */
  estimateTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    // Rough estimation: ~4 characters per token for most models
    return Math.ceil(text.length / 4);
  }

  /**
   * Get AI LLM logs with filtering and pagination
   */
  async getLogs(options = {}) {
    const {
      organizationId,
      providerId,
      providerName,
      success,
      contextType,
      userId,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      orderBy = 'requestTimestamp',
      orderDirection = 'DESC'
    } = options;

    try {
      const whereClause = { organizationId };

      if (providerId !== undefined) {
        whereClause.providerId = providerId;
      }

      if (providerName) {
        whereClause.providerName = {
          [Op.iLike]: `%${providerName}%`
        };
      }

      if (success !== undefined) {
        whereClause.success = success;
      }

      if (contextType) {
        whereClause.contextType = contextType;
      }

      if (userId) {
        whereClause.userId = userId;
      }

      if (startDate || endDate) {
        whereClause.requestTimestamp = {};
        if (startDate) {
          whereClause.requestTimestamp[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.requestTimestamp[Op.lte] = new Date(endDate);
        }
      }

      const { count, rows } = await models.AILLMLog.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: models.AIProvider,
            as: 'provider',
            required: false
          },
          {
            model: models.User,
            as: 'user',
            attributes: ['id', 'username', 'email'],
            required: false
          }
        ],
        limit,
        offset,
        order: [[orderBy, orderDirection]]
      });

      // Calculate token totals for the current result set
      const tokenTotals = rows.reduce((totals, log) => {
        totals.totalInputTokens += log.inputTokens || 0;
        totals.totalOutputTokens += log.outputTokens || 0;
        return totals;
      }, { totalInputTokens: 0, totalOutputTokens: 0 });

      return {
        logs: rows,
        total: count,
        limit,
        offset,
        tokenTotals
      };
    } catch (error) {
      console.error('Failed to get AI LLM logs:', error);
      throw error;
    }
  }

  /**
   * Get a specific AI LLM log by ID
   */
  async getLogById(logId, organizationId) {
    try {
      const log = await models.AILLMLog.findOne({
        where: {
          id: logId,
          organizationId
        },
        include: [
          {
            model: models.AIProvider,
            as: 'provider',
            required: false
          },
          {
            model: models.User,
            as: 'user',
            attributes: ['id', 'username', 'email'],
            required: false
          }
        ]
      });

      return log;
    } catch (error) {
      console.error(`Failed to get AI LLM log ${logId}:`, error);
      throw error;
    }
  }

  /**
   * Delete AI LLM logs
   */
  async deleteLogs(logIds, organizationId) {
    try {
      const deleteCount = await models.AILLMLog.destroy({
        where: {
          id: {
            [Op.in]: logIds
          },
          organizationId
        }
      });

      console.log(`🗑️ Deleted ${deleteCount} AI LLM logs`);
      return deleteCount;
    } catch (error) {
      console.error('Failed to delete AI LLM logs:', error);
      throw error;
    }
  }

  /**
   * Get AI LLM statistics
   */
  async getStatistics(organizationId, timeRange = '24h') {
    try {
      const hours = parseInt(timeRange.replace('h', ''));
      const startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

      // Get overall stats
      const totalRequests = await models.AILLMLog.count({
        where: {
          organizationId,
          requestTimestamp: { [Op.gte]: startTime }
        }
      });

      const successfulRequests = await models.AILLMLog.count({
        where: {
          organizationId,
          success: true,
          requestTimestamp: { [Op.gte]: startTime }
        }
      });

      // Get provider-specific stats (simplified for now)
      const providerStats = [];

      // Simplified stats for now (will improve later)
      const avgDuration = { avgDuration: 0 };
      const tokenUsage = { totalInputTokens: 0, totalOutputTokens: 0 };

      return {
        timeRange,
        totalRequests,
        successfulRequests,
        failedRequests: totalRequests - successfulRequests,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        avgDuration: parseFloat(avgDuration?.dataValues?.avgDuration) || 0,
        totalInputTokens: parseInt(tokenUsage?.dataValues?.totalInputTokens) || 0,
        totalOutputTokens: parseInt(tokenUsage?.dataValues?.totalOutputTokens) || 0,
        providerStats
      };
    } catch (error) {
      console.error('Failed to get AI LLM statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old logs based on retention policy
   */
  async cleanupOldLogs(organizationId, retentionDays = 30) {
    try {
      const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));

      const deleteCount = await models.AILLMLog.destroy({
        where: {
          organizationId,
          createdAt: { [Op.lt]: cutoffDate }
        }
      });

      console.log(`🗑️ Cleaned up ${deleteCount} old AI LLM logs (older than ${retentionDays} days)`);
      return deleteCount;
    } catch (error) {
      console.error('Failed to cleanup old AI LLM logs:', error);
      throw error;
    }
  }

  /**
   * Get list of providers that have logs
   */
  async getProvidersWithLogs(organizationId) {
    try {
      const providers = await models.AILLMLog.findAll({
        where: { organizationId },
        attributes: [
          'providerName',
          'providerType',
          [sequelize.fn('COUNT', '*'), 'logCount']
        ],
        group: ['providerName', 'providerType'],
        order: [['logCount', 'DESC']]
      });

      return providers.map(p => ({
        name: p.providerName,
        type: p.providerType,
        logCount: parseInt(p.dataValues.logCount)
      }));
    } catch (error) {
      console.error('Failed to get providers with logs:', error);
      throw error;
    }
  }
}

module.exports = new AILLMLogService();