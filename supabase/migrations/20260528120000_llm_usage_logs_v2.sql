ALTER TABLE public.llm_usage_logs 
ADD COLUMN IF NOT EXISTS input_text text,
ADD COLUMN IF NOT EXISTS output_text text,
ADD COLUMN IF NOT EXISTS tokens_limit_remaining integer;
