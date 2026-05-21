-- Migração para Fase 2 de IA Autônoma (Cost-Efficient AI)

-- 1. Ativar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabela semantic_cache
CREATE TABLE IF NOT EXISTS public.semantic_cache (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    input_hash text NOT NULL UNIQUE,
    embedding vector(768),
    output_json jsonb NOT NULL,
    ttl_expires_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS e Políticas para semantic_cache
ALTER TABLE public.semantic_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to semantic_cache" ON public.semantic_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access to semantic_cache" ON public.semantic_cache FOR INSERT TO authenticated WITH CHECK (true);

-- Criar índice HNSW para busca rápida no vetor
CREATE INDEX IF NOT EXISTS semantic_cache_embedding_idx ON public.semantic_cache USING hnsw (embedding vector_cosine_ops);

-- 3. Tabela lead_memories
CREATE TABLE IF NOT EXISTS public.lead_memories (
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE PRIMARY KEY,
    compressed_history text NOT NULL,
    last_processed_message_id uuid, -- Para rastrear até onde a IA leu
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS e Políticas para lead_memories
ALTER TABLE public.lead_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access to lead_memories" ON public.lead_memories FOR ALL TO authenticated USING (true);

-- 4. Alterações em ai_settings
ALTER TABLE public.ai_settings 
ADD COLUMN IF NOT EXISTS system_prompt text,
ADD COLUMN IF NOT EXISTS evaluation_criteria jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{"auto_scoring": false, "auto_pipeline": false, "vision": false, "audio": false}'::jsonb,
ADD COLUMN IF NOT EXISTS embedding_provider text DEFAULT 'gemini-text-embedding-004';
