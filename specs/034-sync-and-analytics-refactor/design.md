# Design: Sync Histórico & Analytics

## Arquitetura de Sincronização
Ao invés de criarmos uma Edge Function complexa com risco de Timeout para puxar dias de conversas, criaremos um **Script CLI** (Node/Deno local) dentro da base de código chamado `sync-history.ts`.
- **Limpeza (Truncate):** O script, por padrão, limpará os Leads e Chat Messages para recomeçar o banco limpo e atrelado ao Webhook atualizado.
- **Paginação de Fetch:** O script puxará as conversas via `GET /api/v1/accounts/1/conversations`.
- **Parsing Perfeito:** As mensagens importadas usarão A MESMA lógica de `message_type` criada no webhook na spec 033, garantindo que o Histórico antigo também fique 100% perfeito na direita/esquerda.

## Arquitetura de Dashboard
- **AdminDashboard.tsx / ModoTv.tsx**:
  - Parar de usar `calculateTmr` (que calcula a fila atual do Webhook).
  - Passar a consumir uma chamada assíncrona ao Chatwoot para `/api/v2/accounts/1/reports/summary?metric=avg_first_response_time`.
  - Ou, caso o cliente prefira independência da API do Chatwoot no client-side, criar uma Edge Function ou View no Supabase que calcule o tempo de resposta diretamente das conversas importadas (`last_agent_message_at` - `last_client_message_at` da *primeira interação*).
  - **Decisão:** Pela rapidez, o Dashboard consumirá os Relatórios Nativos via Chatwoot v2 API, pois o Chatwoot já mastiga as métricas por SLA sem onerar nosso banco.

## Mudanças no UI (React)
- Onde está "Tempo Médio" no painel, renomear internamente para evitar que gerentes confundam "Fila Atual" com "TMR Global".
- Corrigir a injeção do TMR nos cards do Modo TV para injetar o TMR nativo (convertido de segundos para minutos com a tag `m`).
