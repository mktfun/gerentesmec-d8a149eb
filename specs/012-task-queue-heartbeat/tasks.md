# Tasks: 012-task-queue-heartbeat

- [x] **T1** — Migração SQL: adicionar `retry_count` em `ai_task_queue`
- [x] **T2** — `ProviderMonitoring.tsx`: adicionar "Local AI Proxy" no dropdown + branding
- [x] **T3** — `TaskQueuePanel.tsx`: heartbeat automático (GET a cada 30s) + indicador visual
- [x] **T4** — `TaskQueuePanel.tsx`: botão "Reprocessar Falhas" com invoke da edge function
- [x] **T5** — `ai-autonomous-evaluator/index.ts`: incrementar `retry_count` em tasks com erro
- [x] **T6** — Build + validação final
- [x] **T7** — Commit e push
