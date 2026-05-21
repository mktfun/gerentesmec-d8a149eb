# Design: Integração Nativa de Métricas com Chatwoot API

## Architecture Overview
O fluxo atual depende de Webhooks (evento `message_created`) para atualizar timestamps.
Vamos evoluir a arquitetura criando uma "esteira de sincronização" no Supabase:

1. **Edge Function `chatwoot-metrics-sync`**:
   - Rotina disparada via PG_CRON a cada 5 ou 10 minutos.
   - Lê a tabela `integration_settings` para pegar o `api_access_token`, `chatwoot_url` e `chatwoot_account_id`.
   - Consulta a API: `GET /api/v1/accounts/{id}/conversations?status=open`.
   - Itera e atualiza os Leads no banco: se a conversa tem `waiting_since`, salvamos esse timestamp nativo em uma nova coluna `waiting_since` no lead (ou substituímos a lógica de `last_client_message_at` pela inteligência do `waiting_since` + `snoozed_until`).
   - Consulta a API de Reports (`GET /api/v1/accounts/{id}/reports/summary`) para os últimos 7 dias, e salva em uma tabela `chatwoot_insights` os dados puros (`avg_first_response_time`, etc.).

2. **Database Schema (Supabase)**:
   - Adicionar coluna `chatwoot_waiting_since` (timestamp) e `chatwoot_snoozed_until` (timestamp) à tabela `leads`.
   - Criar tabela `chatwoot_insights` (id, type: 'global' | 'inbox', entity_id, metrics: JSONB, created_at) para funcionar como cache dos relatórios da API e evitar lentidão.

3. **Frontend (Stitch / React)**:
   - O Utils `calculateTmr` passará a preferir o `chatwoot_waiting_since` real. Se o cliente estiver esperando (a coluna é preenchida), faz-se `agora - waiting_since`. Se ele estiver em snooze, o SLA não infla.
   - A tela de Dashboard / Index passará a puxar a tabela `chatwoot_insights` caso exista, para exibir o Tempo de Resposta e Resolução oficial da plataforma.
