# Design: Responsividade e Interatividade (ID: 041)

## 1. Sidebar Retrátil (DashboardLayout)
- **Visual:** Por padrão, a sidebar permanecerá com `w-[220px]` em telas maiores (`xl`), mas poderá ser retraída para `w-[72px]`, mostrando apenas os ícones, liberando ~150px de espaço útil.
- **Interação:** Um botão de toggle (chevron) na base ou no topo da sidebar. O estado pode ser salvo via `localStorage` ou apenas estado local.

## 2. Ajustes no KanbanView
- **Colunas flexíveis:** 
  - Antes: `w-72` (288px) fixo.
  - Novo design: `w-[260px] min-w-[240px] max-w-[280px] shrink-0`.
- **Scroll Horizontal Personalizado:**
  - Classes do tailwind (`scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40`) para ocultar as scrollbars feias do Windows.
- **Cabeçalho das colunas:** 
  - Manter o sticky mas deixá-lo com visual "glassmorphism" (`backdrop-blur-md`) caso a coluna role por baixo dele (opcional).

## 3. Redesign do KanbanCard
- **Padding reduzido:** Trocar de `p-3.5` (14px) para `p-3` (12px) e diminuir os `gap-2.5` para `gap-2`.
- **Grid Meta Info:** Posicionar os elementos como Avatar do gerente, Nome, Valor do Ticket e Tempo decorrido de forma mais coesa. Se o score existir, colocá-lo como um badge flutuante no topo em vez de uma linha extra inteira na base, ou agrupar na linha inferior junto ao tempo.
- **Framer Motion:** 
  - Embolsar o retorno do card em um `<motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} />`.
  - Durante o Dragging (verificado via `snapshot.isDragging`), adicionar uma borda ou shadow (`shadow-xl border-primary/50 rotate-1`).

## 4. Cores e Typografia
- Manter as cores atuais (Dark Theme com tons Tailwind Default).
- Fontes secundárias poderão usar `text-[10px]` para economizar espaço horizontal, mantendo forte peso de fonte (font-bold/semibold) para garantir a legibilidade.
