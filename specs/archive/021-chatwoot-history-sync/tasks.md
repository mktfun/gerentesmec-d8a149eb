# Tasks: Sincronização Histórica e UI (021)

- [ ] 1. Alterar a `Config.tsx` adicionando um botão universal "Salvar Configurações de API" no final do bloco de "Integração de Canal", responsável por fazer o `updateIntegrationSettings` de todos os estados (URL, Token, Secret, Account).
- [ ] 2. Remover o auto-save acoplado ao botão "Testar", mantendo ele apenas como invocação de teste de rede.
- [ ] 3. No botão de "Sincronização Histórica", substituir o `alert` por uma chamada ao Supabase para a Edge Function `chatwoot-sync`.
- [ ] 4. Adicionar um estado de loading (`isSyncing`) para colocar um spinner no botão "Puxar Histórico" enquanto a chamada não responde.
- [ ] 5. Exibir notificação de sucesso com o total retornado de novos leads importados.
