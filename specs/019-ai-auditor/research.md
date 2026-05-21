# Research: AI Auditor Multi-Agente & RAG (019)

## Contexto e Pedido do Usuário
O usuário deseja implementar uma "Auditoria por IA" que seja disparada a cada mensagem trocada. A IA deve avaliar os leads em tempo real para calcular o `score` (Atendimento, Orçamento, Up-sell, Encerramento).
- **Problema de arquitetura monolítica**: O usuário quer que a IA seja "bem dividida, cada mente da IA e ferramenta dela, muito bem roteada".
- **Prevenção de Alucinação & Performance**: Quer rapidez, sem alucinar, usando roteamento inteligente.
- **Multimodal**: Habilidades para analisar **vídeo, imagem e áudio**.
- **Futuro RAG**: Preparar o terreno para um RAG bem definido (recuperação de contexto de histórico de veículos/peças).

## Arquitetura Multi-Agente (Router Pattern)
Para resolver o problema de latência e alucinação, a melhor abordagem é o padrão **Supervisor/Router**. Em vez de um prompt gigante fazendo tudo:
1. **Webhook Receiver (Supabase Edge Function)**: Recebe a nova mensagem do Chatwoot.
2. **Agent Router (Classificador Rápido)**: Usa um modelo menor (ex: GPT-4o-mini ou Claude 3.5 Haiku) apenas para decidir: "Esta mensagem tem áudio?", "Tem imagem?", "É uma mensagem de negociação ou fechamento?".
3. **Specialized Agents (Sub-mentes)**:
   - *Vision Agent*: Extrai contexto de fotos de peças quebradas ou vídeos.
   - *Audio Agent*: Transcreve e faz análise de sentimento de áudios de clientes irritados.
   - *Audit/Judge Agent*: Atualiza o Scorecard do Dossiê baseado nas regras estritas (tem cordialidade? mandou link do orçamento?).
4. **Database Vector (pgvector)**: Preparar a tabela `chat_messages` com uma coluna de embedding para o futuro RAG.

## Como as ferramentas se encaixam
- O Supabase fará o *trigger* `after insert` na tabela `chat_messages` para chamar o Edge Function.
- O Edge Function orquestrará a chamada para a API da OpenAI (ou Anthropic), invocando as ferramentas (Function Calling) específicas de cada sub-mente.
- O Frontend apenas escutará via *Supabase Realtime* as atualizações do `score` e da tabela `leads`.
