-- Migração para Fase 3 (Edge Cases de IA)

-- 1. Adicionar ai_feedback na tabela leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS ai_feedback text;

-- 2. Garantir que as colunas de media existam na tabela chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text;
