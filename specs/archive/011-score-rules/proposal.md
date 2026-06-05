# Feature Proposal: Smart Cutoff & Rolling 30 Days (011-score-rules)

## 1. Requisitos
- **Cutoff Inteligente (Lost):** O score de um lead perdido deve ser calculado com base apenas nas etapas que o contato alcançou antes da perda, cortando os denominadores das próximas etapas.
- **Recálculo Retroativo Dinâmico:** As notas de todos os leads antigos e novos (ganhos e perdidos) devem refletir a lógica "mais justa" nos painéis sem necessidade de migrações complexas no banco.
- **Filtro de Visualização Estrito:** Painel Executivo (`Index.tsx`), Painel do Gerente (`ManagerDashboard.tsx`), TV Operacional e TV Executiva (`TvDashboard.tsx`) e Relatórios (`Relatorios.tsx`) DEVEM computar nas médias de conversão e score APENAS leads resolvidos (`closed_won` e `closed_lost`) contidos nos últimos 30 dias móveis.

## 2. User Stories
- **Como gerente da unidade**, quero que o meu score reflita apenas o que meus mecânicos poderiam controlar. Se eles falharam em fechar um cliente na Etapa 2, não devem ser punidos por não pedir avaliação no Google (Etapa 4), tornando minha média realística.
- **Como administrador/CEO**, quero abrir os dashboards principais e ver apenas a "foto" da produtividade real dos últimos 30 dias (ignorando leads arquivados antigos ou leads "new" que ainda nem foram respondidos).

## 3. Critérios de Aceite
- [ ] O componente `Index.tsx` reincorpora `filterDashboardLeads` e exibe pontuação baseada em 30 dias.
- [ ] O componente `TvDashboard.tsx` utiliza `filterDashboardLeads`.
- [ ] O componente `ManagerDashboard.tsx` utiliza `filterDashboardLeads`.
- [ ] A função `avgScore` (em `scoreUtils.ts`) intercepta o valor `l.score` e, em vez de retornar o valor salvo no banco de dados "engessado", retorna `calcLeadScore(l.audit_checklist, l.funnel_stage)` em tempo real.
- [ ] A Edge Function `ai-autonomous-evaluator` passa a utilizar uma réplica do cutoff para que novos leads já entrem na DB com o peso justo.

## 4. BDD Scenarios

### Cenário: Cutoff em lead perdido na etapa 2
- **Dado** que um lead foi marcado como `closed_lost`.
- **E** o gerente aprovou apenas: `1a`, `1b` e `2a` (link do orçamento).
- **Quando** o sistema for exibir o Score deste gerente,
- **Então** o cálculo da nota considerará um universo máximo de 5 pontos (`1a, 1b, 2d, 2b, 2a`) resultando em 60% (3/5), e ignorando os pontos das etapas 3 e 4.

### Cenário: Limpeza do Dashboard de Inativos Antigos
- **Dado** que um mecânico possui 50 leads fechados e ganhos há 40 dias atrás.
- **Quando** o administrador abre o Dashboard Executivo.
- **Então** esses 50 leads não comporão a média do `score` global ou individual, refletindo estritamente a performance atual do negócio.
