# Proposal: Histórico de Conversa Premium & Correção de Webhook

## Identificador
`017-chatwoot-history-and-webhook-fix`

## O Problema
1. O gerente enviou uma mensagem de teste e o Webhook do Chatwoot falhou silenciosamente (o lead não apareceu no Kanban/Lista para a respectiva Unidade).
2. O CRM atualmente não mostra o Histórico de Conversa (Chat) real, o que inviabiliza a medição exata do tempo de resposta e a avaliação da qualidade da conversa pelos auditores. Sem visualizar as mensagens, o lead parece "vazio".

## A Solução
- **Blindagem do Webhook:** Tornar a Edge Function `chatwoot-webhook` resiliente às diferentes estruturas JSON que o Chatwoot envia (`message_created` vs `conversation_created`), garantindo que o `inbox_id` e o `contact` sejam sempre capturados.
- **Armazenamento de Mensagens:** Criar a tabela `chat_messages` no banco para guardar localmente as mensagens disparadas pelo webhook, evitando que a UI fique lenta buscando na API externa.
- **Chat UI Premium (UX 2026):** Reformular o `AuditPanel.tsx` (Dossiê) adicionando uma interface visual de Chat espelhada (estilo WhatsApp/iMessage) com design Apple Liquid Glass, balões dinâmicos, separação por remetente (Cliente x Agente) e timestamps. No primeiro momento, mockaremos essas mensagens para aprovação visual.

## BDD Scenarios

### Cenário: Novo Cliente envia mensagem e Lead é gerado
- **Given (Dado):** que a caixa de entrada (Inbox ID 1) está mapeada para a Unidade "Mecânica Tork".
- **When (Quando):** o Chatwoot dispara o webhook `message_created` com payload aninhado ou `conversation_created` com payload flat.
- **Then (Então):** a Edge Function extrai perfeitamente o `inbox_id`, vincula à unidade e cria o Lead instantaneamente com SLA "ok", refletindo na tela em tempo real via Supabase Realtime.

### Cenário: Sincronização de mensagens contínuas
- **Given (Dado):** que o Lead já existe no painel.
- **When (Quando):** qualquer pessoa (cliente ou atendente) enviar uma nova mensagem no canal do Chatwoot.
- **Then (Então):** a Edge Function recebe o webhook `message_created`, insere a mensagem na tabela `chat_messages` local e atualiza o `last_message_at` do Lead.

### Cenário: Visualização do Histórico Premium
- **Given (Dado):** que o gerente clica no card de um Lead para abrir o Dossiê (AuditPanel).
- **When (Quando):** a tela desliza da direita.
- **Then (Então):** a interface exibe duas colunas: a da direita mantém o Checklist/Score atual, e a da esquerda exibe a timeline da conversa completa, com balões de mensagem estilizados e rolagem orgânica, permitindo auditoria visual direta.
