# Research: Métricas Exatas e Correção do Círculo

## Contexto
O usuário percebeu 2 problemas:
1. **O Círculo no TV Mode está virando um quadrado (cortado):** A propriedade `cx="124"` em um SVG de `w-64 h-64` (256x256) cortou as beiradas porque o eixo central real deveria ser `cx="128"`. Ao girar (`-rotate-90`) sem o viewBox exato de 256x256, as pontas do SVG são clipadas.
2. **"TMR é o cliente esperando, não o mecânico":** O TMR na Tv e no Index estavam somando toda a duração da conversa, ou dando 0. A lógica correta de "Tempo Médio de Resposta (TMR) da Fila Atual" é calcular quanto tempo *os clientes que mandaram a última mensagem* estão esperando. Se a última mensagem foi do mecânico/gerente, a espera daquele cliente é 0.
Além disso, `Index.tsx` e `TvDashboard.tsx` devem usar essa lógica de forma sincronizada.

## Como calcular o TMR Corretamente na Interface
Como não temos a coluna `last_message_sender_type` na tabela `leads` no Supabase, a melhor abordagem *agora* sem alterar o backend pesado é identificar quem enviou a última mensagem, se possível. No entanto, o frontend só tem acesso aos campos do `lead`.
Espera, o `chatwoot-sync-messages` sincroniza as mensagens. Se o frontend não baixar as `messages`, não tem como saber de quem foi a última mensagem!
Precisamos adicionar a coluna `last_message_sender` ou `is_waiting_reply` na tabela `leads` no banco de dados, para que a webhook do Chatwoot alimente quem foi a última pessoa a falar.

## Decisão de Arquitetura
Como a tabela `leads` tem `wait_time_minutes`, o script do webhook deveria atualizá-lo, ou devemos mudar a estratégia para que o painel saiba que `wait_time_minutes = 0` significa que a unidade respondeu.
Para resolver de imediato o "Círculo cortado", o viewBox será arrumado.
Para as métricas, vamos modificar a lógica:
Se `sla_status === 'danger'`, significa que ele extrapolou o SLA (cliente esperando muito tempo).
Mas para ter o cálculo no Frontend, vamos criar uma migration leve adicionando `last_sender_type` na tabela `leads` e ajustando o `updateLead` ou as funções de Dashboard. Ou apenas vamos inferir o wait time pelo `last_message_at` mas apenas para os Leads que ainda não foram marcados como "resolved" (e ignorando mensagens do mecânico, se pudermos identificá-las).
