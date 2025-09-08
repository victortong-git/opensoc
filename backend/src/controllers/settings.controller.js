const { models, sequelize } = require('../database/models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');

/**
 * Get all system settings
 * GET /api/settings
 */
const getSystemSettings = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { category } = req.query;

  // Build where clause
  const where = { organizationId };

  if (category) {
    where.category = category;
  }

  // Get system settings
  const settings = await models.SystemSettings.findAll({
    where,
    order: [['category', 'ASC'], ['name', 'ASC']],
    include: [
      {
        model: models.User,
        as: 'updater',
        attributes: ['id', 'username', 'firstName', 'lastName'],
      },
    ],
  });

  res.status(200).json({ settings });
});

/**
 * Update system setting
 * PUT /api/settings/:id
 */
const updateSystemSetting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { value } = req.body;
  const organizationId = req.user.organizationId;

  const setting = await models.SystemSettings.findOne({
    where: { id, organizationId },
  });

  if (!setting) {
    throw new NotFoundError('System setting not found');
  }

  if (!setting.isEditable) {
    throw new ValidationError('This setting is not editable');
  }

  // Validate value based on type
  let validatedValue;
  switch (setting.type) {
    case 'boolean':
      validatedValue = Boolean(value);
      break;
    case 'number':
      validatedValue = Number(value);
      if (isNaN(validatedValue)) {
        throw new ValidationError('Value must be a valid number');
      }
      break;
    case 'string':
      validatedValue = String(value);
      break;
    case 'object':
      validatedValue = typeof value === 'object' ? value : JSON.parse(value);
      break;
    default:
      validatedValue = value;
  }

  await setting.update({
    value: validatedValue,
    updatedBy: req.user.id,
  });

  // Log setting update activity
  await logSettingsActivity(req.user.id, 'setting_updated', `Updated setting: ${setting.name}`, {
    settingId: setting.id,
    settingName: setting.name,
    category: setting.category,
    oldValue: setting.value,
    newValue: validatedValue,
  });

  // Include updater information in response
  const updatedSetting = await models.SystemSettings.findOne({
    where: { id: setting.id },
    include: [
      {
        model: models.User,
        as: 'updater',
        attributes: ['id', 'username', 'firstName', 'lastName'],
      },
    ],
  });

  res.status(200).json({
    message: 'System setting updated successfully',
    setting: updatedSetting,
  });
});

/**
 * Get all alert rules with filtering and pagination
 * GET /api/settings/alert-rules
 */
const getAlertRules = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    category,
    isEnabled,
    severity,
    search,
  } = req.query;

  // Build where clause
  const where = { organizationId };

  // Apply filters
  if (category) {
    const categoryArray = Array.isArray(category) ? category : [category];
    where.category = { [Op.in]: categoryArray };
  }

  if (isEnabled !== undefined) {
    where.isEnabled = isEnabled === 'true';
  }

  if (severity) {
    const severityArray = Array.isArray(severity) ? severity : [severity];
    where.severity = { [Op.in]: severityArray.map(s => parseInt(s)) };
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Calculate offset
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Get alert rules with pagination
  const { count, rows: alertRules } = await models.AlertRule.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
    include: [
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName'],
      },
    ],
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / parseInt(limit));
  const hasNext = parseInt(page) < totalPages;
  const hasPrev = parseInt(page) > 1;

  res.status(200).json({
    alertRules,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: count,
      itemsPerPage: parseInt(limit),
      hasNext,
      hasPrev,
    },
  });
});

/**
 * Create new alert rule
 * POST /api/settings/alert-rules
 */
const createAlertRule = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    name,
    description,
    severity,
    category,
    conditions = [],
    actions = [],
    timeWindow = 300,
    threshold = 1,
    isEnabled = true,
  } = req.body;

  const alertRuleData = {
    name,
    description,
    severity,
    category,
    conditions,
    actions,
    timeWindow,
    threshold,
    isEnabled,
    triggerCount: 0,
    createdBy: req.user.id,
    organizationId,
  };

  const alertRule = await models.AlertRule.create(alertRuleData);

  // Log alert rule creation activity
  await logSettingsActivity(req.user.id, 'alert_rule_created', `Created alert rule: ${name}`, {
    alertRuleId: alertRule.id,
    alertRuleName: name,
    category: category,
    severity: severity,
  });

  // Include creator information in response
  const createdAlertRule = await models.AlertRule.findOne({
    where: { id: alertRule.id },
    include: [
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName'],
      },
    ],
  });

  res.status(201).json({
    message: 'Alert rule created successfully',
    alertRule: createdAlertRule,
  });
});

/**
 * Update alert rule
 * PUT /api/settings/alert-rules/:id
 */
const updateAlertRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const alertRule = await models.AlertRule.findOne({
    where: { id, organizationId },
  });

  if (!alertRule) {
    throw new NotFoundError('Alert rule not found');
  }

  // Track changes for activity log
  const changes = [];
  const updateData = req.body;
  
  Object.keys(updateData).forEach(key => {
    if (JSON.stringify(updateData[key]) !== JSON.stringify(alertRule[key])) {
      changes.push(`${key}: updated`);
    }
  });

  await alertRule.update(updateData);

  // Log alert rule update activity
  if (changes.length > 0) {
    await logSettingsActivity(req.user.id, 'alert_rule_updated', `Updated alert rule: ${alertRule.name}`, {
      alertRuleId: alertRule.id,
      alertRuleName: alertRule.name,
      changes: changes,
    });
  }

  // Include creator information in response
  const updatedAlertRule = await models.AlertRule.findOne({
    where: { id: alertRule.id },
    include: [
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName'],
      },
    ],
  });

  res.status(200).json({
    message: 'Alert rule updated successfully',
    alertRule: updatedAlertRule,
  });
});

/**
 * Delete alert rule
 * DELETE /api/settings/alert-rules/:id
 */
const deleteAlertRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const alertRule = await models.AlertRule.findOne({
    where: { id, organizationId },
  });

  if (!alertRule) {
    throw new NotFoundError('Alert rule not found');
  }

  // Log alert rule deletion activity
  await logSettingsActivity(req.user.id, 'alert_rule_deleted', `Deleted alert rule: ${alertRule.name}`, {
    alertRuleId: alertRule.id,
    alertRuleName: alertRule.name,
    category: alertRule.category,
  });

  await alertRule.destroy();

  res.status(200).json({
    message: 'Alert rule deleted successfully',
  });
});

/**
 * Toggle alert rule status
 * POST /api/settings/alert-rules/:id/toggle
 */
const toggleAlertRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const alertRule = await models.AlertRule.findOne({
    where: { id, organizationId },
  });

  if (!alertRule) {
    throw new NotFoundError('Alert rule not found');
  }

  const newStatus = !alertRule.isEnabled;
  await alertRule.update({ isEnabled: newStatus });

  // Log alert rule toggle activity
  await logSettingsActivity(req.user.id, 'alert_rule_toggled', 
    `${newStatus ? 'Enabled' : 'Disabled'} alert rule: ${alertRule.name}`, {
    alertRuleId: alertRule.id,
    alertRuleName: alertRule.name,
    oldStatus: !newStatus,
    newStatus: newStatus,
  });

  res.status(200).json({
    message: `Alert rule ${newStatus ? 'enabled' : 'disabled'} successfully`,
    alertRule,
  });
});

/**
 * Get settings statistics
 * GET /api/settings/stats
 */
const getSettingsStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const [
    totalSettings,
    settingsByCategory,
    totalAlertRules,
    enabledAlertRules,
    alertRulesByCategory,
    alertRulesBySeverity,
  ] = await Promise.all([
    models.SystemSettings.count({ where: { organizationId } }),
    sequelize.query(`
      SELECT category, COUNT(*) as count 
      FROM system_settings 
      WHERE organization_id = :orgId 
      GROUP BY category
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }),
    models.AlertRule.count({ where: { organizationId } }),
    models.AlertRule.count({ where: { organizationId, isEnabled: true } }),
    sequelize.query(`
      SELECT category, COUNT(*) as count 
      FROM alert_rules 
      WHERE organization_id = :orgId 
      GROUP BY category
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }),
    sequelize.query(`
      SELECT severity, COUNT(*) as count 
      FROM alert_rules 
      WHERE organization_id = :orgId 
      GROUP BY severity
      ORDER BY severity
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }),
  ]);

  res.status(200).json({
    totalSettings,
    settingsByCategory,
    totalAlertRules,
    enabledAlertRules,
    alertRulesByCategory,
    alertRulesBySeverity,
  });
});

/**
 * Get data counts for clear data feature
 * GET /api/settings/data-counts
 */
const getDataCounts = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const [
    alertCount,
    alertTimelineEventCount,
    incidentCount,
    incidentTimelineEventCount,
    assetCount,
    threatIntelCount,
    playbookCount,
    notificationCount,
  ] = await Promise.all([
    models.Alert.count({ where: { organizationId } }),
    // Count alert timeline events by getting alert IDs first
    sequelize.query(`
      SELECT COUNT(*) as count 
      FROM alert_timeline_events 
      WHERE alert_id IN (
        SELECT id FROM alerts WHERE organization_id = :orgId
      )
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }).then(result => parseInt(result[0].count) || 0),
    models.Incident.count({ where: { organizationId } }),
    // Count incident timeline events by getting incident IDs first
    sequelize.query(`
      SELECT COUNT(*) as count 
      FROM timeline_events 
      WHERE incident_id IN (
        SELECT id FROM incidents WHERE organization_id = :orgId
      )
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }).then(result => parseInt(result[0].count) || 0),
    models.Asset.count({ where: { organizationId } }),
    models.IOC.count({ where: { organizationId } }),
    models.Playbook.count({ where: { organizationId } }),
    models.Notification.count({ where: { organizationId } }),
  ]);

  res.status(200).json({
    dataCounts: {
      alerts: {
        alerts: alertCount,
        timelineEvents: alertTimelineEventCount,
        total: alertCount + alertTimelineEventCount
      },
      incidents: {
        incidents: incidentCount,
        timelineEvents: incidentTimelineEventCount,
        total: incidentCount + incidentTimelineEventCount
      },
      assets: {
        total: assetCount
      },
      threatIntel: {
        total: threatIntelCount
      },
      playbooks: {
        total: playbookCount
      },
      notifications: {
        total: notificationCount
      }
    }
  });
});

/**
 * Clear specific data type
 * DELETE /api/settings/clear-data/:type
 */
const clearData = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const organizationId = req.user.organizationId;
  const userId = req.user.id;

  // Start transaction for data integrity
  const transaction = await sequelize.transaction();

  try {
    let deletedCount = 0;
    let description = '';

    switch (type) {
      case 'alerts':
        // Clear alert timeline events first (foreign key dependency)
        const alertTimelineDeleted = await sequelize.query(`
          DELETE FROM alert_timeline_events 
          WHERE alert_id IN (
            SELECT id FROM alerts WHERE organization_id = :orgId
          )
        `, {
          replacements: { orgId: organizationId },
          type: sequelize.QueryTypes.DELETE,
          transaction
        });

        // Clear alerts
        const alertsDeleted = await models.Alert.destroy({
          where: { organizationId },
          transaction
        });

        deletedCount = alertsDeleted + (alertTimelineDeleted[1] || 0);
        description = `Cleared ${alertsDeleted} alerts and ${alertTimelineDeleted[1] || 0} timeline events`;
        break;

      case 'incidents':
        // Clear incident timeline events first (foreign key dependency)
        const incidentTimelineDeleted = await sequelize.query(`
          DELETE FROM timeline_events 
          WHERE incident_id IN (
            SELECT id FROM incidents WHERE organization_id = :orgId
          )
        `, {
          replacements: { orgId: organizationId },
          type: sequelize.QueryTypes.DELETE,
          transaction
        });

        // Clear incidents
        const incidentsDeleted = await models.Incident.destroy({
          where: { organizationId },
          transaction
        });

        deletedCount = incidentsDeleted + (incidentTimelineDeleted[1] || 0);
        description = `Cleared ${incidentsDeleted} incidents and ${incidentTimelineDeleted[1] || 0} timeline events`;
        break;

      case 'assets':
        deletedCount = await models.Asset.destroy({
          where: { organizationId },
          transaction
        });
        description = `Cleared ${deletedCount} assets`;
        break;

      case 'threatintel':
        deletedCount = await models.IOC.destroy({
          where: { organizationId },
          transaction
        });
        description = `Cleared ${deletedCount} threat intelligence indicators`;
        break;

      case 'playbooks':
        // Clear playbook activities first (foreign key dependency)
        const playbookActivitiesDeleted = await sequelize.query(`
          DELETE FROM playbook_activities 
          WHERE playbook_id IN (
            SELECT id FROM playbooks WHERE organization_id = :orgId
          )
        `, {
          replacements: { orgId: organizationId },
          type: sequelize.QueryTypes.DELETE,
          transaction
        });

        // Clear playbooks
        const playbooksDeleted = await models.Playbook.destroy({
          where: { organizationId },
          transaction
        });

        deletedCount = playbooksDeleted + (playbookActivitiesDeleted[1] || 0);
        description = `Cleared ${playbooksDeleted} playbooks and ${playbookActivitiesDeleted[1] || 0} activity records`;
        break;

      case 'notifications':
        deletedCount = await models.Notification.destroy({
          where: { organizationId },
          transaction
        });
        description = `Cleared ${deletedCount} notifications`;
        break;

      default:
        await transaction.rollback();
        throw new ValidationError('Invalid data type specified');
    }

    // Commit transaction
    await transaction.commit();

    // Log the clear data activity
    await logSettingsActivity(userId, 'data_cleared', description, {
      dataType: type,
      deletedCount,
      organizationId
    });

    res.status(200).json({
      message: `Successfully cleared ${type}`,
      deletedCount,
      description
    });

  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    throw error;
  }
});

/**
 * Log settings activity
 */
const logSettingsActivity = async (userId, action, description, metadata = {}) => {
  try {
    // Create settings_activities table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS settings_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT
      )
    `);

    await sequelize.query(`
      INSERT INTO settings_activities (user_id, action, description, metadata)
      VALUES (:userId, :action, :description, :metadata)
    `, {
      replacements: {
        userId,
        action,
        description,
        metadata: JSON.stringify(metadata)
      }
    });
  } catch (error) {
    console.error('Failed to log settings activity:', error);
    // Don't throw error - activity logging should not break main functionality
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSetting,
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  toggleAlertRule,
  getSettingsStats,
  getDataCounts,
  clearData,
};