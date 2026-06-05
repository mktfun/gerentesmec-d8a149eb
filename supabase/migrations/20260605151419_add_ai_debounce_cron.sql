-- Migration: Add AI Debounce Cron Job
-- 1. Create the function that will be called by pg_cron
create or replace function public.cron_process_pending_ai_evaluations()
returns void as $$
declare
  lead_record record;
  project_url text;
  service_role_key text;
begin
  -- Get credentials (could be from vault, but we use env vars available to Edge Functions usually)
  -- For local or Supabase cloud, we can call the function directly via the REST API endpoint.
  -- Note: In a real environment, you'd want to store the SUPABASE_URL and SERVICE_ROLE_KEY securely.
  -- For pg_net we need the full URL.
  
  -- Para fins de segurança, vamos assumir que a chamada deve ir para a mesma origem
  project_url := current_setting('custom.project_url', true);
  service_role_key := current_setting('custom.service_role_key', true);
  
  -- Se as variáveis não estiverem setadas, usa o padrão local para desenvolvimento
  if project_url is null or project_url = '' then
    project_url := 'http://host.docker.internal:54321';
  end if;

  -- 2. Encontrar leads que não tiveram mensagens novas nos últimos 5 minutos
  -- E que possuem mensagens pendentes de auditoria
  for lead_record in
    select id 
    from public.leads 
    where last_message_at < (now() - interval '5 minutes')
    and exists (
      select 1 from public.chat_messages 
      where lead_id = leads.id and ai_audited = false
    )
  loop
    -- 3. Fazer a requisição POST assíncrona para a Edge Function via pg_net
    perform net.http_post(
        url := project_url || '/functions/v1/ai-autonomous-evaluator',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || coalesce(service_role_key, 'YOUR_ANON_OR_SERVICE_KEY')
        ),
        body := jsonb_build_object('lead_id', lead_record.id)
    );
  end loop;
end;
$$ language plpgsql security definer;

-- 4. Agendar a função no pg_cron para rodar a cada 1 minuto
-- Supabase requires the cron extension, which is usually enabled.
select cron.schedule(
  'process-ai-debounce',
  '* * * * *',
  $$ select public.cron_process_pending_ai_evaluations(); $$
);
