# Spec 06: TV Rebuild (Spec Plan)

Este plano documenta os checkpoints rígidos de implementação que só serão executados no ciclo `/vibe-apply`.

- [ ] Modificar o `DashboardLayout.tsx` para interceptar as rotas da TV.
  - Criar constante booleana `isTvRoute`.
  - Remover renderização de `<aside>` e `<header>` para a TV automaticamente.
  - Adequar a margin e height da `<main>` tag para `h-screen w-full` se `isTvRoute`.
  
- [ ] Construir Filtro Waterfall Híbrido (Piores da Unidade).
  - Atualizar o script ou utilitário no frontend para pegar o Hall da Morte (casos de SLA e notas baixas/perdidos).
  
- [ ] Refatorar o `UnitOperationalSlide.tsx` (TV Operacional).
  - Injetar o Filtro Waterfall.
  - Descartar o texto seco de SLA ou preencher de forma mais intimidadora com as anotações do gerente ou AI Feedback das negociações fracassadas.
  
- [ ] Refatorar o `TvRadarView.tsx` (TV Executiva).
  - Garantir que o painel principal na Diretoria liste falhas com mais histórico em caso de ausência no dia.
