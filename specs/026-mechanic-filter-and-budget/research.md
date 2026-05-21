# Research: Filtro de Mecânicas e Orçamento Estimado

## Contexto
O usuário solicitou duas melhorias essenciais no CRM Autônomo B2B:
1. **Filtro de Mecânicas:** Atualmente, se uma mecânica (gerente) manda mensagem entre si ou usa o número cadastrado no próprio Chatwoot para testes/conversas internas, o sistema (via webhook) registra isso como um novo "Lead" no Kanban, sujando a esteira com conversas que não são de clientes finais.
2. **Bug do Orçamento Estimado:** O input de "Orçamento Estimado" (ticket_value) na tela de auditoria não está retendo os valores. O usuário digita, mas o valor some ou não atualiza no banco ("finge salvar").

## Diagnóstico Técnico
1. **Webhook Criando Leads Indesejados:** O script `chatwoot-webhook/index.ts` intercepta qualquer conversa nova no Chatwoot e insere em `leads`. Atualmente, não há uma checagem se o telefone de origem (`contact.phone_number`) pertence à própria oficina.
   - *Desafio:* A tabela `units` não possui um campo de telefone das mecânicas. Precisamos adicionar um campo `phone` ou `whatsapp` nas unidades, para que o webhook possa comparar e barrar a inserção se houver "match".
2. **Bug no `ticket_value`:** No arquivo `AppDataContext.tsx`, a função `updateLead` faz a chamada ao Supabase (`supabase.from('leads').update...`) mas **não realiza a atualização otimista na UI** (`setLeads(...)`).
   - Se o Realtime estiver lento ou falhar, a UI nunca reflete o estado salvo, causando a sensação de "finge salvar".
   - Além disso, se houver um pequeno delay de re-render, o campo perde o valor porque o componente desassocia o estado. A correção envolve garantir o `setLeads` dentro da função `updateLead`.
