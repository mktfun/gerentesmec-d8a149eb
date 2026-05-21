UPDATE public.leads SET funnel_stage = 'lead_new' WHERE funnel_stage = 'new';
ALTER TABLE public.leads ALTER COLUMN funnel_stage SET DEFAULT 'lead_new';
DELETE FROM public.managers WHERE unit_id IN ('unit_1','unit_2','unit_3');
DELETE FROM public.units WHERE id IN ('unit_1','unit_2','unit_3');
-- Integration Settings Table
create table public.integration_settings (
    id uuid default uuid_generate_v4() primary key,
    chatwoot_url text,
    chatwoot_token text,
    chatwoot_webhook_secret text,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert a single initial row
insert into public.integration_settings (id) values (uuid_generate_v4());

-- Add RLS
alter table public.integration_settings enable row level security;
create policy "Enable all access for integration_settings" on public.integration_settings for all using (true);

-- Add Realtime
alter publication supabase_realtime add table public.integration_settings;

-- Update Leads table
alter table public.leads add column chatwoot_conversation_id integer unique;
alter table public.leads add column chatwoot_contact_id integer;
alter table public.units add column chatwoot_inbox_id integer unique;
alter table public.integration_settings add column chatwoot_account_id integer;
create table if not exists public.chat_messages (
    id uuid default gen_random_uuid() primary key,
    lead_id uuid references public.leads(id) on delete cascade not null,
    chatwoot_message_id integer unique not null,
    content text not null,
    sender_type text not null check (sender_type in ('contact', 'user', 'bot')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for querying messages by lead_id fast
create index if not exists chat_messages_lead_id_idx on public.chat_messages(lead_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at);

-- Set up Realtime
alter publication supabase_realtime add table public.chat_messages;
-- Enable pgvector extension
create extension if not exists vector with schema public;

-- Add embedding column to chat_messages
alter table public.chat_messages
add column if not exists embedding vector(1536);

-- Add AI evaluation metadata to chat_messages to keep track if AI processed it
alter table public.chat_messages
add column if not exists ai_audited boolean default false,
add column if not exists ai_summary text;

-- Create function for vector similarity search (RAG)
create or replace function public.match_messages(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  lead_id uuid,
  content text,
  sender_type text,
  similarity float
)
language sql stable
as $$
  select
    messages.id,
    messages.lead_id,
    messages.content,
    messages.sender_type,
    1 - (messages.embedding <=> query_embedding) as similarity
  from public.chat_messages messages
  where 1 - (messages.embedding <=> query_embedding) > match_threshold
  order by messages.embedding <=> query_embedding
  limit match_count;
$$;
create extension if not exists pg_net with schema extensions;

create or replace function public.handle_new_chat_message_for_ai()
returns trigger as $$
declare
  edge_function_url text;
  auth_header text;
begin
  -- Em produÃ§Ã£o, o ideal Ã© usar o Vault do Supabase para guardar a URL e o secret.
  -- Para fins de desenvolvimento local/simplificado, pegamos via variÃ¡veis de ambiente se disponÃ­veis
  -- ou chumbamos a chamada para a URL local do Deno. 
  
  -- Chamada via pg_net (assÃ­ncrona)
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
create table if not exists public.system_configs (
    id uuid default gen_random_uuid() primary key,
    chatwoot_url text,
    chatwoot_api_token text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert a default row if not exists
insert into public.system_configs (id)
select '00000000-0000-0000-0000-000000000000'
where not exists (select 1 from public.system_configs limit 1);

-- Add audit_checklist to leads
alter table public.leads
add column if not exists audit_checklist jsonb default '{}'::jsonb;
-- Make chatwoot_message_id nullable so we can insert local system logs
ALTER TABLE public.chat_messages ALTER COLUMN chatwoot_message_id DROP NOT NULL;

-- Drop the old constraint
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_type_check;

-- Add the new constraint allowing 'system'
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_sender_type_check CHECK (sender_type IN ('contact', 'user', 'bot', 'system'));
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for chat_messages" ON public.chat_messages FOR ALL USING (true);
