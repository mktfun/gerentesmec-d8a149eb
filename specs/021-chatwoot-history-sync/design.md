# Design: Sincronização Histórica e UI (021)

## UI (Configurações)
O refatoramento foca na estabilidade do estado:
1. **Separar a Validação da Persistência:**
   - O botão principal no topo continuará "Testar" para ver se a URL/Token comunicam.
   - Um novo botão **Salvar Configurações** na base da seção consolidará o `updateIntegrationSettings` com todos os 4 campos de uma só vez (URL, Token, Account ID, Webhook Secret).
2. **Botão de Puxar Histórico:**
   - Ganha estado `syncing (boolean)`. Enquanto true, exibe o ícone de spinner (`Loader2 animate-spin`) substituindo o texto.

## Integração (Supabase Edge Function)
A Edge function `chatwoot-sync` já existe e lida com o upsert. 
O Front-End apenas a invocará:
```typescript
const { data, error } = await supabase.functions.invoke('chatwoot-sync')
// Se sucesso, notificar na tela a propriedade data.message (Ex: "Historical sync completed. 15 new leads imported.")
```
