create extension if not exists vector;

create table if not exists public.ai_memories (
    id uuid default gen_random_uuid() primary key,
    unit_id text references public.units(id) on delete cascade not null,
    lead_id text references public.leads(id) on delete cascade,
    context text not null,
    embedding vector(768),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ai_memories enable row level security;

create policy "Gerentes podem ver a memória das auditorias"
    on public.ai_memories for select
    using (true);

create policy "Edge function pode inserir na memória"
    on public.ai_memories for insert
    with check (true);

-- Drop old function if exists
drop function if exists match_ai_memories;

create or replace function match_ai_memories (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_unit_id text
)
returns table (
  id uuid,
  context text,
  similarity float
)
language sql stable
as $$
  select
    am.id,
    am.context,
    1 - (am.embedding <=> query_embedding) as similarity
  from public.ai_memories am
  where am.unit_id = p_unit_id
    and 1 - (am.embedding <=> query_embedding) > match_threshold
  order by am.embedding <=> query_embedding
  limit match_count;
$$;
