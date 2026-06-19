# Implementação - Spec 067 (Edge-to-Edge Auditoria UI)

- [ ] Editar `src/pages/Auditoria/AuditoriaExecution.tsx`:
  - [ ] Na `ÁREA CENTRAL (O Card Principal)`, remover os paddings laterais e margens do container `overflow-y-auto`. Passar de `p-4 pb-24` para `pb-24` (remoção do `p-4` que causa borda cinza).
  - [ ] Remover o `bg-background dark:bg-[#0a0a0f]` do root, deixando o container assumir a cor de fundo nativa do Card ou vice versa, integrando o Header visualmente com o fundo limpo.
- [ ] Editar `src/components/Auditoria/AuditoriaItemCard.tsx`:
  - [ ] No `div` principal, remover as classes que engessam o layout em caixa flutuante: `max-w-lg`, `mx-auto`, `border`, `rounded-[2rem]`, `shadow-2xl`, `mt-4`.
  - [ ] Alterar o wrapper da foto (`h-[40vh]`) para remover arredondamento extra se houver e deixar as imagens ocuparem de ponta a ponta.
  - [ ] No wrapper do conteúdo textual (`<div className="p-6 flex-1...">`), garantir que os botões (Conforme, N/A, etc) tenham respiro interno.
  - [ ] Ajustar o badge da "Categoria" absoluto (`<div className="absolute top-4 left-4 z-20">`) para que fique com `top-0` ou semelhante se o header superior já existir, ou apenas mantê-lo encostado na foto sem vazar.
- [ ] Rodar `npm run build` para validar e aprovar visualmente as bordas.
