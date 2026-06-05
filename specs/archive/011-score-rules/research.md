# Research: Smart Cutoff & Rolling 30 Days (011-score-rules)

## Contexto & Dor do Usuário
O usuário apontou duas inconsistências graves na contabilização de performance (Score) nos Dashboards e Relatórios:
1. **O Score de leads Perdidos (closed_lost) é injusto:** Se um mecânico marca um lead como "Perdido" na Etapa 2, o sistema atual divide os pontos pelas 4 etapas inteiras, jogando a nota do funcionário no chão por etapas que nem ocorreram. O usuário quer que o sistema corte o denominador até o último item marcado (Cutoff Inteligente).
2. **Inconsistência de Filtro de Dashboards:** Os painéis (Executivo, Operacional, Gerente) misturam leads antigos e não resolvidos. O usuário exige que a média de pontuação global mostre APENAS `closed_won` e `closed_lost` que ocorreram especificamente nos ÚLTIMOS 30 DIAS (janela deslizante, incluindo hoje).

## Análise Técnica
1. **Cutoff Inteligente:** 
   Já existe uma função `calcLostScore(checklist)` perfeitamente modelada em `src/utils/scoreUtils.ts` que implementa essa lógica usando a constante `ITEM_SEQUENCE`.
   *Problema:* A Edge Function (`ai-autonomous-evaluator`) ignora essa função e recalcula tudo com a regra estática de pesos (40/30/20/10). Como o frontend pega o `lead.score` direto do banco, a IA injeta a nota errada.
   *Solução:* Fazer o frontend **recalcular dinamicamente** o score de todos os leads usando `calcLeadScore(l.audit_checklist, l.funnel_stage)` antes de rodar `avgScore`. Isso corrige **retroativamente** todas as notas injustas antigas e dispensa mexer no banco. Opcionalmente, espelhar a lógica na Edge Function.

2. **Filtro de 30 Dias:**
   O arquivo `src/utils/dashboardFilters.ts` já exporta `filterDashboardLeads(leads, 30)` que faz exatamente a verificação de `closed_won/closed_lost` + 30 dias.
   *Problema:* Em commits recentes, essa função foi removida das chamadas em `Index.tsx`, `TvDashboard.tsx` e `ManagerDashboard.tsx`.
   *Solução:* Restaurar rigorosamente a chamada de `filterDashboardLeads` no numerador e denominador dos componentes de dashboard, garantindo o escopo cirúrgico exigido.
