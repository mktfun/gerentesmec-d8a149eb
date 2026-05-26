# Proposal: Sincronização Histórica e Fix de Configurações (021)

## Identificador
`021-chatwoot-history-sync`

## O Problema
Atualmente, a tela de configurações agrupa a persistência dos campos de API, Token e Secret de Webhook num único gatilho atrelado ao botão "Testar". Se o usuário preencher o campo e mudar de tela, os dados se perdem.
Além disso, o botão de "Sincronização Histórica" tem um alerta mockado, impedindo o carregamento do histórico passado para quem já tem conversas rodando no Chatwoot.

## Requisitos
- **Req 1 (Fix UI):** Botão "Salvar" individual ou acoplado que persista imediatamente as credenciais inseridas (URL, Token, Account ID e Webhook Secret) na tabela `integration_settings`.
- **Req 2 (Sync Function):** Conectar o botão "Puxar Histórico" ao invoker de funções do Supabase para acionar a rota remota `chatwoot-sync`.
- **Req 3 (Feedback Visual):** Exibir loading no botão durante a sincronização e retornar via notificação quantos leads foram puxados, dando total transparência ao gerente.

## BDD Scenarios

### Cenário: Salvando as Configurações de API e Webhook
- **Given:** O gerente acessou a tela de Configurações e não possui um Segredo de Webhook configurado.
- **When:** Ele digita "123456" no campo de Segredo do Webhook e clica em "Salvar Configurações".
- **Then:** O estado é persistido no banco e um feedback de "Salvo com sucesso" aparece em verde.

### Cenário: Sincronizando o Histórico
- **Given:** O gerente inseriu os dados de integração com sucesso.
- **When:** Ele clica em "Puxar Histórico".
- **Then:** O botão exibe um spinner rotativo e, após conclusão, exibe a mensagem "X conversas novas importadas com sucesso!".
