'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('threat_hunt_mitre_enhancements', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      
      // === RELATIONSHIP ===
      threat_hunt_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'threat_hunts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Reference to the threat hunt this enhancement belongs to',
      },
      
      // === TOOL CALLING METADATA ===
      session_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Unique session ID for the MITRE enhancement process',
      },
      ai_reasoning_effort: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'high',
        comment: 'AI reasoning effort level used for enhancement',
      },
      confidence_score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: 'Overall confidence score for the enhancement (0.00 to 1.00)',
      },
      
      // === MAPPED TECHNIQUES ===
      mapped_techniques: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of mapped MITRE techniques with details',
      },
      
      // === STRUCTURED ANALYSIS ===
      analysis_structured: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Structured analysis with parsed sections',
      },
      original_analysis_text: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Original AI-generated analysis text',
      },
      
      // === DETECTION STRATEGIES ===
      detection_strategies: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of detection strategies for mapped techniques',
      },
      
      // === TOOL CALLING SUMMARY ===
      tool_calling_summary: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Summary of AI tool calling session',
      },
      
      // === PROCESSING METADATA ===
      processing_time_ms: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Time taken for enhancement processing in milliseconds',
      },
      enhancement_timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When the enhancement was completed',
      },
      
      // === VALIDATION TRACKING ===
      human_validated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the enhancement has been validated by a human analyst',
      },
      validation_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Human analyst notes on enhancement validation',
      },
      validated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        comment: 'User who validated the enhancement',
      },
      validated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the enhancement was validated',
      },
      
      // === ORGANIZATIONAL ===
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create indexes
    await queryInterface.addIndex('threat_hunt_mitre_enhancements', ['threat_hunt_id'], {
      unique: true,
      name: 'threat_hunt_mitre_enhancements_hunt_id_unique'
    });
    
    await queryInterface.addIndex('threat_hunt_mitre_enhancements', ['organization_id'], {
      name: 'threat_hunt_mitre_enhancements_organization_id_idx'
    });
    
    await queryInterface.addIndex('threat_hunt_mitre_enhancements', ['session_id'], {
      name: 'threat_hunt_mitre_enhancements_session_id_idx'
    });
    
    await queryInterface.addIndex('threat_hunt_mitre_enhancements', ['enhancement_timestamp'], {
      name: 'threat_hunt_mitre_enhancements_timestamp_idx'
    });
    
    await queryInterface.addIndex('threat_hunt_mitre_enhancements', ['human_validated'], {
      name: 'threat_hunt_mitre_enhancements_validated_idx'
    });

    // GIN indexes for JSONB fields
    await queryInterface.sequelize.query(`
      CREATE INDEX threat_hunt_mitre_enhancements_techniques_gin_idx 
      ON threat_hunt_mitre_enhancements 
      USING gin (mapped_techniques);
    `);
    
    await queryInterface.sequelize.query(`
      CREATE INDEX threat_hunt_mitre_enhancements_strategies_gin_idx 
      ON threat_hunt_mitre_enhancements 
      USING gin (detection_strategies);
    `);
    
    await queryInterface.sequelize.query(`
      CREATE INDEX threat_hunt_mitre_enhancements_analysis_gin_idx 
      ON threat_hunt_mitre_enhancements 
      USING gin (analysis_structured);
    `);

    console.log('✅ Created threat_hunt_mitre_enhancements table with JSONB indexes');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('threat_hunt_mitre_enhancements');
  }
};