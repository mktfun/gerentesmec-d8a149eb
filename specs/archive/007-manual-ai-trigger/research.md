# Research: Manual AI Evaluator Trigger

## Contexto
O cliente relatou a necessidade de um botão manual para forçar a avaliação da IA (preenchimento do checklist, score, alteração de etapa de funil, leitura de mídia).
Este botão servirá como um "mecanismo de emergência" ou atalho prático caso o webhook falhe ou caso o gestor queira processar todo o histórico recente acumulado de uma vez, sem depender exclusivamente da escuta mensagem a mensagem.

## Desafios e Arquitetura Existente
- Atualmente, o CRM já escuta o webhook e envia requisições para a edge function `ai-autonomous-evaluator` mensagem a mensagem.
- A função `ai-autonomous-evaluator` já possui um sistema nativo de "Memoization/Compression" (tabela `lead_memories`) que resume o histórico da conversa para poupar tokens do LLM nas próximas requisições.
- Se implementarmos um botão na interface do usuário (ex: em `AuditPanel.tsx`, próximo ao botão "Abrir no Chatwoot"), ele não deve substituir o webhook, mas sim complementá-lo.

## Solução Arquitetural Elegante
Não precisamos criar uma nova Edge Function inteira para isso. Podemos reutilizar o `ai-autonomous-evaluator`.
Quando o botão for clicado, o CRM pode juntar todas as mensagens não processadas ou as últimas N mensagens do lead, concatená-las em um formato estruturado (ex: `Gerente: Olá \n Cliente: Preciso de orçamento`), e disparar a Edge Function passando esse bloco de texto como `message_content`.
A IA vai receber esse bloco, juntar com o `compressed_history` (sua memória), emitir o resultado completo (score, funil, etc.), e devolver o novo `compressed_history`, matando dois problemas de uma vez: token saving (resuminhos) e avaliação manual.

## Benchmarking UI
Para não ter "cara de IA", o botão precisa ser sutil, talvez apenas um ícone (ex: um raio, um cérebro minimalista ou um botão "Reavaliar Conversa") com cores neutras ou integradas ao design do sistema sem neon ou "glitter" de IA convencional, seguindo a estética Liquid Glass.
