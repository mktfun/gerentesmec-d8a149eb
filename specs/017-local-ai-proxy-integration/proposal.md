# Proposal — 017: Local AI Proxy Integration

## Objetivo

Fazer o sistema de avaliação de leads por IA funcionar de ponta a ponta através do **CLI Proxy local** (Gemini via `cli-proxy-api.exe`) em vez de APIs de terceiros, eliminando o erro `FATAL: Túnel Offline ou Inalcançável` que afeta 25+ tasks na fila.

---

## Requisitos

### Funcionais

1. A tabela `ai_settings` no Supabase deve ter uma coluna `api_url` para persistir a URL base do proxy.
2. O frontend deve salvar e carregar a `api_url` corretamente ao configurar o provider `Local AI Proxy (CLI Tunnel)`.
3. A Edge Function `ai-autonomous-evaluator` deve usar `api_url` do banco e o modelo `gemini-2.5-flash` obrigatoriamente quando o provider for o proxy local.
4. A API Key do proxy (`key-8bb35a9f6a724543a5e788ee55b1c880`) deve ser salva em campo `api_key` e usada na autenticação.
5. O modelo exposto na UI para o proxy deve ser `gemini-2.5-flash` (não `gemini-3.5-flash` que é apenas display name do CLI).

### Não-funcionais

- A URL do tunnel muda a cada reinício — o sistema deve permitir atualizar a `api_url` facilmente via UI sem precisar de deploy.
- Nenhuma chave sensível deve ser hardcoded no frontend.

---

## User Stories

**US-01** — Como administrador, quero salvar a URL do tunnel e a API Key do proxy local na tela de configurações, para que o sistema persista essas informações entre recargas.

**US-02** — Como a Edge Function, quero ler a `api_url` corretamente do banco de dados, para que as chamadas ao Gemini sejam roteadas pelo proxy local sem fallback incorreto para OpenAI.

**US-03** — Como administrador, quero ver o status real da conexão com o proxy (online/offline) na tela de configurações, para saber se preciso reiniciar o tunnel antes das avaliações.

---

## Critérios de Aceite

- [ ] `api_url` existe como coluna TEXT na tabela `ai_settings` do Supabase.
- [ ] Ao salvar o provider `Local AI Proxy`, a URL e a key são persistidas e recarregadas corretamente na UI.
- [ ] A Edge Function não retorna mais `FATAL: Túnel Offline` quando o proxy está online e o banco tem `api_url` preenchida.
- [ ] O modelo enviado para o proxy é sempre `gemini-2.5-flash`.
- [ ] O TypeScript não tem erros de tipo nos arquivos modificados.

---

## BDD Scenarios

### Cenário: Salvar URL do proxy no banco
- **Given (Dado):** Admin está na tela Config → IA, provider = `Local AI Proxy (CLI Tunnel)`
- **When (Quando):** Preenche a URL `https://past-sean-restored-performing.trycloudflare.com` e clica em "Diagnóstico Inteligente"
- **Then (Então):** O banco de dados registra `api_url = 'https://...'` na tabela `ai_settings`, e ao recarregar a página o campo aparece preenchido

### Cenário: Edge Function roteia pelo proxy
- **Given (Dado):** `ai_settings.provider = 'Local AI Proxy (CLI Tunnel)'` e `api_url` preenchida no banco
- **When (Quando):** O webhook dispara uma avaliação de mensagem
- **Then (Então):** A Edge Function chama `{api_url}/v1/chat/completions` com `model: gemini-2.5-flash` e `Authorization: Bearer {api_key}`

### Cenário: Proxy offline gera erro claro
- **Given (Dado):** `api_url` está preenchida mas o `cli-proxy-api.exe` está parado (502)
- **When (Quando):** A Edge Function tenta chamar o proxy
- **Then (Então):** A task na fila mostra `status: 'error'` com mensagem `"Túnel Offline: 502"` e não entra em loop de retry infinito

### Cenário: URL não salva não bloqueia o build
- **Given (Dado):** `api_url` não foi informada
- **When (Quando):** O TypeScript compila o projeto
- **Then (Então):** Zero erros de tipo — `api_url` é `string | null` com fallback seguro
