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
