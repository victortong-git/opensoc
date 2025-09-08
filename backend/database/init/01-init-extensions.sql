-- Initialize database extensions for Agentic SOC
-- This script runs when the PostgreSQL container starts for the first time

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostgreSQL Cryptographic Functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create indexes for vector similarity search
-- These will be created by Sequelize models, but we can prepare the database

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'Agentic SOC database extensions initialized successfully';
    RAISE NOTICE 'Available extensions: vector, uuid-ossp, pgcrypto';
END$$;