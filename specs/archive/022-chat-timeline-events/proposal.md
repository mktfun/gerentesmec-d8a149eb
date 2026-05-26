# Proposal: Chat Timeline Events & Real History (022)

## Identificador
`022-chat-timeline-events`

## O Problema
No Dossiê, o histórico visual estava com uma aparência simples, misturando dados reais e *mocks*. O usuário quer que o chat tenha uma interface primorosa de mensagens e que acontecimentos sistêmicos (ex: a IA deu o check 1A, a IA mudou o lead para Orçamento, a IA gerou o score) apareçam cronologicamente inseridos no meio do chat como marcações sutis, idêntico à forma como o Chatwoot mostra "lead_quente added".

## Requisitos
- **Req 1 (Remove Mocks):** `ChatHistoryView` deve confiar 100% no array `messages` do Supabase. Sem mock fallback.
- **Req 2 (System Sender Type):** Permitir inserção e renderização de mensagens do tipo `sender_type = 'system'`.
- **Req 3 (Timeline Pills UI):** Se a mensagem for `system`, renderizá-la não como um balão de conversa, mas como uma cápsula (pill) pequena, sutil e centralizada, indicando apenas a ação (ex: "Etapa alterada para Em Orçamento", "Score calculado em 80%").
- **Req 4 (Registro Automático):** Alterar o `AppDataContext.tsx` e o fluxo da Edge Function `ai-auditor` para que, ao mudarem etapas ou darem score, gerem uma linha do tipo `system` na tabela `chat_messages`.

## BDD Scenarios

### Cenário: Renderização do Histórico e Pílula de Sistema
- **Given:** O Dossiê do Lead tem 2 mensagens reais no banco e 1 registro de sistema "Movido para Em Negociação".
- **When:** O gerente abre o Dossiê.
- **Then:** O painel esquerdo exibe os 2 balões de diálogo (cliente vs atendente) e, entre eles (cronologicamente), uma pequena pílula centralizada cinza contendo o texto da ação sistêmica. Nenhum mock é exibido.
