# Supabase Memory & Knowledge Base

## [2026-07-24] — [Feature ID: 071-supabase-cloud-migration]

**Contexto:** Migração completa do backend Supabase do IP VPS temporário para a instância oficial Supabase Cloud Ref `ijomsruroyeaapurnbqu`.

**Regra aprendida:** O Management API do Supabase possibilita executar queries DDL/DML via endpoint REST (`/v1/projects/<ref>/database/query`) usando o token PAT. Arquivos SQL com BOM UTF-8 (`\uFEFF`) devem ser sanitizados (`sql.replace(/^\uFEFF/, '')`) antes da execução via REST API para evitar erros de sintaxe no parser Postgres.

**Risco identificado:** RLS em `storage.objects` bloqueia uploads anônimos/públicos por padrão nos buckets `audits` e `inspections`. É necessário aplicar explicitamente políticas RLS para `INSERT` e `SELECT` em `storage.objects` especificando `bucket_id`.

**Não fazer:** Nunca deixar o fallback de `src/integrations/supabase/client.ts` apontando para IPs locais/VPS sem criptografia TLS em produção Cloud.
