# Tasks: Integração Nativa de Métricas com Chatwoot API

- [ ] 1. **Migration (Database)**
  - Adicionar colunas `chatwoot_waiting_since` (timestamptz) e `chatwoot_snoozed_until` (timestamptz) à tabela `leads`.
  - Criar tabela `chatwoot_insights` (id, type, entity_id, metrics JSONB, created_at).
- [ ] 2. **Edge Function `chatwoot-metrics-sync`**
  - Criar script TypeScript consumindo a API de conversas (`/api/v1/accounts/1/conversations?status=open`).
  - Mapear e dar update nos leads associados, gravando os timestamps nativos.
  - Consumir a API de Reports Summary (`/api/v1/accounts/1/reports/summary?since=X&until=Y&type=account`) e fazer upsert em `chatwoot_insights`.
- [ ] 3. **PG_CRON Config**
  - Configurar um hook via PG_NET ou PG_CRON para disparar a edge function a cada 10 minutos automaticamente.
- [ ] 4. **Frontend Analytics**
  - Atualizar `src/utils/metrics.ts` para consumir `chatwoot_waiting_since` se disponível, respeitando o `snoozed_until`.
  - No `Index.tsx`, se os dados em `chatwoot_insights` existirem, usá-los como os números Master da Visão Global (Time to Resolve, First Response Time).
