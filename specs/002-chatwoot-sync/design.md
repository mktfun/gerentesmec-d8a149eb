# Design: Chatwoot Webhook Sync

## Visão Geral da Solução
A implementação segue as abstrações da arquitetura atual: O **frontend (Stitch/React)** coleta os parâmetros, o **Supabase Database** os armazena e atua como ponte em tempo real, e as **Supabase Edge Functions** operam como o processador assíncrono recebendo os webhooks do Chatwoot.

## 1. Banco de Dados (Supabase MCP)
### Novas Estruturas (Migrações)
*   **Tabela `integration_settings`**:
    *   `id` (uuid, PK)
    *   `chatwoot_url` (text)
    *   `chatwoot_token` (text)
    *   `chatwoot_webhook_secret` (text) - Para verificar as assinaturas.
*   **Alterações em `leads`**:
    *   `chatwoot_conversation_id` (integer, unique)
    *   `chatwoot_contact_id` (integer)

## 2. Edge Function (`chatwoot-webhook`)
Criaremos uma função em Deno no Supabase que:
1.  Recebe `POST`.
2.  Lê o payload JSON.
3.  Verifica o tipo de evento (`conversation_created`, `message_created`, etc).
4.  Lê o `inbox.name` do payload.
5.  Usa a API local do Supabase via `@supabase/supabase-js` para encontrar a Unidade (`SELECT id FROM units WHERE ilike name = inbox_name`).
6.  Faz Upsert no lead correspondente baseado no `conversation.id` usando o cliente do Supabase com Role de Serviço (Service Role Key para bypassar RLS).

## 3. User Interface (Stitch MCP)
### Componente `Config.tsx`
- Precisamos transformar as variáveis de estado de Token e URL para que elas carreguem os valores de `integration_settings` do AppDataContext.
- O botão "Testar" deverá fazer um request real à API do Chatwoot (ex: `GET /api/v1/profile` com o token providenciado) para homologar as credenciais. Se for `200 OK`, a conexão é salva no banco.
- O Visual utilizará Glassmorphism como os demais componentes (Apple Liquid Glass vibes). O estado de erro deve brilhar levemente em `rose-500` e o estado de sucesso em `emerald-500`.
