# Tasks: Regras de Filtro para Score

- [x] `01-modify-utils-types`: Abrir `src/utils/scoreUtils.ts`. Adicionar a interface `ScoreFilterOptions` e a constante `defaultOptions` que ative `onlyGanho` e `onlyCurrentMonth`.
- [x] `02-refactor-avgscore`: Modificar a função `avgScore` em `src/utils/scoreUtils.ts` para receber `options` e utilizar o filtro dentro do array `leads.filter(...)`, checando `l.stage === 'Ganho'` e se `l.created_at` pertence ao mês corrente (usando Data string parsing format `YYYY-MM`).
- [x] `03-refactor-avgscoreint`: Garantir que `avgScoreInt` em `src/utils/scoreUtils.ts` também receba a assinatura e a repasse.
- [x] `04-review-dashboards`: Revisar componentes globais que exibem score como `UnitSwitcher.tsx` e Dashboards. Eles devem continuar passando apenas `leads`, aproveitando o default restritivo.
- [x] `05-review-reports`: Revisar a seção de relatórios (caso exista). Se for em `Reports.tsx` ou similar, habilitar as opções para passar `{ onlyGanho: false, onlyCurrentMonth: false }` ou conforme o estado dos seletores na tela de relatórios.
