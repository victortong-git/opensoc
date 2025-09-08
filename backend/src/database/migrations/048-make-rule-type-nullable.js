'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Make rule_type nullable and set default values for existing rows
    await queryInterface.changeColumn('alert_rules', 'rule_type', {
      type: Sequelize.ENUM('threshold', 'anomaly', 'correlation', 'signature'),
      allowNull: true,
      defaultValue: 'threshold'
    });

    console.log('✅ Made rule_type nullable with default value');
  },

  async down(queryInterface, Sequelize) {
    // Revert back to not null
    await queryInterface.changeColumn('alert_rules', 'rule_type', {
      type: Sequelize.ENUM('threshold', 'anomaly', 'correlation', 'signature'),
      allowNull: false
    });
  }
};