const { asyncHandler, ValidationError } = require('../middleware/error.middleware');
const RecordCreator = require('../services/testData/recordCreator');
const { sequelize } = require('../database/models');

const recordCreator = new RecordCreator();

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

/**
 * Create test alerts from generated data
 * POST /api/test-data/alerts
 */
const createTestAlerts = asyncHandler(async (req, res) => {
  const user = req.user;
  const { alerts } = req.body;

  if (!Array.isArray(alerts) || alerts.length === 0) {
    throw new ValidationError('Request body must contain a non-empty alerts array');
  }

  const alertsData = alerts;

  try {
    console.log(`📋 Creating ${alertsData.length} test alerts from UI import...`);
    console.log(`📋 Alert data sample:`, JSON.stringify(alertsData[0], null, 2));
    
    const result = await recordCreator.createRecords('alert', alertsData, user);
    
    if (result.success) {
      await logTestDataActivity(
        user.id,
        'test_alerts_created',
        `Created ${result.summary.created} test alerts via UI import`,
        { count: result.summary.created, failed: result.summary.failed, source: 'ui_import' }
      );
    }

    console.log(`✅ Alert creation completed: ${result.summary.created}/${result.summary.attempted} successful`);

    res.status(200).json({
      success: result.success,
      message: `Successfully created ${result.summary.created} of ${result.summary.attempted} test alerts`,
      summary: result.summary,
      createdIds: result.createdIds,
      errors: result.errors
    });
  } catch (error) {
    console.error('❌ Failed to create test alerts:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      alertsCount: alertsData?.length,
      userId: user?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create test alerts: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Create test incidents from generated data
 * POST /api/test-data/incidents
 */
const createTestIncidents = asyncHandler(async (req, res) => {
  const user = req.user;
  const { incidents } = req.body;

  if (!Array.isArray(incidents) || incidents.length === 0) {
    throw new ValidationError('Request body must contain a non-empty incidents array');
  }

  const incidentsData = incidents;

  try {
    console.log(`📋 Creating ${incidentsData.length} test incidents...`);
    const result = await recordCreator.createRecords('incident', incidentsData, user);
    
    if (result.success) {
      await logTestDataActivity(
        user.id,
        'test_incidents_created',
        `Created ${result.summary.created} test incidents`,
        { count: result.summary.created, failed: result.summary.failed }
      );
    }

    res.status(200).json({
      success: result.success,
      message: `Successfully created ${result.summary.created} of ${result.summary.attempted} test incidents`,
      summary: result.summary,
      createdIds: result.createdIds,
      errors: result.errors
    });
  } catch (error) {
    console.error('Failed to create test incidents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test incidents: ' + error.message
    });
  }
});

/**
 * Create test assets from generated data
 * POST /api/test-data/assets
 */
const createTestAssets = asyncHandler(async (req, res) => {
  const user = req.user;
  const { assets } = req.body;

  if (!Array.isArray(assets) || assets.length === 0) {
    throw new ValidationError('Request body must contain a non-empty assets array');
  }

  const assetsData = assets;

  try {
    console.log(`📋 Creating ${assetsData.length} test assets...`);
    const result = await recordCreator.createRecords('asset', assetsData, user);
    
    if (result.success) {
      await logTestDataActivity(
        user.id,
        'test_assets_created',
        `Created ${result.summary.created} test assets`,
        { count: result.summary.created, failed: result.summary.failed }
      );
    }

    res.status(200).json({
      success: result.success,
      message: `Successfully created ${result.summary.created} of ${result.summary.attempted} test assets`,
      summary: result.summary,
      createdIds: result.createdIds,
      errors: result.errors
    });
  } catch (error) {
    console.error('Failed to create test assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test assets: ' + error.message
    });
  }
});

/**
 * Create test IOCs from generated data
 * POST /api/test-data/iocs
 */
const createTestIOCs = asyncHandler(async (req, res) => {
  const user = req.user;
  const { iocs } = req.body;

  if (!Array.isArray(iocs) || iocs.length === 0) {
    throw new ValidationError('Request body must contain a non-empty iocs array');
  }

  const iocsData = iocs;

  try {
    console.log(`📋 Creating ${iocsData.length} test IOCs...`);
    const result = await recordCreator.createRecords('ioc', iocsData, user);
    
    if (result.success) {
      await logTestDataActivity(
        user.id,
        'test_iocs_created',
        `Created ${result.summary.created} test IOCs`,
        { count: result.summary.created, failed: result.summary.failed }
      );
    }

    res.status(200).json({
      success: result.success,
      message: `Successfully created ${result.summary.created} of ${result.summary.attempted} test IOCs`,
      summary: result.summary,
      createdIds: result.createdIds,
      errors: result.errors
    });
  } catch (error) {
    console.error('Failed to create test IOCs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test IOCs: ' + error.message
    });
  }
});

/**
 * Create test playbooks from generated data
 * POST /api/test-data/playbooks
 */
const createTestPlaybooks = asyncHandler(async (req, res) => {
  const user = req.user;
  const { playbooks } = req.body;

  if (!Array.isArray(playbooks) || playbooks.length === 0) {
    throw new ValidationError('Request body must contain a non-empty playbooks array');
  }

  const playbooksData = playbooks;

  try {
    console.log(`📋 Creating ${playbooksData.length} test playbooks...`);
    const result = await recordCreator.createRecords('playbook', playbooksData, user);
    
    if (result.success) {
      await logTestDataActivity(
        user.id,
        'test_playbooks_created',
        `Created ${result.summary.created} test playbooks`,
        { count: result.summary.created, failed: result.summary.failed }
      );
    }

    res.status(200).json({
      success: result.success,
      message: `Successfully created ${result.summary.created} of ${result.summary.attempted} test playbooks`,
      summary: result.summary,
      createdIds: result.createdIds,
      errors: result.errors
    });
  } catch (error) {
    console.error('Failed to create test playbooks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test playbooks: ' + error.message
    });
  }
});

