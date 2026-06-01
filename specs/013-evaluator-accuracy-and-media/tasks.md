# Tasks

- [ ] Corrigir componente `AuditPanel.tsx`, removendo o fallback `else if (lead.score !== null) { setChecked({todas_true}) }`.
- [ ] Corrigir o mesmo bug em `ReadOnlyAuditPanel.tsx`.
- [ ] Corrigir o cálculo fantasma no componente `ChatHistoryView.tsx` (se houver fallback similar no array de checkboxes da conversa).
- [ ] Ajustar `ai-autonomous-evaluator/index.ts` linha ~495 para parar de dropar mídias de vídeo e áudio quando `provider === 'Local AI Proxy (CLI Tunnel)'`, permitindo enviá-los como data-URI base64 para o roteador CLI.
- [ ] Reforçar o system prompt em `ai-autonomous-evaluator/index.ts` na string `prompt`, adicionando regras explícitas para NUNCA gerar itens de checklist "true" no começo do funil se não houver prova.
