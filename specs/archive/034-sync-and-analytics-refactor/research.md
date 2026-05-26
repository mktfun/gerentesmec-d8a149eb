# Research: Sync Histórico e Analytics Refactor

## O Problema Atual
1. **O TMR Robótico (0m / 1m):** O cálculo atual no frontend (`src/utils/metrics.ts`) não calcula a *média histórica* que o gerente demorou para responder. Ele calcula a **espera atual da fila**. Ou seja, se o gerente acabou de responder todo mundo, a espera da fila é 0, o que faz a tela exibir 0m. Para um relatório, o usuário quer saber o TMR real (quanto tempo em média o gerente levou para fazer o primeiro atendimento na semana/mês).
2. **Falta de Histórico:** A aplicação só grava no banco `leads` e `chat_messages` a partir do momento em que o webhook foi ativado. Mensagens de 3 dias atrás não estão no banco, inviabilizando qualquer dashboard real.

## Descobertas e APIs do Chatwoot
1. O Chatwoot possui a API nativa de Relatórios (`/api/v2/accounts/{id}/reports/summary`) que retorna exatamente o que o Dashboard precisa com perfeição de relógio suíço: `avg_first_response_time` e `avg_resolution_time`.
2. O Chatwoot possui a API de Conversas (`/api/v1/accounts/{id}/conversations`) que permite puxar todas as conversas e mensagens antigas para preenchermos nosso CRM local.

## Conclusão da Pesquisa
Para termos relatórios que não parecem "robóticos" e um CRM útil desde o dia 1, precisamos:
- Criar um script massivo de Sincronização.
- Mudar a fonte da verdade do Dashboard: usar APIs nativas do Chatwoot para os cards de Relatório Global (ou calcular via SQL no Supabase usando o timestamp exato das mensagens importadas).