/**
 * Create test threat actors from generated data
 * POST /api/test-data/threat-actors
 */
const createTestThreatActors = asyncHandler(async (req, res) => {
  const user = req.user;
  const { threat_actors } = req.body;

  if (!Array.isArray(threat_actors) || threat_actors.length === 0) {
    throw new ValidationError('Request body must contain a non-empty threat_actors array');
  }

  const threatActorsData = threat_actors;

  try {
    console.log(`📋 Creating ${threatActorsData.length} test threat actors...`);
    const result = await recordCreator.createRecords('threat_actor', threatActorsData, user);
    
    if (result.success) {
      await logTestDataActivity(
        user.id,
        'test_threat_actors_created',
        `Created ${result.summary.created} test threat actors`,
        { count: result.summary.created, failed: result.summary.failed }
      );
    }

    res.status(200).json({
      success: result.success,
      message: `Successfully created ${result.summary.created} of ${result.summary.attempted} test threat actors`,
      summary: result.summary,
      createdIds: result.createdIds,
      errors: result.errors
    });
  } catch (error) {
    console.error('Failed to create test threat actors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test threat actors: ' + error.message
    });
  }
});

/**
 * Create test threat campaigns from generated data
 * POST /api/test-data/threat-campaigns
 */
const createTestThreatCampaigns = asyncHandler(async (req, res) => {
  const user = req.user;
  const { threat_campaigns } = req.body;

  if (!Array.isArray(threat_campaigns) || threat_campaigns.length === 0) {
    throw new ValidationError('Request body must contain a non-empty threat_campaigns array');
  }

  const threatCampaignsData = threat_campaigns;

  try {
    console.log(`📋 Creating ${threatCampaignsData.length} test threat campaigns...`);
    const result = await recordCreator.createRecords('threat_campaign', threatCampaignsData, user);
    
    if (result.success) {
      await logTestDataActivity(
        user.id,
        'test_threat_campaigns_created',
        `Created ${result.summary.created} test threat campaigns`,
        { count: result.summary.created, failed: result.summary.failed }
      );
    }

    res.status(200).json({
      success: result.success,
      message: `Successfully created ${result.summary.created} of ${result.summary.attempted} test threat campaigns`,
      summary: result.summary,
      createdIds: result.createdIds,
      errors: result.errors
    });
  } catch (error) {
    console.error('Failed to create test threat campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test threat campaigns: ' + error.message
    });
  }
});

module.exports = {
  createTestAlerts,
  createTestIncidents,
  createTestAssets,
  createTestIOCs,
  createTestPlaybooks,
  createTestThreatActors,
  createTestThreatCampaigns,
};