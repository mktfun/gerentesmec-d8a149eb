# Research: Regras de Contabilização de Score

## Contexto Atual
O cálculo do Score global e das unidades está definido em `gerentesmec/src/utils/scoreUtils.ts` através da função `avgScore(leads: Lead[])`.
Atualmente, essa função aplica apenas uma regra restritiva: `l.score !== null && l.score !== undefined`. Todos os leads que possuem um score são contabilizados, independentemente da etapa (Kanban stage) ou da data de criação/finalização do atendimento.

## Problema Relatado
O usuário solicitou que a contabilização do Score passe a ser restrita, para refletir o desempenho real e validado das unidades e vendedores, focando em:
1. **Apenas Leads em Ganho**: Leads perdidos, arquivados ou ainda em negociação não devem entrar na média global das telas de monitoramento (Cards, Dashboards), pois o atendimento ainda não foi finalizado ou não reflete o potencial total avaliado do fluxo de fechamento.
2. **Mês Vigente**: Leads antigos distorcem a percepção do desempenho atual da equipe. A média vista no dia a dia precisa considerar apenas leads fechados no mês/ano correntes.
3. **Tela de Relatórios (Exceção)**: Na tela consolidada de relatórios, o usuário quer manter a flexibilidade de poder filtrar por qualquer mês e mudar o escopo de contabilização. Isso implica que a função central `avgScore` precisará aceitar parâmetros de flexibilização (flags) para quando for chamada pela página de Analytics/Relatórios.

## Arquivos Afetados Mapeados
1. `src/utils/scoreUtils.ts`: Coração da lógica. A função `avgScore` e `avgScoreInt` serão modificadas.
2. `src/components/Crm/UnitSwitcher.tsx`: Utiliza `avgScore(unitLeads)` para exibir o score em cima de cada unidade. Precisará passar a data corrente.
3. `src/pages/Dashboard.tsx` (e quaisquer outras telas que exibam os KPIs globais): Deve herdar as regras rígidas por padrão.
4. `src/pages/Reports.tsx` ou equivalentes de relatórios: Precisarão injetar flags para ignorar a regra de "Mês Corrente" e permitir a filtragem personalizada do usuário.
