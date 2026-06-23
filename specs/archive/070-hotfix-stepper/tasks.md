# Check-list Estrito (Save-State) da Spec 070

- [ ] `src/pages/Auditoria/AuditoriaExecution.tsx`: Implementar helper `canAdvance()` considerando status `null`, `na`, `ok`, `nok` e a verificação de fotos vs. `minPhotos`.
- [ ] `src/pages/Auditoria/AuditoriaExecution.tsx`: Aplicar `disabled={!canAdvance()}` ao botão "Próximo Passo".
- [ ] `src/pages/Auditoria/AuditoriaExecution.tsx`: Adicionar a Tela Preta de Interstício (`isTransitioning`) no método `handleNext` que pisca por 2 segundos ao avançar para um `categoryIdx` diferente.
- [ ] `src/pages/Auditoria/AuditoriaExecution.tsx`: Enviar a prop `instruction` (fazendo um fallback de `currentItem.data.instruction || (currentItem.data as any).photo_instruction`) para o `<AuditoriaItemCard />`.
- [ ] `src/components/Auditoria/AuditoriaItemCard.tsx`: Modificar a label "Observação" para indicar como `* (Obrigatória)` caso status seja `na` ou `nok`.
- [ ] `src/components/Auditoria/AuditoriaItemCard.tsx`: Adicionar styling condicional avermelhado (`border-rose-500`, `bg-rose-50`) à textarea caso o status seja `nok` (ou status `na` e vazia).
- [ ] `src/components/Auditoria/AuditoriaItemCard.tsx`: Melhorar a label fixa da categoria no topo esquerdo usando "📍 CATEGORIA" e tipografia mais gorda para situar o usuário.
