-- Add multi-LLM fields to ai_settings

ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS gcp_credentials jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gcp_project_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gcp_region text DEFAULT 'us-central1';
