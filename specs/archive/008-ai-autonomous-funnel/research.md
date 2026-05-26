# Research: Arquitetura Multi-Agente para Autonomia de Funil

## Contexto Atual
Atualmente, o sistema possui uma Edge Function `ai-auditor` com um roteamento heurístico muito básico ("se tem .jpg, envia pro vision.ts"). Além disso, o webhook (`chatwoot-webhook`) força o estágio do funil para `quote` de forma "burra" ao receber a primeira mensagem do cliente. A IA atual pontua o lead (Judge) e resume mensagens, mas não afeta o funil.

## O Problema
O usuário deseja que a IA mova os leads pelo funil (Orçamento, Em Negociação, etc.) com base no contexto real da conversa. Além disso, o usuário exigiu explicitamente evitar um "Super Prompt" monolítico. A solução deve ser uma arquitetura modular com um "Cérebro Principal" (Roteador) excelente e "Mini-Cérebros" (Agentes Especialistas) focados em tarefas únicas, para máxima precisão e performance.

## Análise de Solução (Benchmarking & Padrões)
- **Padrão Supervisor/Worker (LangChain/Autogen):** Um LLM rápido atua como Classificador/Roteador. Ele lê a última mensagem + contexto e decide a intenção (Intent). Com base na intenção, ele aciona a função de código específica ou um sub-LLM (Mini-Cérebro) com um prompt restrito e focado.
- **Vantagens:** 
  - Reduz custo (o roteador pode ser GPT-4o-mini rápido, apenas os cérebros complexos usam prompts maiores).
  - Facilita manutenção (se a IA errar na etapa de "Negociação", mexemos apenas no `negotiation_brain.ts`).
  - Previne "Alucinação" de misturar tarefas de auditoria com troca de estágio.

## Escopo Técnico
A Edge Function `ai-auditor` será refatorada para a seguinte arquitetura:
1. **Router Brain (`router.ts`):** Analisa a intenção da mensagem e decide quais módulos acionar.
2. **Funnel Brain (`funnel_agent.ts`):** Mini-cérebro acionado se o router detectar intenção de orçamento, negociação ou aprovação/rejeição. Lê o contexto e decide se deve dar update no `funnel_stage` da tabela `leads`.
3. **Auditor Brain (`judge.ts`):** O cérebro existente que foca exclusivamente em pontuar (score) as regras de atendimento premium do gerente.
4. **Media Brains (`vision.ts`, `audio.ts`):** Mantidos para analisar mídia se o roteador identificar anexos.
