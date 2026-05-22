# Design: Chatwoot Proxy & Label Action

## Arquitetura de Comunicação Segura
Faremos uma nova Edge Function em Supabase chamada `chatwoot-action`. Esta function receberá comandos do Front-end (React) e funcionará como uma ponte segura para ações no Chatwoot (como adicionar etiquetas).

### Interface da Edge Function `chatwoot-action`
**Payload de Entrada (Body JSON):**
```json
{
  "action": "add_labels",
  "conversation_id": 12345,
  "labels": ["ignorar"]
}
```

**Comportamento Interno:**
1. A função receberá os dados.
2. Vai utilizar o cliente do Supabase para puxar a `integration_settings`.
3. Vai disparar a requisição usando as credenciais extraídas diretamente da base de dados, contornando o navegador, evitando totalmente o problema de CORS.

### Atualização no `AppDataContext.tsx`
Substituiremos a lógica bruta de `fetch()` para a API do Chatwoot no front-end por uma invocação da Edge Function via supabase client:
```typescript
await supabase.functions.invoke('chatwoot-action', {
  body: {
    action: 'add_labels',
    conversation_id: (l as any).chatwoot_conversation_id,
    labels: ['ignorar']
  }
});
```
