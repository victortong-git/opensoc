'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Updating embedding model to NovaSearch/stella_en_400M_v5 (1024 dimensions)...');
    
    // Ensure pgvector extension is enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // List of all tables that have vector embeddings
    const tables = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'];
    
    for (const tableName of tables) {
      console.log(`🧹 Clearing existing embeddings and updating ${tableName} table...`);
      
      // Drop existing vector indexes first
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "${tableName}_embedding_cosine_idx";
      `);
      
      // Clear all existing embedding data (set to NULL)
      await queryInterface.sequelize.query(`
        UPDATE "${tableName}" SET embedding = NULL;
      `);
      
      // Drop existing embedding column
      await queryInterface.removeColumn(tableName, 'embedding');
      
      // Add new vector(1024) embedding column
      console.log(`✅ Adding vector(1024) embedding column to ${tableName}...`);
      await queryInterface.sequelize.query(`
        ALTER TABLE "${tableName}" 
        ADD COLUMN embedding vector(1024);
      `);
      
      // Add comment for new column
      await queryInterface.sequelize.query(`
        COMMENT ON COLUMN "${tableName}".embedding IS 'Vector embedding for RAG similarity search using NovaSearch/stella_en_400M_v5 (1024-dimensional)';
      `);
      
      // Create optimized vector similarity index for 1024-dimensional vectors
      console.log(`🚀 Creating optimized vector similarity index on ${tableName}.embedding...`);
      await queryInterface.sequelize.query(`
        CREATE INDEX "${tableName}_embedding_cosine_idx" 
        ON "${tableName}" USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100);
      `);
    }
    
    console.log('✅ Successfully updated all tables to use NovaSearch/stella_en_400M_v5 model with vector(1024) embeddings');
    console.log('📊 All existing embedding data has been cleared and will need to be regenerated');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Reverting to previous embedding model (384 dimensions)...');
    
    const tables = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'];
    
    for (const tableName of tables) {
      console.log(`🔄 Reverting ${tableName} table...`);
      
      // Drop 1024-dimensional vector indexes
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "${tableName}_embedding_cosine_idx";
      `);
      
      // Drop 1024-dimensional embedding column
      await queryInterface.removeColumn(tableName, 'embedding');
      
      // Add back the 384-dimensional vector column
      await queryInterface.sequelize.query(`
        ALTER TABLE "${tableName}" 
        ADD COLUMN embedding vector(384);
      `);
      
      // Add comment for reverted column
      await queryInterface.sequelize.query(`
        COMMENT ON COLUMN "${tableName}".embedding IS 'Vector embedding for RAG similarity search (384-dimensional)';
      `);
      
      // Recreate 384-dimensional vector indexes
      await queryInterface.sequelize.query(`
        CREATE INDEX "${tableName}_embedding_cosine_idx" 
        ON "${tableName}" USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100);
      `);
    }
    
    console.log('✅ Successfully reverted all tables to 384-dimensional embeddings');
    console.log('📊 All embedding data has been cleared and will need to be regenerated');
  }
};