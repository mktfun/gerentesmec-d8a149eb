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
