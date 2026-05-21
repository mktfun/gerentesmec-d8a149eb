# Tasks: AI Auditor Multi-Agente (019)

- [ ] **1. Fundação RAG no Supabase**:
  - Criar migration SQL para habilitar a extensão `vector`.
  - Alterar a tabela `chat_messages` para ter uma coluna `embedding vector(1536)`.
  - Criar function SQL `match_messages` para busca vetorial de similaridade (RAG foundation).
- [ ] **2. Webhook / Trigger de Banco**:
  - Criar um Trigger Postgres ou Supabase Webhook que dispare um evento `after insert` na tabela `chat_messages` para a Edge Function `ai-auditor`.
- [ ] **3. Edge Function (`ai-auditor`) - Router**:
  - Implementar um script Deno na pasta `supabase/functions/ai-auditor/`.
  - Configurar a API Key da OpenAI.
  - Implementar o padrão "Tool Calling" do modelo como Roteador Cognitivo, capaz de despachar tarefas (`analyze_audio`, `analyze_vision`, `score_lead`).
- [ ] **4. Edge Function - Prompts & Skills**:
  - Criar modulos separados na Edge Function (`skills/vision.ts`, `skills/audio.ts`, `skills/judge.ts`) para manter as mentes e prompts muito bem divididos e fáceis de calibrar.
  - O `judge` deve avaliar as 10 métricas do Dossiê e atualizar a nota do lead usando a API do Supabase.
- [ ] **5. Interface Crm/AuditPanel.tsx**:
  - Adicionar feedback visual (ex: badge ou ícone ✨ de IA) no Dossiê indicando que o score está sendo auditado em tempo real por IA.
  - Garantir que a subscription do realtime reflita atualizações automáticas feitas pela IA nas métricas do Checklist.
