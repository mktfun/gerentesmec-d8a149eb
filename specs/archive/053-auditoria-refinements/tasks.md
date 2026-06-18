# Tasks: Refinamento Auditoria (Spec 053)

- [ ] Instalar dependência: `react-medium-image-zoom`.
- [ ] Atualizar `src/pages/Auditoria/constants.ts` (desmembramento estrito, nova ordem e `min_photos` aumentados).
- [ ] Atualizar `src/hooks/useAuditStorage.ts`:
  - Adicionar `schema_version` no payload local.
  - No `loadDraft`, se `schema_version` for diferente da atual, limpar cache automaticamente.
- [ ] Refatorar `src/components/Auditoria/AuditItem.tsx`:
  - Se status for 'na', não renderizar `CameraCapture` e ignorar necessidade de foto.
  - Aplicar estilo visual de desativado (cinza) quando 'na'.
  - Adicionar componente de Zoom na foto miniatura.
- [ ] Atualizar cálculo de stepper e sync em `src/pages/Auditoria/index.tsx` para ignorar fotos quando 'na'.
- [ ] Refatorar `src/pages/AuditHistory/index.tsx`:
  - Adicionar filtros globais (Loja, Data).
  - Exibir timestamps de start/end no card da auditoria.
  - Implementar modal/details view com as fotos em grid, incluindo timestamp de captura formatado.
  - Usar Lightbox/Zoom nas fotos do histórico.
