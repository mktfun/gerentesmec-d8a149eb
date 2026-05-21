# Tasks: Histórico de Conversa & Webhook Fix (017-chatwoot-history-and-webhook-fix)

Siga estas tarefas ESTRITAMENTE em ordem:

- [ ] **1. Ajuste do Layout da Auditoria (Stitch/React):**
  - Refatorar o `AuditPanel.tsx` para comportar um Grid de 2 colunas se houver espaço (ex: tela cheia ou drawer mais largo).
  - Coluna Esquerda: Componente de Histórico de Conversa (`ChatHistoryView.tsx`), contendo scroll vertical independente, cabeçalho e rodapé.
  - Coluna Direita: O conteúdo atual de Checklist/Evidence de auditoria.

- [ ] **2. Criação Visual do Chat (UI Mockada 2026):**
  - Implementar balões de mensagem estilizados (Liquid Glass para clientes, Neon Gradient para agentes).
  - Inserir um array de 4 mensagens mockadas para o usuário ver e testar a rolagem, a animação `spring` de entrada e os detalhes como data/hora ao passar o mouse.
  
- [ ] **3. Migração do Banco de Dados:**
  - Criar um arquivo SQL de migração que adiciona a tabela `chat_messages` contendo as colunas `lead_id`, `chatwoot_message_id`, `content`, `sender_type`, `created_at`.
  - Fornecer este SQL para o usuário rodar no Supabase Dashboard.

- [ ] **4. Refatoração da Edge Function (`chatwoot-webhook`):**
  - Alterar `index.ts` para capturar `inbox_id` de forma defensiva (ex: `payload.inbox_id || payload.inbox?.id`).
  - Alterar captura de contato para suportar novas versões do Chatwoot (`payload.meta?.sender`).
  - Incluir lógica: Se o evento for `message_created`, inserir o registro na tabela `chat_messages`.

- [ ] **5. Conexão do Contexto e Teste Final:**
  - Atualizar o `AppDataContext.tsx` ou criar chamadas no `AuditPanel` para buscar as mensagens reais daquele `lead_id` do Supabase.
  - Fazer o deploy das funções e validar a jornada end-to-end com um teste real.
