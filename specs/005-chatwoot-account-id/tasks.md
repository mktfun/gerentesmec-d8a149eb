# Tasks: Implementação do Chatwoot Account ID (005-chatwoot-account-id)

Siga estas tarefas ESTRITAMENTE em ordem:

- [ ] **1. Migração de Banco de Dados (Supabase SQL Editor):**
  - Criar o arquivo de migração local `supabase/migrations/20260521131435_chatwoot_account_id.sql` contendo o alter table para adicionar `chatwoot_account_id` à tabela `integration_settings`.
  - Apresentar o comando SQL limpo para o usuário rodar no SQL Editor do painel do Supabase.

- [ ] **2. Atualização da Edge Function (`chatwoot-inboxes`):**
  - Modificar `supabase/functions/chatwoot-inboxes/index.ts` para sanitizar a URL (adicionando `https://` se ausente, limpando espaços e barra final).
  - Modificar a função para aceitar `chatwoot_account_id` no payload e pular a chamada de `/api/v1/profile` caso o ID esteja presente.
  - Testar a lógica localmente ou garantir sua robustez para Deno.

- [ ] **3. Integração do Frontend (Config.tsx):**
  - Ler `chatwoot_account_id` das configurações retornadas por `integrationSettings` no `useAppData`.
  - Exibir um input numérico para "ID da Conta (Account ID)" na seção de integração.
  - Atualizar `testConnection` para sanitizar a URL digitada (prefixando `https://` caso necessário) e para salvar a URL sanitizada, o Token e o ID da conta.
  - Ajustar o teste de conexão para rodar através da própria Edge Function (ou via fetch sanitizado).

- [ ] **4. Adaptação do Painel de Mapeamento (`InboxMappingPanel.tsx`):**
  - Alterar o componente para receber a propriedade `accountId` (ou extraí-la de `integrationSettings` através do contexto/prop).
  - Incluir `chatwoot_account_id` na chamada da Edge Function `chatwoot-inboxes` para garantir a busca direta.

- [ ] **5. Deploy e Verificação:**
  - Realizar o deploy local/em nuvem das Edge Functions atualizadas.
  - Validar na UI se o preenchimento de `chat.tork.services`, `Token` e `Account ID` ativa e lista as caixas de entrada perfeitamente sem erros.
