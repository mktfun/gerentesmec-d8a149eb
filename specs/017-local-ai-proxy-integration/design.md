# Design — 017: Local AI Proxy Integration

## Banco de Dados (Supabase)

### Migration: adicionar coluna `api_url` em `ai_settings`

```sql
ALTER TABLE public.ai_settings
  ADD COLUMN IF NOT EXISTS api_url TEXT DEFAULT NULL;
```

**Sem breaking change** — coluna nullable, não afeta rows existentes.

### Update do TypeScript types

Adicionar `api_url` em `ai_settings.Row`, `Insert` e `Update` em `src/integrations/supabase/types.ts`:

```ts
Row: {
  api_key: string | null
  api_url: string | null   // ← NOVO
  ...
}
```

---

## Frontend (AiRouterConfig.tsx)

A tela de config já tem o campo de URL — apenas a persistência estava quebrada. Com a coluna existindo no banco:

- `updateAiSettings({ api_url: apiUrl })` passa a funcionar sem `as any`
- O `useEffect` que inicializa o estado lê `aiSettings.api_url` direto (tipado)
- O tipo `AiSettings` em `AppDataContext.tsx` recebe `api_url?: string | null`

**Nenhuma mudança visual necessária** — a UI já está correta.

---

## Edge Function (ai-autonomous-evaluator)

Linha 522 atual (problemática):
```ts
let apiUrl = aiSettings.api_url || 'https://api.openai.com/v1/chat/completions';
```

Com a migração, `aiSettings.api_url` passa a ser lido corretamente do banco.

Adicionalmente, o bloco do Local AI Proxy deve:
1. Sempre usar `model: 'gemini-2.5-flash'` (já corrigido no commit anterior)
2. Usar `api_key` do banco como Bearer token (já implementado)
3. Não entrar em loop de fallback (já corrigido — `modelsToTry = ['gemini-2.5-flash']`)

---

## Fluxo Corrigido

```
Webhook → ai-autonomous-evaluator
  ↓
Lê ai_settings do banco
  provider = 'Local AI Proxy (CLI Tunnel)'
  api_url  = 'https://TUNNEL.trycloudflare.com'   ← agora persistido
  api_key  = 'key-8bb35a9f6a724543a5e788ee55b1c880'
  model    = 'gemini-2.5-flash'
  ↓
POST {api_url}/v1/chat/completions
  Authorization: Bearer {api_key}
  body.model = 'gemini-2.5-flash'
  ↓
cli-proxy-api.exe (porta 3001) → Gemini API → resposta JSON
  ↓
Edge Function parseia → salva score no banco → ✅
```
