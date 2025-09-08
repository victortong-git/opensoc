const { models } = require('../database/models');
const { NotFoundError, ValidationError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');
const embeddingHelper = require('./embeddingHelper');
const alertTimelineService = require('./alertTimelineService');
const notificationService = require('./notificationService');

/**
 * Alert CRUD Service
 * Handles basic Create, Read, Update, Delete operations for alerts
 * with comprehensive filtering, pagination, and association management
 */
class AlertCrudService {

  /**
   * Get all alerts with filtering and pagination
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options (page, limit, filters, etc.)
   * @returns {Object} Paginated alerts with metadata
   */
  async getAlerts(organizationId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      severity,
      status,
      sourceSystem,
      assetId,
      startDate,
      endDate,
      search,
    } = options;

    // Build where clause
    const where = { organizationId };

    // Apply filters
    if (severity) {
      const severityArray = Array.isArray(severity) ? severity : [severity];
      where.severity = { [Op.in]: severityArray.map(s => parseInt(s)) };
    }

    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      where.status = { [Op.in]: statusArray };
    }

    if (sourceSystem) {
      where.sourceSystem = sourceSystem;
    }

    if (assetId) {
      where.assetId = assetId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      where.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { [Op.lte]: new Date(endDate) };
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { assetName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Valid sort fields
    const validSortFields = ['createdAt', 'updatedAt', 'severity', 'status', 'title', 'sourceSystem'];
    const safeSort = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    // Execute query
    const { count, rows: alerts } = await models.Alert.findAndCountAll({
      where,
      include: [
        {
          model: models.Asset,
          as: 'asset',
          attributes: ['id', 'name', 'assetType', 'ipAddress', 'criticality'],
          required: false,
        },
      ],
      order: [[safeSort, safeOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const totalPages = Math.ceil(count / limit);

    return {
      alerts,
      metadata: {
        totalCount: count,
        totalPages,
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        filters: {
          severity,
          status,
          sourceSystem,
          assetId,
          startDate,
          endDate,
          search,
        },
        sorting: {
          sortBy: safeSort,
          sortOrder: safeOrder,
        },
      },
    };
  }

  /**
   * Get single alert by ID
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @returns {Object} Alert with associations
   */
  async getAlert(alertId, organizationId) {
    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId },
      include: [
        {
          model: models.Asset,
          as: 'asset',
          attributes: ['id', 'name', 'assetType', 'ipAddress', 'hostname', 'criticality', 'location', 'owner'],
        },
        {
          model: models.AlertMitreAnalysis,
          as: 'mitreAnalysisRecords',
          required: false,
        },
      ],
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    return { alert };
  }

  /**
   * Create new alert
   * @param {Object} alertData - Alert data to create
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object
   * @returns {Object} Created alert with associations
   */
  async createAlert(alertData, organizationId, user) {
    const finalAlertData = {
      ...alertData,
      organizationId,
      // Explicitly handle isTestData parameter for test data consistency
      isTestData: alertData.isTestData === true || alertData.isTestData === 'true',
    };

    const alert = await models.Alert.create(finalAlertData);

    // Create alert timeline event
    await alertTimelineService.createAlertCreatedEvent(alert, user);

    // Trigger automatic embedding generation (fire-and-forget)
    embeddingHelper.triggerEmbeddingForRecord('alert', alert.id, 'create');

    // Get the created alert with associations
    const createdAlert = await models.Alert.findByPk(alert.id, {
      include: [
        {
          model: models.Asset,
          as: 'asset',
          attributes: ['id', 'name', 'assetType', 'ipAddress', 'criticality'],
        },
      ],
    });

    // Create notification for the alert
    try {
      await notificationService.createFromAlert(createdAlert);
    } catch (error) {
      console.error('Failed to create notification for alert:', error);
      // Don't fail the request if notification creation fails
    }

    return {
      message: 'Alert created successfully',
      alert: createdAlert,
    };
  }

  /**
   * Update alert
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @param {Object} updateData - Data to update
   * @param {Object} user - User object
   * @returns {Object} Updated alert
   */
  async updateAlert(alertId, organizationId, updateData, user) {
    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId },
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    const oldStatus = alert.status;
    const processedUpdateData = { ...updateData };

    // If status is being updated, handle triage timestamp
    if (processedUpdateData.status && processedUpdateData.status !== oldStatus) {
      processedUpdateData.triageTimestamp = new Date();
      
      // If manual status change includes triage remarks, update them
      if (processedUpdateData.triageRemarks) {
        processedUpdateData.triageRemarks = {
          ...processedUpdateData.triageRemarks,
          updatedBy: user.username || user.id,
          updatedAt: new Date().toISOString(),
          previousStatus: oldStatus,
          manualUpdate: true
        };
      }
    }

    await alert.update(processedUpdateData);

    // Create timeline event for manual status changes
    if (processedUpdateData.status && processedUpdateData.status !== oldStatus) {
      await alertTimelineService.createStatusChangeEvent(alert, oldStatus, processedUpdateData.status, user, processedUpdateData);
    }

    // Trigger automatic embedding generation for updates (fire-and-forget)
    embeddingHelper.triggerEmbeddingForRecord('alert', alert.id, 'update');

    // Get updated alert with associations
    const updatedAlert = await models.Alert.findByPk(alert.id, {
      include: [
        {
          model: models.Asset,
          as: 'asset',
          attributes: ['id', 'name', 'assetType', 'ipAddress', 'criticality'],
        },
      ],
    });

    return {
      message: 'Alert updated successfully',
      alert: updatedAlert,
    };
  }

  /**
   * Delete alert
   * @param {string} alertId - Alert ID
   * @param {string} organizationId - Organization ID
   * @param {Object} user - User object
   * @returns {Object} Deletion confirmation
   */
  async deleteAlert(alertId, organizationId, user) {
    const alert = await models.Alert.findOne({
      where: { id: alertId, organizationId },
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    // Create timeline event for alert deletion
    await alertTimelineService.createAlertDeletionEvent(alert, user);

    await alert.destroy();

    return {
      message: 'Alert deleted successfully',
    };
  }

  /**
   * Bulk update alerts
   * @param {Array} alertIds - Array of alert IDs
   * @param {string} organizationId - Organization ID
   * @param {Object} updateData - Data to update
   * @param {Object} user - User object
   * @returns {Object} Bulk update results
   */
  async bulkUpdateAlerts(alertIds, organizationId, updateData, user) {
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      throw new ValidationError('Alert IDs array is required');
    }

    const results = {
      successful: [],
      failed: [],
      totalRequested: alertIds.length
    };

    // Process each alert individually to handle errors gracefully
    for (const alertId of alertIds) {
      try {
        const result = await this.updateAlert(alertId, organizationId, updateData, user);
        results.successful.push({ alertId, result });
      } catch (error) {
        results.failed.push({ alertId, error: error.message });
      }
    }

    return {
      message: `Bulk update completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      results,
      success: results.failed.length === 0
    };
  }

  /**
   * Validate alert data for creation/update
   * @param {Object} alertData - Alert data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validation result
   */
  validateAlertData(alertData, isUpdate = false) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!isUpdate) {
      // Required fields for creation
      const requiredFields = ['title', 'description', 'severity', 'sourceSystem'];
      
      requiredFields.forEach(field => {
        if (!alertData[field]) {
          validation.errors.push(`Missing required field: ${field}`);
          validation.isValid = false;
        }
      });
    }

    // Validate severity
    if (alertData.severity !== undefined) {
      const validSeverities = [1, 2, 3, 4, 5];
      if (!validSeverities.includes(parseInt(alertData.severity))) {
        validation.errors.push('Severity must be between 1 and 5');
        validation.isValid = false;
      }
    }

    // Validate status
    if (alertData.status) {
      const validStatuses = ['open', 'investigating', 'resolved', 'false_positive', 'closed'];
      if (!validStatuses.includes(alertData.status)) {
        validation.errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        validation.isValid = false;
      }
    }

    // Validate title length
    if (alertData.title && alertData.title.length > 255) {
      validation.errors.push('Title must be 255 characters or less');
      validation.isValid = false;
    }

    // Validate description length
    if (alertData.description && alertData.description.length > 10000) {
      validation.warnings.push('Description is very long (>10,000 characters)');
    }

    return validation;
  }

  /**
   * Get alert statistics for organization
   * @param {string} organizationId - Organization ID
   * @returns {Object} Basic alert statistics
   */
  async getBasicAlertStats(organizationId) {
    const totalAlerts = await models.Alert.count({ where: { organizationId } });
    
    const statusCounts = await models.Alert.findAll({
      where: { organizationId },
      attributes: [
        'status',
        [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const severityCounts = await models.Alert.findAll({
      where: { organizationId },
      attributes: [
        'severity',
        [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
      ],
      group: ['severity'],
      raw: true
    });

    return {
      totalAlerts,
      statusDistribution: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      severityDistribution: severityCounts.reduce((acc, item) => {
        acc[`severity_${item.severity}`] = parseInt(item.count);
        return acc;
      }, {})
    };
  }
}

module.exports = new AlertCrudService();