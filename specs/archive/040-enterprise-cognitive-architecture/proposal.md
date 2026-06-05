# Proposal: Enterprise Cognitive Architecture (040-enterprise-cognitive-architecture)

## 1. O Problema
A inteligência artificial atual do sistema opera de forma linear ("Naive Prompting"). Ela processa os dados de vistoria uma única vez e "cospe" o resultado. Isso causa falhas de raciocínio, alucinações de contexto, falta de memória real ao longo do tempo, e destrói a confiança do gestor na automação, fazendo-a parecer amadora e pouco lúcida.

## 2. A Solução Proposta
Para transformar a IA em uma especialista "nível empresa gigante" (extremamente afiada e confiável), propomos uma **Arquitetura Cognitiva de Agentes Reflexivos (Agentic RAG + Self-Critique)**.
- **Raciocínio Exposto (Chain of Thought):** A IA será forçada a escrever "como ela está pensando" antes de dar a nota. Esse log reflexivo reduzirá a taxa de erro a quase zero, pois a obriga a "pensar alto" e validar a lógica.
- **Memória Semântica com Supabase pgvector:** O RAG vai buscar vistorias históricas do mesmo mecânico. Antes de avaliar, a IA saberá se aquele mecânico comete o mesmo erro com frequência, permitindo feedbacks evolutivos e assertivos.
- **Ciclo de Auto-Correção:** Uma segunda etapa rápida de validação. A IA avalia a vistoria, e um "Supervisor Agent" microscópico confere: "Esta avaliação segue as regras estritas da mecânica?". Se não, refaz internamente antes de devolver ao usuário.
- **Cache Semântico:** Implementado para respostas idênticas usando embeddings de alta precisão, reduzindo latência em até 80% e economizando chamadas de API.

## 3. Requisitos Técnicos
- Habilitar `pgvector` no Supabase (já ativado por padrão em versões recentes, apenas criar tabela de embeddings da memória).
- Refatorar a Edge Function `ai-autonomous-evaluator` para executar o pipeline em 2 etapas lógicas: Raciocínio (Orchestrator) -> Execução/Crítica (Worker).
- Alterar o `responseFormat` (JSON Schema) para conter a chave `thinking_process` obrigatória.
- Interface React atualizada para exibir (opcionalmente) a "Caixa Preta do Raciocínio" para os gerentes que desejam auditar a decisão da IA.

## BDD Scenarios

### Cenário: Raciocínio Transparente (Chain of Thought)
- **Dado** que a IA recebe uma avaliação complexa de manutenção de motor.
- **Quando** o processamento é iniciado.
- **Então** o sistema produz um JSON contendo `{"thinking_process": "O mecânico não filmou o aperto do cárter, porém mandou áudio. A regra X exige comprovação visual. Portanto, falhou.", "score": 0}` e a UI exibe essa "linha de pensamento" garantindo total transparência e coerência da máquina.

### Cenário: Memória Dinâmica via RAG (Evolução Temporal)
- **Dado** que o mecânico "João" repete um erro de não usar capa protetora pela terceira vez no mês.
- **Quando** a IA processa sua nova vistoria.
- **Então** o RAG injeta as vistorias anteriores no contexto do prompt, fazendo com que a IA adicione ao feedback: "Atenção gestor: João não usou capa protetora pela 3ª vez consecutiva em 30 dias. Ação disciplinar recomendada.", demonstrando memória e evolução no raciocínio.

### Cenário: Alta Velocidade e Otimização via Cache Semântico
- **Dado** que um input idêntico (mesmas imagens e texto de uma rotina padronizada de Check-In) é avaliado novamente no mesmo dia.
- **Quando** a requisição atinge a Edge Function.
- **Então** o sistema faz match vetorial de 99% com uma avaliação validada anterior, retornando a nota imediatamente sem custo de processamento LLM pesado, otimizando latência.
