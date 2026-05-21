# Proposal: Mapeamento Explícito de Canais Chatwoot

## Identificador
`004-chatwoot-inbox-mapping`

## O Problema
Atualmente, o vínculo entre um canal de atendimento do WhatsApp no Chatwoot e uma `Unit` (Unidade Dom Pedro, Unidade XYZ) no nosso sistema é feito "adivinhando" pelo nome em formato de texto. Isso é instável. Além disso, a rotina de puxar dados históricos estava falhando com erro 500 devido a dependências assíncronas do banco de dados na Edge Function. E tentar baixar milhares de mensagens do passado causa bloqueios de rate limit.

## A Solução
Criar uma interface de "Mapeamento Direto" (Visual Mapping). 
1. Uma nova Edge Function `chatwoot-inboxes` que apenas atua como "Proxy", recebendo as credenciais do front-end e retornando a lista de caixas de entrada (Inboxes).
2. O banco de dados passa a salvar o ID oficial do Chatwoot (`chatwoot_inbox_id`) diretamente na tabela `units`.
3. O Webhook atual (`chatwoot-webhook`) será refatorado para usar esse `chatwoot_inbox_id` (cruzamento com 100% de precisão).
4. Removemos a carga massiva de sync histórico para proteger a infraestrutura e a conta do cliente. Apenas novos leads entram no funil normalmente.

## Requisitos
- Adicionar coluna `chatwoot_inbox_id` (Integer, Nullable, Unique) na tabela `units`.
- Nova Edge Function: `chatwoot-inboxes` que aceita `{ url, token }` no POST body.
- UI atualizada em `Config.tsx` exibindo as caixas do Chatwoot e dropdowns selecionáveis para vinculá-las às Unidades do painel.

## BDD Scenarios

### Cenário: Mapeamento Visual de Inboxes
- **Given (Dado):** que o painel conectou a API do Chatwoot com sucesso.
- **When (Quando):** o administrador acessa a seção "Canais de Atendimento" nas configurações.
- **Then (Então):** o sistema lista todos os inboxes reais retornados pela conta do Chatwoot (ex: WhatsApp Dom Pedro).
- **And (E):** o usuário pode selecionar num dropdown a qual "Unidade" aquele inbox pertence.
- **And (E):** ao salvar, o sistema grava de forma definitiva o `chatwoot_inbox_id` na Unidade correta, garantindo precisão cirúrgica no recebimento dos próximos Webhooks.
