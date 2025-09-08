'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'lmstudio' to the enum_ai_providers_type ENUM
    await queryInterface.sequelize.query(
      "ALTER TYPE enum_ai_providers_type ADD VALUE 'lmstudio';"
    );
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing values from ENUMs directly.
    // This would require recreating the ENUM and updating all dependent objects.
    // For simplicity, we'll leave a comment indicating this limitation.
    console.log('Warning: PostgreSQL does not support removing ENUM values directly.');
    console.log('To rollback this migration, you would need to:');
    console.log('1. Create a new ENUM without lmstudio');
    console.log('2. Update the table to use the new ENUM');
    console.log('3. Drop the old ENUM');
    console.log('This rollback is not automated due to complexity.');
  }
};