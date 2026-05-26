# Tasks: Manual AI Trigger

- [x] Editar `src/components/Crm/AuditPanel.tsx` para adicionar o novo estado `isSyncing` (boolean).
- [x] Construir a função `handleManualSync` que consolida `realMessages` em uma string formatada (`[Agente]: texto`, `[Contato]: texto`).
- [x] Em `handleManualSync`, adicionar a chamada `supabase.functions.invoke('ai-autonomous-evaluator', { body: { lead_id, message_content: consolidatedStr, message_id: 'manual_sync' } })`.
- [x] Adicionar o botão "Sincronizar" renderizado ao lado do link "Abrir no Chatwoot" no topo do `AuditPanel.tsx`.
- [x] O botão deve usar `<RefreshCw />` ou `<Sparkles />` com estilo outline/ghost e ficar rodando/disabled enquanto `isSyncing` for true.
- [x] Commitar as alterações.
