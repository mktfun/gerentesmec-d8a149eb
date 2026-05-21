# Proposal: Sync Histórico Chatwoot

## Identificador
`003-chatwoot-historical-sync`

## O Problema
Ao conectar a API do Chatwoot no painel, as conversas já existentes (abertas/em andamento) não estão aparecendo no CRM/Dashboard, pois o sistema só processa eventos novos via Webhook.

## A Solução
Criar uma rotina de ingestão de dados (Historical Sync) que se comunique com a API REST do Chatwoot usando o URL e Token recém-salvos para varrer as caixas de entrada (Inboxes), mapear para as unidades (Units) e importar as conversas como `leads` no banco de dados.

## Requisitos
- A rotina deve ser protegida contra bloqueios de CORS (rodar no backend/Edge Function).
- A rotina deve varrer `GET /api/v1/profile` para pegar o ID da conta.
- A rotina deve varrer `GET /api/v1/accounts/{id}/inboxes` para mapear IDs do Chatwoot com os IDs das unidades do sistema.
- A rotina deve varrer `GET /api/v1/accounts/{id}/conversations?status=open` e importar.
- O Frontend precisa de um botão ou gatilho automático "Sincronizar Dados Históricos".
- Evitar duplicação (usar upsert baseado em `chatwoot_conversation_id`).

## BDD Scenarios

### Cenário: Sincronização de Conversas Iniciais
- **Given (Dado):** que o administrador acaba de conectar as credenciais do Chatwoot e há 50 conversas abertas no WhatsApp da Unidade Dom Pedro.
- **When (Quando):** o administrador clica em "Sincronizar Histórico" (ou a integração é validada).
- **Then (Então):** o sistema aciona a rotina de sync.
- **And (E):** as 50 conversas abertas são importadas para a tabela `leads` com o estágio `lead_new` e vinculadas à Unidade Dom Pedro.
- **And (E):** o sistema exibe um alerta de sucesso na UI e o contador do Dashboard reflete os 50 novos atendimentos.
