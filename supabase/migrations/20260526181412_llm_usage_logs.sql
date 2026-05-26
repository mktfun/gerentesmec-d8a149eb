CREATE TABLE public.llm_usage_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    provider text NOT NULL,
    model text NOT NULL,
    status text NOT NULL CHECK (status IN ('success', 'error')),
    error_message text,
    latency_ms integer,
    tokens_used integer
);

CREATE INDEX idx_llm_usage_logs_created_at ON public.llm_usage_logs (created_at);
