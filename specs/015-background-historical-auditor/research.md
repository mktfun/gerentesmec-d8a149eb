# Research - Background Historical Auditor

## Contexto
O cliente tem um acúmulo de mensagens antigas (`chat_messages`) e históricos de leads parados que nunca passaram pelo Evaluator de IA (ou porque falharam antes, ou porque a IA local proxy estava desligada, ou porque chegaram antes do sistema de IA ser implantado). 
O processamento instantâneo de um grande volume de mensagens no LLM local pode sobrecarregar (explodir a IA), causar lentidão extrema na máquina ou estourar rate limits caso o fallback vá para a cloud.

## Objetivo
Criar um job de segundo plano (Background Worker/Cron) persistente e cadenciado, apelidado de "Historical Auditor", capaz de:
- Identificar as mensagens e leads não auditados (`ai_audited = false`).
- Fazer o enfileiramento (queue) ordenado (dos mais recentes para os mais antigos, ou vice-versa, dependendo da regra de negócio escolhida).
- Aplicar um throttle/delay (ex: processar 1 mensagem a cada 10-15 segundos) para não derrubar a IA.
- Permitir que o usuário pause ou configure a velocidade no Painel de Engenharia.

## Benchmark & Padrões
- **Padrão de Fila Supabase:** `pg_cron` no Supabase não é bom para loops curtos (mínimo de 1 minuto). Para cadência de segundos, precisamos de uma arquitetura de loop no cliente (UI/Daemon Local) ou invocações encadeadas de Edge Functions (Edge Function chamando a si mesma com delay - desaconselhado pois infla conta de invocação).
- **Abordagem Vencedora:** Como o app React está muitas vezes sempre aberto no desktop do cliente (ou no terminal via CLI Proxy API rodando em background da conversa anterior "Automating Background Service Execution"), podemos embutir um "Slow Queue Worker" direto na aplicação, ou adicionar uma rota num script Node.js já existente. 

Considerando o ecossistema, se usarmos o React Frontend (no `AdvancedAiPanel`), já temos o loop do heartbeat. Só precisamos expandi-lo para um modo "Slow Sync" que roda independentemente de o modal estar aberto.

## Conclusões
- A arquitetura usará o app React (via um Hook global de Background Task) ou o Node.js proxy (se quisermos garantir execução offline). Como a interface Supabase é a fonte da verdade, usaremos o próprio `AppDataContext.tsx` ou um novo `BackgroundAuditorService` na aplicação React para rodar o throttle.
