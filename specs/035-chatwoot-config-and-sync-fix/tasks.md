# Tasks: Chatwoot Config & Sync Fix

- [ ] 1. **Corrigir save do Account ID no Config.tsx**
  - Mudar lógica de save: `accountId.trim() ? parseInt(accountId.trim(), 10) : null`
  - Validar que `parseInt` retorna um número válido antes de salvar
  - Substituir `alert()` por toast visual não-bloqueante

- [ ] 2. **Normalizar URL em todos os pontos de consumo**
  - `supabase/functions/chatwoot-webhook/index.ts` — adicionar helper `normalizeUrl(url)` que garante `https://`
  - `sync-history.ts` — já feito parcialmente mas revisar
  - Toda chamada de API do Chatwoot no frontend (Index.tsx, Relatorios.tsx, TvDashboard.tsx) — já usa o helper

- [ ] 3. **Criar Edge Function `chatwoot-sync`**
  - Nova função em `supabase/functions/chatwoot-sync/index.ts`
  - Lê as settings do banco (url, token, account_id)
  - Valida que `account_id` não é null antes de prosseguir
  - Varre conversas paginadas (máx 3 páginas / últimas ~75 conversas)
  - Usa "Variável de Ouro" (`message_type`) para setar `sender_type`
  - Retorna `{ message: "X conversas sincronizadas" }`

- [ ] 4. **Remover `/profile` call do sync-history.ts**
  - Usar `chatwoot_account_id` do banco diretamente
  - Se null, abortar com mensagem clara: "Configure o Account ID primeiro"

- [ ] 5. **Deploy das Edge Functions**
  - `npx supabase functions deploy chatwoot-webhook`
  - `npx supabase functions deploy chatwoot-sync`

- [ ] 6. **Commit e push**
