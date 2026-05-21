# Research: Sincronização Histórica do Chatwoot

## O Problema
A integração feita anteriormente (`002-chatwoot-sync`) implementou apenas o fluxo **Passivo** (Webhooks). Webhooks só reagem a eventos futuros (quando uma nova mensagem chega ou nova conversa é criada).
O usuário conectou a API Key (Access Token) e URL (`chat.tork.services`) do Chatwoot e relatou que "não puxou nada". Isso ocorre porque o sistema precisa de um fluxo **Ativo** (API Polling/Sync) no momento em que a chave é conectada para "puxar" todo o histórico existente (Inboxes, Contatos, Conversas).

## Como funciona a API REST do Chatwoot (Client/Application APIs)

Baseado na documentação oficial (`/api/v1/`), para extrair os dados iniciais com um Token, o fluxo exato é:

1. **Obter o `account_id`**:
   - Endpoint: `GET /api/v1/profile`
   - Header: `api_access_token: <TOKEN>`
   - Resposta: `{ account_id: 1, name: "Admin", ... }`

2. **Obter os Canais (Inboxes)**:
   - Endpoint: `GET /api/v1/accounts/{account_id}/inboxes`
   - Resposta: Array de inboxes contendo `id`, `name`, `channel_type`.
   - Lógica: Cruzar o `name` do Inbox com o `name` da Unit no nosso Supabase.

3. **Obter Conversas Ativas**:
   - Endpoint: `GET /api/v1/accounts/{account_id}/conversations?status=open`
   - Resposta: Paginação contendo array de conversas.
   - Cada conversa traz:
     - `id` (chatwoot_conversation_id)
     - `inbox_id` (para mapear a qual unidade pertence)
     - `meta.sender` ou `contact` (nome, telefone, id do contato)
     - `created_at`, `status`

## Gap Arquitetural
Não temos uma rotina no nosso backend ou frontend que faça esse processo de 1 a 3. O painel salvou as credenciais no Supabase `integration_settings`, mas ninguém avisou o banco para ir buscar os dados passados.

## Solução Proposta
Criar um processo de **"Sync Inicial"** (Initial Sync) que pode ser disparado de duas formas:
1. Automaticamente logo após a validação da conexão (`testConnection` dar certo).
2. Manualmente via um botão "Sincronizar Dados" no painel de Configurações.
Esta rotina fará os requests para a API do Chatwoot, mapeará os Inboxes e dará Upsert em massa na tabela `leads` do Supabase para refletir o cenário atual da operação.
