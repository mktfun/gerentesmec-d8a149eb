# Design: Correção de Alinhamento e Avatares no Histórico de Chat

## Frontend (`src/components/Crm/ChatHistoryView.tsx`)
A UI precisa ler a propriedade `msg.sender_type` e aplicar estilos lógicos.

**Lógica de Renderização de Linha (Bubble Wrapper):**
- Se `isUser` (Gerente): `justify-end` (Alinha para a direita). Não exibe avatar lateral.
- Se `!isUser` (Cliente ou Bot): `justify-start` (Alinha para a esquerda). Exibe avatar lateral.

**Avatar Lateral (`!isUser`):**
- Se `isBot`: Renderiza o ícone de ferramenta da mecânica (`<Wrench className="w-3 h-3 text-indigo-400" />`).
- Se não for `isBot` (logo é `contact` / cliente): Renderiza a letra inicial do nome do cliente (`{lead.customer_name.charAt(0)}`) formatado como um badge arredondado.

## Backend / Database (`chat_messages` backfill script)
Para corrigir o legado (mensagens antigas), precisaremos de uma Deno Edge Function chamada `chatwoot-sync-messages` que:
- Seleciona todas as conversas do banco.
- Faz requisição para a API do Chatwoot buscando as mensagens daquela conversa.
- Mapeia o array de mensagens e verifica o `message_type` correto do Chatwoot (0 = contact, 1 = user).
- Faz o UPDATE em lote na tabela `chat_messages` ajustando o `sender_type`.
