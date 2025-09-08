const { Sequelize } = require('sequelize');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'agentic_soc',
  username: process.env.DB_USER || 'agentic',
  password: process.env.DB_PASSWORD || 'secure_password_123',
  dialect: 'postgres',
  dialectOptions: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  pool: {
    max: 20,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  benchmark: process.env.NODE_ENV === 'development',
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
};

// Parse DATABASE_URL if provided (for production deployments)
if (process.env.DATABASE_URL) {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: dbConfig.define,
    pool: dbConfig.pool,
  });
  
  module.exports = sequelize;
} else {
  // Create Sequelize instance with individual config
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      dialectOptions: dbConfig.dialectOptions,
      pool: dbConfig.pool,
      logging: dbConfig.logging,
      benchmark: dbConfig.benchmark,
      define: dbConfig.define,
    }
  );
  
  module.exports = sequelize;
}