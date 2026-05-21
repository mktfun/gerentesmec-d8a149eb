# Tasks: Redesign Revolut Bank (018)

- [ ] **1. Ajuste do Dashboard (`Index.tsx`)**: Refatorar o card lateral de scores das unidades para usar scroll horizontal oculto (`overflow-x-auto snap-x`), evitando compressão dos cards em redes grandes.
- [ ] **2. Criação do Componente `UnitSwitcher`**: Desenvolver um componente elegante de Dropdown focado na "vibe Revolut", usando o `Select` do Shadcn UI ou radix puro para alternar a unidade, mostrando a cor/alerta e o score da unidade.
- [ ] **3. Refatoração do Kanban (`Crm.tsx`)**: Remover as tabs e integrar o `UnitSwitcher` na barra de topo. O botão de "Unidade Selecionada" deve ser claro e expansível.
- [ ] **4. Lógica de Paginação do `TvDashboard.tsx`**:
  - Limitar a renderização a 3 unidades por vez.
  - Criar state `pageIndex` e `intervalTime` (default 15s).
  - Configurar um `useEffect` com `setInterval` para rotacionar as páginas.
- [ ] **5. Interface do Modo TV (`TvDashboard.tsx`)**:
  - Inserir controles de tempo [15s] [30s] [1m] com design Pill ao lado do botão de Sair.
  - Implementar transições fluidas de Framer Motion para quando os cards trocarem de página.
- [ ] **6. Quality Gate Visual (UX 2026)**: Revisar os três componentes atualizados com a skill "ux-ui-architect-2026" mentalmente:
  - Scroll smooth e sem scrollbars visíveis.
  - Sombras premium liquid glass.
  - Microinterações no hover e focus.
