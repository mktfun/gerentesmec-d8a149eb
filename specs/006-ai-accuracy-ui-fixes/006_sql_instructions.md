# Aplicação do Banco de Dados

Como sua base de dados remota está com o histórico de migrações corrompido ou desalinhado com os arquivos locais (`npx supabase db push` acusou divergência no `supabase_migrations.schema_migrations`), a forma mais segura e à prova de falhas de injetar as novas colunas é rodando a query diretamente no painel.

**Por favor, vá ao Supabase Dashboard -> SQL Editor e rode o código abaixo:**

```sql
-- Adicionar coluna audit_reasons na tabela leads se não existir
ALTER TABLE leads ADD COLUMN IF NOT EXISTS audit_reasons JSONB DEFAULT '{}'::jsonb;

-- Adicionar coluna ai_transcription na tabela chat_messages se não existir
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS ai_transcription TEXT;
```

Essa é a única etapa manual necessária. Todo o resto (Edge Functions e UI Frontend) já foi atualizado!
