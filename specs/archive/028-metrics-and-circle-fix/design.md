# Design: Métricas Exatas e Correção do Círculo

## Frontend
- **UI do Círculo SVG (`TvDashboard.tsx`)**: O atributo `viewBox="0 0 256 256"` será incluído, as coordenadas centrais `cx`, `cy` serão ajustadas para `128` (metade de 256px), resolvendo o "corte" de forma geométrica.
- **Lógica do T.M.R.**: O cálculo inventado anteriormente (`last_message_at - created_at`) será desfeito, pois ele estava contabilizando o tempo independente de quem respondeu por último. Vamos retornar à métrica `wait_time_minutes` ou construir um helper que cruza o status se possível.

## Database (Supabase)
Para que o sistema seja "vivo" e saiba de quem foi a última mensagem, a tabela `leads` deve receber 2 colunas novas via SQL:
- `last_client_message_at timestamp`
- `last_agent_message_at timestamp`

O webhook do Chatwoot alimentará essas colunas baseado no `sender_type` (se for 'contact' ou 'user'/'bot').
Assim, no Frontend (`Index.tsx` e `TvDashboard.tsx`), o TMR (Tempo Médio de Resposta) da Fila e os Alertas (>20m) serão calculados EM TEMPO REAL apenas se `last_client_message_at > last_agent_message_at`. Se o agente falou por último, a espera atual do cliente cai para 0!
