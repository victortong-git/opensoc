'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fix alert_rules table schema to match the model

    // 1. Add missing columns
    await queryInterface.addColumn('alert_rules', 'category', {
      type: Sequelize.STRING(100),
      allowNull: true, // temporarily allow null for migration
    });

    await queryInterface.addColumn('alert_rules', 'actions', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });

    await queryInterface.addColumn('alert_rules', 'threshold', {
      type: Sequelize.INTEGER,
      defaultValue: 1,
    });

    await queryInterface.addColumn('alert_rules', 'trigger_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn('alert_rules', 'last_triggered', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // 2. Migrate data from rule_type to category
    await queryInterface.sequelize.query(`
      UPDATE alert_rules SET category = rule_type::text WHERE category IS NULL;
    `);

    // 3. Make category not null after data migration
    await queryInterface.changeColumn('alert_rules', 'category', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });

    // 4. Add index for category
    await queryInterface.addIndex('alert_rules', ['category']);

    // Note: We're keeping the old columns (rule_type, threshold_value, tags, metadata) 
    // for backward compatibility and in case they're used elsewhere
    
    console.log('✅ Alert rules schema migration completed');
  },

  async down(queryInterface, Sequelize) {
    // Remove the columns we added
    await queryInterface.removeColumn('alert_rules', 'category');
    await queryInterface.removeColumn('alert_rules', 'actions');
    await queryInterface.removeColumn('alert_rules', 'threshold');
    await queryInterface.removeColumn('alert_rules', 'trigger_count');
    await queryInterface.removeColumn('alert_rules', 'last_triggered');
  }
};