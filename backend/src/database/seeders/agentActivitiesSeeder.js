'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get the first organization and agents to associate activities with
    const organizations = await queryInterface.sequelize.query(
      'SELECT id FROM organizations LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const agents = await queryInterface.sequelize.query(
      'SELECT id, name, type FROM ai_agents LIMIT 10',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (organizations.length === 0 || agents.length === 0) {
      console.log('No organizations or agents found, skipping agent activities seeder');
      return;
    }

    const organizationId = organizations[0].id;
    
    // Activity templates for different agent types
    const activityTemplates = {
      soc_analyst: [
        {
          title: 'Analyzed security alert for credential stuffing',
          description: 'Processed suspicious login attempts from multiple IP addresses targeting user accounts.',
          activity_type: 'task_completed',
          impact: 'high',
          metadata: { 
            alerts_processed: 15, 
            false_positives: 2, 
            escalated: 3,
            threat_level: 'high',
            confidence: 0.92
          }
        },
        {
          title: 'Updated threat detection rules',
          description: 'Enhanced SIEM rules to improve detection accuracy for phishing campaigns.',
          activity_type: 'learning_update',
          impact: 'medium',
          metadata: { 
            rules_updated: 8, 
            effectiveness_increase: '15%',
            false_positive_reduction: '23%'
          }
        },
        {
          title: 'Collaborated on incident response plan',
          description: 'Worked with security team to refine procedures for ransomware incidents.',
          activity_type: 'collaboration',
          impact: 'high',
          metadata: { 
            team_members: 4, 
            procedures_updated: 12,
            response_time_improvement: '30%'
          }
        }
      ],
      incident_response: [
        {
          title: 'Executed automated containment for malware',
          description: 'Isolated affected endpoints and initiated malware remediation workflow.',
          activity_type: 'task_completed',
          impact: 'high',
          metadata: { 
            endpoints_isolated: 12, 
            malware_samples: 3, 
            containment_time: '4 minutes',
            success_rate: '100%'
          }
        },
        {
          title: 'Updated incident response playbooks',
          description: 'Enhanced automation scripts based on recent incident patterns.',
          activity_type: 'learning_update',
          impact: 'medium',
          metadata: { 
            playbooks_updated: 5, 
            automation_coverage: '85%',
            response_time_reduction: '40%'
          }
        },
        {
          title: 'System maintenance and optimization',
          description: 'Performed routine maintenance on incident response systems.',
          activity_type: 'maintenance',
          impact: 'low',
          metadata: { 
            systems_updated: 8, 
            performance_improvement: '12%',
            uptime: '99.9%'
          }
        }
      ],
      threat_intel: [
        {
          title: 'Enriched IOCs with threat intelligence',
          description: 'Analyzed and contextualized indicators of compromise from multiple feeds.',
          activity_type: 'task_completed',
          impact: 'medium',
          metadata: { 
            iocs_processed: 245, 
            threat_actors_identified: 8, 
            campaigns_tracked: 12,
            confidence_score: 0.87
          }
        },
        {
          title: 'Updated threat actor profiles',
          description: 'Enhanced knowledge base with latest threat actor TTPs and attribution data.',
          activity_type: 'learning_update',
          impact: 'high',
          metadata: { 
            profiles_updated: 15, 
            new_ttps: 23,
            attribution_confidence: '92%'
          }
        },
        {
          title: 'Integration error with external feed',
          description: 'Temporary failure connecting to MISP threat intelligence platform.',
          activity_type: 'error',
          impact: 'low',
          metadata: { 
            error_type: 'connection_timeout', 
            downtime: '15 minutes',
            backup_feeds_active: true,
            resolution: 'automatic_retry'
          }
        }
      ],
      report_generation: [
        {
          title: 'Generated executive security dashboard',
          description: 'Compiled and formatted weekly security metrics for leadership review.',
          activity_type: 'task_completed',
          impact: 'medium',
          metadata: { 
            reports_generated: 3, 
            metrics_included: 28, 
            stakeholders_notified: 12,
            delivery_time: '2 minutes'
          }
        },
        {
          title: 'Improved report template accuracy',
          description: 'Updated reporting algorithms based on feedback from security team.',
          activity_type: 'learning_update',
          impact: 'medium',
          metadata: { 
            templates_updated: 6, 
            accuracy_improvement: '18%',
            user_satisfaction: '94%'
          }
        },
        {
          title: 'Collaborated on compliance reporting',
          description: 'Worked with compliance team to automate regulatory reporting requirements.',
          activity_type: 'collaboration',
          impact: 'high',
          metadata: { 
            compliance_frameworks: ['SOX', 'PCI-DSS'], 
            automation_coverage: '75%',
            time_savings: '20 hours/week'
          }
        }
      ]
    };

    // Human analyst names for collaboration scenarios
    const humanAnalysts = [
      'Sarah Chen', 'Mike Rodriguez', 'Emily Thompson', 'David Kumar', 
      'Lisa Johnson', 'Alex Park', 'Jordan Smith', 'Maya Patel'
    ];

    const activities = [];
    const now = new Date();
    
    // Generate activities for the last 30 days
    for (let day = 0; day < 30; day++) {
      const currentDate = new Date(now);
      currentDate.setDate(now.getDate() - day);
      
      // Vary activity volume by day (weekdays higher, weekends lower)
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const dailyActivityCount = isWeekend ? 
        Math.floor(Math.random() * 3) + 1 : // 1-3 activities on weekends
        Math.floor(Math.random() * 8) + 3;  // 3-10 activities on weekdays

      for (let i = 0; i < dailyActivityCount; i++) {
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const agentType = agent.type || 'soc_analyst';
        const templates = activityTemplates[agentType] || activityTemplates.soc_analyst;
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Create timestamp within the day (business hours more likely)
        const hour = isWeekend ? 
          Math.floor(Math.random() * 24) : // Any hour on weekends
          Math.floor(Math.random() * 10) + 8; // 8 AM - 6 PM on weekdays
        const activityTime = new Date(currentDate);
        activityTime.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

        // Determine if human is involved (30% chance for collaboration activities, 10% for others)
        const humanInvolved = template.activity_type === 'collaboration' ? 
          (Math.random() < 0.8 ? humanAnalysts[Math.floor(Math.random() * humanAnalysts.length)] : null) :
          (Math.random() < 0.1 ? humanAnalysts[Math.floor(Math.random() * humanAnalysts.length)] : null);

        activities.push({
          id: uuidv4(),
          agent_id: agent.id,
          title: template.title,
          description: template.description,
          activity_type: template.activity_type,
          impact: template.impact,
          agent_name: agent.name,
          agent_type: agentType,
          human_involved: humanInvolved,
          action: template.activity_type.replace('_', ' '), // Legacy field
          metadata: JSON.stringify(template.metadata),
          timestamp: activityTime.toISOString()
        });
      }
    }

    // Add some specific high-impact activities for demonstration
    const highImpactActivities = [
      {
        id: uuidv4(),
        agent_id: agents[0].id,
        title: 'Prevented Advanced Persistent Threat infiltration',
        description: 'Detected and blocked sophisticated APT campaign targeting critical infrastructure.',
        activity_type: 'task_completed',
        impact: 'high',
        agent_name: agents[0].name,
        agent_type: agents[0].type || 'soc_analyst',
        human_involved: humanAnalysts[0],
        action: 'task completed',
        metadata: JSON.stringify({
          threat_actor: 'APT29',
          attack_vectors: ['spear_phishing', 'watering_hole'],
          indicators_blocked: 47,
          potential_impact: 'critical_infrastructure',
          collaboration_time: '6 hours',
          threat_level: 'critical'
        }),
        timestamp: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)).toISOString() // 2 days ago
      },
      {
        id: uuidv4(),
        agent_id: agents[1] ? agents[1].id : agents[0].id,
        title: 'Machine learning model optimization completed',
        description: 'Enhanced threat detection algorithms achieving 95% accuracy with reduced false positives.',
        activity_type: 'learning_update',
        impact: 'high',
        agent_name: agents[1] ? agents[1].name : agents[0].name,
        agent_type: agents[1] ? (agents[1].type || 'threat_intel') : 'threat_intel',
        human_involved: humanAnalysts[1],
        action: 'learning update',
        metadata: JSON.stringify({
          model_accuracy: '95.2%',
          false_positive_reduction: '34%',
          training_data_size: '2.3M samples',
          validation_score: 0.94,
          deployment_date: 'scheduled',
          performance_metrics: {
            precision: 0.952,
            recall: 0.943,
            f1_score: 0.947
          }
        }),
        timestamp: new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString() // 1 day ago
      }
    ];

    activities.push(...highImpactActivities);

    // Insert activities in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < activities.length; i += batchSize) {
      const batch = activities.slice(i, i + batchSize);
      await queryInterface.bulkInsert('agent_activities', batch);
    }

    console.log(`Successfully seeded ${activities.length} agent activities`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('agent_activities', null, {});
  }
};