# Tasks: Refinamentos de UX e Granularidade (Spec 058)

- [ ] Atualizar `src/pages/Auditoria/constants.ts`:
  - Mudar `SCHEMA_VERSION` para `v3_granular`.
  - Desmembrar `Banheiros e Tanque` em 4 categorias (`Banheiro Clientes (Feminino)`, `Banheiro Clientes (Masculino)`, `Banheiro dos Mecânicos`, `Área de Lavagem (Tanque)`).
  - Adicionar o campo `instruction` em cada item com diretrizes estritas.
- [ ] Atualizar `src/components/Auditoria/AuditoriaItemCard.tsx`:
  - Receber a prop `instruction` (opcional/string).
  - Renderizar o `<p className="text-zinc-400 text-sm mt-1">` abaixo do título.
- [ ] Atualizar `src/pages/Auditoria/index.tsx`:
  - Criar state `isTransitioning` (boolean) e `transitionTarget` (string).
  - Interceptar o avanço (`handleNext`) para verificar se a próxima categoria (`flatItems[nextIndex].catName`) mudou.
  - Se mudou, setar `isTransitioning(true)` e iniciar `setTimeout` de 3500ms.
  - Renderizar a Tela de Transição Ocupando o Card quando `isTransitioning` for true.
- [ ] Rodar o build para validar ausência de bugs.
