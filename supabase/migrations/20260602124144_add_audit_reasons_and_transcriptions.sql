-- Adicionar coluna audit_reasons na tabela leads se não existir
ALTER TABLE leads ADD COLUMN IF NOT EXISTS audit_reasons JSONB DEFAULT '{}'::jsonb;

-- Adicionar coluna ai_transcription na tabela chat_messages se não existir
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS ai_transcription TEXT;
