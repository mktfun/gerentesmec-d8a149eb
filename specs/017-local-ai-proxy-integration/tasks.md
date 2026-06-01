# Tasks — 017: Local AI Proxy Integration

## Checklist de Implementação

### 1. Banco de Dados
- [x] Criar migration SQL: `ALTER TABLE public.ai_settings ADD COLUMN IF NOT EXISTS api_url TEXT DEFAULT NULL;`
- [ ] Aplicar migration via Supabase MCP ou dashboard
- [ ] Verificar que a coluna aparece no banco com `\d ai_settings`

### 2. TypeScript Types
- [x] Adicionar `api_url: string | null` em `ai_settings.Row` em `src/integrations/supabase/types.ts`
- [x] Adicionar `api_url?: string | null` em `ai_settings.Insert` e `ai_settings.Update`
- [x] Remover o cast `as any` de `api_url` em `AiRouterConfig.tsx` (linha 212 e 232)
- [x] Remover o cast `as any` na leitura de `api_url` em `AiRouterConfig.tsx` (linha 110-111)
- [x] Adicionar `api_url?: string | null` ao tipo `AiSettings` em `AppDataContext.tsx`
- [x] Rodar `npx tsc --noEmit` e confirmar zero erros

### 3. Edge Function
- [x] Verificar que `aiSettings.api_url` na linha 522 agora recebe o valor correto do banco
- [x] Confirmar que o bloco Local AI Proxy usa `gemini-2.5-flash` obrigatoriamente (já feito no commit `f758c2b`)
- [x] Deploy da Edge Function: `npx supabase functions deploy ai-autonomous-evaluator --project-ref qtjitszradxsmnilnqtj`
  - Requer `SUPABASE_ACCESS_TOKEN` — fazer login no CLI primeiro: `npx supabase login`

### 4. Validação End-to-End
- [x] Abrir Config → IA → selecionar `Local AI Proxy (CLI Tunnel)`
- [x] Preencher URL do tunnel e API Key → clicar em "Diagnóstico Inteligente"
- [x] Verificar no Supabase que `ai_settings.api_url` foi salvo
- [x] Recarregar a página e confirmar que a URL continua preenchida
- [x] Enviar uma mensagem de teste no Chatwoot e verificar que a task aparece como `success` na fila
- [x] Confirmar que o modelo logado em `llm_usage_logs` é `gemini-2.5-flash`

### 5. Git
- [ ] Commit com `feat(017): add api_url column to ai_settings + fix proxy integration`
- [ ] Push para `main`
