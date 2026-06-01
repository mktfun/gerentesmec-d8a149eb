# Research: 012-task-queue-heartbeat

## Contexto do Projeto

A plataforma **GerentesMec** é um CRM voltado para oficinas mecânicas. Possui um sistema de IA Autônoma (`ai-autonomous-evaluator`) que classifica cada mensagem de conversa recebida via Chatwoot. O sistema já suporta múltiplos provedores LLM (Google AI Studio, OpenAI, Anthropic, OpenRouter, NVIDIA NIM, Google Vertex AI) e, mais recentemente, o **Local AI Proxy (CLI Tunnel)** que roteia chamadas para a máquina local do usuário via Cloudflare Tunnel.

## Infraestrutura Existente

### Tabela `ai_task_queue` (já existe)
- **Migration:** `20260529133020_be13d591-8544-4217-9f2e-56ffa7d23efa.sql`
- **Campos:** `id`, `lead_id`, `message_id`, `content_preview`, `sender_type`, `status` (pending/running/success/error/ignored), `provider`, `model`, `latency_ms`, `tokens_used`, `error_message`, `created_at`, `started_at`, `completed_at`
- **Realtime:** Habilitado via `REPLICA IDENTITY FULL` e publicação `supabase_realtime`
- **RLS:** Aberta (policy `USING (true)`)

### Componente `TaskQueuePanel.tsx` (já existe)
- **Localização:** `src/components/Config/TaskQueuePanel.tsx`
- Renderiza a fila em tempo real com Realtime do Supabase
- Tem contadores (Pendentes, Rodando, ✓ OK, ✗ Erro)
- Tem lógica de **heartbeat** visual: Verde (Vivo), Amarelo (Travado), Cinza (Ocioso)
- Importado e renderizado dentro de `AiRouterConfig.tsx` na aba de telemetria

### Tabela `llm_usage_logs` (já existe)
- **Migration:** `20260526181412_llm_usage_logs.sql` + `20260528120000_llm_usage_logs_v2.sql`
- **Campos:** `id`, `created_at`, `provider`, `model`, `status` (success/error), `error_message`, `latency_ms`, `tokens_used`, `input_text`, `output_text`, `tokens_limit_remaining`
- Realtime habilitado no `ProviderMonitoring.tsx`

### Componente `ProviderMonitoring.tsx` (já existe)
- **Localização:** `src/components/Config/ProviderMonitoring.tsx`
- Mostra gráficos Recharts de latência, cards de RPM, taxa de sucesso, tokens
- Lista paginada de logs com modal de detalhes (input/output)
- **Problema encontrado:** O filtro de provider no `<select>` NÃO inclui a opção "Local AI Proxy (CLI Tunnel)" — só tem Google, Vertex AI, OpenAI, NVIDIA NIM, OpenRouter

### Edge Function `ai-autonomous-evaluator/index.ts`
- Já insere tarefas em `ai_task_queue` como `pending` ao receber uma mensagem
- Atualiza para `running` quando começa a processar
- Atualiza para `success`/`error` ao finalizar
- Já insere logs em `llm_usage_logs` após cada chamada LLM
- **Problema:** Quando o provider é "Local AI Proxy" e o túnel está offline, a task fica como `error` mas NÃO tem mecanismo de retry automático

## Problemas Identificados pelo Usuário

1. **Logs não aparecem para o Local AI Proxy:** O dropdown do `ProviderMonitoring.tsx` não tem a opção "Local AI Proxy (CLI Tunnel)", impossibilitando filtrar e ver os logs desse provider.

2. **Sem retry/heartbeat automático:** Quando o túnel cai (ou o PC reinicia), todas as tasks futuras dão erro imediato. Não existe mecanismo de:
   - **Heartbeat:** Verificar periodicamente se o provider voltou a responder (200)
   - **Retry automático:** Reprocessar tasks que falharam quando o provider se recuperar
   - **Backpressure:** Segurar a fila enquanto o provider está offline, sem desperdiçar chamadas

3. **Fila visual incompleta:** O `TaskQueuePanel` existe mas não mostra claramente o estado do heartbeat do provider nem tem botão de "Reprocessar tasks com erro"
