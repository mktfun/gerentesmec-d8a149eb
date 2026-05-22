# Tasks: Manual AI Trigger

- [ ] Editar `src/components/Crm/AuditPanel.tsx` para adicionar o novo estado `isSyncing` (boolean).
- [ ] Construir a função `handleManualSync` que consolida `realMessages` em uma string formatada (`[Agente]: texto`, `[Contato]: texto`).
- [ ] Em `handleManualSync`, adicionar a chamada `supabase.functions.invoke('ai-autonomous-evaluator', { body: { lead_id, message_content: consolidatedStr, message_id: 'manual_sync' } })`.
- [ ] Adicionar o botão "Sincronizar" renderizado ao lado do link "Abrir no Chatwoot" no topo do `AuditPanel.tsx`.
- [ ] O botão deve usar `<RefreshCw />` ou `<Sparkles />` com estilo outline/ghost e ficar rodando/disabled enquanto `isSyncing` for true.
- [ ] Commitar as alterações.
