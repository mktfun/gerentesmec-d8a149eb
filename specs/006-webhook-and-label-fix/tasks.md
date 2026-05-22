# Tasks: Chatwoot Webhook & Labeling Fixes

- [x] Rodar `NOTIFY pgrst, 'reload schema'` no banco para destravar a leitura da tabela `leads` que travou o `chatwoot-webhook`.
- [ ] Criar e configurar o esqueleto de uma nova Edge Function `chatwoot-action`.
- [ ] Escrever a lógica em `chatwoot-action/index.ts` para capturar `integration_settings` do Supabase.
- [ ] Implementar a ação `add_labels` dentro do `chatwoot-action` fazendo a requisição POST para a API de labels do Chatwoot usando as credenciais do backend.
- [ ] Modificar `deleteLeads` em `src/context/AppDataContext.tsx` para chamar a edge function `chatwoot-action` via `supabase.functions.invoke`.
- [ ] Deploy da nova edge function no projeto Supabase.
