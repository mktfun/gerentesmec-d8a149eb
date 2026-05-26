# Research: Correção de Account ID e URL do Chatwoot

## Bug Reportado
```
Edge function returned 400: Error, {"error":"Invalid URL: 'chat.tork.services/api/v1/profile'"}
```

## Causa Raiz (2 problemas)

### 1. URL sem protocolo `https://`
- O usuário salvou a URL como `chat.tork.services` (sem `https://`).
- A Edge Function `chatwoot-inboxes` faz `fetch(${baseUrl}/api/v1/profile)` que resulta em `chat.tork.services/api/v1/profile` — uma URL inválida para o runtime Deno.
- **Fix:** Garantir que a URL sempre tenha `https://` no início, tanto no frontend (ao salvar) quanto na Edge Function (como fallback).

### 2. Dependência desnecessária do endpoint `/profile`
- Atualmente, a Edge Function chama `/api/v1/profile` apenas para extrair o `account_id`.
- Isso é frágil: se o token for um "bot token" ou "agent token" com permissões limitadas, o `/profile` pode não retornar o `account_id`.
- **Solução do usuário:** Adicionar um campo `Account ID` na UI de configuração para que o admin informe diretamente o número da conta do Chatwoot. Isso elimina a chamada ao `/profile` e torna o fluxo 100% determinístico.

## Arquivos Afetados
| Arquivo | Mudança |
|---------|---------|
| `integration_settings` (tabela) | Nova coluna `chatwoot_account_id` (integer) |
| `Config.tsx` | Novo input "Account ID" + sanitização da URL |
| `InboxMappingPanel.tsx` | Passa `accountId` para a Edge Function |
| `chatwoot-inboxes/index.ts` | Recebe `account_id` direto, pula `/profile`, fix de URL |
