# Tasks: 063 Auditoria UI Fixes

- [x] 1. Ajustar Toaster (Sonner)
  - Modificar a prop `position` para `bottom-right`.
  - Garantir que o z-index não atrapalhe a UI principal.

- [x] 2. Ajustar `LumaBar.tsx`
  - Travar as dimensões dos botões para evitar flicker.
  - Assegurar z-index correto.

- [x] 3. Refatorar Cores (`Auditoria/index.tsx`, `AuditoriaExecution.tsx`, `AuditoriaItemCard.tsx`)
  - Remover `bg-[#0a0a0f]`, `bg-[#121214]`, e `text-white` hardcoded.
  - Utilizar padrões do Tailwind (`bg-background`, `bg-card`, `text-foreground`, etc).
  - Ajustar botões de Conforme/Não Conforme para cores fortes no light mode (`bg-emerald-600` vs `bg-rose-600`).

- [x] 4. Premium UI no Histórico (`AuditHistory.tsx` e tela de Detalhes)
  - Converter listagens para Cards com `shadow-sm` no light mode.
  - Mudar fotos para exibição em grid (`aspect-square object-cover`).
  - Utilizar badges (pílulas) translúcidas para status e scores.
