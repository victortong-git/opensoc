const { createAlertHelper } = require('../../controllers/alerts.controller');
const { createIncidentHelper } = require('../../controllers/incidents.controller');
const { createAssetHelper } = require('../../controllers/assets.controller');
const { createIOCHelper } = require('../../controllers/ioc.controller');
const { createPlaybookHelper } = require('../../controllers/playbooks.controller');
const { createThreatActorBulkHelper, createThreatCampaignBulkHelper } = require('../../controllers/threat-intel.controller');
const { Op } = require('sequelize');

class RecordCreator {
  /**
   * Create records using existing manual creation APIs
   */
  async createRecords(dataType, records, user) {
    const results = {
      success: true,
      createdIds: [],
      errors: [],
      summary: {
        attempted: records.length,
        created: 0,
        failed: 0
      }
    };

    console.log(`📝 Creating ${records.length} ${dataType} records using manual APIs...`);

    try {
      switch (dataType) {
        case 'alert':
          results.createdIds = await this.createAlerts(records, user);
          break;
        case 'incident':
          results.createdIds = await this.createIncidents(records, user);
          break;
        case 'asset':
          results.createdIds = await this.createAssets(records, user);
          break;
        case 'ioc':
          results.createdIds = await this.createIOCs(records, user);
          break;
        case 'playbook':
          results.createdIds = await this.createPlaybooks(records, user);
          break;
        case 'threat_actor':
          results.createdIds = await this.createThreatActors(records, user);
          break;
        case 'threat_campaign':
          results.createdIds = await this.createThreatCampaigns(records, user);
          break;
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      results.summary.created = results.createdIds.length;
      results.summary.failed = results.summary.attempted - results.summary.created;
      results.success = results.summary.failed === 0;

      console.log(`✅ Created ${results.summary.created}/${results.summary.attempted} ${dataType} records`);
      return results;
    } catch (error) {
      console.error(`❌ Failed to create ${dataType} records:`, error.message);
      results.success = false;
      results.errors.push(error.message);
      results.summary.failed = results.summary.attempted;
      return results;
    }
  }

  /**
   * Create alerts using existing helper
   */
  async createAlerts(alerts, user) {
    const createdIds = [];
    
    for (const alertData of alerts) {
      try {
        // Validate and fix enum values
        const validStatuses = ['new', 'investigating', 'resolved', 'false_positive'];
        const correctedStatus = validStatuses.includes(alertData.status) ? alertData.status : 'new';
        
        if (alertData.status && !validStatuses.includes(alertData.status)) {
          console.log(`⚠️ Fixed invalid alert status: ${alertData.status} → ${correctedStatus}`);
        }
        
        // Ensure test data flag is set
        const enrichedData = {
          ...alertData,
          isTestData: true,
          sourceSystem: alertData.sourceSystem || 'TestDataGenerator',
          organizationId: user.organizationId,
          eventTime: alertData.eventTime || new Date(),
          status: correctedStatus,
          enrichmentData: {
            ...alertData.enrichmentData,
            createdBy: `${user.firstName} ${user.lastName}`,
            createdAt: new Date().toISOString(),
            generatedBy: 'AI'
          }
        };

        const createdAlert = await createAlertHelper(enrichedData, user);
        createdIds.push(createdAlert.id);
        console.log(`  ✅ Alert created: ${createdAlert.title} (${createdAlert.id})`);
      } catch (error) {
        console.error(`  ❌ Failed to create alert: ${alertData.title}`, error.message);
        throw error;
      }
    }
    
    return createdIds;
  }

  /**
   * Create incidents using existing helper
   */
  async createIncidents(incidents, user) {
    const createdIds = [];
    
    console.log(`🔧 Creating ${incidents.length} incidents for user ${user.id}`);
    
    for (const incidentData of incidents) {
      try {
        console.log(`🔧 Processing incident: ${incidentData.title}`);
        console.log(`🔧 Original incident data:`, JSON.stringify(incidentData, null, 2));
        
        // Clean up fake alertIds for test incidents
        const processedData = { ...incidentData };
        delete processedData.alertIds; // Remove fake alert references
        processedData.alertCount = 0;
        
        const enrichedData = {
          ...processedData,
          isTestData: true,
          organizationId: user.organizationId,
          assignedTo: processedData.assignedTo || user.id,
          assignedToName: processedData.assignedToName || `${user.firstName} ${user.lastName}`,
          metadata: {
            ...processedData.metadata,
            createdBy: `${user.firstName} ${user.lastName}`,
            createdAt: new Date().toISOString(),
            generatedBy: 'AI'
          }
        };

        console.log(`🔧 Enriched incident data:`, JSON.stringify(enrichedData, null, 2));

        const createdIncident = await createIncidentHelper(enrichedData, user);
        createdIds.push(createdIncident.id);
        console.log(`  ✅ Incident created: ${createdIncident.title} (${createdIncident.id})`);
      } catch (error) {
        console.error(`  ❌ Failed to create incident: ${incidentData.title}`, error.message);
        console.error(`  ❌ Full error:`, error);
        throw error;
      }
    }
    
    console.log(`✅ Successfully created ${createdIds.length} incidents`);
    return createdIds;
  }

  /**
   * Create assets using existing helper
   */
  async createAssets(assets, user) {
    const createdIds = [];
    
    for (const assetData of assets) {
      try {
        const enrichedData = {
          ...assetData,
          isTestData: true,
          organizationId: user.organizationId,
          metadata: {
            ...assetData.metadata,
            createdBy: `${user.firstName} ${user.lastName}`,
            createdAt: new Date().toISOString(),
            generatedBy: 'AI'
          }
        };

        const createdAsset = await createAssetHelper(enrichedData, user);
        createdIds.push(createdAsset.id);
        console.log(`  ✅ Asset created: ${createdAsset.name} (${createdAsset.id})`);
      } catch (error) {
        console.error(`  ❌ Failed to create asset: ${assetData.name}`, error.message);
        throw error;
      }
    }
    
    return createdIds;
  }

  /**
   * Create IOCs using existing helper
   */
  async createIOCs(iocs, user) {
    const createdIds = [];
    
    for (const iocData of iocs) {
      try {
        const enrichedData = {
          ...iocData,
          isTestData: true,
          organizationId: user.organizationId,
          firstSeen: iocData.firstSeen || null,
          lastSeen: iocData.lastSeen || null
        };

        const createdIOC = await createIOCHelper(enrichedData, user);
        createdIds.push(createdIOC.id);
        console.log(`  ✅ IOC created: ${createdIOC.value} (${createdIOC.id})`);
      } catch (error) {
        console.error(`  ❌ Failed to create IOC: ${iocData.value}`, error.message);
        throw error;
      }
    }
    
    return createdIds;
  }

  /**
   * Create playbooks using existing helper
   */
  async createPlaybooks(playbooks, user) {
    const createdIds = [];
    
    for (const playbookData of playbooks) {
      try {
        const enrichedData = {
          ...playbookData,
          isTestData: true,
          organizationId: user.organizationId,
          createdBy: playbookData.createdBy || user.id
        };

        const createdPlaybook = await createPlaybookHelper(enrichedData, user);
        createdIds.push(createdPlaybook.id);
        console.log(`  ✅ Playbook created: ${createdPlaybook.name} (${createdPlaybook.id})`);
      } catch (error) {
        console.error(`  ❌ Failed to create playbook: ${playbookData.name}`, error.message);
        throw error;
      }
    }
    
    return createdIds;
  }

  /**
   * Create threat actors using existing bulk helper
   */
  async createThreatActors(threatActors, user) {
    try {
      const enrichedData = threatActors.map(actor => ({
        ...actor,
        isTestData: true,
        organizationId: user.organizationId
      }));

      const createdIds = await createThreatActorBulkHelper(enrichedData, user, user.organizationId);
      console.log(`  ✅ ${createdIds.length} Threat actors created`);
      return createdIds;
    } catch (error) {
      console.error(`  ❌ Failed to create threat actors:`, error.message);
      throw error;
    }
  }

  /**
   * Create threat campaigns using existing bulk helper
   */
  async createThreatCampaigns(threatCampaigns, user) {
    try {
      console.log(`🔧 Creating ${threatCampaigns.length} threat campaigns for user ${user.id}`);
      console.log(`🔧 Original threat campaigns:`, JSON.stringify(threatCampaigns, null, 2));

      const enrichedData = threatCampaigns.map(campaign => ({
        ...campaign,
        isTestData: true,
        organizationId: user.organizationId
      }));

      console.log(`🔧 Enriched threat campaigns:`, JSON.stringify(enrichedData, null, 2));

      const createdIds = await createThreatCampaignBulkHelper(enrichedData, user, user.organizationId);
      console.log(`  ✅ ${createdIds.length} Threat campaigns created`);
      return createdIds;
    } catch (error) {
      console.error(`  ❌ Failed to create threat campaigns:`, error.message);
      console.error(`  ❌ Full error:`, error);
      throw error;
    }
  }


  /**
   * Verify records exist in database
   */
  async verifyRecords(dataType, recordIds, organizationId) {
    const { models } = require('../../database/models');
    
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return {
        success: false,
        verified: 0,
        expected: 0,
        missing: [],
        error: 'No record IDs provided for verification'
      };
    }

    try {
      const modelMap = {
        alert: models.Alert,
        incident: models.Incident,
        asset: models.Asset,
        ioc: models.IOC,
        playbook: models.Playbook,
        threat_actor: models.ThreatActor,
        threat_campaign: models.ThreatCampaign
      };


      const model = modelMap[dataType];
      if (!model) {
        return {
          success: false,
          verified: 0,
          expected: recordIds.length,
          missing: recordIds,
          error: `Invalid data type: ${dataType}`
        };
      }

      const existingRecords = await model.findAll({
        where: {
          id: { [Op.in]: recordIds },
          organizationId: organizationId,
          isTestData: true
        },
        attributes: ['id']
      });

      const existingIds = existingRecords.map(record => record.id);
      const missingIds = recordIds.filter(id => !existingIds.includes(id));

      return {
        success: missingIds.length === 0,
        verified: existingIds.length,
        expected: recordIds.length,
        missing: missingIds,
        existing: existingIds,
        error: missingIds.length > 0 ? `${missingIds.length} records missing` : null
      };
    } catch (error) {
      console.error(`Database verification failed for ${dataType}:`, error);
      return {
        success: false,
        verified: 0,
        expected: recordIds.length,
        missing: recordIds,
        error: `Database verification error: ${error.message}`
      };
    }
  }
}

module.exports = RecordCreator;