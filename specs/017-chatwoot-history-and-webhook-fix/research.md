# Research: Histórico de Conversa e Correção de Lead Automático

## 1. Problema de "Lead Não Criado"
O usuário reportou que mandou mensagens de teste mas os Leads não foram criados automaticamente para a unidade mapeada.

**Possíveis Causas no Webhook:**
- Em `chatwoot-webhook/index.ts`, o parser de payload tenta ler `payload.inbox?.id` e `payload.contact`. Dependendo da versão do Chatwoot e do tipo de evento (`message_created` vs `conversation_created`), a estrutura do JSON varia (`payload.inbox_id` vs `payload.inbox.id`, e `payload.meta.sender` vs `payload.sender`).
- O Webhook pode não ter sido configurado corretamente no painel do Chatwoot (é necessário adicionar a URL da Edge Function nas configurações de Webhooks do Chatwoot).

**Solução Webhook:** Refatorar a extração de dados no Webhook para lidar de forma robusta com as diferentes estruturas de payload do Chatwoot, garantindo que o `inbox_id`, `conversation_id`, e `contact` sempre sejam encontrados.

## 2. Necessidade de "Histórico de Conversa"
Para o gerente ou auditor poderem calcular o tempo de resposta ou entender o contexto, não basta saber que "o lead existe". É preciso ler o histórico da conversa (quem falou o que, e quando). 
Como armazenar e exibir isso?

**Abordagem Backend:**
- A Edge Function `chatwoot-webhook` já recebe TODAS as mensagens (`message_created`).
- Podemos criar uma nova tabela `messages` no Supabase, vinculada ao `lead_id` (ou `conversation_id`), onde salvaremos `content`, `sender_type` (user, contact, agent), e `created_at`.
- Alternativamente, poderíamos buscar as mensagens em tempo real na API do Chatwoot quando o modal de auditoria for aberto, mas isso deixaria o sistema dependente e lento. **Salvar no Supabase é a melhor prática para performance (e para permitir análise de IA futura).**

**Abordagem UI (AuditPanel):**
- A interface `AuditPanel.tsx` deve ganhar uma aba de "Chat" ou dividir o layout em 2 colunas:
  - Esquerda: Histórico do Chat estilo WhatsApp/iMessage, com "Liquid Glass", balões de mensagem estilizados e marcação de tempo.
  - Direita: Checklist de Auditoria e formulários.
- Para o design, usaremos a skill `ux-ui-architect-2026`: sombras multicamadas, alto contraste, transições dopamínicas. Mockaremos 3 ou 4 mensagens para o usuário ver como ficará maravilhoso antes de conectarmos a API.
