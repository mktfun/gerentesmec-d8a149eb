# Spec Plan: Correção de Schema e Colunas em `store_inspections` (072-fix-store-inspections-schema)

## Tasks

- [x] [BACKEND] Executar a alteração de DDL no Supabase Cloud adicionando `completed_at`, `started_at`, `store_id`, `device_info`, `status` na tabela `store_inspections`
- [x] [BACKEND] Recarregar a cache de schema do PostgREST (`NOTIFY pgrst, 'reload schema';`)
- [x] [BACKEND] Criar arquivo de migration versionado em `supabase/migrations/20260728100000_fix_store_inspections_columns.sql`
- [x] [TEST] Testar a consulta `supabase.from('store_inspections').select('id, store_id, completed_at, raw_payload').order('completed_at')`
- [x] [TEST] Testar inserção e leitura de auditoria completa no PWA
