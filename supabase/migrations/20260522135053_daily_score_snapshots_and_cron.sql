-- 1. Tabela para armazenar snapshots diários de score
CREATE TABLE IF NOT EXISTS public.daily_score_snapshots (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date   date NOT NULL UNIQUE,
  global_score    numeric(5,1),
  total_leads     integer NOT NULL DEFAULT 0,
  scored_leads    integer NOT NULL DEFAULT 0,
  unit_breakdown  jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS: só leitura autenticada
ALTER TABLE public.daily_score_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "snapshots_select_auth" ON public.daily_score_snapshots
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Habilitar pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Agendar cron para 21:00 UTC = 18:00 BRT todos os dias úteis
-- O job chama a Edge Function via pg_net (HTTP)
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'daily-score-snapshot-18h-brt',
  '0 21 * * 1-6',  -- 21:00 UTC = 18:00 BRT, seg a sáb
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/daily-score-snapshot',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
