# Design: Filtro de Mecânicas e Orçamento Estimado

## Database (Supabase)
1. **Alteração na tabela `units`**:
   - `ALTER TABLE public.units ADD COLUMN phone text;`
   - O campo `phone` armazenará o número oficial do WhatsApp daquela unidade (ex: `+5511999999999`).

## Webhook (Supabase Edge Function: `chatwoot-webhook`)
1. **Filtro de Telefone**:
   - Ao receber o payload, extrair `contact.phone_number`.
   - Se o número estiver presente, fazer um `.select('id')` na tabela `units` onde `phone = contact.phone_number`.
   - Se retornar dados (ou seja, o remetente é uma unidade registrada), registrar no console "Ignorando conversa de número interno" e retornar `200 OK` para o Chatwoot **sem** inserir na tabela `leads`.

## Frontend (React + Context API)
1. **Atualização Otimista no `AppDataContext.tsx`**:
   - Modificar a função `updateLead(id, updates)` para aplicar as atualizações no estado de React IMEDIATAMENTE (Optimistic Update) antes ou junto da requisição do Supabase.
   - Código esperado:
     ```tsx
     setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
     const { error } = await supabase.from('leads').update(updates)...
     ```
   - Caso a API dê erro, podemos dar rollback no state, ou apenas mostrar um `alert` (já existente).
2. Isso resolverá o bug do campo "finge salvar", pois o React passará a renderizar o valor recém-digitado a partir do estado local, ao invés de descartá-lo esperando um Realtime que não chega.
