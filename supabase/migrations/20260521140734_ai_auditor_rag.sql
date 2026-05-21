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
