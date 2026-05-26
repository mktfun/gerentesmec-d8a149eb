# Tasks: Sync Histórico Chatwoot

- `[x]` **1. Backend (Edge Function):**
  - `[x]` Criar Edge Function `chatwoot-sync` no Supabase (`npx supabase functions new chatwoot-sync`).
  - `[x]` Implementar acesso à tabela `integration_settings` para ler URL e Token.
  - `[x]` Implementar chamadas à API REST do Chatwoot (Profile -> Inboxes -> Conversations).
  - `[x]` Realizar parser e fazer UPSERT das conversas ativas na tabela `leads` vinculando à `unit_id`.

- `[x]` **2. Frontend (Config UI):**
  - `[x]` Adicionar botão "Sincronizar Histórico" em `Config.tsx`.
  - `[x]` Fazer o botão chamar a Edge Function via `supabase.functions.invoke('chatwoot-sync')`.
  - `[x]` Implementar estado de *loading* visual e alerta de sucesso/falha (Toast).

- `[x]` **3. Validação:**
  - `[x]` Garantir que conversas puxadas não dupliquem ao receber novos webhooks (o `chatwoot_conversation_id` como identificador único garante o `last_message_at` update).
