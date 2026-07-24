# Spec Plan: Migração de Instância Supabase Cloud (071-supabase-cloud-migration)

## Tasks

- [x] [BACKEND] Autenticar silenciosamente a Supabase CLI usando o token `<SUPABASE_ACCESS_TOKEN>` e vincular ao projeto `ijomsruroyeaapurnbqu`
- [x] [BACKEND] Aplicar a estrutura de DDL (tabelas, RPCs, RLS, extensão `vector`) no banco de dados do projeto Cloud
- [x] [BACKEND] Provisionar os storage buckets `audits` e `inspections` com políticas RLS de upload e leitura
- [x] [BACKEND] Migrar dados cadastrais e de infraestrutura (`units`, `profiles`, `user_roles`, `ai_settings`, `business_hours`), ignorando conversas/logs descartáveis
- [x] [FRONTEND] Obter e configurar as novas chaves anônima e service role no `.env` (`VITE_SUPABASE_URL=https://ijomsruroyeaapurnbqu.supabase.co`)
- [x] [FRONTEND] Atualizar o fallback de URL e anon key em `src/integrations/supabase/client.ts`
- [x] [TEST] Verificar conexão e leitura de dados cadastrais no frontend Vite
- [x] [TEST] Verificar fluxo de envio de inspeções em `store_inspections` e upload de foto no bucket `audits`
