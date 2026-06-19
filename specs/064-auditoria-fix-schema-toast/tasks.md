# Tasks: 064 Hotfix Auditoria Execution & Toast Mobile Overlap

- [x] 1. Corrigir import de SCHEMA_VERSION no hook
  - Arquivo: `src/hooks/useAuditStorage.ts`
  - Ação: Importar `SCHEMA_VERSION` de `@/pages/Auditoria/constants`.
  - Ação: Trocar a string hardcoded `'v2_granular'` pela variável `SCHEMA_VERSION`.

- [x] 2. Ajustar margem mobile do Toast
  - Arquivo: `src/components/ui/sonner.tsx` ou `src/App.tsx`
  - Ação: Adicionar classe responsiva para subir o Toast no mobile (ex: `max-md:mb-24`).
