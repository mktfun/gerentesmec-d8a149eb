# Tasks: CRM Search + Webhook Fix + Número Duplicado

## BUG CRÍTICO — Fix Webhook (prioridade máxima)

- [ ] 1. **Diagnosticar webhook via logs do Supabase**
  - Verificar logs da função `chatwoot-webhook` no Supabase Dashboard
  - Confirmar qual evento está chegando e em qual linha está falhando

- [ ] 2. **Corrigir `chatwoot-webhook/index.ts`**
  - Remover query `.eq('phone', contactPhone)` — coluna não existe
  - Substituir por verificação de `unit.phone` (se quiser filtrar por número da mecânica, precisa de uma coluna dedicada em units, ou simplesmente remover esse filtro por enquanto)
  - Garantir extração correta de `inboxId` para evento `message_created`:
    - Para `message_created`: o `inbox_id` pode estar em `payload.conversation.inbox_id`, não em `payload.inbox?.id`
  - Adicionar logs em cada ponto de saída para facilitar diagnóstico
  
- [ ] 3. **Deploy do webhook corrigido**
  - `npx supabase functions deploy chatwoot-webhook --project-ref qtjitszradxsmnilnqtj`

- [ ] 4. **Verificar unidades têm `chatwoot_inbox_id` preenchido**
  - Query: `SELECT name, chatwoot_inbox_id FROM units`
  - Se NULL: o webhook nunca vai encontrar a unidade

---

## Feature: CRM Search Bar

- [ ] 5. **Adicionar estado `searchQuery` e `searchScope` em `Crm.tsx`**
  - `searchQuery: string` — texto digitado
  - `searchScope: 'global' | 'pipeline'` — escopo da busca

- [ ] 6. **Implementar lógica de filtragem com busca**
  - `searchedLeads`: `filteredLeads` filtrado por `searchQuery` em `customer_name` ou `customer_phone` (case-insensitive)
  - Quando `searchScope === 'global'`: busca em `leads` (todos) antes do filtro de unidade
  - Substituir uso de `filteredLeads` por `searchedLeads` no render

- [ ] 7. **Adicionar UI da barra de pesquisa no topbar de `Crm.tsx`**
  - Inserir entre o view toggle (esquerda) e o botão "Novo Atendimento" (direita)
  - Input com ícone de lupa, placeholder "Buscar nome ou número..."
  - Botão X para limpar quando há texto
  - Pills "Global" / "Esta Pipeline" para trocar scope (aparecem apenas quando há texto)
  - Estilo: glassmorphism + transição suave de expansão

---

## Feature: Número Duplicado em Unidades

- [ ] 8. **Detectar `chatwoot_inbox_id` duplicado entre units em `Config.tsx`**
  - Calcular `duplicateInboxIds`: array de `chatwoot_inbox_id` que aparecem mais de uma vez
  - Se não-null e duplicado: renderizar badge de warning amarelo na seção de unidades

- [ ] 9. **UI de aviso inline na seção de Unidades**
  - Banner amarelo: "⚠️ Conflito: as unidades [X] e [Y] compartilham o mesmo inbox. Verifique a configuração no Chatwoot."
  - Aparece apenas se `duplicateInboxIds.length > 0`

---

## Finalização

- [ ] 10. **Commit e push de tudo**
  - Build deve passar sem erros
