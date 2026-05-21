# Research: Sincronização Histórica do Chatwoot (021)

## Contexto e Pedido do Usuário
O usuário pontuou que o painel de configurações na tela `Config.tsx` não salva adequadamente os dados novos (Segredo do Webhook e Account ID) caso ele não clique no botão superior "Testar". Além disso, ele tentou usar o botão "Sincronização Histórica" e recebeu um alerta genérico "Em breve!". 
O pedido exige:
1. Fixar a UI para que salvar o segredo do webhook e Account ID seja intuitivo e persistente.
2. Criar uma proposal para ativar a Edge Function `chatwoot-sync` existente, que puxa conversas antigas para alimentar o banco de leads do CRM.

## Análise do Código Atual
- `Config.tsx`: O botão "Testar" invoca a action `updateIntegrationSettings`. Os novos campos `webhookSecret` não possuem um botão salvar dedicado.
- `chatwoot-sync/index.ts`: A Edge Function já existe! Ela busca em `api/v1/accounts/{accountId}/conversations?status=open`, mapeia pelo Inbox ID -> Unit ID e insere leads na tabela `leads`. Falta apenas conectar o botão do front-end a esta rota via `supabase.functions.invoke`.

## Benchmarking Funcional
Sistemas de CRM como HubSpot ou Pipedrive permitem sincronização manual com feedback de progresso ("Sincronizando 5 de 150 conversas..."). Como nossa Edge Function executa de uma vez, precisamos exibir um `Spinner` ou loader no botão, além de exibir um Toast de sucesso com o número de Leads importados (retornado pela Edge Function `importedCount`).
