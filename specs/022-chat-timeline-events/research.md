# Research: Chat Timeline Events & Real History (022)

## Contexto e Pedido do Usuário
O usuário percebeu que o Dossiê ainda estava usando um fallback visual de mensagens mockadas. O pedido tem duas partes principais:
1. **Histórico Real e Bonitinho**: Ligar de vez o chat para puxar exclusivamente as mensagens reais gravadas no Supabase e dar um layout premium ("bonitinho") de chat.
2. **Timeline Events (Pills Mistas)**: Inserir marcadores sutis no meio do chat cronológico. Por exemplo, se a IA marcou um check ou mudou a etapa do funil (ex: `Em Orçamento -> Em Negociação`) em determinado momento, isso deve aparecer graficamente no meio das mensagens na ordem correta de tempo (exatamente como o Chatwoot mostra na screenshot enviada pelo usuário: *pill oval cinza, discreto, sem nome de ator, apenas a ação*).

## Análise do Código Atual
- `ChatHistoryView.tsx`: Atualmente exibe as mensagens cruas (`sender_type: 'contact' | 'user' | 'bot'`). Não tem suporte a "Eventos de Sistema".
- `chat_messages` table: Guarda mensagens textuais. Não há uma tabela centralizada de "System Logs" ou "Timeline Events".

## Abordagem Tecnológica (Benchmarking)
Plataformas como Intercom, Zendesk e Chatwoot misturam "mensagens" e "eventos" (audit logs) em uma única Timeline ordenando por `created_at`.
Para não precisar criar uma tabela nova inteira só pra isso agora, a abordagem ideal é injetar esses eventos em *runtime* (Virtual Timeline) calculando a hora em que o Lead mudou de etapa, ou gravando mensagens do tipo `sender_type = 'system'` e `content = 'mudou etapa para X'`. Como a IA vai interagir futuramente mudando os estados, usar o próprio banco de `chat_messages` com um `sender_type = 'system'` é a forma mais robusta e escalável.
