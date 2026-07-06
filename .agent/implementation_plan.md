# Objetivo: Auditoria Crítica Contínua (Zero Toque)

## User Review Required

> [!IMPORTANT]
> Proposta elaborada com sucesso baseada nas regras de SDD.
> Analise os quatro pontos da seção `Proposed Changes` abaixo. Nela está a engenharia do Super-Prompt focado nas "Falhas do Gerente" e a orquestração do Agendador de Sexta-feira. Você aprova esse design estrito?

## Proposed Changes

### 1. Novo Cérebro de Auditoria (Modificação de Prompt)
#### [MODIFY] [autonomous_auditor_v2.mjs](file:///c:/Users/admin/.gemini/antigravity/scratch/gerentesmec/scripts/autonomous_auditor_v2.mjs)
Vou refatorar a instrução primária (System Prompt) que a OpenAI/Groq recebe. Ela abandonará a neutralidade. O agente será instruído a incorporar a figura de um inspetor incisivo.
Ele terá obrigatoriamente que devolver no JSON:
- `conversation_summary`: O resumo objetivo da transação.
- `manager_failures`: Texto de análise comportamental indicando "O que o gerente vacilou". Se o gerente foi perfeito, ele descreverá a boa conduta.
- `unit_insight`: Um apontamento de inteligência tática sobre o pilar comercial.

### 2. Upgrade Visual dos Dossiês
#### [MODIFY] [gerar_relatorio_diretoria.mjs](file:///c:/Users/admin/.gemini/antigravity/scratch/gerentesmec/scripts/gerar_relatorio_diretoria.mjs)
Para não deixar a inteligência escondida, vou adicionar blocos de HTML no card de cada cliente (dentro dos Dossiês da Área de Trabalho). Ele renderizará:
- 💡 **Resumo da Conversa:** (Texto)
- ⚠️ **Onde o Gerente Falhou:** (Texto com destaque crítico em vermelho ou laranja).

### 3. Orquestrador Nativo (Skill Antigravity)
#### [NEW] [.agent/skills/cron-auditor/SKILL.md](file:///c:/Users/admin/.gemini/antigravity/scratch/gerentesmec/.agent/skills/cron-auditor/SKILL.md)
Criarei a Skill `cron-auditor`. Quando ativada, ela sabe que deve rodar o `run_pipeline.mjs` puxando automaticamente o filtro de data `--from` e `--to` dos últimos 7 dias.

### 4. Cron Task Automática
Agendarei um Timer (usando o sistema `/schedule` interno) com a expressão Cron: `0 16 * * 5` (Toda Sexta às 16:00). Quando o relógio bater, o sistema se acorda sozinho, suga o Chatwoot, audita os áudios, compila tudo e joga os relatórios bonitos na sua Área de Trabalho sem você nem abrir a boca.

## Verification Plan
Se você der o `Proceed` e autorizar o plano, eu criarei os códigos da Skill e refatorarei o motor do LLM e do HTML. Logo em seguida, ligarei o CronJob e ele ficará engatilhado na memória.
