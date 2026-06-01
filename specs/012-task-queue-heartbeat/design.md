# Design: 012-task-queue-heartbeat

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────┐
│  Frontend (TaskQueuePanel.tsx)                       │
│  ┌───────────────┐  ┌─────────────────────────────┐ │
│  │ Heartbeat     │  │ Lista de Tasks (Realtime)    │ │
│  │ GET /proxy    │  │ pending → running → success  │ │
│  │ cada 30s      │  │ Botão: Reprocessar Falhas    │ │
│  └───────┬───────┘  └──────────────┬──────────────┘ │
│          │ online?                  │ retry click    │
└──────────┼──────────────────────────┼───────────────┘
           │                          │
           ▼                          ▼
┌──────────────────────┐   ┌───────────────────────────┐
│ ProviderMonitoring   │   │ Edge: ai-autonomous-eval  │
│ + filtro "Local AI"  │   │ Agora com parse resiliente│
│ no dropdown          │   │ + retry_count tracking    │
└──────────────────────┘   └───────────────────────────┘
```

## Mudanças no Banco de Dados (Supabase)

### Migração: `ai_task_queue` — adicionar campo `retry_count`
```sql
ALTER TABLE public.ai_task_queue
ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;
```

Sem novas tabelas. Apenas 1 campo novo.

## Mudanças no Frontend

### 1. `ProviderMonitoring.tsx` — Adicionar filtro "Local AI Proxy"
- Adicionar `<option value="Local AI Proxy (CLI Tunnel)">Local AI Proxy</option>` no `<select>` de filtro de provider (linha ~258)
- Adicionar branding (cor/bg) para o proxy local no `getProviderBranding()`

### 2. `TaskQueuePanel.tsx` — Heartbeat + Botão Retry
- **Heartbeat automático**: A cada 30s, faz `GET` na `api_url` do provider local (lida via `useAppData().aiSettings.api_url`)
- **Status visual**: Indicador "Online" (verde pulsante) / "Offline" (vermelho) / "Ocioso" (cinza)
- **Botão "Reprocessar Falhas"**: Chama a edge function `ai-autonomous-evaluator` para cada task com `status='error'` e `retry_count < 3`
- **Badge de contagem**: Mostra quantas tasks estão aguardando retry

### 3. `AiRouterConfig.tsx` — Nenhuma mudança (já foi feito)

## Mudanças no Backend

### `ai-autonomous-evaluator/index.ts`
- Ao atualizar task como `error`, incrementar `retry_count`
- O JSON parse resiliente já foi implementado no commit anterior

## Estética (UX/UI 2026)
- Heartbeat: Ponto pulsante com `animate-ping` + glassmorphism card
- Botão retry: Estilo primary com ícone `RefreshCw` e micro-animação de spin durante o reprocessamento
- Status badges: Seguir o padrão visual existente do `TaskQueuePanel`
