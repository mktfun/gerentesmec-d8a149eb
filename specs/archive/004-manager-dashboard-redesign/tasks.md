# Checklist de Implementação: UX Redesign para Mecânicos (Feature 004)

- `[ ]` 1. Configurar Thema no App Context (Hook e Provider)
  - `[ ]` Injetar ou reaproveitar estado global de `theme` (dark/light) no Tailwind.
  - `[ ]` Implementar suporte a `.dark` ou classe genérica no index html baseado na variável.
- `[ ]` 2. Alterar o Layout do Manager
  - `[ ]` Remover Header fixo superior no `ManagerLayout.tsx`.
  - `[ ]` Implementar Navbar Flutuante Bottom (em estilo de Pílula Branca ou Preta dependendo do tema).
  - `[ ]` Integrar botões grandes de "Início", "Alternar Tema (Sol/Lua)" e "Sair" na Bottom Bar.
- `[ ]` 3. Refatorar o ManagerDashboard
  - `[ ]` Importar font Instrument Sans globalmente no css se aplicável ou estilizá-la com classes utilitárias no Tailwind simuladas (`font-sans tracking-tight`).
  - `[ ]` Criar seções com títulos curtos: "Olá, {Nome}", "Sua Performance" (Card grande).
  - `[ ]` Adicionar seletor de visualização (Filtros em Pill - "Todos", "Fila", "Atrasos").
  - `[ ]` Limpar os blocos de card para exibir um layout limpo branco e botões de ação escuros em Light mode (ou vice versa em Dark Mode).
  - `[ ]` Ajustar cores para remover qualquer resíduo do Glow Neon antigo e substituir por Drop-Shadows sutis (ex: `shadow-xl shadow-black/5`).
- `[ ]` 4. Tratamento Responsivo Anti-Erro
  - `[ ]` Aumentar botões de navegação dos cards (touch targets mínimos de 48px).
- `[ ]` 5. Ajustes Finais
  - `[ ]` Correr `npm run build` para garantir que as dependências continuam funcionais.
  - `[ ]` Aplicar Skill `ux-ui-architect-2026` visualmente em cima das views.
