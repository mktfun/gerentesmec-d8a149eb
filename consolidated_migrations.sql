CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. units
CREATE TABLE IF NOT EXISTS public.units (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  google_place_id text,
  created_at timestamptz DEFAULT now()
);

-- 2. managers
CREATE TABLE IF NOT EXISTS public.managers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  chatwoot_inbox_id integer,
  created_at timestamptz DEFAULT now()
);

-- 3. whatsapp_cycles
CREATE TABLE IF NOT EXISTS public.whatsapp_cycles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  manager_id uuid REFERENCES public.managers(id) ON DELETE CASCADE,
  customer_phone text,
  started_at timestamptz DEFAULT now(),
  max_response_time_breached boolean DEFAULT false,
  chatwoot_conversation_id integer
);

-- 4. cycle_steps
CREATE TABLE IF NOT EXISTS public.cycle_steps (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  cycle_id uuid REFERENCES public.whatsapp_cycles(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  is_compliant boolean,
  reason_failed text,
  evaluated_at timestamptz DEFAULT now()
);

-- 5. google_reviews_log
CREATE TABLE IF NOT EXISTS public.google_reviews_log (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  review_count_diff integer,
  logged_date date DEFAULT CURRENT_DATE
);

-- 6. system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_reviews_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all for units" ON public.units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for managers" ON public.managers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for whatsapp_cycles" ON public.whatsapp_cycles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for cycle_steps" ON public.cycle_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for google_reviews_log" ON public.google_reviews_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Units Table
create table public.units (
    id text primary key,
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Managers Table
create table public.managers (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    unit_id text references public.units(id) on delete cascade,
    avatar text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Leads Table
create table public.leads (
    id text primary key,
    customer_name text not null,
    customer_phone text not null,
    customer_vehicle text,
    unit_id text references public.units(id) on delete restrict,
    manager_id uuid references public.managers(id) on delete set null,
    last_message_at timestamp with time zone not null,
    funnel_stage text not null default 'lead_new',
    score numeric(5,2),
    wait_time_minutes integer not null default 0,
    sla_status text not null default 'ok',
    ticket_value numeric(10,2),
    closing_summary text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AI Settings Table (Single Row)
create table public.ai_settings (
    id uuid default uuid_generate_v4() primary key,
    provider text not null default 'openai',
    model text not null default 'gpt-4o',
    api_key text, -- In a real prod environment, this should ideally be encrypted or handled via Vault, but for MVP we store it here
    features jsonb not null default '{"vision": false, "video": false, "audio": false}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a single initial row for settings
insert into public.ai_settings (id) values (uuid_generate_v4());

-- Seed initial units
insert into public.units (id, name) values
    ('unit_1', 'Dom Pedro'),
    ('unit_2', 'Jabaquara'),
    ('unit_3', 'Kennedy');

-- Row Level Security (RLS)
alter table public.units enable row level security;
alter table public.managers enable row level security;
alter table public.leads enable row level security;
alter table public.ai_settings enable row level security;

-- Policies for public access (since the dashboard is currently unauthenticated for MVP)
create policy "Enable all access for units" on public.units for all using (true);
create policy "Enable all access for managers" on public.managers for all using (true);
create policy "Enable all access for leads" on public.leads for all using (true);
create policy "Enable all access for ai_settings" on public.ai_settings for all using (true);

-- Realtime Setup
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.ai_settings;
alter publication supabase_realtime add table public.managers;
CREATE TABLE IF NOT EXISTS units (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  chatwoot_inbox_id integer,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS managers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  funnel_stage text NOT NULL,
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES managers(id) ON DELETE SET NULL,
  score integer,
  sla_status text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON units FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON managers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON leads FOR ALL TO authenticated USING (true);
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
