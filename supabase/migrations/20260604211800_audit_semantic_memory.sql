-- Ativar extensão pgvector caso não esteja ativa
create extension if not exists vector;

-- Tabela para memória semântica de auditorias passadas (para evitar cometer os mesmos erros)
create table if not exists public.audit_semantic_memory (
    id uuid default gen_random_uuid() primary key,
    mechanic_id text not null,
    lead_id uuid references public.leads(id) on delete cascade,
    content text not null, -- A correção feita pelo gerente ("O gerente avisou que aquilo era uma sombra, não sujeira")
    embedding vector(1536), -- ou 768 dependendo do modelo (deixaremos 1536 pra OpenAI/Google padrão)
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.audit_semantic_memory enable row level security;

-- Políticas de acesso
create policy "Gerentes podem ver a memória das auditorias"
    on public.audit_semantic_memory for select
    using (true);

create policy "Gerentes podem inserir correções na memória"
    on public.audit_semantic_memory for insert
    with check (true);

-- Função de busca por similaridade (cosine similarity)
create or replace function match_audit_memories (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_mechanic_id text
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    asm.id,
    asm.content,
    1 - (asm.embedding <=> query_embedding) as similarity
  from public.audit_semantic_memory asm
  where asm.mechanic_id = p_mechanic_id
    and 1 - (asm.embedding <=> query_embedding) > match_threshold
  order by asm.embedding <=> query_embedding
  limit match_count;
$$;
