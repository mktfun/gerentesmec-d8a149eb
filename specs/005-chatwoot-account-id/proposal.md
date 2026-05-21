# Proposal: Correção Account ID + URL do Chatwoot

## Identificador
`005-chatwoot-account-id`

## O Problema
A Edge Function `chatwoot-inboxes` retorna erro 400 (`Invalid URL`) porque:
1. A URL salva no banco não tem o prefixo `https://`, gerando uma URL inválida pro Deno.
2. A função tenta descobrir o `account_id` chamando `/api/v1/profile`, mas isso é frágil e desnecessário — o admin já sabe o número da conta dele.

## A Solução
- Adicionar campo `Account ID` na tela de configuração (ao lado de URL e Token).
- Sanitizar a URL automaticamente adicionando `https://` se o usuário não digitar.
- A Edge Function recebe o `account_id` direto no payload, eliminando a chamada ao `/profile`.

## Requisitos
- Nova coluna `chatwoot_account_id` (integer) na tabela `integration_settings`.
- Input numérico "Account ID" na UI de Config.tsx.
- Edge Function `chatwoot-inboxes` refatorada para usar `account_id` do payload.
- Sanitização de URL (prefixar `https://` automaticamente).

## BDD Scenarios

### Cenário: Admin configura Account ID
- **Given (Dado):** que o admin está na tela de Configurações com URL e Token preenchidos.
- **When (Quando):** o admin preenche o campo "Account ID" com o número da conta (ex: `1`) e clica em "Testar".
- **Then (Então):** o sistema salva os 3 campos (`url`, `token`, `account_id`) no banco e exibe "Conectado com sucesso".

### Cenário: URL sem protocolo é sanitizada
- **Given (Dado):** que o admin digitou `chat.tork.services` no campo URL (sem `https://`).
- **When (Quando):** o sistema salva ou usa essa URL.
- **Then (Então):** o sistema adiciona automaticamente `https://` antes de fazer qualquer requisição, evitando erro de URL inválida.

### Cenário: Inboxes carregam usando Account ID direto
- **Given (Dado):** que URL, Token e Account ID estão salvos e validados.
- **When (Quando):** o painel de "Caixas de Entrada" carrega automaticamente.
- **Then (Então):** a Edge Function usa o `account_id` diretamente na rota `/api/v1/accounts/{id}/inboxes`, sem chamar `/profile`, retornando os canais instantaneamente.
