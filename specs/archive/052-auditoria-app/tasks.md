# Tasks: App de Auditoria (Spec 052)

- [ ] Instalar dependências: `localforage` e `browser-image-compression`.
- [ ] Banco de Dados (Supabase Migration):
  - Criar bucket de storage `audits`.
  - Criar tabela `store_inspections` e configurar RLS.
  - As lojas (`store_id`) farão vínculo com a tabela `units` já existente.
- [ ] Core Frontend: Contexto Offline
  - Criar classe ou hook `useAuditStorage` usando `localforage` para salvar e restaurar o estado do draft no device.
  - Implementar lógica do compressor de imagens.
- [ ] UI Architecture (PWA Fluxo Direcional):
  - Criar página principal `/auditoria` para escolher a loja e iniciar.
  - Criar o Layout de Stepper Vertical (Tabs fixas: Área Externa, Recepção, Sala Comercial, Oficina, Banheiros, Cozinha).
  - Criar componente genérico `AuditItem` que recebe `min_photos`, bloqueia upload de galeria (`capture="environment"`), exige as fotos, e tira foto geral caso marcado como "N/A".
- [ ] Sync Mechanism (All-or-Nothing):
  - Lógica para subir as fotos no Storage apenas no clique final de "Sincronizar".
  - Trocar blobs locais pelos URLs finais e dar insert do JSONB completo em `store_inspections`.
  - Limpar `localforage` após sync.
