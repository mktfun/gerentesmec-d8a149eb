# Tasks: Correção da Lógica do Avaliador (021)

- [ ] Modificar `supabase/functions/ai-autonomous-evaluator/index.ts`
  - [ ] Atualizar a definição de `closed_won` no prompt para acontecer APENAS no fim do serviço (pós-pagamento ou pedido de avaliação).
  - [ ] Atualizar a definição de `negotiation` para incluir o momento em que o serviço está "Aprovado / Sendo executado".
  - [ ] Adicionar reforço explícito no prompt para lotes mistos (`mixed`) garantindo que o item `2e` seja avaliado corretamente mesmo que a última mensagem seja do gerente.
- [ ] Testar prompt executando a Edge Function com payload simulado (ou validando logicamente).
- [ ] Solicitar aprovação do usuário sobre a decisão de negócio (usar a etapa 'negotiation' para carros na oficina).
