'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Reverting to 384-dimensional embeddings for Xenova/all-MiniLM-L6-v2 model...');
    
    // Ensure pgvector extension is enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // List of all tables that have vector embeddings
    const tables = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'];
    
    for (const tableName of tables) {
      console.log(`🔄 Updating ${tableName} table to 384 dimensions...`);
      
      // Drop existing vector indexes first
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "${tableName}_embedding_cosine_idx";
      `);
      
      // Clear all existing embedding data (set to NULL) since dimensions are changing
      await queryInterface.sequelize.query(`
        UPDATE "${tableName}" SET embedding = NULL;
      `);
      
      // Drop existing embedding column
      await queryInterface.removeColumn(tableName, 'embedding');
      
      // Add new vector(384) embedding column
      console.log(`✅ Adding vector(384) embedding column to ${tableName}...`);
      await queryInterface.sequelize.query(`
        ALTER TABLE "${tableName}" 
        ADD COLUMN embedding vector(384);
      `);
      
      // Add comment for new column
      await queryInterface.sequelize.query(`
        COMMENT ON COLUMN "${tableName}".embedding IS 'Vector embedding for RAG similarity search using Xenova/all-MiniLM-L6-v2 (384-dimensional)';
      `);
      
      // Create optimized vector similarity index for 384-dimensional vectors
      console.log(`🚀 Creating optimized vector similarity index on ${tableName}.embedding...`);
      await queryInterface.sequelize.query(`
        CREATE INDEX "${tableName}_embedding_cosine_idx" 
        ON "${tableName}" USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100);
      `);
    }
    
    console.log('✅ Successfully updated all tables to use Xenova/all-MiniLM-L6-v2 model with vector(384) embeddings');
    console.log('📊 All existing embedding data has been cleared and will need to be regenerated');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Reverting to 1024-dimensional embeddings...');
    
    const tables = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'];
    
    for (const tableName of tables) {
      console.log(`🔄 Reverting ${tableName} table to 1024 dimensions...`);
      
      // Drop 384-dimensional vector indexes
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "${tableName}_embedding_cosine_idx";
      `);
      
      // Drop 384-dimensional embedding column
      await queryInterface.removeColumn(tableName, 'embedding');
      
      // Add back the 1024-dimensional vector column
      await queryInterface.sequelize.query(`
        ALTER TABLE "${tableName}" 
        ADD COLUMN embedding vector(1024);
      `);
      
      // Add comment for reverted column
      await queryInterface.sequelize.query(`
        COMMENT ON COLUMN "${tableName}".embedding IS 'Vector embedding for RAG similarity search (1024-dimensional)';
      `);
      
      // Recreate 1024-dimensional vector indexes
      await queryInterface.sequelize.query(`
        CREATE INDEX "${tableName}_embedding_cosine_idx" 
        ON "${tableName}" USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100);
      `);
    }
    
    console.log('✅ Successfully reverted all tables to 1024-dimensional embeddings');
  }
};