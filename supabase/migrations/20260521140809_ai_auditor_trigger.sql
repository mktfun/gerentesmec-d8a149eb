create extension if not exists pg_net with schema extensions;

create or replace function public.handle_new_chat_message_for_ai()
returns trigger as $$
declare
  edge_function_url text;
  auth_header text;
begin
  -- Em produção, o ideal é usar o Vault do Supabase para guardar a URL e o secret.
  -- Para fins de desenvolvimento local/simplificado, pegamos via variáveis de ambiente se disponíveis
  -- ou chumbamos a chamada para a URL local do Deno. 
  
  -- Chamada via pg_net (assíncrona)
  perform net.http_post(
      url:='http://host.docker.internal:54321/functions/v1/ai-auditor',
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:=json_build_object('record', row_to_json(NEW))::jsonb
  );
  
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trigger_new_chat_message_for_ai
  after insert on public.chat_messages
  for each row
  execute function public.handle_new_chat_message_for_ai();
