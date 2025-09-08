'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure pgvector extension is enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // List of all tables that should have vector embeddings
    const tables = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'];
    
    for (const tableName of tables) {
      // Check if embedding column exists
      const tableDesc = await queryInterface.describeTable(tableName);
      
      if (tableDesc.embedding) {
        // Drop existing embedding column if it exists
        console.log(`🔄 Dropping existing embedding column from ${tableName}...`);
        await queryInterface.removeColumn(tableName, 'embedding');
      }
      
      // Add proper vector(384) embedding column
      console.log(`✅ Adding vector(384) embedding column to ${tableName}...`);
      await queryInterface.sequelize.query(`
        ALTER TABLE "${tableName}" 
        ADD COLUMN embedding vector(384);
      `);
      
      // Add comment separately
      await queryInterface.sequelize.query(`
        COMMENT ON COLUMN "${tableName}".embedding IS 'Vector embedding for RAG similarity search (384-dimensional)';
      `);
      
      // Create vector similarity index for performance
      console.log(`🚀 Creating vector similarity index on ${tableName}.embedding...`);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "${tableName}_embedding_cosine_idx" 
        ON "${tableName}" USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100);
      `);
    }
    
    console.log('✅ Successfully converted all embedding columns to vector(384) type with indexes');
  },

  async down(queryInterface, Sequelize) {
    const tables = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'];
    
    for (const tableName of tables) {
      // Drop vector indexes
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "${tableName}_embedding_cosine_idx";
      `);
      
      // Drop vector embedding column
      await queryInterface.removeColumn(tableName, 'embedding');
      
      // Add back the old REAL[] column
      await queryInterface.addColumn(tableName, 'embedding', {
        type: Sequelize.ARRAY(Sequelize.REAL),
        allowNull: true,
        comment: 'Vector embedding for RAG similarity search (384-dimensional)'
      });
    }
    
    console.log('✅ Reverted embedding columns back to REAL[] type');
  }
};