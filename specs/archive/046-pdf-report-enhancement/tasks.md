# Tasks: Aprimoramento do Relatório PDF (Spec 046)

- [x] Documentar `spec/global` e `spec/046-pdf-report-enhancement/tasks.md`.
- [ ] Omitir Leads Vazios: Em `Relatorios.tsx` -> `handleExportPDF`, após buscar `messages`, remover de `reportTargetLeads` os leads que não possuam mensagens humanas.
- [ ] UI de Evidências (Audit Reasons): Modificar a renderização do PDF para iterar e exibir o array de `audit_reasons` (caso exista). Mostrar título em vermelho e evidência em texto menor.
- [ ] Refatoração das Mensagens de Chat:
  - Aplicar `max-w-[85%]` nas mensagens.
  - Usar background `bg-gray-100` (cliente) e `bg-indigo-50` (gerente).
  - Ajustar paddings e margens.
  - Remover bordas laterais fortes em favor de um design mais moderno ("bubble style").
