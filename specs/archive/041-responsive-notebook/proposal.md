# Proposal: Responsividade para Notebook e Melhorias de Interatividade (ID: 041)

## Contexto e Motivação
A aplicação "GerentesMec" possui um quadro Kanban robusto e com muitos dados visuais. No entanto, em telas de notebook (ex: 1366x768 ou 1920x1080 com escala de 125/150%), os usuários enfrentam dificuldades com o espaço horizontal, sendo forçados a realizar muitos scrolls ou tendo visualização cortada das colunas. Além disso, a interatividade pode ser mais rica e responsiva ("snappy") para criar uma sensação de uso "premium", como esperado no frontend de alto nível.

De acordo com o `memory.md`, mantemos o uso do stack: Vite + React + Tailwind + shadcn/ui.

## Objetivos (Requirements)
1. **Otimização de Espaço Horizontal:** 
   - Acomodar mais colunas do Kanban visíveis em telas de notebooks sem perder a legibilidade.
   - Otimizar a Sidebar para ser retrátil (collapsed mode) na versão Desktop/Notebook.
2. **Compactação Inteligente dos Cards (KanbanCard):**
   - Reduzir margens internas e otimizar a disposição dos componentes do Card (Manager, Valor do Ticket e Tempo).
3. **Melhorias de Interatividade:**
   - Adicionar micro-interações (hover effects, scale) aos Cards utilizando framer-motion.
   - Refinar a experiência de Drag & Drop para ser mais fluida (ex: tilt ou glow enquanto está sendo arrastado).
   - Customizar a barra de rolagem (scrollbar) do Kanban para ficar elegante e sutil, possivelmente adicionando botões de navegação lateral (pan).

## Análise de Risco (Bayesian Reasoning)
- **Risco 1:** A quebra de layouts em telas ultralargas ou smartphones caso as medidas sejam hardcoded.
  - *Mitigação:* Usar `min-w`, `w-full` e `max-w` junto com propriedades flexíveis ao invés de tamanhos rígidos absolutos como `w-72`.
- **Risco 2:** Impacto de performance por excesso de animações no Framer Motion (se houver muitos leads).
  - *Mitigação:* Restringir micro-animações para o `hover` ou `drag`, mantendo os componentes estáticos quando ociosos. Usar `will-change-transform` em elementos arrastáveis.

## Critérios de Aceite
- O quadro Kanban precisa mostrar de 4 a 5 colunas em uma tela padrão de 1366px sem precisar rolar se a sidebar estiver retraída.
- Os cards devem ter um aspecto "premium" com respiros menores, sem amontoar as informações.
- A aplicação deve reagir suavemente ao passar o mouse ou segurar um card.
