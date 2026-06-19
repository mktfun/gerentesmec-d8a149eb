# Tasks: Novo Card de Início da Auditoria (Spec 056)

- [ ] Atualizar `tailwind.config.ts` adicionando `keyframes.gradientShift` e `animation.gradient-shift`.
- [ ] Atualizar `src/pages/Auditoria/index.tsx`:
  - Adicionar state `auditorName`.
  - Substituir o painel inicial pela estrutura enviada pelo usuário (Card com gradiente animado no topo, inputs escuros).
  - Incluir trava `if (!auditorName.trim())` no `handleStart`.
  - Adicionar o `auditorName` no `initialPayload` (no campo `device_info` ou se já houver um `auditor_user_id` manual).
- [ ] Rodar o build para validar ausência de bugs.
