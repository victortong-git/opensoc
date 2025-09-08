-- Create ai_agent_logs table
CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id SERIAL PRIMARY KEY,
  agent_name VARCHAR(100) NOT NULL,
  task_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  alert_id UUID,
  incident_id UUID,
  ai_provider VARCHAR(50),
  ai_model VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for ai_agent_logs
CREATE INDEX IF NOT EXISTS ai_agent_logs_agent_name_idx ON ai_agent_logs (agent_name);
CREATE INDEX IF NOT EXISTS ai_agent_logs_task_name_idx ON ai_agent_logs (task_name);
CREATE INDEX IF NOT EXISTS ai_agent_logs_user_id_idx ON ai_agent_logs (user_id);
CREATE INDEX IF NOT EXISTS ai_agent_logs_organization_id_idx ON ai_agent_logs (organization_id);
CREATE INDEX IF NOT EXISTS ai_agent_logs_created_at_idx ON ai_agent_logs (created_at);
CREATE INDEX IF NOT EXISTS ai_agent_logs_success_idx ON ai_agent_logs (success);
CREATE INDEX IF NOT EXISTS ai_agent_logs_agent_name_created_at_idx ON ai_agent_logs (agent_name, created_at);
CREATE INDEX IF NOT EXISTS ai_agent_logs_organization_id_created_at_idx ON ai_agent_logs (organization_id, created_at);
CREATE INDEX IF NOT EXISTS ai_agent_logs_alert_id_idx ON ai_agent_logs (alert_id);
CREATE INDEX IF NOT EXISTS ai_agent_logs_incident_id_idx ON ai_agent_logs (incident_id);

-- Create ai_agent_interactions table
CREATE TABLE IF NOT EXISTS ai_agent_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_log_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  interaction_type VARCHAR(10) NOT NULL CHECK (interaction_type IN ('like', 'comment')),
  comment_text TEXT,
  parent_comment_id UUID,
  mentioned_users UUID[],
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for ai_agent_interactions
CREATE INDEX IF NOT EXISTS ai_agent_interactions_agent_log_id_idx ON ai_agent_interactions (agent_log_id);
CREATE INDEX IF NOT EXISTS ai_agent_interactions_user_id_idx ON ai_agent_interactions (user_id);
CREATE INDEX IF NOT EXISTS ai_agent_interactions_interaction_type_idx ON ai_agent_interactions (interaction_type);
CREATE INDEX IF NOT EXISTS ai_agent_interactions_created_at_idx ON ai_agent_interactions (created_at);
CREATE INDEX IF NOT EXISTS ai_agent_interactions_parent_comment_id_idx ON ai_agent_interactions (parent_comment_id);
CREATE INDEX IF NOT EXISTS ai_agent_interactions_agent_log_id_interaction_type_idx ON ai_agent_interactions (agent_log_id, interaction_type);
CREATE INDEX IF NOT EXISTS ai_agent_interactions_agent_log_id_created_at_idx ON ai_agent_interactions (agent_log_id, created_at);

-- Add unique constraint for likes
ALTER TABLE ai_agent_interactions 
ADD CONSTRAINT IF NOT EXISTS unique_user_like_per_activity 
UNIQUE (agent_log_id, user_id, interaction_type) 
DEFERRABLE INITIALLY DEFERRED;

-- Add new columns to ai_agents table if they don't exist
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500);
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]';
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS social_metrics JSONB DEFAULT '{}';
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS first_activity_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS total_activities INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS total_likes_received INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS total_comments_received INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS avg_execution_time_ms INTEGER;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS success_rate_percentage DECIMAL(5,2);

-- Create indexes for new ai_agents columns
CREATE INDEX IF NOT EXISTS ai_agents_is_active_idx ON ai_agents (is_active);
CREATE INDEX IF NOT EXISTS ai_agents_total_activities_idx ON ai_agents (total_activities);
CREATE INDEX IF NOT EXISTS ai_agents_total_likes_received_idx ON ai_agents (total_likes_received);
CREATE INDEX IF NOT EXISTS ai_agents_success_rate_percentage_idx ON ai_agents (success_rate_percentage);
CREATE INDEX IF NOT EXISTS ai_agents_last_interaction_at_idx ON ai_agents (last_interaction_at);
CREATE INDEX IF NOT EXISTS ai_agents_organization_id_is_active_idx ON ai_agents (organization_id, is_active);