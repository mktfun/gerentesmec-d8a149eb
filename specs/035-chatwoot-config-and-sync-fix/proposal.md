# Proposal: Chatwoot Config & Sync Fix

## Requisitos
1. O campo **Account ID** na tela de Configurações deve salvar corretamente no banco (sem `NaN`).
2. Toda função que consome `chatwoot_url` do banco deve normalizar a URL com `https://` antes de usá-la.
3. O botão "Puxar Histórico" na tela de Config deve funcionar disparando a Edge Function `chatwoot-sync` que sincroniza as conversas no banco.
4. O `chatwoot_account_id` deve ser obrigatório e usado diretamente — sem depender de chamadas a `/profile`.

## BDD Scenarios

### Cenário: Salvar Account ID com sucesso
- **Dado** que o usuário digita `5` no campo Account ID
- **Quando** ele clica em "Salvar Configurações de API"
- **Então** o banco persiste `chatwoot_account_id = 5` e exibe toast de sucesso

### Cenário: Salvar com Account ID vazio
- **Dado** que o campo Account ID está vazio
- **Quando** o usuário salva
- **Então** o banco salva `null` (sem NaN) e não quebra a aplicação

### Cenário: URL sem protocolo não quebra a Edge Function
- **Dado** que a URL salva no banco é `chat.tork.services`
- **Quando** a Edge Function `chatwoot-webhook` processa um evento
- **Então** ela normaliza a URL para `https://chat.tork.services` antes de qualquer fetch

### Cenário: Botão "Puxar Histórico" sincroniza conversas
- **Dado** que o usuário configurou URL, Token e Account ID corretos
- **Quando** ele clica em "Puxar Histórico"
- **Então** a Edge Function `chatwoot-sync` varre as conversas dos últimos 7 dias, cria os leads e messages no banco e retorna `{ message: "X conversas sincronizadas" }`
