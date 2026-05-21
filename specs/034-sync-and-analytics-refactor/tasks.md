# Tasks: Sync Histórico & Analytics

- [ ] 1. **Script de Sincronização**
  - Escrever arquivo `sync-history.ts` em TypeScript puro (rodável via `npx tsx`) para interagir com a API de `/api/v1/accounts/1/conversations`.
  - O script deve conter a opção de truncar (limpar) as tabelas `chat_messages` e `leads`.
  - O script deve varrer as conversas iterando pelas páginas (últimos 7 dias ou todas).
  - Aplicar a "Variável Ouro" (`message_type`) ao criar os `chat_messages` do passado.

- [ ] 2. **Integração do Chatwoot Analytics**
  - Mudar `calculateTmr` no `src/utils/metrics.ts` ou criar um hook específico para buscar o `/reports/summary` do Chatwoot.
  - Atualizar `AdminDashboard.tsx` para plugar esse valor real de TMR no card.
  - Atualizar `ModoTv.tsx` para plugar esse valor real de TMR nos círculos/cards das filiais.

- [ ] 3. **Rodar Sincronização**
  - Executar o comando `npx tsx sync-history.ts` no ambiente local do usuário para limpar a sujeira que criamos antes e injetar o passado perfeito.
