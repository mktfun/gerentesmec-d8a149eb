# Tasks: Enterprise Cognitive Architecture (040-enterprise-cognitive-architecture)

- [x] 1. **Banco de Dados (Supabase)**
  - [x] Criar migração SQL `00X_semantic_memory.sql` ativando a extensão `vector`.
  - [x] Criar a tabela `ai_semantic_memory` com colunas `id`, `mechanic_id`, `content`, `embedding`, e configurar RLS (Row Level Security).
  - [x] Criar função SQL RPC `match_mechanic_memories` para realizar busca de similaridade via operador cosseno (`<=>`).

- [x] 2. **Refatoração da Lógica da IA (Edge Functions)**
  - [x] Modificar `ai-autonomous-evaluator` para obrigar o LLM a retornar a chave `thinking_process` dentro do seu payload JSON.
  - [x] Se o provider for Vertex AI ou OpenAI (modelos que suportam structured outputs / JSON mode perfeito), incluir a nova chave no schema `response_schema`.
  - [x] Implementar a chamada ao `match_mechanic_memories` **antes** da chamada principal, formatando as memórias passadas dentro da string de prompt: *"Memórias deste mecânico: ..."*.

- [x] 3. **UI / Frontend (React/Stitch)**
  - [x] Criar o componente `AiThinkingLog.tsx` que renderiza a caixa de "Pensamento da IA" em estilo Terminal Premium.
  - [x] Injetar o componente na visualização de detalhes da Vistoria para o gerente.
  - [x] Adicionar suporte a exibição de badgets (Aviso de Recidiva) se a memória injetada alterar o resultado da pontuação.

- [x] 4. **Teste e Validação**
  - [x] Garantir que o tempo extra gasto no `thinking_process` compensa com um aumento gigantesco na lucidez da resposta (Testar e exibir a diferença para o usuário).
  - [x] Garantir que chamadas repetidas sem novas memórias não gerem anomalias.

