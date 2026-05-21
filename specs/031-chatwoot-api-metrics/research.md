# Research: Integração Nativa de Métricas com Chatwoot API

## Contexto e Dores
Atualmente, as métricas de Tempo de Resposta (TMR) e SLAs do nosso dashboard estão sendo calculadas "manualmente" pelo nosso código, baseando-se nas datas das últimas mensagens capturadas via Webhook (`last_message_at`, `last_client_message_at`).
Isso é falho porque:
1. O Webhook pode sofrer atrasos ou perdas.
2. Não captura momentos em que o gerente arquiva a conversa ou "snooze" (adia) o lead nativamente no Chatwoot.
3. Chatwoot possui uma API robusta de Relatórios e de Conversas que já contabiliza com perfeição o "Waiting Time" (tempo de espera) e o "Resolution Time".

O usuário deseja melhorar a "Inteligência" dos dados, puxando informações diretamente da API do Chatwoot (tanto globais, quanto por inboxes/canais e por conversas individuais) para termos a **melhor precisão possível**.

## Capacidades da API do Chatwoot
1. **Conversation API**: `GET /api/v1/accounts/{id}/conversations/{conv_id}`
   - Retorna campos vitais como `waiting_since`, `snoozed_until`, `first_reply_created_at`.
   - Se `waiting_since` for nulo, o cliente não está esperando. Se houver data, basta fazermos `now() - waiting_since` e teremos o tempo exato com base no relógio oficial do Chatwoot.
2. **Reports API**: `GET /api/v1/accounts/{id}/reports/summary`
   - Parâmetros: `since`, `until`, `type=account` (ou `inbox`).
   - Retorna: `avg_first_response_time`, `avg_resolution_time`, `conversations_count`.
   - Isso permite que o nosso painel "Visão Global" tenha um espelho 100% idêntico ao dashboard interno do Chatwoot.

## Arquitetura Proposta
- Criar uma **Supabase Edge Function** (`chatwoot-metrics-sync`) rodando em cron-job (a cada X minutos) ou chamada sob demanda pelo frontend.
- Essa function baterá na API do Chatwoot e atualizará uma nova tabela `chatwoot_metrics` no banco, ou fará o update direto na tabela `leads` caso estejamos sincronizando apenas os tempos de espera individuais (`waiting_since`).
- Para o Frontend: usar as métricas globais oficias da API para o cabeçalho, e o `waiting_since` para a ordenação e cálculos de TMR da fila de Leads.
