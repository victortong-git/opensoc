'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get the first organization and agents for productivity data
    const organizations = await queryInterface.sequelize.query(
      'SELECT id FROM organizations LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const agents = await queryInterface.sequelize.query(
      'SELECT id, name, type FROM ai_agents',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (organizations.length === 0 || agents.length === 0) {
      console.log('No organizations or agents found, skipping agent productivity seeder');
      return;
    }

    const organizationId = organizations[0].id;
    
    // Check if productivity metrics table exists, if not create sample data structure
    try {
      await queryInterface.describeTable('agent_productivity_metrics');
    } catch (error) {
      // Table doesn't exist, create it
      await queryInterface.createTable('agent_productivity_metrics', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        agent_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'ai_agents',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        tasks_completed: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false,
        },
        accuracy_score: {
          type: Sequelize.DECIMAL(5, 4),
          allowNull: true,
        },
        response_time_avg: {
          type: Sequelize.DECIMAL(8, 2),
          allowNull: true,
        },
        collaboration_events: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false,
        },
        learning_updates: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false,
        },
        error_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false,
        },
        uptime_percentage: {
          type: Sequelize.DECIMAL(5, 2),
          defaultValue: 100.00,
          allowNull: false,
        },
        productivity_score: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
        },
        metadata: {
          type: Sequelize.JSONB,
          defaultValue: {},
          allowNull: true,
        },
        organization_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'organizations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        }
      });

      // Add indexes for better query performance
      await queryInterface.addIndex('agent_productivity_metrics', ['agent_id']);
      await queryInterface.addIndex('agent_productivity_metrics', ['date']);
      await queryInterface.addIndex('agent_productivity_metrics', ['organization_id']);
      await queryInterface.addIndex('agent_productivity_metrics', ['agent_id', 'date']);
    }

    const productivityMetrics = [];
    const now = new Date();
    
    // Generate productivity data for each agent over the last 30 days
    agents.forEach(agent => {
      for (let day = 0; day < 30; day++) {
        const currentDate = new Date(now);
        currentDate.setDate(now.getDate() - day);
        
        // Create realistic productivity patterns based on day of week
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        const dayOfWeek = currentDate.getDay();
        
        // Base productivity varies by agent type and day
        let baseProductivity = {
          soc_analyst: isWeekend ? 0.3 : 0.8,
          incident_response: isWeekend ? 0.5 : 0.9, // Higher weekend activity
          threat_intel: isWeekend ? 0.2 : 0.7,
          report_generation: isWeekend ? 0.1 : 0.8
        };
        
        const agentType = agent.type || 'soc_analyst';
        const productivity = baseProductivity[agentType] || 0.8;
        
        // Add some randomness and trends
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        const trendFactor = 1 + (day / 30) * 0.1; // Slight improvement over time
        const finalProductivity = Math.min(1.0, productivity * randomFactor * trendFactor);
        
        // Calculate derived metrics
        const tasksCompleted = Math.floor(finalProductivity * (isWeekend ? 8 : 25) * randomFactor);
        const accuracyScore = Math.min(0.9999, 0.75 + finalProductivity * 0.2 + Math.random() * 0.05);
        const responseTime = (2000 - (finalProductivity * 1500)) + Math.random() * 500; // Lower is better
        const collaborationEvents = Math.floor(finalProductivity * (isWeekend ? 2 : 6) * randomFactor);
        const learningUpdates = Math.floor(finalProductivity * (isWeekend ? 1 : 3) * randomFactor);
        const errorCount = Math.floor((1 - finalProductivity) * 5 * Math.random());
        const uptimePercentage = Math.min(100, 95 + finalProductivity * 5);
        const productivityScore = finalProductivity * 100;

        productivityMetrics.push({
          id: uuidv4(),
          agent_id: agent.id,
          date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
          tasks_completed: tasksCompleted,
          accuracy_score: accuracyScore.toFixed(4),
          response_time_avg: responseTime.toFixed(2),
          collaboration_events: collaborationEvents,
          learning_updates: learningUpdates,
          error_count: errorCount,
          uptime_percentage: uptimePercentage.toFixed(2),
          productivity_score: productivityScore.toFixed(2),
          metadata: JSON.stringify({
            agent_name: agent.name,
            agent_type: agentType,
            day_of_week: dayOfWeek,
            is_weekend: isWeekend,
            peak_hours: [9, 14, 16], // Simulated peak activity hours
            efficiency_rating: finalProductivity > 0.8 ? 'high' : finalProductivity > 0.6 ? 'medium' : 'low',
            workload_distribution: {
              automated_tasks: Math.floor(tasksCompleted * 0.7),
              human_assisted: Math.floor(tasksCompleted * 0.2),
              manual_review: Math.floor(tasksCompleted * 0.1)
            },
            performance_trends: {
              week_over_week: ((Math.random() - 0.5) * 0.2).toFixed(3),
              accuracy_trend: finalProductivity > 0.8 ? 'improving' : 'stable',
              speed_optimization: responseTime < 1000 ? 'excellent' : responseTime < 1500 ? 'good' : 'needs_attention'
            }
          }),
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });

    // Add some special high-performance days for demonstration
    const specialDays = [
      {
        daysAgo: 3,
        reason: 'Major incident response',
        multiplier: 1.8
      },
      {
        daysAgo: 7,
        reason: 'Threat hunting campaign',
        multiplier: 1.5
      },
      {
        daysAgo: 14,
        reason: 'AI model update',
        multiplier: 0.4 // Temporary performance dip during update
      }
    ];

    specialDays.forEach(specialDay => {
      const specialDate = new Date(now);
      specialDate.setDate(now.getDate() - specialDay.daysAgo);
      const dateString = specialDate.toISOString().split('T')[0];
      
      // Update existing metrics for this date
      productivityMetrics.forEach(metric => {
        if (metric.date === dateString) {
          metric.tasks_completed = Math.floor(metric.tasks_completed * specialDay.multiplier);
          metric.collaboration_events = Math.floor(metric.collaboration_events * specialDay.multiplier);
          metric.productivity_score = Math.min(100, parseFloat(metric.productivity_score) * specialDay.multiplier).toFixed(2);
          
          const metadata = JSON.parse(metric.metadata);
          metadata.special_event = specialDay.reason;
          metadata.performance_modifier = specialDay.multiplier;
          metric.metadata = JSON.stringify(metadata);
        }
      });
    });

    // Insert productivity metrics in batches
    const batchSize = 100;
    for (let i = 0; i < productivityMetrics.length; i += batchSize) {
      const batch = productivityMetrics.slice(i, i + batchSize);
      await queryInterface.bulkInsert('agent_productivity_metrics', batch);
    }

    console.log(`Successfully seeded ${productivityMetrics.length} productivity metrics records for time-series charts`);
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('agent_productivity_metrics', null, {});
    } catch (error) {
      // Table might not exist, ignore error
    }
    
    try {
      await queryInterface.dropTable('agent_productivity_metrics');
    } catch (error) {
      // Table might not exist, ignore error
    }
  }
};