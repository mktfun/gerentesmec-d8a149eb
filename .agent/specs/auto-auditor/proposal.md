# Arquitetura de Módulo: Auditor Autônomo & Scheduled Task

## Objetivo
Automatizar de forma definitiva o ciclo de auditorias e inteligência LLM para a rede, operando em *background* sem intervenção humana, gerando Dossiês analíticos detalhados.

## 1. O Novo Motor de Prompt (LLM)
O robô (`autonomous_auditor_v2.mjs`) será atualizado com uma diretiva muito mais rigorosa focada no erro gerencial.
**Novo JSON de Saída por Conversa:**
- `score` (0 a 10)
- `conversation_summary` (String): Resumo descritivo da negociação e desfecho da OS.
- `manager_failures` (String/Array): Diagnóstico direto de negligências do gerente (Ex: "Esqueceu de oferecer revisão do sistema de arrefecimento após trocar radiador", "Não enviou PDF do orçamento formal", "Deixou cliente 4 horas sem resposta no WhatsApp").
- `unit_insight` (String): Um insight que será agregado ao resumo geral da unidade.

## 2. Nova Skill (`.agent/skills/cron-auditor/SKILL.md`)
Será desenvolvida uma Skill nativa para o Antigravity que intercepta gatilhos de tempo e invoca o pipeline de Node.js que construímos (`run_pipeline.mjs`). A skill terá os poderes de ler a data e processar a execução silenciada no servidor, entregando na Área de Trabalho ao fim.

## 3. Workflow de Setup Agendado
Para a execução "toda sexta-feira às 16:00", usaremos o sistema interno de **Cron Job** (expressão `0 16 * * 5`). Uma vez acionado, este cron dispara o motor e avisa apenas quando a pasta física for enviada ao Desktop com sucesso.

## 4. Evolução do Dossiê Visual (HTML)
O `gerar_relatorio_diretoria.mjs` sofrerá uma breve alteração estética para exibir a nova chave de dados `manager_failures` em vermelho vibrante embaixo de cada card de cliente, para que a diretoria bata o olho e saiba **"O que o gerente vacilou"**.
