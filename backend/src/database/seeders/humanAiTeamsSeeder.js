'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get the first organization and available agents
    const organizations = await queryInterface.sequelize.query(
      'SELECT id FROM organizations LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const agents = await queryInterface.sequelize.query(
      'SELECT id, name, type FROM ai_agents',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (organizations.length === 0 || agents.length === 0) {
      console.log('No organizations or agents found, skipping human-AI teams seeder');
      return;
    }

    const organizationId = organizations[0].id;
    
    // Create human-AI teams with realistic collaboration data
    const teams = [
      {
        id: uuidv4(),
        name: 'Threat Hunting Task Force',
        specialization: 'threat_hunting',
        description: 'Elite team combining human expertise with AI-powered threat detection to proactively hunt for advanced persistent threats and zero-day attacks.',
        human_analysts: ['Sarah Chen', 'Mike Rodriguez', 'Emily Thompson'],
        ai_agents: agents.slice(0, 2).map(agent => agent.id),
        team_lead: 'Sarah Chen',
        current_workload: 78,
        max_workload: 100,
        performance_metrics: {
          threats_detected: 47,
          false_positive_rate: 0.12,
          average_detection_time: '2.3 hours',
          collaboration_efficiency: 0.92,
          human_ai_synergy_score: 0.89,
          monthly_improvement: '15%',
          threat_attribution_accuracy: '94%',
          proactive_hunts: 23,
          reactive_investigations: 15,
          knowledge_base_contributions: 156,
          training_hours_ai: 48.5,
          training_hours_human: 32.0
        },
        created_date: new Date(Date.now() - (45 * 24 * 60 * 60 * 1000)), // 45 days ago
        last_activity: new Date(Date.now() - (2 * 60 * 60 * 1000)), // 2 hours ago
        organization_id: organizationId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Incident Response Alpha',
        specialization: 'incident_response',
        description: 'Rapid response team leveraging AI automation for immediate threat containment and human expertise for complex decision-making during critical security incidents.',
        human_analysts: ['David Kumar', 'Lisa Johnson', 'Alex Park'],
        ai_agents: agents.slice(2, 4).map(agent => agent.id),
        team_lead: 'David Kumar',
        current_workload: 45,
        max_workload: 120,
        performance_metrics: {
          incidents_resolved: 134,
          average_response_time: '8.7 minutes',
          containment_success_rate: 0.97,
          collaboration_efficiency: 0.85,
          human_ai_synergy_score: 0.91,
          automation_coverage: '73%',
          manual_intervention_rate: '27%',
          escalation_accuracy: '96%',
          playbook_execution_rate: 0.89,
          false_escalations: 6,
          critical_incidents: 8,
          customer_satisfaction: 4.7
        },
        created_date: new Date(Date.now() - (60 * 24 * 60 * 60 * 1000)), // 60 days ago
        last_activity: new Date(Date.now() - (30 * 60 * 1000)), // 30 minutes ago
        organization_id: organizationId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Intelligence Fusion Center',
        specialization: 'vulnerability_management',
        description: 'Specialized team integrating human analytical skills with AI-driven vulnerability assessment to prioritize and remediate security weaknesses across the enterprise.',
        human_analysts: ['Jordan Smith', 'Maya Patel'],
        ai_agents: agents.slice(4, 6).map(agent => agent.id),
        team_lead: 'Maya Patel',
        current_workload: 92,
        max_workload: 80,
        performance_metrics: {
          vulnerabilities_assessed: 2847,
          critical_vulns_patched: 156,
          risk_score_accuracy: 0.94,
          collaboration_efficiency: 0.88,
          human_ai_synergy_score: 0.83,
          patch_prioritization_accuracy: '91%',
          false_positive_reduction: '38%',
          mean_time_to_patch: '4.2 days',
          compliance_score: 0.96,
          threat_context_integration: 0.87,
          vendor_coordination_efficiency: 0.79,
          asset_coverage: '98.5%'
        },
        created_date: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)), // 30 days ago
        last_activity: new Date(Date.now() - (15 * 60 * 1000)), // 15 minutes ago
        organization_id: organizationId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Compliance Automation Squad',
        specialization: 'compliance',
        description: 'Cross-functional team combining regulatory expertise with AI-powered compliance monitoring to ensure continuous adherence to security standards and frameworks.',
        human_analysts: ['Emily Thompson', 'Mike Rodriguez'],
        ai_agents: agents.slice(6, 8).map(agent => agent.id),
        team_lead: 'Emily Thompson',
        current_workload: 67,
        max_workload: 90,
        performance_metrics: {
          compliance_checks: 1456,
          policy_violations_detected: 89,
          audit_readiness_score: 0.93,
          collaboration_efficiency: 0.79,
          human_ai_synergy_score: 0.86,
          automated_reporting_coverage: '82%',
          regulatory_frameworks: ['SOX', 'PCI-DSS', 'GDPR', 'HIPAA'],
          control_effectiveness: 0.91,
          remediation_tracking: 0.88,
          stakeholder_satisfaction: 4.4,
          documentation_accuracy: '95%',
          audit_preparation_time: '40% reduction'
        },
        created_date: new Date(Date.now() - (21 * 24 * 60 * 60 * 1000)), // 21 days ago
        last_activity: new Date(Date.now() - (4 * 60 * 60 * 1000)), // 4 hours ago
        organization_id: organizationId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Digital Forensics Unit',
        specialization: 'forensics',
        description: 'Expert forensic investigators working alongside AI analysis tools to conduct deep-dive investigations into security breaches and criminal activities.',
        human_analysts: ['Sarah Chen', 'David Kumar', 'Jordan Smith'],
        ai_agents: agents.slice(8).map(agent => agent.id),
        team_lead: 'Jordan Smith',
        current_workload: 34,
        max_workload: 60,
        performance_metrics: {
          cases_investigated: 23,
          evidence_collected_gb: 1247,
          chain_of_custody_integrity: 1.0,
          collaboration_efficiency: 0.94,
          human_ai_synergy_score: 0.87,
          analysis_accuracy: '97%',
          timeline_reconstruction: 0.92,
          malware_family_identification: 0.89,
          attribution_confidence: 0.78,
          court_admissible_reports: 18,
          investigation_time_reduction: '35%',
          tool_automation_coverage: '65%'
        },
        created_date: new Date(Date.now() - (14 * 24 * 60 * 60 * 1000)), // 14 days ago
        last_activity: new Date(Date.now() - (6 * 60 * 60 * 1000)), // 6 hours ago
        organization_id: organizationId,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Strategic Threat Intelligence',
        specialization: 'threat_hunting',
        description: 'Strategic intelligence team focusing on long-term threat landscape analysis and predictive security modeling using advanced AI capabilities.',
        human_analysts: ['Lisa Johnson', 'Alex Park'],
        ai_agents: agents.slice(0, 3).map(agent => agent.id),
        team_lead: 'Lisa Johnson',
        current_workload: 56,
        max_workload: 75,
        performance_metrics: {
          intelligence_reports: 89,
          threat_actor_profiles: 34,
          campaign_tracking: 67,
          collaboration_efficiency: 0.91,
          human_ai_synergy_score: 0.95,
          prediction_accuracy: '88%',
          intelligence_timeliness: 0.84,
          source_credibility_assessment: 0.92,
          strategic_insights: 145,
          tactical_recommendations: 267,
          threat_landscape_coverage: '93%',
          stakeholder_briefings: 24
        },
        created_date: new Date(Date.now() - (35 * 24 * 60 * 60 * 1000)), // 35 days ago
        last_activity: new Date(Date.now() - (1 * 60 * 60 * 1000)), // 1 hour ago
        organization_id: organizationId,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Convert performance_metrics to JSON strings and ensure ai_agents are properly formatted for PostgreSQL
    const formattedTeams = teams.map(team => ({
      ...team,
      ai_agents: `{${team.ai_agents.join(',')}}`, // Format as PostgreSQL array
      performance_metrics: JSON.stringify(team.performance_metrics)
    }));

    await queryInterface.bulkInsert('human_ai_teams', formattedTeams);

    console.log(`Successfully seeded ${teams.length} human-AI teams with collaboration data`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('human_ai_teams', null, {});
  }
};