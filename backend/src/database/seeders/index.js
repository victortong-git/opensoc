const { models, sequelize } = require('../models/index');
const { seedOrganizations } = require('./organizationSeeder');
const { seedUsers } = require('./userSeeder');
const { seedAssets } = require('./assetSeeder');
const { seedAlerts } = require('./alertSeeder');
const { seedIncidents } = require('./incidentSeeder');
const { seedNotifications } = require('./notificationSeeder');
const { seedAIAgents } = require('./aiAgentSeeder');
const { seedPlaybooks } = require('./playbookSeeder');
const { seedIOCs } = require('./iocSeeder');
const { seedSecurityEvents } = require('./securityEventSeeder');
const { seedThreatActors } = require('./threatActorSeeder');
const { seedComplianceFrameworks } = require('./complianceFrameworkSeeder');
const { seedSystemSettings, seedAlertRules } = require('./settingsSeeder');

const runSeeders = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Initialize database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Sync database models (create tables if they don't exist)
    await sequelize.sync({ alter: false }); // Don't drop existing tables
    console.log('✅ Database tables synchronized.');

    // Seed data in dependency order
    let organizations = await seedOrganizations();
    console.log(`✅ Seeded ${organizations.length} organizations`);
    
    // If no organizations were seeded (they already exist), fetch them
    if (organizations.length === 0) {
      organizations = await models.Organization.findAll();
      console.log(`✅ Found ${organizations.length} existing organizations`);
    }

    let users = await seedUsers(organizations[0].id);
    console.log(`✅ Seeded ${users.length} users`);
    
    // If no users were seeded (they already exist), fetch them
    if (users.length === 0) {
      users = await models.User.findAll({ where: { organizationId: organizations[0].id } });
      console.log(`✅ Found ${users.length} existing users`);
    }

    let assets = await seedAssets(organizations[0].id);
    console.log(`✅ Seeded ${assets.length} assets`);
    
    // If no assets were seeded (they already exist), fetch them
    if (assets.length === 0) {
      assets = await models.Asset.findAll({ where: { organizationId: organizations[0].id } });
      console.log(`✅ Found ${assets.length} existing assets`);
    }

    const alerts = await seedAlerts(organizations[0].id, assets);
    console.log(`✅ Seeded ${alerts.length} alerts`);

    const incidents = await seedIncidents(organizations[0].id, users, alerts, assets);
    console.log(`✅ Seeded ${incidents.length} incidents`);

    // Enable AI agents and playbooks now that models exist
    const notifications = await seedNotifications(organizations[0].id, users[0].id);
    console.log(`✅ Seeded ${notifications.length} notifications`);

    const aiAgents = await seedAIAgents(organizations[0].id);
    console.log(`✅ Seeded ${aiAgents.length} AI agents`);

    // Run AI Agent demo data seeders using Sequelize CLI
    console.log('🤖 Running AI Agents demo data seeders...');
    
    try {
      const { execSync } = require('child_process');
      const seedersPath = require('path').join(__dirname, '..');
      
      // Run migrations first to ensure schema is up to date
      execSync('npx sequelize-cli db:migrate', { 
        cwd: seedersPath + '/../..',
        stdio: 'inherit' 
      });
      
      // Run the AI agents demo data seeders
      execSync('npx sequelize-cli db:seed --seed agentActivitiesSeeder.js', { 
        cwd: seedersPath + '/../..',
        stdio: 'inherit' 
      });
      
      execSync('npx sequelize-cli db:seed --seed humanAiTeamsSeeder.js', { 
        cwd: seedersPath + '/../..',
        stdio: 'inherit' 
      });
      
      execSync('npx sequelize-cli db:seed --seed agentProductivitySeeder.js', { 
        cwd: seedersPath + '/../..',
        stdio: 'inherit' 
      });
      
      console.log('✅ AI Agents demo data seeders completed successfully');
    } catch (error) {
      console.warn('⚠️ AI Agents demo data seeders failed (tables may not exist yet):', error.message);
    }

    const playbooks = await seedPlaybooks(organizations[0].id, users[0].id);
    console.log(`✅ Seeded ${playbooks.length} playbooks`);

    const iocs = await seedIOCs(organizations[0].id);
    console.log(`✅ Seeded ${iocs.length} IOCs`);

    const systemSettings = await seedSystemSettings(organizations[0].id, users[0].id);
    console.log(`✅ Seeded ${systemSettings.length} system settings`);

    const alertRules = await seedAlertRules(organizations[0].id, users[0].id);
    console.log(`✅ Seeded ${alertRules.length} alert rules`);

    // Skip security events - schema mismatch  
    // const securityEvents = await seedSecurityEvents(organizations[0].id, assets);
    // console.log(`✅ Seeded ${securityEvents.length} security events`);

    // Skip threat actors and compliance frameworks for now - models don't exist yet
    // const threatActors = await seedThreatActors(organizations[0].id);
    // console.log(`✅ Seeded ${threatActors.length} threat actors`);

    // const complianceFrameworks = await seedComplianceFrameworks(organizations[0].id);
    // console.log(`✅ Seeded ${complianceFrameworks.length} compliance frameworks`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📊 Seeding Summary:');
    console.log(`  - Organizations: ${organizations.length}`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Assets: ${assets.length}`);
    console.log(`  - Alerts: ${alerts.length}`);
    console.log(`  - Incidents: ${incidents.length}`);
    console.log(`  - Notifications: ${notifications.length}`);
    console.log(`  - AI Agents: ${aiAgents.length}`);
    console.log(`  - Playbooks: ${playbooks.length}`);
    console.log(`  - IOCs: ${iocs.length}`);
    console.log(`  - System Settings: ${systemSettings.length}`);
    console.log(`  - Alert Rules: ${alertRules.length}`);
    console.log('');
    console.log('Default login credentials:');
    console.log('Username: admin');
    console.log('Password: password');
    console.log('');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Run seeders if called directly
if (require.main === module) {
  runSeeders()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { runSeeders };