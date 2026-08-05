# Spec Plan: Correção de Exibição do Histórico de Vistorias (bugfix-audits-display)

## Tasks

- [x] [FRONTEND] Atualizar `src/pages/Auditoria/index.tsx` para selecionar `.in('status', ['synced', 'completed'])` e `.select('..., score')`
- [x] [FRONTEND] Atualizar cálculo de Score no widget de `Últimas Vistorias` para ler primariamente a coluna nativa.
- [x] [FRONTEND] Atualizar `src/pages/AuditHistory.tsx` para `.in('status', ['synced', 'completed'])`
- [x] [FRONTEND] Atualizar cálculo de Score na listagem principal de `Histórico` para ler primariamente a coluna nativa.
- [x] [FRONTEND] Adicionar um fallback render block no Drawer de `AuditHistory.tsx` caso `categories` não exista.
