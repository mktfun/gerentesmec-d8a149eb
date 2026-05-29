CREATE TABLE public.ai_task_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text,
  message_id text,
  content_preview text,
  sender_type text,
  status text NOT NULL DEFAULT 'pending',
  provider text,
  model text,
  latency_ms integer,
  tokens_used integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX idx_ai_task_queue_created_at ON public.ai_task_queue (created_at DESC);
CREATE INDEX idx_ai_task_queue_status ON public.ai_task_queue (status);

GRANT SELECT ON public.ai_task_queue TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_task_queue TO authenticated;
GRANT ALL ON public.ai_task_queue TO service_role;

ALTER TABLE public.ai_task_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for ai_task_queue"
  ON public.ai_task_queue FOR ALL
  USING (true) WITH CHECK (true);

ALTER TABLE public.ai_task_queue REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_task_queue;