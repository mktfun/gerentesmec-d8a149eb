# Proposal: Auditoria Autônoma de Gerentes (gerentes-audit)

## Problema
Os gerentes mecânicos da rede (distribuídos em várias lojas no Chatwoot) lidam com atendimentos ao longo de vários dias/horas, gerando dezenas ou centenas de mensagens (incluindo áudios, fotos e vídeos). Enviar todas essas mensagens de uma só vez para um modelo de IA caro no fechamento (won/lost) resulta em custos excessivos de tokens e limitação na janela de contexto.
O usuário quer extrair as lógicas de auditoria (checklist) do app atual e implementar uma "arquitetura barata e incremental" em um novo app ou módulo dedicado para analisar apenas essas conversas.

## Solução Proposta
A proposta é implementar uma arquitetura de "Summarização Incremental" e "Checklist Master no Fechamento". O sistema atuará como uma state-machine:
1. **Webhook Contínuo:** Recebe mensagens do Chatwoot mapeadas por loja (Store ID).
2. **Filtro de Ruído:** Valida se a conversa é com um *Cliente* (ignora fornecedores, financeiro, ou grupos).
3. **Transcrição de Áudio (Local):** Processa mensagens de áudio/vídeo enviando para uma API Whisper rodando localmente (VPS) para não gerar custos.
4. **Batching Econômico (Flash/Haiku):** A cada X mensagens (ou intervalo de tempo/inatividade), uma IA rápida e barata (ex: Claude 3.5 Haiku, Gemini Flash ou GPT-4o-mini) atualiza o "Running Summary" (Estado da Negociação). Ela não audita nada, apenas comprime o contexto.
5. **Trigger de Encerramento:** Quando a conversa atinge um estágio de fechamento (tag no Chatwoot de `fechou` ou inatividade de X horas determinando `lost`), um trigger é acionado.
6. **Auditoria Master (GPT-4o ou Groq):** O modelo robusto é invocado usando APENAS os últimos logs brutos cruciais + o `Running Summary` comprimido, respondendo ao checklist completo das 4 tarefas de avaliação e exportando para o Painel de Gerentes.

## Contratos de Dados (Tabelas)
*(Migração para novo app envolverá criar estas estruturas)*
- Tabela `manager_conversations_state`: Guarda `chatwoot_conversation_id`, `store_id`, `running_summary` (TEXT), `message_count` (INT), `status` (open/closed).
- Tabela `manager_inspections` (equivalente ao `store_inspections` atual, porém focada no gerente): `id`, `store_id`, `manager_name`, `chatwoot_id`, `score`, `audit_checklist` (JSONB), `manager_failures`, `funnel_stage`.

## API / Interface
- **Webhook Endpoint**: `POST /api/webhooks/chatwoot`
  - Escuta `message_created`.
  - **Filtro de Contato:** Analisa os atributos customizados (Custom Attributes) do contato no Chatwoot ou verifica se há tags de `fornecedor` / `financeiro`. Se houver, a mensagem é ignorada. Caso contrário (cliente), o fluxo segue.
  - Agrupa em lotes e salva no buffer (Redis ou tabela).
- **CRON Job / Queue**: Roda a cada 5 minutos.
  - Verifica conversas no buffer com lote cheio ou inativas. Aciona LLM Barata.
  - Verifica conversas sinalizadas como concluídas. Aciona LLM Cara (Super-Prompt).
- **Worker de Áudio (VPS Local)**:
  - Roda em Python (usando o pacote `whisper` da OpenAI, no modelo `base` ou `small`).
  - Escuta fila de áudios pendentes. Baixa o OGG do Chatwoot, transcreve em CPU (ou GPU barata), e devolve o texto limpo para ser inserido na base antes do Batching ocorrer. Totalmente gratuito.
- **Frontend Dashboard**: Tela dedicada estilo "AuditorsPanel", listando as lojas e scores, sem poluir a visão da central de atendimento.

## O Que Analisar (Os Pontos Extraídos)
O sistema irá avaliar as conversas sob 4 pilares, usando o mesmo sistema de "Confiança Zero":
**TAREFA 1: AVALIAÇÃO GLOBAL (Checklist)**
- 1a: Atendeu em menos de 10 minutos após a primeira mensagem?
- 1b: Acolheu o cliente com empatia e entusiasmo?
- 2a: Fez perguntas investigativas para entender o problema real?
- 2b: Evitou passar preços exatos antes de ver o veículo?
- 2c: Puxou a responsabilidade da venda pro WhatsApp (e não apenas mandou vir na loja)?
- 2d: Usou áudio ou vídeo para criar autoridade técnica?
- 2e: Fez o quebra-objeções após o cliente relutar no preço?
- 3a: Tentou oferecer revisão de outros itens preventivos (Up-Sell/Cross-Sell)?
- 4a: Agradeceu após finalizar atendimento? (Apenas se fechar ou perder)
- 4b: Enviou link de avaliação do Google? (Apenas se fechar ou perder)

## Features Existentes Impactadas
- O webhook atual do Chatwoot (se existir) precisará ser roteado ou expandido para diferenciar caixas da Central vs caixas dos Gerentes.
- O painel atual do web app ganhará um "modo/tab" (Gerentes vs Central) caso a lógica seja mantida no mesmo projeto, ou o web app atual precisará expor um endpoint/API caso tudo seja extraído para fora.

## Risco Principal
- **Perda de Nuances no Resumo:** A IA mais barata (Haiku/Flash) pode resumir a conversa e DELETAR do resumo o exato momento em que ocorreu uma quebra de objeção (2e). Quando a IA Mestre for rodar, ela não achará a prova e dará 'false', baixando o score injustamente.
- **Mitigação:** O prompt da IA barata DEVE ser instruída a "preservar citações exatas ou anotações de eventos do checklist", ou seja, ser "Checklist-Aware".
