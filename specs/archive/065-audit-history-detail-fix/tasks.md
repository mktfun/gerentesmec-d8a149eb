# Tasks: 065 - Audit History Detail Fix

- [x] 1. Criar função `resolvePhotoUrl()` e placeholder de foto inválida
  - Em `AuditHistory.tsx`, criar helper que detecta blob URL expirado
  - Renderizar placeholder elegante quando URL inválida

- [x] 2. Renderização condicional de Notes com destaque visual
  - Bloco vermelho para status `nok` / `nao_conforme` com notes
  - Itálico muted para outras notas
