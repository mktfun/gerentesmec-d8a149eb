# Tasks: Score Metrics Refactoring

## 1. Atualizar UI de Relatórios (`src/pages/Relatorios.tsx`)
- [ ] Adicionar o state `scoreStatusFilter` ('all' | 'ganho' | 'perdido').
- [ ] Adicionar botões Glass Pill no Header da seção de Score em Relatórios para alternar o status.
- [ ] Modificar as chamadas `avgScore` de `scoreCur` e `scorePrev` para passar `{ onlyCurrentMonth: false, onlyGanho: scoreStatusFilter === 'ganho' }`. Se for 'perdido', a função `scoreUtils` precisará ser atualizada para suportar isso ou a lógica filtrará antes de chamar a função.

## 2. Refatorar `scoreUtils.ts` (Opcional se necessário para suportar "Perdidos")
- [ ] Ajustar `ScoreFilterOptions` para suportar `onlyPerdido`. 
- [ ] Atualizar a condicional em `avgScore` para respeitar `onlyPerdido`.

## 3. Feedback Visual em Cards (Opcional, porém Recomendado)
- [ ] Em `KanbanCard.tsx`, adicionar um pequeno badge tooltip no Score caso o lead não seja Ganho: *"Nota individual do atendimento. Não contabilizado na média geral (requer status Ganho)."*
- [ ] Garantir que na `TvDashboard` o termo esteja claro: "Média (Mês Vigente, Ganhos)".
