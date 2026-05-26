# Tasks: AI Scoring Fix

- [ ] Editar `src/components/Crm/AuditPanel.tsx` para remover o bloqueio condicional `pointer-events-none opacity-40` baseado na flag `auto_scoring`.
- [ ] Deletar a div com a classe `absolute inset-0 z-20` que exibe a flag "🔒 Avaliação Fechada".
- [ ] Adicionar os campos `ticket_value` e `customer_vehicle` no select do Supabase na Edge Function `ai-autonomous-evaluator/index.ts` linha ~149 para trazer os dados atuais.
- [ ] Construir lógica de **Merge de Checklist** no evaluator, preservando tudo o que é `true` do `currentChecklist`.
- [ ] Construir lógica de **Fallback de Ticket e Veículo** no evaluator, fazendo `mockOutput.ticket_value || leadData.ticket_value`.
- [ ] Construir cálculo computado (determinístico) do `score` no backend, iterando no `mergedChecklist` e utilizando a tabela de pesos `aiSettings.evaluation_criteria`, ignorando `mockOutput.score`.
- [ ] Alterar o `updatePayload` para utilizar o `mergedChecklist`, o `calculatedScore` e os valores persistentes.
- [ ] Fazer deploy da Edge Function `ai-autonomous-evaluator` com `--no-verify-jwt`.
- [ ] Commitar as alterações.
