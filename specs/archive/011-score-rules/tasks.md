# Tasks: Smart Cutoff & Rolling 30 Days (011-score-rules)

- [x] 1. Restabelecer o `filterDashboardLeads` globalmente.
  - [x] Garantir que `src/utils/dashboardFilters.ts` exija `closed_won` ou `closed_lost` e restrinja a data para 30 dias móveis.
  - [x] Aplicar no `Index.tsx`.
  - [x] Aplicar no `TvDashboard.tsx`.
  - [x] Aplicar no `ManagerDashboard.tsx`.
  - [x] Aplicar no `Relatorios.tsx`.
- [x] 2. Ajustar o Recálculo de Score no Frontend.
  - [x] Em `src/utils/scoreUtils.ts`, alterar a função `avgScore` para não depender estaticamente de `l.score`.
  - [x] Invocar `calcLeadScore` mapeando as opções justas de peso.
- [x] 3. Ajustar a Edge Function `ai-autonomous-evaluator`.
  - [x] Copiar o array `ITEM_SEQUENCE` e a lógica do `calcLostScore`.
  - [x] Subordinar o `calculatedScore` a um IF verificando se `newFunnelStage === 'closed_lost'`.
- [x] 4. Validação.
  - [x] Confirmar que gerentes com leads muito antigos não herdam pontuação no Ranking.
  - [x] Confirmar que leads perdidos não diluem o score por etapas ignoradas.
