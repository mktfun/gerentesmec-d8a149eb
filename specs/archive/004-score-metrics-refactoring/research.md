# Research: Refactoring Score Metrics

## Escopo Atual
Atualmente, as notas (Scores) são calculadas utilizando as funções `avgScore` e `avgScoreInt` presentes em `src/utils/scoreUtils.ts`.
A função principal `avgScore` aceita um objeto `ScoreFilterOptions` com os filtros `onlyGanho` e `onlyCurrentMonth`.
O default já está configurado como `onlyGanho: true` e `onlyCurrentMonth: true`.

No entanto, o usuário relatou que precisa que o score contabilize APENAS leads que tenham pontuação registrada, estejam em "Ganho", e do "mês vigente" em **todas as telas**. Na tela de Relatórios, o comportamento precisa permitir visualizar dados consolidados e filtrar flexivelmente.

## Análise de Lacunas (Gap Analysis)
- **Onde o score é exibido individualmente**: Em componentes como `AuditPanel`, `ReadOnlyAuditPanel`, `KanbanCard` e `ChatHistoryView`, o score individual do lead é exibido independentemente dele ser "Ganho" ou "Perdido", e não importa o mês. Isso pode estar confundindo o usuário na percepção de quais scores impactam as médias das unidades/gerentes.
- **Telas Gerais**: O Dashboard (`TvDashboard`, `UnitOperationalSlide`, `Index`) exibe a média chamando `avgScore` com a configuração padrão, que já foca no Mês Vigente e Ganhos. 
- **Tela de Relatórios (`Relatorios.tsx`)**: Atualmente chama `avgScore(leads, { onlyCurrentMonth: false, onlyGanho: false })` para mostrar tudo. O usuário quer que seja possível filtrar dinamicamente, mas ver tudo consolidado como padrão.
- **Viés de Sobrevivência (Survivorship Bias)**: Se ignorarmos os leads "Perdidos" na média de score, não conseguiremos auditar *por que* o atendimento falhou naqueles casos. Um atendimento ruim leva à perda da venda, e essa nota ruim deve baixar a média do gerente/mecânico. A requisição do usuário de "apenas ganho" faz sentido para métricas de bonificação de *sucesso*, mas não para a métrica real de *qualidade do atendimento*.

## Concorrentes e Benchmark (Conceito)
- Sistemas avançados de CRM mantêm "Score de Qualidade" separado de "Pipeline de Vendas". A qualidade do atendimento é medida independentemente se o cliente comprou ou não.
- **Decisão sugerida ao usuário:** Contabilizar scores APENAS para Ganhos distorce a realidade da equipe. Sugerimos medir Qualidade Geral (todos os scores) vs Taxa de Conversão. No entanto, cumpriremos a exibição conforme configurado, podendo criar um "toggle" para o usuário.
