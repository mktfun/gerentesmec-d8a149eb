CREATE TABLE IF NOT EXISTS public.daily_digests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  target_date DATE NOT NULL,
  summary_text TEXT NOT NULL,
  leads_processed INT DEFAULT 0
);

ALTER TABLE public.daily_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON public.daily_digests
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for service role only"
  ON public.daily_digests
  FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS off_hours_batching BOOLEAN DEFAULT TRUE;
