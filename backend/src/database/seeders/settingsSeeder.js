const { models } = require('../models/index');

const seedSystemSettings = async (organizationId, adminUserId) => {
  try {
    // Check if settings already exist
    const existingSettings = await models.SystemSettings.findAll({
      where: { organizationId }
    });

    if (existingSettings.length > 0) {
      console.log('System settings already exist, skipping seeding.');
      return existingSettings;
    }

    const systemSettingsData = [
      // System Configuration
      {
        category: 'System',
        name: 'System Name',
        value: 'OpenSOC Security Platform',
        type: 'string',
        description: 'The display name of the security platform',
        isEditable: true,
      },
      {
        category: 'System',
        name: 'Maintenance Mode',
        value: false,
        type: 'boolean',
        description: 'Enable maintenance mode to restrict access',
        isEditable: true,
      },
      {
        category: 'System',
        name: 'Auto-refresh Interval',
        value: 30,
        type: 'number',
        description: 'Dashboard auto-refresh interval in seconds',
        isEditable: true,
      },
      {
        category: 'System',
        name: 'Max Upload Size',
        value: 10485760,
        type: 'number',
        description: 'Maximum file upload size in bytes (10MB)',
        isEditable: true,
      },
      {
        category: 'System',
        name: 'Debug Mode',
        value: false,
        type: 'boolean',
        description: 'Enable debug logging and detailed error messages',
        isEditable: false,
      },

      // Notification Settings
      {
        category: 'Notifications',
        name: 'High Severity Alerts',
        value: true,
        type: 'boolean',
        description: 'Send notifications for high severity alerts (4-5)',
        isEditable: true,
      },
      {
        category: 'Notifications',
        name: 'Incident Updates',
        value: true,
        type: 'boolean',
        description: 'Send notifications when incidents are updated',
        isEditable: true,
      },
      {
        category: 'Notifications',
        name: 'Daily Digest',
        value: false,
        type: 'boolean',
        description: 'Send daily security summary digest',
        isEditable: true,
      },
      {
        category: 'Notifications',
        name: 'Weekly Reports',
        value: true,
        type: 'boolean',
        description: 'Send weekly security reports',
        isEditable: true,
      },
      {
        category: 'Notifications',
        name: 'System Status Alerts',
        value: true,
        type: 'boolean',
        description: 'Send notifications for system health issues',
        isEditable: true,
      },

      // Security Settings
      {
        category: 'Security',
        name: 'Multi-Factor Authentication',
        value: false,
        type: 'boolean',
        description: 'Require MFA for all user accounts',
        isEditable: true,
      },
      {
        category: 'Security',
        name: 'Password Complexity',
        value: true,
        type: 'boolean',
        description: 'Enforce strong password requirements',
        isEditable: false,
      },
      {
        category: 'Security',
        name: 'Session Security',
        value: true,
        type: 'boolean',
        description: 'Enable secure session management',
        isEditable: false,
      },
      {
        category: 'Security',
        name: 'IP Allowlist',
        value: false,
        type: 'boolean',
        description: 'Restrict access to allowed IP addresses only',
        isEditable: true,
      },
      {
        category: 'Security',
        name: 'API Rate Limiting',
        value: true,
        type: 'boolean',
        description: 'Enable API rate limiting protection',
        isEditable: false,
      },

      // Data Retention Settings
      {
        category: 'Retention',
        name: 'Alert Retention Days',
        value: 90,
        type: 'number',
        description: 'Number of days to retain alert data',
        isEditable: true,
      },
      {
        category: 'Retention',
        name: 'Log Retention Days',
        value: 365,
        type: 'number',
        description: 'Number of days to retain log data',
        isEditable: true,
      },
      {
        category: 'Retention',
        name: 'Incident Retention Days',
        value: 730,
        type: 'number',
        description: 'Number of days to retain incident data',
        isEditable: true,
      },
      {
        category: 'Retention',
        name: 'Audit Log Retention Days',
        value: 2555,
        type: 'number',
        description: 'Number of days to retain audit logs (7 years)',
        isEditable: false,
      },
    ];

    const settings = await models.SystemSettings.bulkCreate(
      systemSettingsData.map(setting => ({
        ...setting,
        organizationId,
        updatedBy: adminUserId,
      }))
    );

    return settings;
  } catch (error) {
    console.error('Error seeding system settings:', error);
    throw error;
  }
};

