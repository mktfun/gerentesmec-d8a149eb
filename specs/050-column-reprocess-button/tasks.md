# Tasks: Botão de Refazer Coluna (Spec 050)

- [x] Criar estrutura e planejar textos de substituição.
- [ ] Atualizar `src/pages/Crm.tsx` ou `src/pages/Crm/index.tsx` (arquivo mestre do Kanban):
  - Adicionar a função `handleReprocessColumn` que interage com o Supabase.
  - Repassar a função para o componente Kanban.
- [ ] Atualizar `src/components/Crm/KanbanView.tsx`:
  - Adicionar o botão `RefreshCw` do lucide-react no header da coluna.
  - Implementar o clique do botão chamando a função repassada.
- [ ] Compilar frontend e testar.
