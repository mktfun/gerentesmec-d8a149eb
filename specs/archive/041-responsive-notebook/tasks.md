# Tarefas: Responsividade e Interatividade (ID: 041)

## Fase 1: Sidebar Retrátil
- `[x]` Atualizar `src/components/Layout/DashboardLayout.tsx` para adicionar um estado `isSidebarCollapsed` (pode iniciar falso e usar `localStorage`).
- `[x]` Adicionar um botão de toggle na base da sidebar (ex: ChevronRight/ChevronLeft).
- `[x]` Ajustar o width da sidebar dinamicamente de `w-[220px]` para `w-[72px]`.
- `[x]` Ocultar os labels (textos) dos NavLinks quando a sidebar estiver colapsada, exibindo tooltips caso seja hover.
- `[x]` Ajustar a margem (margin-left) do elemento `main` para respeitar a nova largura da sidebar.

## Fase 2: Layout KanbanView Responsivo
- `[x]` Atualizar `src/components/Crm/KanbanView.tsx` mudando a largura das colunas. Substituir `w-72 shrink-0` por `w-[260px] min-w-[250px] shrink-0`.
- `[x]` Adicionar custom classes na listagem principal (`overflow-x-auto pb-4`) para estilizar a scrollbar (`scrollbar-thin` e variantes) no CSS global ou usando utilitários caso existam.
- `[x]` Otimizar os cabeçalhos das colunas para serem mais enxutos.

## Fase 3: KanbanCard Compacto & Animado
- `[x]` Atualizar `src/components/Crm/KanbanCard.tsx` e envolver o componente num `<motion.div>` utilizando propriedades de hover e tap (ex: `whileHover={{ y: -2 }}`, `whileTap={{ scale: 0.98 }}`).
- `[x]` Ajustar opacidade e styling durante o drag na property `snapshot.isDragging`.
- `[x]` Reduzir os paddings do cartão (`p-3.5` -> `p-3`).
- `[x]` Consolidar o design da badge do ticket (`formatMoney(lead.ticket_value)`) ao lado do nome, ou otimizar a seção de meta infos para ocupar menos linhas verticais.
- `[x]` Trocar as strings grandes por iconografia + tooltips quando a tela for muito menor (ou de forma permanente se ficar mais elegante).

## Fase 4: Teste de Experiência
- `[x]` Simular tela 1366x768 usando as dev tools.
- `[x]` Testar o arrastar-e-soltar para garantir que o performance não caiu.
- `[x]` Garantir que em `TvMode` o layout se mantenha legível e centralizado.
