# Tasks: Chatwoot Messaging Type Fix

- [x] 1. **Webhook Refactoring**
  - Ajustar lógica de `sender_type` na Edge Function `chatwoot-webhook` (implementado e commitado).
- [ ] 2. **Deployment do Webhook**
  - Dar deploy no webhook no ambiente de produção usando a CLI do Supabase.
- [ ] 3. **Sanitização de Dados (Data Migration)**
  - Rodar o comando SQL `UPDATE chat_messages SET sender_type = 'user' WHERE sender_type = 'bot';` no Supabase para corrigir os Dossiês quebrados na visualização atual.
