# Tarefas de Implementação: Coluna Perdidos

- [ ] Modificar `src/components/Crm/KanbanView.tsx`: Adicionar o objeto `{ id: 'closed_lost', label: 'Perdido', color: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' }` no array `COLUMNS`.
- [ ] Modificar `src/components/Crm/KanbanView.tsx`: Renomear o label de `closed_won` de "Encerrado" para "Ganho".
- [ ] Modificar `src/components/Crm/KanbanView.tsx`: Na função `getColumnLeads`, remover a lógica que agrupava `closed_lost` dentro de `closed_won`. Mudar para `colLeads = filtered.filter(l => l.funnel_stage === stageId);`
- [ ] Fazer commit das alterações e solicitar ao usuário que atualize a página no Lovable para validar.
