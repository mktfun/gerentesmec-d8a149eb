# Tasks: Inbox Mapping Chatwoot

- `[x]` **1. Backend (Migração e Edge Function):**
  - `[x]` Executar `npx supabase migration new chatwoot_inbox_id` para adicionar a coluna `chatwoot_inbox_id` (integer, unique) em `units`.
  - `[x]` Criar Edge Function `chatwoot-inboxes` como um proxy seguro.
  - `[x]` Refatorar a Edge Function atual `chatwoot-webhook` para usar o `chatwoot_inbox_id` ao invés de cruzar nomes por string matching.

- `[x]` **2. Frontend (AppDataContext):**
  - `[x]` Atualizar o Type `Unit` (`chatwoot_inbox_id?: number | null`).
  - `[x]` Atualizar a mutação `updateUnit` no `AppDataContext` para aceitar salvamento do `chatwoot_inbox_id`.

- `[x]` **3. Frontend (UI de Configurações):**
  - `[x]` Substituir a rotina pesada do botão "Sincronizar Histórico" pela lógica cirúrgica de "Listar Canais" usando a nova Edge Function `chatwoot-inboxes`.
  - `[x]` Renderizar na UI um Card dinâmico para cada Inbox encontrado na conta Chatwoot do cliente.
  - `[x]` Colocar um Select/Dropdown listando as "Unidades" do painel para o administrador fazer o link visualmente.
  - `[x]` Adicionar botão "Salvar Vínculo" que atualiza a Unidade no banco de dados.
