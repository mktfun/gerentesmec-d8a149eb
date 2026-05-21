# Tasks: Chat Timeline Events & Real History (022)

- [ ] 1. Alterar `ChatHistoryView.tsx` para remover os mocks fixos.
- [ ] 2. Na mesma tela, identificar mensagens com `sender_type === 'system'` e renderizá-las no formato centralizado e contornado de pílula (Pill), sem fundo de cor ou balão de apontamento.
- [ ] 3. No método `moveLeadStage` e `updateLead` (quando salva auditoria) do `AppDataContext.tsx`, injetar programaticamente no backend uma linha na tabela `chat_messages` com o `content` do evento ("Alterou para Em Negociação", "Calculou Score X%") usando o `sender_type: 'system'`.
- [ ] 4. Testar arrastar o card no Kanban e confirmar que um pill de sistema pipoca em tempo real no Dossiê sem afetar a conversa.
