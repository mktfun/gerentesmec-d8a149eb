# Checklist de Implementação (Feature 005)

- `[ ]` 1. Atualizar Terminologia
  - `[ ]` Modificar o texto do botão na listagem do `ManagerDashboard.tsx` de "Avaliar Atendimento" para "Vistoriar Atendimento".
- `[ ]` 2. Padronizar o Tema no Audit Inspector
  - `[ ]` No `ManagerAuditInspector.tsx`, importar `useTheme` do Context.
  - `[ ]` Trocar as cores estáticas (`hsl(var(--background))`, rgba, etc) do container principal por interpolação de `isDark` (`bg-[#212529]` vs `bg-[#f5f6f7]`).
- `[ ]` 3. Refatorar o Cabeçalho (Header) do Modal
  - `[ ]` Remover os gradientes com vidro do header, utilizando cores sólidas alinhadas ao Light/Dark mode.
- `[ ]` 4. Refatorar os Balões de Chat e Eventos
  - `[ ]` Balões do Cliente (Esquerda): Brancos no Light, Pretos (`#1a1a1a`) no Dark, usando bordas normais (tailwind) em vez de estilo in-line pesado.
  - `[ ]` Balões do Mecânico/Sistema (Direita): Fundo Azul Primário ou Escuro, sem neons, apenas `shadow-sm`.
  - `[ ]` Eventos Inline (Atrasos e Acertos de checklist): Tirar estilo "hacker" translúcido e aplicar blocos mais largos com ícones sólidos contrastantes.
- `[ ]` 5. Refatorar o Quality Drawer (Menu Deslizante)
  - `[ ]` Tirar o fundo `#0f0f14` estrito e forçar a cor de fundo nativa dependendo do `isDark` (Branco ou Cinza Chumbo).
  - `[ ]` Garantir legibilidade (preto no claro, branco no escuro) nas palavras do checklist.
- `[ ]` 6. Garantia de Build
  - `[ ]` Rodar `npm run build` para aferir que os hooks React inseridos não corrompem o app.
