'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add severity column
    await queryInterface.addColumn('iocs', 'severity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 5
      }
    });
    
    // Add mitre_attack column
    await queryInterface.addColumn('iocs', 'mitre_attack', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: []
    });
    
    // Add related_campaign column
    await queryInterface.addColumn('iocs', 'related_campaign', {
      type: Sequelize.UUID,
      allowNull: true
    });
    
    // Drop the old confidence column and create new enum confidence
    await queryInterface.removeColumn('iocs', 'confidence');
    await queryInterface.addColumn('iocs', 'confidence', {
      type: Sequelize.ENUM('low', 'medium', 'high', 'very_high'),
      allowNull: false,
      defaultValue: 'medium'
    });
    
    // Update type enum to match model
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_iocs_type RENAME TO enum_iocs_type_old;
    `);
    
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_iocs_type AS ENUM('ip', 'domain', 'url', 'file_hash', 'email', 'registry_key');
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE iocs 
      ALTER COLUMN type TYPE enum_iocs_type 
      USING (
        CASE 
          WHEN type::text = 'ip_address' THEN 'ip'::enum_iocs_type
          WHEN type::text = 'domain' THEN 'domain'::enum_iocs_type
          WHEN type::text = 'url' THEN 'url'::enum_iocs_type
          WHEN type::text = 'file_hash' THEN 'file_hash'::enum_iocs_type
          WHEN type::text = 'email' THEN 'email'::enum_iocs_type
          WHEN type::text = 'registry_key' THEN 'registry_key'::enum_iocs_type
          ELSE 'ip'::enum_iocs_type
        END
      );
    `);
    
    await queryInterface.sequelize.query(`
      DROP TYPE enum_iocs_type_old;
    `);
    
    // Remove threat_types column (not used in model)
    await queryInterface.removeColumn('iocs', 'threat_types');
    
    // Remove false_positive column (not used in model)
    await queryInterface.removeColumn('iocs', 'false_positive');
    
    // Add indexes for new columns
    await queryInterface.addIndex('iocs', ['severity']);
    await queryInterface.addIndex('iocs', ['confidence']);
  },

  async down(queryInterface, Sequelize) {
    // Reverse the changes
    await queryInterface.removeColumn('iocs', 'severity');
    await queryInterface.removeColumn('iocs', 'mitre_attack');
    await queryInterface.removeColumn('iocs', 'related_campaign');
    
    // Restore old confidence as integer
    await queryInterface.removeColumn('iocs', 'confidence');
    await queryInterface.addColumn('iocs', 'confidence', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100
      }
    });
    
    // Restore threat_types
    await queryInterface.addColumn('iocs', 'threat_types', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: []
    });
    
    // Restore false_positive
    await queryInterface.addColumn('iocs', 'false_positive', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  }
};