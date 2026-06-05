# Design: Enterprise Cognitive Architecture (040-enterprise-cognitive-architecture)

## 1. Modificações Visuais (Stitch / Frontend)
No React/Shadcn, a UX para transmitir essa confiança absurda precisa ser visível:
- O painel de auditoria do Gerente exibirá um botão expansível em estética de *Liquid Glass* chamado "Ver Cadeia de Raciocínio da IA".
- Ao abrir, ele exibirá um log em formato "Terminal Premium" (monospaced, cores suaves roxas/violetas), onde a IA lista os passos do que ela viu, cruzou e deduziu *antes* de chegar ao resultado final (o log de `thinking_process`).
- Caso a IA detecte um padrão histórico (ex: "Mesmo erro cometido dia 15"), uma flag flutuante vermelha vibrante aparecerá sobre a vistoria: "Aviso de Recidiva de Erro (Memória RAG)".

## 2. Modelagem de Banco de Dados (Supabase MCP)
A chave da "Memória da Empresa Gigante" é o banco vetorial:
- **Tabela `ai_semantic_memory`**:
  - `id`: uuid
  - `mechanic_id`: uuid
  - `content`: text (resumo do erro/acerto gravado do passado)
  - `embedding`: vector(1536) ou o que for compatível com Gemini Embeddings (768).
  - `created_at`: timestamp
- Cada vistoria finalizada que contenha erros graves ou elogios raros dispara um evento que extrai a lição, transforma em vetor e salva na memória do mecânico específico.

## 3. Lógica do Supabase Edge Function (`ai-autonomous-evaluator`)
- **Etapa 1 (Memória - RAG):** Antes de injetar o prompt ao Gemini, a função busca as últimas 5 memórias mais relevantes daquele `mechanic_id` via similaridade de cosseno no `pgvector`.
- **Etapa 2 (Thinking Phase):** O modelo é chamado exigindo resposta em JSON com:
  ```json
  {
    "thinking_process": "Passo 1: Avaliar imagem. Passo 2: Comparar com regra. Passo 3: Buscar memória...",
    "score_details": {...},
    "final_decision": true
  }
  ```
- **Etapa 3 (Caching Semântico Opcional):** Para vistorias em massa quase idênticas, um hash simples ou comparação semântica super-leve decide se pulamos a Etapa 2 e entregamos o cache.

Essa separação de passos garante que a IA pare de "chutar" respostas imediatas, obrigando-a a ser totalmente lúcida em seus processos.
