# Tasks: Chatwoot Rich Media & AI Readiness

- [ ] 1. **Migration (Database)**
  - Adicionar colunas `media_url` (text) e `media_type` (varchar) na tabela `chat_messages`.
- [ ] 2. **Webhook Update**
  - No `chatwoot-webhook/index.ts`, capturar `attachments` do payload e salvar na inserção da mensagem.
- [ ] 3. **AI Transcriber Edge Function**
  - Criar `transcribe-audio` function que puxa o arquivo de áudio da URL e envia para `https://api.openai.com/v1/audio/transcriptions`.
  - Configurar um Database Webhook/Trigger (instruções pro usuário) para disparar sempre que entrar um áudio sem conteúdo texto.
- [ ] 4. **UI Update**
  - Em `ChatHistoryView.tsx`, ler `media_url` e `media_type`.
  - Renderizar players `<audio>`, `<video>` ou tags `<img>` apropriadas e estilizadas com padrão visual 2026.
