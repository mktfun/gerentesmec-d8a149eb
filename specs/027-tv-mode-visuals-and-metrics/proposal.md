# Proposal: TV Mode Visuals & Metrics Engine

## Objetivos
Refinar o design do Command Center (TV Mode) para corrigir problemas de espaçamento e iluminação. Adicionar um motor robusto de contabilização de dados baseado em um filtro de datas configurável.

## User Stories
1. Como gestor visualizando a TV, eu quero que os cards das unidades não tenham fundos cortados e apresentem um visual polido, com espaçamentos proporcionais e blurs agradáveis (Estética 2026).
2. Como gestor analisando métricas, eu quero poder contabilizar corretamente os Leads em Risco (Leads cujo T.M.R extrapolou o SLA) e o Tempo Médio de Resposta (T.M.R.) daquele período.
3. Como gestor estratégico, eu quero um botão no topo da TV para alternar entre "Hoje", "Ontem", "Últimos 7 dias", "Mês Atual" ou "Personalizado", para ver a performance daquele período.
4. Como usuário recorrente, eu quero que minha escolha de filtro fique salva, para que amanhã a TV abra na mesma configuração.

## Critérios de Aceite
1. O background glow dos cards não pode estar clipado/cortado de forma estranha.
2. A métrica "Leads em Risco" deve somar a quantidade de leads cujo `sla_status` é `danger` naquele período.
3. A métrica de T.M.R. deve exibir a média real de minutos (`wait_time_minutes`) no período.
4. O Filtro de Data deve ser um Menu visual elegante no Topbar.
5. A configuração do filtro deve persistir via `localStorage` (chave `tv_mode_date_filter`).

## BDD Scenarios

### Cenário: Troca de período e recálculo
- **Dado** que a TV está mostrando o filtro "Hoje"
- **Quando** o usuário clica no seletor de data e escolhe "Últimos 7 dias"
- **Então** a função `getUnitMetrics` recalcula o score, TMR e Leads em Risco analisando os leads filtrados
- **E** a UI reflete imediatamente os novos valores consolidados.
