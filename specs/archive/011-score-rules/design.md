# Design: Smart Cutoff & Rolling 30 Days (011-score-rules)

## 1. UI & Visuals
There are no major changes to visual components (colors, spacing, layout). The modification purely intercepts the mathematical state provided to the `AreaChart` and `<Ranking>` lists.

## 2. Architecture & Data Flow

### 2.1 Score Calculation Overrides
Currently, the `avgScore` function inside `scoreUtils.ts` extracts `l.score` (which comes from the DB directly).
To fix historical scores instantaneously without writing a huge SQL migration, we will alter `avgScore`:
```typescript
const computedScore = calcLeadScore(l.audit_checklist || {}, l.funnel_stage);
```
`calcLeadScore` relies on `calcLostScore`, which automatically trims the "perfect score" denominator down to the exact point the mechanic gave up (e.g. marked lost after step 2a).

### 2.2 Re-establishing Global Filters
`dashboardFilters.ts` will be guaranteed to export:
```typescript
export function filterDashboardLeads(leads: Lead[], daysWindow = 30): Lead[] { ... }
```
In:
- `src/pages/Index.tsx`
- `src/components/Dashboard/TvDashboard.tsx`
- `src/pages/ManagerDashboard.tsx`
- `src/pages/Relatorios.tsx`

We will wrap the `.filter` calls for `globalScore`, `unitScores`, `managerScores`, and chart series around this utility function.

### 2.3 Edge Function Consistency
In `supabase/functions/ai-autonomous-evaluator/index.ts`, we will reproduce the `calcLostScore` logic so that the score mathematically written into Supabase on *new* evaluations matches the frontend's strict "just/fair" model.

## 3. Riscos Mitigados
- **Histórico Defasado:** Ao refatorar `avgScore` no runtime do React, garantimos que todos os leads ganhos/perdidos passados sejam recalculados na tela no mesmo milissegundo.
- **Gráficos Vazios:** A janela deslizante de 30 dias pode deixar algumas lojas vazias de dados se não tiverem leads fechados (ganho/perdido) nesse período. Isso é o comportamento correto (N/A) esperado pelo executivo para cobrar produtividade.
