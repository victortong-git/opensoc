'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Update existing chat_conversations to include enabledTools in settings
    await queryInterface.sequelize.query(`
      UPDATE chat_conversations 
      SET settings = settings || '{"enabledTools": []}'::jsonb 
      WHERE settings IS NOT NULL 
      AND NOT (settings ? 'enabledTools')
    `);

    // Set default enabled tools for existing conversations (all tools enabled by default)
    const defaultEnabledTools = [
      // Security Alert Tools
      'get_latest_critical_alerts',
      'analyze_alert_trends', 
      'get_alerts_by_asset',
      'search_alerts_by_indicators',
      
      // Incident Tools
      'get_active_incidents',
      'get_incident_details',
      'suggest_incident_response_steps',
      'analyze_incident_patterns',
      'generate_incident_summary_report',
      
      // Reporting Tools
      'generate_security_dashboard_summary',
      'generate_threat_intelligence_report',
      'generate_compliance_report',
      'generate_asset_security_report',
      'generate_executive_summary',
      
      // RAG Tools
      'smart_context_search',
      'find_related_security_data',
      'semantic_playbook_search',
      'contextual_threat_analysis',
      'intelligent_knowledge_extraction',
      
      // Threat Intelligence Tools
      'analyze_threat_indicators',
      'search_threat_intelligence',
      'generate_threat_profile',
      'assess_ioc_quality',
      'detect_threat_campaigns',
      
      // MITRE Attack Tools (existing)
      'search_mitre_techniques',
      'analyze_attack_patterns',
      'get_technique_details',
      'find_related_techniques',
      'generate_threat_hunt_hypotheses',
      'create_detection_rules',
      'assess_coverage',
      'search_threat_groups'
    ];

    await queryInterface.sequelize.query(`
      UPDATE chat_conversations 
      SET settings = jsonb_set(settings, '{enabledTools}', '${JSON.stringify(defaultEnabledTools)}'::jsonb)
      WHERE settings IS NOT NULL 
      AND (settings->'enabledTools')::jsonb = '[]'::jsonb
    `);

    console.log('✅ Updated chat conversation settings with tool preferences');
  },

  async down(queryInterface, Sequelize) {
    // Remove enabledTools from settings
    await queryInterface.sequelize.query(`
      UPDATE chat_conversations 
      SET settings = settings - 'enabledTools'
      WHERE settings IS NOT NULL 
      AND (settings ? 'enabledTools')
    `);

    console.log('✅ Removed tool preferences from chat conversation settings');
  }
};