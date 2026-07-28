# Supabase Memory & Knowledge Base

## [2026-07-24] — [Feature ID: 071-supabase-cloud-migration]

**Contexto:** Migração completa do backend Supabase do IP VPS temporário para a instância oficial Supabase Cloud Ref `ijomsruroyeaapurnbqu`.

**Regra aprendida:** O Management API do Supabase possibilita executar queries DDL/DML via endpoint REST (`/v1/projects/<ref>/database/query`) usando o token PAT. Arquivos SQL com BOM UTF-8 (`\uFEFF`) devem ser sanitizados (`sql.replace(/^\uFEFF/, '')`) antes da execução via REST API para evitar erros de sintaxe no parser Postgres.

**Risco identificado:** RLS em `storage.objects` bloqueia uploads anônimos/públicos por padrão nos buckets `audits` e `inspections`. É necessário aplicar explicitamente políticas RLS para `INSERT` e `SELECT` em `storage.objects` especificando `bucket_id`.



## [2026-07-28] — [Feature ID: 072-fix-store-inspections-schema]

**Contexto:** Correção do erro Postgres `42703 (undefined_column: completed_at)` na tabela `store_inspections` durante a conclusão e consulta de vistorias do PWA.

**Regra aprendida:** Sempre que colunas forem adicionadas ou alteradas via DDL no banco de dados Supabase Cloud, a instrução `NOTIFY pgrst, 'reload schema';` deve ser executada imediatamente após para forçar o PostgREST a invalidar o cache de schema. Caso contrário, requisições REST do frontend continuarão falhando com `42703 (undefined_column)`.

**Risco identificado:** A coluna `auditor_name` possuía restrição `NOT NULL` remanescente em schemas legados. No PWA desacoplado, o nome do auditor é gravado dentro do `device_info` ou `raw_payload`. Manter restrições `NOT NULL` não utilizadas faz com que chamadas de inserção anônima/offline falhem.

**Não fazer:** Nunca crie/altere colunas temporais (`started_at`, `completed_at`) ou de vínculo (`store_id`, `unit_id`) com restrições rígidas que diferem do modelo payload do frontend sem verificar os hooks de armazenamento (`useAuditStorage`).
