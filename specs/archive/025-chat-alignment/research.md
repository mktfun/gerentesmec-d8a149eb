# Research: Correção de Alinhamento e Avatares no Histórico de Chat

## Problema Relatado
O usuário relatou que no histórico de chat, todas as mensagens (tanto do cliente quanto do gerente) estão aparecendo do lado ESQUERDO e com o ícone de chave de boca (Wrench), falhando em diferenciar os autores das mensagens.

## Diagnóstico
1. **O Bug da Webhook Antiga:** Até a última correção, a webhook do Chatwoot (`supabase/functions/chatwoot-webhook/index.ts`) continha um bug de tipagem. A propriedade `message_type` falhava na comparação estrita e todas as mensagens recebiam um `sender_type = 'bot'` por fallback.
2. **Impacto no Banco de Dados:** Como resultado, todas as mensagens históricas salvas na tabela `chat_messages` antes da correção estão registradas com `sender_type: 'bot'`.
3. **Comportamento da UI:** No arquivo `ChatHistoryView.tsx`, a lógica de alinhamento verifica:
   - `isUser = msg.sender_type === 'user'` (Alinhamento à Direita)
   - `isBot = msg.sender_type === 'bot'`
   - Como todas as mensagens antigas têm `sender_type === 'bot'`, a UI alinha todas à esquerda e aplica o ícone de `Wrench` (chave de boca).

## Solução Necessária
1. **Resync do Histórico:** Criar um script de backfill (`fix_chat_messages.ts`) que consulte a API do Chatwoot, recupere o `message_type` correto para todas as mensagens já salvas e faça o `UPDATE` na tabela `chat_messages` mudando 'bot' para 'contact' (cliente) ou 'user' (gerente).
2. **Revisão da UI:** Garantir que o `ChatHistoryView.tsx` alinhe corretamente:
   - Gerente/Usuário (user): Direita, balão colorido, sem ícone lateral.
   - Contato/Cliente (contact): Esquerda, balão escuro, com avatar usando a primeira letra do nome.
   - Sistema/Bot Autônomo (bot): Esquerda, com ícone de Chave de Boca.
