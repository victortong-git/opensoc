const express = require('express');
const router = express.Router();
const aiLlmLogService = require('../services/aiLlmLogService');
const { authMiddleware, requireRoles } = require('../middleware/auth.middleware');

/**
 * @route GET /api/ai-llm-logs
 * @desc Get AI LLM logs with filtering and pagination
 * @access Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      organizationId
    } = req.user;

    const {
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
    } = req.query;

    // Convert string parameters to appropriate types
    const options = {
      organizationId,
      limit: parseInt(limit),
      offset: parseInt(offset),
      orderBy,
      orderDirection: orderDirection.toUpperCase()
    };

    // Add optional filters
    if (providerId) options.providerId = parseInt(providerId);
    if (providerName) options.providerName = providerName;
    if (success !== undefined) options.success = success === 'true';
    if (contextType) options.contextType = contextType;
    if (userId) options.userId = parseInt(userId);
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const result = await aiLlmLogService.getLogs(options);

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        pages: Math.ceil(result.total / result.limit),
        currentPage: Math.floor(result.offset / result.limit) + 1
      },
      tokenTotals: result.tokenTotals
    });
  } catch (error) {
    console.error('Error fetching AI LLM logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI LLM logs',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai-llm-logs/stats
 * @desc Get AI LLM statistics and analytics
 * @access Private
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { timeRange = '24h' } = req.query;

    const stats = await aiLlmLogService.getStatistics(organizationId, timeRange);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching AI LLM statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI LLM statistics',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai-llm-logs/providers
 * @desc Get list of providers that have logs
 * @access Private
 */
router.get('/providers', authMiddleware, async (req, res) => {
  try {
    const { organizationId } = req.user;

    const providers = await aiLlmLogService.getProvidersWithLogs(organizationId);

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Error fetching providers with logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch providers with logs',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai-llm-logs/:id
 * @desc Get specific AI LLM log by ID
 * @access Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Valid log ID is required'
      });
    }

    const log = await aiLlmLogService.getLogById(parseInt(id), organizationId);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'AI LLM log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error fetching AI LLM log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI LLM log',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/ai-llm-logs/:id
 * @desc Delete specific AI LLM log (admin only)
 * @access Private (Admin only)
 */
router.delete('/:id', authMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Valid log ID is required'
      });
    }

    const deleteCount = await aiLlmLogService.deleteLogs([parseInt(id)], organizationId);

    if (deleteCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'AI LLM log not found'
      });
    }

    res.json({
      success: true,
      message: 'AI LLM log deleted successfully',
      deletedCount: deleteCount
    });
  } catch (error) {
    console.error('Error deleting AI LLM log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete AI LLM log',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/ai-llm-logs
 * @desc Bulk delete AI LLM logs (admin only)
 * @access Private (Admin only)
 */
router.delete('/', authMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { logIds } = req.body;

    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of log IDs is required'
      });
    }

    // Validate all IDs are numbers
    const validIds = logIds.filter(id => !isNaN(parseInt(id))).map(id => parseInt(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid log IDs provided'
      });
    }

    const deleteCount = await aiLlmLogService.deleteLogs(validIds, organizationId);

    res.json({
      success: true,
      message: `Successfully deleted ${deleteCount} AI LLM logs`,
      deletedCount: deleteCount,
      requestedCount: validIds.length
    });
  } catch (error) {
    console.error('Error bulk deleting AI LLM logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete AI LLM logs',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai-llm-logs/cleanup
 * @desc Clean up old AI LLM logs based on retention policy (admin only)
 * @access Private (Admin only)
 */
router.post('/cleanup', authMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { retentionDays = 30 } = req.body;

    if (isNaN(parseInt(retentionDays)) || parseInt(retentionDays) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid retention days (minimum 1) is required'
      });
    }

    const deleteCount = await aiLlmLogService.cleanupOldLogs(
      organizationId, 
      parseInt(retentionDays)
    );

    res.json({
      success: true,
      message: `Cleaned up ${deleteCount} old AI LLM logs (older than ${retentionDays} days)`,
      deletedCount: deleteCount,
      retentionDays: parseInt(retentionDays)
    });
  } catch (error) {
    console.error('Error cleaning up AI LLM logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup AI LLM logs',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai-llm-logs/export
 * @desc Export AI LLM logs as CSV (admin only)
 * @access Private (Admin only)
 */
router.get('/export/csv', authMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const { organizationId } = req.user;
    const {
      providerId,
      providerName,
      success,
      contextType,
      startDate,
      endDate,
      limit = 1000 // Default export limit
    } = req.query;

    // Get logs with filters
    const options = {
      organizationId,
      limit: parseInt(limit),
      offset: 0,
      orderBy: 'requestTimestamp',
      orderDirection: 'DESC'
    };

    // Add optional filters
    if (providerId) options.providerId = parseInt(providerId);
    if (providerName) options.providerName = providerName;
    if (success !== undefined) options.success = success === 'true';
    if (contextType) options.contextType = contextType;
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const result = await aiLlmLogService.getLogs(options);

    // Convert to CSV
    const csvHeader = [
      'ID', 'Provider Name', 'Provider Type', 'Model', 'Success', 'Duration (ms)', 
      'Input Tokens', 'Output Tokens', 'Context Type', 'Context ID', 
      'Request Time', 'Response Time', 'Error Message'
    ].join(',');

    const csvRows = result.logs.map(log => [
      log.id,
      `"${log.providerName}"`,
      log.providerType,
      `"${log.modelName}"`,
      log.success,
      log.durationMs || '',
      log.inputTokens || '',
      log.outputTokens || '',
      log.contextType || '',
      log.contextId || '',
      log.requestTimestamp,
      log.responseTimestamp || '',
      `"${log.errorMessage || ''}"`
    ].join(','));

    const csv = [csvHeader, ...csvRows].join('\n');

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ai_llm_logs.csv"');
    
    res.send(csv);
  } catch (error) {
    console.error('Error exporting AI LLM logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export AI LLM logs',
      error: error.message
    });
  }
});

module.exports = router;