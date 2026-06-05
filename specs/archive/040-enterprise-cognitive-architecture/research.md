# Research: Enterprise Cognitive Architecture (040-enterprise-cognitive-architecture)

## 1. Contexto e Problema
O usuário relata que a Inteligência Artificial do sistema (avaliador de mecânicos) ainda falha, comete alucinações e perde contexto, não aparentando evoluir ao longo do tempo. Há o desejo expresso de elevar a arquitetura do LLM ao "nível empresa gigante" (State of the Art 2026), otimizando:
- **RAG (Retrieval-Augmented Generation)**
- **Raciocínio (Reasoning)**
- **Lucidez e Credibilidade**
- **Velocidade e Eficiência**

## 2. Padrões Enterprise 2026 (Benchmarking)
A abordagem ingênua ("Naive RAG" — chunk, embed, retrieve, generate) está ultrapassada para workflows críticos. Em 2026, gigantes tech utilizam **Arquiteturas Cognitivas Modulares** que envolvem:

1. **Agentic RAG (RAG Orientado a Agentes):**
   - Em vez de uma busca passiva, a IA usa loops de raciocínio como PRAR (Perceive, Reason, Act, Reflect).
   - O agente divide tarefas complexas, decide ativamente *o que* buscar no banco e verifica as próprias respostas antes de enviá-las ao usuário final (Self-Correction/Critique).

2. **Raciocínio Chain-of-Thought (CoT) / Tree-of-Thoughts (ToT):**
   - Transparência do raciocínio. A IA processa o problema em passos lógicos e documenta isso, permitindo que a aplicação faça "parse" da linha de pensamento. Isso reduz drasticamente alucinações.

3. **Hybrid & Graph RAG:**
   - **GraphRAG:** Permite que a IA construa grafos de conhecimento das relações (ex: "Mecânico A" -> "Vistoria B" -> "Carro C"). Isso garante contexto profundo que vetores puramente semânticos perdem.
   - **Reranking:** O uso de modelos de Cross-Encoder (ex: Cohere Rerank) para re-ordenar resultados antes de injetá-los no prompt, garantindo que só o ouro chegue no contexto, economizando tokens e evitando poluição cognitiva.

4. **MCP (Model Context Protocol):**
   - A padronização universal (MCP) ajuda agentes a operarem as ferramentas (como buscar dados no banco Supabase ou varrer a web) de forma padronizada e nativa.

## 3. Aplicação ao Nosso Ecossistema (Supabase + React)
No nosso contexto de "Gerentes Mecânicos", a IA atua como um Auditor. Para atingir a credibilidade máxima:
- **Separação de Modelos (Orchestrator vs. Worker):** Um modelo rápido (Gemini Flash) decide o que buscar, e um modelo robusto (Gemini Pro/Claude Opus) faz a avaliação final usando um prompt que força a exibição do raciocínio `{"thought_process": "...", "final_score": X}`.
- **RAG com Supabase `pgvector`:** Ao invés de jogar todo o contexto no prompt, a Edge Function fará uma busca vetorial refinada por histórico de correções parecidas do mesmo mecânico, permitindo que a IA *aprenda* com os erros passados.
- **Cache Semântico:** Implementar Redis ou tabelas em memória no Supabase para retornar resultados idênticos em frações de segundo.
