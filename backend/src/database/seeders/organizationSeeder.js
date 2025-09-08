const { models } = require('../models/index');

const seedOrganizations = async () => {
  const organizationsData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Demo Corporation',
      domain: 'demo.corp',
      settings: {
        timezone: 'UTC',
        alertRetentionDays: 90,
        incidentRetentionDays: 365,
        enableAIAgents: true,
        enablePlaybooks: true,
        threatIntelFeeds: ['misp', 'otx', 'virustotal'],
      },
    },
  ];

  const organizations = await models.Organization.bulkCreate(organizationsData, {
    returning: true,
    ignoreDuplicates: true,
  });

  return organizations;
};

module.exports = { seedOrganizations };