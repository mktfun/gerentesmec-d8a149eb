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
