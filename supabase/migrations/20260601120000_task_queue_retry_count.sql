ALTER TABLE public.ai_task_queue
ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;
