# Research: Chatwoot Config & Sync Fix

## Bugs Encontrados

### Bug 1: URL sem protocolo quebrando a Edge Function (400)
- **Onde:** `supabase/functions/chatwoot-webhook/index.ts` e `sync-history.ts`
- **Causa:** A URL salva no banco é `chat.tork.services` (sem `https://`). O código no frontend adiciona o protocolo antes de salvar, mas o webhook/Edge Functions não sanitizam antes de usar — gerando `Invalid URL: 'chat.tork.services/api/v1/profile'`.
- **Fix:** Todo ponto que consome `chatwoot_url` do banco (Edge Functions e scripts) DEVE normalizar a URL com `https://` se não tiver protocolo.

### Bug 2: Account ID não salva
- **Onde:** `src/pages/Config.tsx` (linha ~194)
- **Causa:** O campo `chatwoot_account_id` é `number | null` na tipagem do Supabase, mas o estado local é `string`. A conversão `Number(accountId)` quando `accountId` está vazio retorna `NaN` → o Supabase rejeita.
- **Fix:** Garantir que o campo salva `null` (e não `NaN`) quando vazio, e exibir feedback de sucesso real (sem `alert()`).

### Bug 3: Edge Function `chatwoot-sync` bate em `/profile` para pegar o account_id
- **Onde:** `sync-history.ts` (estava usando `/api/v1/profile` para descobrir o account_id)
- **Causa:** O account_id já deve ser configurado pelo usuário na tela de Config. Não faz sentido ir buscar no perfil, especialmente se a URL estiver sem `https://`.
- **Fix:** Remover a chamada ao `/profile`. Usar o `chatwoot_account_id` salvo no banco diretamente. Se estiver `null`, logar erro claro.

### Bug 4: Edge Function `chatwoot-sync` não existe como deploy
- **Onde:** `src/pages/Config.tsx` chama `supabase.functions.invoke('chatwoot-sync')` mas a função não está deployada.
- **Fix:** Criar a Edge Function `chatwoot-sync` que executa a lógica do `sync-history.ts` (puxar conversas + mensagens do Chatwoot e salvar no Supabase), ou redirecionar o botão para executar via chamada direta da API.
