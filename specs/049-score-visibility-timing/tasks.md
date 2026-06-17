# Tasks: Momento Certo da Avaliação (Spec 049)

- [x] Criar estrutura e planejar textos de substituição.
- [ ] Atualizar `scripts/ai-cli-runner.md` e `scripts/autonomous_auditor_v2.mjs`:
  - Adicionar regra para que o score só seja avaliado se o lead for `closed_won` ou `closed_lost`.
  - Se o lead for `lead_new`, `negotiation`, ou `quote`, retornar `score: null` e `audit_checklist: {}`.
- [ ] Atualizar o front-end `src/components/Crm/KanbanCard.tsx`:
  - Garantir que o bloco do Score seja exibido SOMENTE se `isClosed` for verdadeiro.
- [ ] Compilar frontend e checar se está tudo okay (`npm run build`).
