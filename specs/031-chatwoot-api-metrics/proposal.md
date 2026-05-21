# Proposal: Integração Nativa de Métricas com Chatwoot API

## Objetivos
1. Consumir a API oficial de Reports do Chatwoot para os dados do Dashboard (Visão Global e Visão por Unidade/Canal).
2. Sincronizar o status de "Esperando" (Waiting Since) diretamente da API do Chatwoot para cada Lead, substituindo o cálculo impreciso local por uma fonte de verdade oficial.
3. Criar uma Edge Function no Supabase responsável por buscar esses dados de forma assíncrona ou por cron-job, poupando a API do Chatwoot de abusos (Rate Limits) pelo Frontend.

## User Stories
1. Como Diretor, quero olhar a "Visão Global" e ver o Tempo Médio de Primeira Resposta e de Resolução exatamente iguais aos que o Chatwoot reporta nos seus relatórios nativos, para garantir consistência dos dados empresariais.
2. Como Gerente, quero que os minutos de espera do meu cliente na coluna do CRM sejam calculados com precisão suíça, pausando quando a conversa é "snoozed" (adiada) e voltando a contar quando o cliente fala.

## BDD Scenarios

### Cenário: Sincronização do Tempo de Espera
- **Dado** que o Lead "Mario" mandou uma mensagem às 10h00 e o gerente adiou (snooze) o chat até as 12h00 pelo painel do Chatwoot.
- **Quando** a rotina de sincronização atualiza o lead.
- **Então** o sistema local lê a propriedade `waiting_since` e `snoozed_until` vindas da API e pausa o SLA de acordo com a regra de negócios nativa do Chatwoot, não penalizando o TMR do gerente incorretamente.

### Cenário: Dashboard com Métricas Globais Oficiais
- **Dado** que o Chatwoot reporta um `avg_first_response_time` de 300 segundos na última semana.
- **Quando** o usuário carrega o dashboard principal do GerentesMec.
- **Então** o Frontend consome o último "snapshot" salvo da API de reports e exibe "5 minutos" com base no relatório real do Chatwoot.
