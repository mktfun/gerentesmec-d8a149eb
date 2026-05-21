# Research: Chatwoot Messaging Type Fix

## Contexto e Desafio
A funcionalidade de Chat History tem apresentado um comportamento confuso na interface: mensagens enviadas por **Gerentes** (humanos) ou **Clientes** estão aparecendo com um ícone de "Ferramenta" (Wrench), que no nosso sistema significa `bot`.
Isso ocorre porque o webhook `chatwoot-webhook` está falhando em classificar corretamente a origem da mensagem e recorrendo ao fallback de `bot` por segurança.

## Causa Raiz
Na análise do payload do Chatwoot, existem três principais fatores de erro no nosso código legado:
1. **Diferenças de Versão do Chatwoot:** Algumas versões e integrações (como a Evolution API / WappConnect) não enviam `message_type` como um `Number` (0 ou 1). Elas enviam como `String` (`"incoming"` para cliente, `"outgoing"` para agente, `"template"` para mensagens automáticas).
2. **Avaliação `NaN`**: Ao tentar fazer `Number("incoming")`, o código retorna `NaN`. Quando avaliamos `if (messageType === 0)`, o `NaN` falha em todas as condições numéricas, caindo diretamente no `else senderType = 'bot'`.
3. **Ignorar `sender.type`**: O payload mais confiável do Chatwoot envia a estrutura `sender: { type: "user" | "contact" }`. Ignorar isso e tentar depender apenas do `message_type` gera instabilidade.

## Solução Arquitetural
- O Webhook deve usar primariamente `payload.sender?.type`.
- Deve ter suporte a fallback para strings (`"incoming"`, `"outgoing"`).
- O banco de dados histórico (tabela `chat_messages`) possui registros "sujos" (`sender_type = 'bot'`) que precisam ser higienizados para arrumar o histórico de conversas que já aconteceram.
