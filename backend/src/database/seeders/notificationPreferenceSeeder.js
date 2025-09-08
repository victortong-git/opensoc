const { models } = require('../models/index');

const seedNotificationPreferences = async (organizationId, userId) => {
  // Create default notification preferences for all notification types
  const preferencesData = [
    {
      id: '650e8400-e29b-41d4-a716-446655440001',
      userId,
      organizationId,
      notificationType: 'alert',
      priorityThreshold: 'medium',
      enabledChannels: ['web', 'email'],
      quietHoursEnabled: false,
      emailEnabled: true,
      emailPriorityThreshold: 'high',
      webhookEnabled: false,
      settings: {
        alertTypes: ['malware', 'intrusion', 'data_breach'],
        escalationTimeout: 3600,
        autoAcknowledge: false
      },
      isActive: true,
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440002',
      userId,
      organizationId,
      notificationType: 'incident',
      priorityThreshold: 'low',
      enabledChannels: ['web', 'email'],
      quietHoursEnabled: false,
      emailEnabled: true,
      emailPriorityThreshold: 'medium',
      webhookEnabled: false,
      settings: {
        incidentCategories: ['intrusion', 'data_breach', 'policy_violation'],
        notifyOnStatusChange: true,
        notifyOnAssignment: true
      },
      isActive: true,
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440003',
      userId,
      organizationId,
      notificationType: 'system',
      priorityThreshold: 'medium',
      enabledChannels: ['web'],
      quietHoursEnabled: true,
      quietHoursStart: '22:00:00',
      quietHoursEnd: '08:00:00',
      quietHoursTimezone: 'America/New_York',
      emailEnabled: false,
      emailPriorityThreshold: 'high',
      webhookEnabled: false,
      settings: {
        systemEvents: ['maintenance', 'backup', 'updates'],
        criticalOnly: false
      },
      isActive: true,
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440004',
      userId,
      organizationId,
      notificationType: 'security',
      priorityThreshold: 'low',
      enabledChannels: ['web', 'email'],
      quietHoursEnabled: false,
      emailEnabled: true,
      emailPriorityThreshold: 'medium',
      webhookEnabled: false,
      settings: {
        securityEvents: ['policy_violation', 'access_control', 'authentication'],
        includeRecommendations: true
      },
      isActive: true,
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440005',
      userId,
      organizationId,
      notificationType: 'info',
      priorityThreshold: 'low',
      enabledChannels: ['web'],
      quietHoursEnabled: true,
      quietHoursStart: '18:00:00',
      quietHoursEnd: '09:00:00',
      quietHoursTimezone: 'America/New_York',
      emailEnabled: false,
      emailPriorityThreshold: 'critical',
      webhookEnabled: false,
      settings: {
        infoTypes: ['reports', 'updates', 'ai_insights'],
        digestMode: false
      },
      isActive: true,
    },
  ];

  const preferences = await models.NotificationPreference.bulkCreate(preferencesData, {
    returning: true,
  });

  return preferences;
};

// Create preferences for multiple users
const seedAllNotificationPreferences = async (organizationId, userIds) => {
  const allPreferences = [];
  
  for (const userId of userIds) {
    const userPreferences = await seedNotificationPreferences(organizationId, userId);
    allPreferences.push(...userPreferences);
  }
  
  return allPreferences;
};

module.exports = { 
  seedNotificationPreferences,
  seedAllNotificationPreferences 
};