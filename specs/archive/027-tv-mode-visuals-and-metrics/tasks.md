# Tasks: TV Mode Visuals & Metrics Engine

- [x] 1. **Implementar Filtro de Datas no TV Mode**
  - No arquivo `TvDashboard.tsx`, adicionar estado `dateFilter` com `localStorage`.
  - Criar um Dropdown/Select no Header para alterar esse estado (opções: Hoje, Ontem, 7d, 30d, Mês Atual).
- [x] 2. **Refatorar Motor de Métricas**
  - Criar função utilitária para filtrar os `leads` baseada na data de `created_at` (ou `last_message_at`) vs o `dateFilter`.
  - Atualizar `getUnitMetrics` para calcular "T.M.R." usando o array filtrado real.
  - Atualizar `getUnitMetrics` para calcular "Leads em Risco" contando leads com `sla_status === 'danger'`.
- [x] 3. **Refino Visual (UX/UI)**
  - Corrigir os problemas de layout (fundo cortado).
  - Usar um `Select` do Lucide ou UI nativa para o botão do filtro ser minimalista e elegante (sem destoar do estilo Comando Central).
  - Testar a quebra do texto "Sem comparativo disponível" fixando alturas (h-x) ou classes do flex.
