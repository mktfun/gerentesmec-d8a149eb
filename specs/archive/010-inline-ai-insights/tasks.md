# Tarefas de Implementação - Inline AI Insights

- [ ] **Passo 1 (Banco de Dados):**
  - Solicitar ao usuário a execução de um script SQL no SQL Editor da Supabase para adicionar a coluna `ai_insight TEXT` na tabela `chat_messages`.

- [ ] **Passo 2 (Update Edge Function - `ai-autonomous-evaluator`):**
  - Modificar o `system_prompt` para retornar também uma chave `"message_insight"` no JSON de resposta.
  - Explicar ao LLM que este campo deve ser uma explicação curta e direta do motivo de ter mudado de etapa ou da nota, voltada para ser exibida abaixo da mensagem do usuário (Ex: "✨ IA: Movi para Em Negociação pois você enviou um vídeo do orçamento").
  - Modificar o código TypeScript da Edge Function para, ao final da avaliação, realizar um `UPDATE` em `chat_messages` setando o campo `ai_insight = jsonOutput.message_insight` onde o `chatwoot_message_id = message_id`.

- [ ] **Passo 3 (Frontend Types & AppContext):**
  - Atualizar a interface `ChatMessage` no arquivo `ChatHistoryView.tsx` para incluir a propriedade opcional `ai_insight?: string`.

- [ ] **Passo 4 (Renderização em `ChatHistoryView.tsx`):**
  - Localizar o mapa de renderização (`messages.map`) no arquivo.
  - Para mensagens onde `msg.ai_insight` existir, renderizar um bloco compacto de UI usando `framer-motion` (um tooltip ou inline block) abaixo da "bolha" de chat. 
  - Usar tons roxos/índigo (`bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`) e um ícone `Sparkles` pequeno para garantir o aspecto Premium.

- [ ] **Passo 5 (Validação e Deploy):**
  - Realizar o deploy do Edge Function modificado (`npx supabase functions deploy ai-autonomous-evaluator --no-verify-jwt`).
  - Avisar o usuário para testar conversando pelo WhatsApp com a AI.
