---
name: auditor-autonomo
description: Dispara e orquestra a auditoria profunda nas conversas do Chatwoot usando o super-prompt local, gerando resumos de desempenho e falhas dos gerentes.
---

# Auditor Autônomo Tork / ChatBee

Esta skill serve para ser engatilhada manualmente pelo Agente Master sempre que o Diretor/Usuário quiser acionar o Pipeline de Auditoria fora do cron-job oficial.

## Gatilhos de Uso
- Quando o usuário disser: "Rode a auditoria", "Gere o relatório dessa semana", ou "Inspecione as conversas e pontuações".

## Procedimento da Skill

1. **Definição de Parâmetros**: Pergunte silenciosamente ou deduza o período (`--from` e `--to`). Se o usuário apenas disser "Audite essa semana", calcule a data atual e a data de 7 dias atrás.
2. **Ativação da Pipeline Mestre**: Use a ferramenta `run_command` para executar:
   ```bash
   node run_pipeline.mjs --from=YYYY-MM-DD --to=YYYY-MM-DD --name="Auditoria_Solicitada_IA"
   ```
3. **Pós-Ativação**: Não tente ler os JSONs resultantes a não ser que o usuário exija. Apenas informe ao usuário que a pipeline está sendo processada no background (e o Whisper transcreverá os áudios) e que a pasta final `Auditorias_Rede` vai pousar na Área de Trabalho com os PDFs/HTMLs lindamente gerados exibindo onde o gerente vacilou e o que houve na conversa.
