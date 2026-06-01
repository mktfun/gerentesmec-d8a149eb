# Research — 017: Local AI Proxy Integration

## Validação do Proxy (realizada em 2026-06-01 às 19:51 BRT)

Teste direto via PowerShell contra `http://127.0.0.1:3001/v1/chat/completions`:

```json
{
  "id": "4OIdaqGkFevJ4_UPwf7Z2Ag",
  "model": "gemini-2.5-flash",
  "choices": [{ "message": { "content": "OK" }, "finish_reason": "stop" }],
  "usage": { "total_tokens": 23 }
}
```

✅ **Proxy local 100% funcional.** O tunnel externo retornou 502 porque o `cli-proxy-api.exe` estava parado — `manage-proxy.py start` resolveu.

---

## Diagnóstico do Bug Raiz: "api_url não salva"

### Causa confirmada

A coluna `api_url` **não existe** na tabela `ai_settings` do Supabase.  
Prova: arquivo `src/integrations/supabase/types.ts` → tabela `ai_settings.Row` não contém `api_url`.

Quando o frontend chama `updateAiSettings({ api_url: '...' })`, o Supabase JS ignora silenciosamente a coluna desconhecida. O UPDATE é enviado, mas `api_url` é dropado no banco. A UI faz um optimistic update local e parece ter salvo — mas na próxima recarga o valor sumiu.

### Workaround atual (problemático)

O código em `AiRouterConfig.tsx` tenta salvar via:
```ts
await updateAiSettings({ provider, model, api_key: apiKey, api_url: apiUrl } as any);
```

E depois lê de volta como:
```ts
if ((aiSettings as any).api_url || (aiSettings.features as any)?.api_url)
```

Ou seja: dois lugares diferentes tentam ler de dois campos diferentes, nenhum persistido.

### Situação da Edge Function

`ai-autonomous-evaluator/index.ts` lê `aiSettings.api_url` na linha 522:
```ts
let apiUrl = aiSettings.api_url || 'https://api.openai.com/v1/chat/completions';
```

Como o campo não existe no banco, `aiSettings.api_url` sempre será `null` → sempre cai no fallback OpenAI → erro "Túnel Offline".

### Auth da Edge Function para o proxy

A Edge Function usa:
```ts
'Authorization': `Bearer ${provider === 'Local AI Proxy (CLI Tunnel)' ? (Deno.env.get('CLIPROXY_KEY') || apiKey) : apiKey}`
```

A env var `CLIPROXY_KEY` não está setada no Supabase (tentativa via CLI falhou por falta de access token). O fallback `apiKey` funciona **se** `api_key` estiver salvo no banco — o que só acontece parcialmente pois a coluna existe.

---

## Arquitetura do Proxy

| Componente | Detalhes |
|---|---|
| Processo | `cli-proxy-api.exe` (porta 3001 local) |
| Starter | `python C:\cli-proxy-api\manage-proxy.py start` |
| API Key | `key-8bb35a9f6a724543a5e788ee55b1c880` |
| Modelo default | `gemini-2.5-flash` |
| Tunnel | Cloudflare (URL muda a cada reinício — lida de `C:\cli-proxy-api\tunnel.log`) |
| Formato | OpenAI-compatible (`/v1/chat/completions`) |

---

## Arquivos Relevantes

| Arquivo | Relevância |
|---|---|
| `src/integrations/supabase/types.ts` | Schema do banco — `api_url` ausente em `ai_settings` |
| `src/context/AppDataContext.tsx` | `updateAiSettings()` — persiste via Supabase |
| `src/components/Config/AiRouterConfig.tsx` | UI de configuração do provider + URL |
| `supabase/functions/ai-autonomous-evaluator/index.ts` | Consome `aiSettings.api_url` para rotear chamadas |
