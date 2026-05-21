# Tasks: UX do CRM, Ordenação e Status de Gerentes

- [ ] 1. **Ordenação do Kanban**
  - Em `KanbanView.tsx`, aplicar `sort()` por `last_message_at` decrescente nos leads antes de agrupá-los por coluna.
- [ ] 2. **Fallback do Gerente no LeadCard**
  - Em `KanbanCard.tsx`, modificar a lógica para: se `lead.manager_id` não resolver em um gerente, fazer um `managers.find(m => m.unit_id === lead.unit_id)` para exibir um gerente padrão.
- [ ] 3. **Tempo Decorrido no Card**
  - Em `KanbanCard.tsx`, criar a função de formatação de tempo e renderizá-la ao lado do ícone de relógio, exibindo o gap entre `now` e `last_message_at`.
- [ ] 4. **Limpeza do Link no AuditPanel**
  - Em `AuditPanel.tsx`, remover a badge azul e deixar apenas um `<a>` com `ExternalLink` limpo, de preferência posicionado ao lado do H3 (Nome do Lead).
- [ ] 5. **Ajuste de Copy no ChatHistoryView**
  - Em `ChatHistoryView.tsx`, trocar "Online no Chatwoot" por "Canal Online".
