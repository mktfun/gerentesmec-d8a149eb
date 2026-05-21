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
