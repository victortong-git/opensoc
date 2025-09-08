const { models, sequelize } = require('../database/models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');

/**
 * Get AI generation logs with pagination and filtering
 * GET /api/ai-generation-logs
 */
const getAIGenerationLogs = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    page = 1,
    limit = 20,
    dataType,
    success,
    userId,
    scenario,
    fromDate,
    toDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;
  
  // Build where clause
  const where = { organizationId };

  if (dataType) {
    where.dataType = dataType;
  }

  if (success !== undefined) {
    where.success = success === 'true';
  }

  if (userId) {
    where.userId = userId;
  }

  if (scenario) {
    where.scenario = { [Op.iLike]: `%${scenario}%` };
  }

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) {
      where.createdAt[Op.gte] = new Date(fromDate);
    }
    if (toDate) {
      where.createdAt[Op.lte] = new Date(toDate);
    }
  }

  // Build order clause
  const order = [[sortBy, sortOrder.toUpperCase()]];

  try {
    const { count, rows } = await models.AIGenerationLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order,
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: ['id', 'username', 'first_name', 'last_name', 'email'],
        }
      ],
    });

    res.status(200).json({
      logs: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: offset + limit < count,
        hasPrevPage: page > 1,
      }
    });
  } catch (error) {
    console.error('Failed to fetch AI generation logs:', error);
    throw new Error('Failed to fetch AI generation logs: ' + error.message);
  }
});

/**
 * Get AI generation log by ID
 * GET /api/ai-generation-logs/:id
 */
const getAIGenerationLogById = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { id } = req.params;

  const log = await models.AIGenerationLog.findOne({
    where: {
      id,
      organizationId,
    },
    include: [
      {
        model: models.User,
        as: 'user',
        attributes: ['id', 'username', 'first_name', 'last_name', 'email'],
      }
    ],
  });

  if (!log) {
    throw new NotFoundError('AI generation log not found');
  }

  res.status(200).json(log);
});

/**
 * Delete AI generation log by ID
 * DELETE /api/ai-generation-logs/:id
 */
const deleteAIGenerationLog = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { id } = req.params;

  const log = await models.AIGenerationLog.findOne({
    where: {
      id,
      organizationId,
    },
  });

  if (!log) {
    throw new NotFoundError('AI generation log not found');
  }

  await log.destroy();

  res.status(200).json({
    success: true,
    message: 'AI generation log deleted successfully',
  });
});

/**
 * Get AI generation logs statistics
 * GET /api/ai-generation-logs/stats
 */
const getAIGenerationLogsStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { days = 30 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const [
      totalLogs,
      successfulLogs,
      failedLogs,
      dataTypeStats,
      userStats,
      recentActivity,
      avgExecutionTime
    ] = await Promise.all([
      // Total logs count
      models.AIGenerationLog.count({
        where: {
          organizationId,
          createdAt: { [Op.gte]: startDate }
        }
      }),

      // Successful logs count
      models.AIGenerationLog.count({
        where: {
          organizationId,
          success: true,
          createdAt: { [Op.gte]: startDate }
        }
      }),

      // Failed logs count
      models.AIGenerationLog.count({
        where: {
          organizationId,
          success: false,
          createdAt: { [Op.gte]: startDate }
        }
      }),

      // Stats by data type
      models.AIGenerationLog.findAll({
        where: {
          organizationId,
          createdAt: { [Op.gte]: startDate }
        },
        attributes: [
          'dataType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('execution_time')), 'avgExecutionTime'],
        ],
        group: ['dataType'],
        raw: true
      }),

      // Stats by user
      models.AIGenerationLog.findAll({
        where: {
          organizationId,
          createdAt: { [Op.gte]: startDate }
        },
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('AIGenerationLog.id')), 'count'],
        ],
        include: [
          {
            model: models.User,
            as: 'user',
            attributes: ['username', 'first_name', 'last_name'],
          }
        ],
        group: ['userId', 'user.id', 'user.username', 'user.first_name', 'user.last_name'],
        raw: true
      }),

      // Recent activity (last 10 logs)
      models.AIGenerationLog.findAll({
        where: { organizationId },
        order: [['createdAt', 'DESC']],
        limit: 10,
        include: [
          {
            model: models.User,
            as: 'user',
            attributes: ['username', 'first_name', 'last_name'],
          }
        ]
      }),

      // Average execution time
      models.AIGenerationLog.findOne({
        where: {
          organizationId,
          execution_time: { [Op.ne]: null },
          createdAt: { [Op.gte]: startDate }
        },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('execution_time')), 'avgTime'],
          [sequelize.fn('MIN', sequelize.col('execution_time')), 'minTime'],
          [sequelize.fn('MAX', sequelize.col('execution_time')), 'maxTime'],
        ],
        raw: true
      })
    ]);

    const successRate = totalLogs > 0 ? ((successfulLogs / totalLogs) * 100).toFixed(1) : 0;

    res.status(200).json({
      period: `${days} days`,
      summary: {
        totalLogs,
        successfulLogs,
        failedLogs,
        successRate: parseFloat(successRate),
      },
      dataTypes: dataTypeStats.map(stat => ({
        dataType: stat.dataType,
        count: parseInt(stat.count),
        avgExecutionTime: stat.avgExecutionTime ? Math.round(stat.avgExecutionTime) : null,
      })),
      users: userStats.map(stat => ({
        userId: stat.userId,
        username: stat['user.username'],
        fullName: `${stat['user.first_name']} ${stat['user.last_name']}`,
        count: parseInt(stat.count),
      })),
      performance: {
        avgExecutionTime: avgExecutionTime?.avgTime ? Math.round(avgExecutionTime.avgTime) : null,
        minExecutionTime: avgExecutionTime?.minTime ? Math.round(avgExecutionTime.minTime) : null,
        maxExecutionTime: avgExecutionTime?.maxTime ? Math.round(avgExecutionTime.maxTime) : null,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('Failed to fetch AI generation logs stats:', error);
    throw new Error('Failed to fetch AI generation logs stats: ' + error.message);
  }
});

/**
 * Cleanup all AI generation logs
 * DELETE /api/ai-generation-logs/cleanup
 */
const cleanupAIGenerationLogs = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { dataType, onlyFailed = false } = req.query;

  const where = {
    organizationId
  };

  if (dataType) {
    where.dataType = dataType;
  }

  if (onlyFailed === 'true') {
    where.success = false;
  }

  try {
    // First, count how many logs would be deleted
    const logsToDelete = await models.AIGenerationLog.count({ where });
    
    console.log(`🧹 AI Generation Logs Cleanup: Found ${logsToDelete} logs to delete`);
    console.log(`   Organization: ${organizationId}`);
    console.log(`   Data Type Filter: ${dataType || 'All types'}`);
    console.log(`   Only Failed: ${onlyFailed === 'true' ? 'Yes' : 'No'}`);

    if (logsToDelete === 0) {
      return res.status(200).json({
        success: false,
        message: `No AI generation logs found matching the specified criteria`,
        deletedCount: 0,
        reason: 'no_logs_found',
      });
    }

    // Perform the actual deletion
    const deletedCount = await models.AIGenerationLog.destroy({ where });

    if (deletedCount === 0) {
      return res.status(200).json({
        success: false,
        message: `Failed to delete AI generation logs due to an unexpected error`,
        deletedCount: 0,
        reason: 'deletion_failed',
      });
    }

    console.log(`✅ Successfully deleted ${deletedCount} AI generation logs`);

    res.status(200).json({
      success: true,
      message: deletedCount === 1 
        ? `Successfully deleted 1 AI generation log`
        : `Successfully deleted ${deletedCount} AI generation logs`,
      deletedCount,
    });
  } catch (error) {
    console.error('❌ Failed to cleanup AI generation logs:', error);
    throw new Error('Failed to cleanup AI generation logs: ' + error.message);
  }
});

module.exports = {
  getAIGenerationLogs,
  getAIGenerationLogById,
  deleteAIGenerationLog,
  getAIGenerationLogsStats,
  cleanupAIGenerationLogs,
};