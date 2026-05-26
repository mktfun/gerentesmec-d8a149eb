# Tasks: Correção de Métricas de Tempo e UI do Círculo

- [ ] 1. **Reverter Cálculo Falho no Frontend**
  - No `TvDashboard.tsx` e `Index.tsx`, remover o cálculo `last_message_at - created_at` que criamos anteriormente para `wait`.
- [ ] 2. **Corrigir SVG do TV Mode**
  - Ajustar as propriedades do `circle` (`cx="128" cy="128"`) no arquivo `TvDashboard.tsx` (já feito na tentativa anterior, mas validar e estabilizar caso ainda esteja torto).
- [ ] 3. **Migração do Supabase**
  - Criar um arquivo SQL em `supabase/migrations/` adicionando as colunas `last_client_message_at` e `last_agent_message_at` na tabela `leads`.
  - Aplicar a migração no banco de dados.
- [ ] 4. **Ajuste no Webhook do Chatwoot (`chatwoot-webhook/index.ts`)**
  - Modificar o script para preencher `last_client_message_at` se a mensagem for do `contact`.
  - Modificar para preencher `last_agent_message_at` se a mensagem for de `user`/`bot`.
- [ ] 5. **Refatorar TMR no Frontend**
  - Em `TvDashboard.tsx` e `Index.tsx`, calcular o `wait_time` apenas quando `last_client_message_at > last_agent_message_at`. Se o agente for o último, o wait time do cliente é 0. O TMR somará apenas os wait times maiores que 0 e fará a média baseada neles (ou na fila de clientes aguardando).
