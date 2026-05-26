# Proposal: Proxied Chatwoot Labeling

## Requisitos
- **Correção Imediata do Webhook:** Garantir que o cache do PostgREST atualizado reflita a leitura exata do banco e garanta que as mensagens entrem sem interrupção (Isso já foi efetuado pelo reload do schema via `NOTIFY pgrst`).
- **Etiquetas Funcionais:** Sempre que o usuário deletar um Lead clicando no lixeiro dentro do CRM, a etiqueta `ignorar` DEVE ser atribuída instantaneamente à conversa correspondente no Chatwoot.
- **Segurança e CORS:** A chamada API ao Chatwoot para adição da etiqueta não pode sofrer bloqueio CORS do navegador e não pode trafegar de forma insegura, o token deve estar restrito ao backend.

## BDD Scenarios

### Cenário: Envio de Etiqueta Seguro via Proxy (Edge Function)
- **Given (Dado):** O usuário possui uma conversa no funil e clica para excluir o card.
- **When (Quando):** A interface invoca o `deleteLead`, que aciona uma Edge Function do Supabase (ex: `chatwoot-proxy` ou um endpoint interno) em vez de fazer uma requisição externa HTTP diretamente do front-end.
- **Then (Então):** A Edge Function, executando do lado do servidor (isenta de CORS), puxa os tokens e a URL da `integration_settings`, dispara o POST para o Chatwoot e retorna um 200 de sucesso, e a etiqueta "ignorar" aparece no Chatwoot com eficácia de 100%.

### Cenário: Fluxo de Eventos Contínuo no Webhook
- **Given (Dado):** A Edge Function `chatwoot-webhook` está no ar.
- **When (Quando):** O webhook processa uma mensagem com queries para a coluna recém adicionada `total_response_time_minutes`.
- **Then (Então):** Como o PostgREST teve seu schema recarregado, o retorno é 200 (sucesso) e a mensagem flui para a interface sem os atrasos e congelamentos reportados anteriormente.
