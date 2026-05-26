# Design: Sync Histórico Chatwoot

## UI / Stitch MCP
Adicionaremos um botão ou feedback visual no `Config.tsx` abaixo do status de conexão.
- **Botão:** "Sincronizar Histórico" (Icone de Refresh/Download).
- **Estado Loading:** Feedback de Apple Liquid Glass brilhando em azul `primary` durante o carregamento.
- **Status:** Texto informando a data da última sincronização ou o número de conversas importadas na última execução.

## Backend / Supabase MCP
Nova Supabase Edge Function `chatwoot-sync`.

**Fluxo da Edge Function:**
1. Recebe requisição via `supabase.functions.invoke('chatwoot-sync')` a partir do frontend do administrador.
2. Consulta a tabela `integration_settings` no banco local para extrair `chatwoot_url` e `chatwoot_token`.
3. Dispara `GET {url}/api/v1/profile` para pegar o `account_id`.
4. Dispara `GET {url}/api/v1/accounts/{account_id}/inboxes` e mapeia pelo nome (inbox name -> unit name em lowercase/ilike).
5. Dispara `GET {url}/api/v1/accounts/{account_id}/conversations?status=open` paginando se necessário (para MVP, a primeira página com até 50/100 itens resolve o travamento inicial).
6. Monta um array de objetos `Lead` a partir das conversas e contatos.
7. Faz um `upsert` em massa na tabela `leads` no Supabase usando a Supabase API Client local (cruzando `chatwoot_conversation_id`).
8. Retorna a contagem de quantos foram inseridos/atualizados para o frontend.
