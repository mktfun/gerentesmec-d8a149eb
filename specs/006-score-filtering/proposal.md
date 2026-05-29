# Proposal: Nova Regra de Contabilização de Score

## Visão Geral
Reformular a função `avgScore` (e todas as agregações de score derivadas) para que, por padrão, as telas de monitoramento operacional (Kanban, UnitSwitcher, Dashboards gerenciais em tempo real) calculem o Quality Score considerando única e exclusivamente:
1. **Atendimentos Finalizados (Ganho)**: Para não penalizar ou inflar o score da unidade baseado em leads onde o atendimento está na metade ou aguardando resposta.
2. **Mês Vigente**: Para refletir um termômetro exato de como a equipe e a unidade estão performando na janela atual de metas.
3. **Com Score Preenchido**: Mantendo a regra vitalícia de que leads sem auditoria ignoram a média.

## Requirements
- Modificar o contrato de `avgScore(leads: Lead[], options?: ScoreFilterOptions)` no utils de score.
- O parâmetro padrão de `options` deve aplicar o filtro restrito: `onlyGanho = true`, e `onlyCurrentMonth = true`.
- Criar a mecânica de inferir o "Mês Atual". A lógica usará a data de criação do lead (`created_at`) ou a data de fechamento, caso seja controlada. Assumiremos a data presente no banco (normalmente `created_at`).
- Na tela de **Relatórios** (Consolidados), a função será chamada passando `onlyCurrentMonth = false` e possivelmente `onlyGanho = false` (a depender do filtro customizado da interface).

## User Stories
- **Como** Gestor de Qualidade, **eu quero** olhar para o Kanban da Unidade e ver o Score baseado *apenas* nos fechamentos daquele mês, **para** que a nota mostre o comportamento e treinamento atual do gerente daquela loja.
- **Como** Diretor Operacional, **eu quero** acessar os relatórios no fim de semana e poder selecionar "Mês Passado" ou "Todos os leads (Ganho e Perdido)", **para** investigar se os leads Perdidos têm scores de qualidade sistematicamente mais baixos que os leads em Ganho.

## BDD Scenarios

### Cenário: Média do Kanban em Tempo Real
- **Given (Dado):** O mês atual é "Maio". A Unidade X possui 4 leads auditados. 2 estão em "Ganho" (um de Maio [score 100], um de Abril [score 50]), 1 está em "Orçamento" (Maio [score 80]), 1 está em "Perdido" (Maio [score 20]).
- **When (Quando):** O componente `UnitSwitcher` exibe o Badge de Score da unidade.
- **Then (Então):** O badge exibe "100%", pois filtra apenas os leads "Ganho" e que pertencem ao mês atual ("Maio").

### Cenário: Filtro Flexível no Relatório
- **Given (Dado):** O Diretor está na tela consolidada de relatórios.
- **When (Quando):** Ele desmarca a opção "Somente Mês Vigente" e "Somente Ganhos".
- **Then (Então):** O sistema re-chama a função `avgScore` passando as flags em "false", retornando a média crua e histórica de todos os 4 leads (média de 62.5%).
