'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add security_event_type column to alerts table
    await queryInterface.addColumn('alerts', 'security_event_type', {
      type: Sequelize.ENUM(
        // Network & Traffic
        'network_intrusion',
        'ddos_attack', 
        'port_scan',
        'suspicious_traffic',
        'dns_tunneling',
        'lateral_movement',
        
        // Malware & Threats
        'malware_detection',
        'ransomware',
        'trojan',
        'virus',
        'rootkit',
        'botnet_activity',
        'phishing',
        
        // Authentication & Access
        'authentication_failure',
        'privilege_escalation',
        'unauthorized_access',
        'account_compromise',
        'brute_force_attack',
        'credential_theft',
        
        // Data & Exfiltration
        'data_exfiltration',
        'data_breach',
        'data_loss_prevention',
        'unauthorized_data_access',
        
        // System & Host
        'suspicious_process',
        'system_compromise',
        'file_integrity_violation',
        'registry_modification',
        'service_manipulation',
        
        // Application & Web
        'web_attack',
        'sql_injection',
        'xss_attack',
        'application_vulnerability',
        'api_abuse',
        
        // Policy & Compliance
        'policy_violation',
        'compliance_violation',
        'configuration_violation',
        'security_control_bypass',
        
        // Insider & Internal
        'insider_threat',
        'user_behavior_anomaly',
        'data_misuse',
        'unauthorized_software',
        
        // Infrastructure
        'vulnerability_exploitation',
        'system_misconfiguration',
        'patch_management_failure',
        
        // General & Status
        'security_incident',
        'suspicious_activity',
        'anomaly_detection',
        'unknown',
        'pending'
      ),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Classification of security event type for SOC analysis and incident response'
    });

    // Add index for security_event_type for performance
    await queryInterface.addIndex('alerts', ['security_event_type']);
    
    // Add composite index for status and security_event_type
    await queryInterface.addIndex('alerts', ['status', 'security_event_type']);
    
    // Add composite index for severity and security_event_type  
    await queryInterface.addIndex('alerts', ['severity', 'security_event_type']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('alerts', ['security_event_type']);
    await queryInterface.removeIndex('alerts', ['status', 'security_event_type']);
    await queryInterface.removeIndex('alerts', ['severity', 'security_event_type']);
    
    // Remove the column
    await queryInterface.removeColumn('alerts', 'security_event_type');
  }
};