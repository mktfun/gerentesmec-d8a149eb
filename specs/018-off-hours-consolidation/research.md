# Pesquisa e Contexto (RPI-R) - Spec 018

## 1. Escopo e Problema
**Requisito do Usuário:**
- O robô avaliador (`ai-autonomous-evaluator`) só deve disparar em tempo real durante o **horário de expediente**.
- Fora do horário de expediente, o webhook deve apenas salvar as mensagens, e uma rotina deve **consolidar** tudo o que ficou pendente durante a noite/fim de semana.
- Deve gerar um **Resumo Diário (Daily Digest)**, disponível às 08:00 AM, detalhando o que aconteceu fora do expediente, se a IA notou algum erro do atendente (mesmo que a IA avaliadora ou o vendedor tenha cometido falhas), servindo como leitura matinal para o gerente.
- Deve haver opções na UI para **Ligar/Desligar** a consolidação noturna e acionar manualmente.

## 2. Arquitetura Atual
- `chatwoot-webhook`: É acionado a cada mensagem. Atualmente, ele salva a mensagem na tabela `chat_messages` e então invoca a Edge Function `ai-autonomous-evaluator` imediatamente via `fetch`.
- `ai-autonomous-evaluator`: Carrega todo o histórico, manda pra IA e atualiza o `lead`.
- `integration_settings`: Contém a configuração de `business_hours` (dias úteis e horários de início e fim).

## 3. Desafios e Soluções
- **Parada Noturna:** O `chatwoot-webhook` precisa identificar se o momento atual (hora do evento) está dentro do `business_hours`. Se não estiver, ele NÃO chama o `ai-autonomous-evaluator`.
- **Fila Pendente Noturna:** Precisamos saber *quais leads* tiveram mensagens à noite. Como o webhook sempre atualiza `last_client_message_at` ou `last_message_at`, qualquer lead cujo `last_message_at > last_evaluation_at` precisa de avaliação. Mas não temos uma coluna `last_evaluation_at`. Podemos usar uma flag `evaluation_pending` ou apenas ler mensagens de `chat_messages` não processadas. Outra solução é o webhook enfileirar o ID do lead na tabela de "Fila de Tarefas" com status pendente se estiver fora do expediente.
- **Resumo Diário (Daily Digest):** A IA precisa analisar o pacote de tudo que ocorreu no período e condensar em texto formatado para leitura rápida pelo Gerente. Isso pode ser salvo em uma tabela `daily_digests` e exibido na dashboard (UI discreta e focada).

## 4. O que faremos
- Atualizar a UI em `Config/AiRouterConfig.tsx` adicionando chaves/botões para "Avaliador Noturno em Lote".
- Criar a tabela `daily_digests` no Supabase.
- Modificar o `chatwoot-webhook` para respeitar o expediente na hora de invocar a IA avaliadora em tempo real.
- Criar uma **nova Edge Function** (`ai-daily-consolidator`) que rodará de manhã. Ela pegará todas as conversas ativas da madrugada/dia anterior, processará (usando o evaluator) e depois chamará o Gemini para fazer o *Digest Matinal*.