const seedAlertRules = async (organizationId, adminUserId) => {
  try {
    // Check if alert rules already exist
    const existingRules = await models.AlertRule.findAll({
      where: { organizationId }
    });

    if (existingRules.length > 0) {
      console.log('Alert rules already exist, skipping seeding.');
      return existingRules;
    }

    const alertRulesData = [
      {
        name: 'Critical System Failure',
        description: 'Detect critical system failures and outages',
        severity: 5,
        category: 'System',
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: 'system_failure',
            logicalOperator: 'AND'
          },
          {
            field: 'severity',
            operator: 'greater_than',
            value: 4,
            logicalOperator: null
          }
        ],
        actions: [
          {
            type: 'email',
            config: {
              recipients: ['admin@company.com', 'soc-team@company.com'],
              template: 'critical_alert'
            }
          },
          {
            type: 'create_incident',
            config: {
              priority: 'critical',
              assignTo: 'soc_lead'
            }
          }
        ],
        timeWindow: 300,
        threshold: 1,
        isEnabled: true,
        triggerCount: 0,
      },

      {
        name: 'Multiple Failed Login Attempts',
        description: 'Detect brute force authentication attempts',
        severity: 4,
        category: 'Authentication',
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: 'login_failure',
            logicalOperator: 'AND'
          },
          {
            field: 'source_ip',
            operator: 'equals',
            value: '${source_ip}',
            logicalOperator: null
          }
        ],
        actions: [
          {
            type: 'email',
            config: {
              recipients: ['security@company.com'],
              template: 'brute_force_alert'
            }
          },
          {
            type: 'webhook',
            config: {
              url: 'https://hooks.slack.com/services/webhook',
              method: 'POST'
            }
          }
        ],
        timeWindow: 600,
        threshold: 5,
        isEnabled: true,
        triggerCount: 0,
      },

      {
        name: 'Malware Detection',
        description: 'Alert on malware detection from security tools',
        severity: 5,
        category: 'Malware',
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: 'malware_detected',
            logicalOperator: 'OR'
          },
          {
            field: 'threat_type',
            operator: 'contains',
            value: 'malware',
            logicalOperator: null
          }
        ],
        actions: [
          {
            type: 'create_incident',
            config: {
              priority: 'critical',
              category: 'malware'
            }
          },
          {
            type: 'run_playbook',
            config: {
              playbookId: 'malware_response',
              autoExecute: false
            }
          }
        ],
        timeWindow: 60,
        threshold: 1,
        isEnabled: true,
        triggerCount: 0,
      },

      {
        name: 'Unusual Network Traffic',
        description: 'Detect unusual network traffic patterns',
        severity: 3,
        category: 'Network',
        conditions: [
          {
            field: 'bytes_transferred',
            operator: 'greater_than',
            value: 1000000000,
            logicalOperator: 'AND'
          },
          {
            field: 'time_window',
            operator: 'less_than',
            value: 300,
            logicalOperator: null
          }
        ],
        actions: [
          {
            type: 'email',
            config: {
              recipients: ['network-team@company.com'],
              template: 'network_anomaly'
            }
          }
        ],
        timeWindow: 900,
        threshold: 1,
        isEnabled: true,
        triggerCount: 0,
      },

      {
        name: 'Privilege Escalation',
        description: 'Detect potential privilege escalation attempts',
        severity: 4,
        category: 'Access Control',
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: 'privilege_change',
            logicalOperator: 'AND'
          },
          {
            field: 'action',
            operator: 'equals',
            value: 'elevation',
            logicalOperator: null
          }
        ],
        actions: [
          {
            type: 'create_incident',
            config: {
              priority: 'high',
              category: 'access_control'
            }
          },
          {
            type: 'assign_user',
            config: {
              userId: 'security_analyst'
            }
          }
        ],
        timeWindow: 300,
        threshold: 1,
        isEnabled: true,
        triggerCount: 0,
      },

      {
        name: 'Data Exfiltration Pattern',
        description: 'Detect potential data exfiltration based on file access patterns',
        severity: 5,
        category: 'Data Loss Prevention',
        conditions: [
          {
            field: 'file_access_count',
            operator: 'greater_than',
            value: 100,
            logicalOperator: 'AND'
          },
          {
            field: 'file_type',
            operator: 'contains',
            value: 'sensitive',
            logicalOperator: 'AND'
          },
          {
            field: 'access_time',
            operator: 'regex',
            value: '^(0[0-6]|2[2-3])',
            logicalOperator: null
          }
        ],
        actions: [
          {
            type: 'create_incident',
            config: {
              priority: 'critical',
              category: 'data_exfiltration'
            }
          },
          {
            type: 'run_playbook',
            config: {
              playbookId: 'data_breach_response',
              autoExecute: true
            }
          },
          {
            type: 'email',
            config: {
              recipients: ['security-lead@company.com', 'legal@company.com'],
              template: 'data_breach_alert'
            }
          }
        ],
        timeWindow: 1800,
        threshold: 1,
        isEnabled: false,
        triggerCount: 0,
      }
    ];

    const alertRules = await models.AlertRule.bulkCreate(
      alertRulesData.map(rule => ({
        ...rule,
        organizationId,
        createdBy: adminUserId,
      }))
    );

    return alertRules;
  } catch (error) {
    console.error('Error seeding alert rules:', error);
    throw error;
  }
};

module.exports = {
  seedSystemSettings,
  seedAlertRules,
};