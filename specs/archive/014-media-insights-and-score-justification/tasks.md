# Tasks (Spec 014)

## Backend (Supabase)
- [ ] Criar migration SQL para adicionar a coluna `audit_justifications` (JSONB) e `media_summaries` (JSONB) na tabela `leads`.
- [ ] Atualizar os tipos do Supabase (TypeScript) para incluir essas chaves em `Lead`.
- [ ] Alterar `ai-autonomous-evaluator/index.ts` para que o JSON de saída espere as chaves `audit_justifications` e `media_summaries`.
- [ ] Atualizar a função RPC de save (ou atualização direta em `AppDataContext`) para enviar e gravar os campos novos no banco de dados.

## Frontend (Stitch/UI)
- [ ] Atualizar `AuditPanel.tsx` e `ReadOnlyAuditPanel.tsx` para renderizar a string de justificativa caso exista em `lead.audit_justifications[item.id]`.
- [ ] Atualizar `ChatHistoryView.tsx` para procurar em `lead.media_summaries` e renderizar uma caixinha de "Insight da IA" logo abaixo dos balões que contém vídeo/áudio/imagem.
- [ ] Inserir alerta visual em `AdvancedAiPanel.tsx` orientando que as "Configurações de Rota" só salvam clicando no botão "Diagnóstico Inteligente", separando o mindset de salvamento de prompt.
