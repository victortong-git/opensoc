module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add is_test_data column to assets table
      await queryInterface.addColumn('assets', 'is_test_data', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Flag to identify test/demo data for cleanup purposes',
      }, { transaction });

      // Add is_test_data column to iocs table
      await queryInterface.addColumn('iocs', 'is_test_data', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Flag to identify test/demo data for cleanup purposes',
      }, { transaction });

      // Add is_test_data column to playbooks table
      await queryInterface.addColumn('playbooks', 'is_test_data', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Flag to identify test/demo data for cleanup purposes',
      }, { transaction });

      // Add indexes for performance on test data queries
      await queryInterface.addIndex('assets', ['is_test_data'], {
        name: 'assets_is_test_data_idx',
        transaction,
      });

      await queryInterface.addIndex('iocs', ['is_test_data'], {
        name: 'iocs_is_test_data_idx',
        transaction,
      });

      await queryInterface.addIndex('playbooks', ['is_test_data'], {
        name: 'playbooks_is_test_data_idx',
        transaction,
      });

      // Add composite indexes for common queries
      await queryInterface.addIndex('assets', ['organization_id', 'is_test_data'], {
        name: 'assets_org_test_data_idx',
        transaction,
      });

      await queryInterface.addIndex('iocs', ['organization_id', 'is_test_data'], {
        name: 'iocs_org_test_data_idx',
        transaction,
      });

      await queryInterface.addIndex('playbooks', ['organization_id', 'is_test_data'], {
        name: 'playbooks_org_test_data_idx',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove indexes first
      await queryInterface.removeIndex('assets', 'assets_is_test_data_idx', { transaction });
      await queryInterface.removeIndex('iocs', 'iocs_is_test_data_idx', { transaction });
      await queryInterface.removeIndex('playbooks', 'playbooks_is_test_data_idx', { transaction });
      
      await queryInterface.removeIndex('assets', 'assets_org_test_data_idx', { transaction });
      await queryInterface.removeIndex('iocs', 'iocs_org_test_data_idx', { transaction });
      await queryInterface.removeIndex('playbooks', 'playbooks_org_test_data_idx', { transaction });

      // Remove columns
      await queryInterface.removeColumn('assets', 'is_test_data', { transaction });
      await queryInterface.removeColumn('iocs', 'is_test_data', { transaction });
      await queryInterface.removeColumn('playbooks', 'is_test_data', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};