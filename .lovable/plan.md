## Diagnóstico

Confirmei no banco: **os logs de SUCESSO existem sim** (284 successes vs 405 errors no total, com sucessos recentes em 28/05 às 13h e centenas em 27/05). O problema é de **visibilidade**:

1. A lista atual mistura tudo, e como há muito mais erro recente (Gemini 1.5 Flash 404 em loop de fallback), os sucessos somem visualmente.
2. Polling fixo de 15s — não dá sensação de "vivo".
3. Não existe nenhuma visualização do que está **chegando / em processamento / aguardando** — só do que já terminou.

Você pediu duas coisas e ambas fazem sentido:
- **A.** Garantir que sucessos apareçam claramente na lista.
- **B.** Uma "fila de tarefas" estilo heartbeat: cada mensagem do Chatwoot vira uma task; ela aparece pulsando enquanto roda; vira ✓ quando dá 200, vira ✗ se falhar; se tudo travar, a fila enche e o problema fica óbvio.

## O que vou construir

### 1. Tabela `ai_task_queue` (nova, via migration)
Uma fila real, desacoplada dos logs:

| coluna | descrição |
|---|---|
| `id` | uuid |
| `lead_id`, `message_id` | referência ao que disparou |
| `content_preview` | primeiros ~120 chars da mensagem (pra você reconhecer) |
| `sender_type` | contact / agent |
| `status` | `pending` → `running` → `success` / `error` / `ignored` |
| `provider`, `model` | preenchido quando começa a chamar a LLM |
| `latency_ms`, `tokens_used`, `error_message` | preenchido no fim |
| `created_at`, `started_at`, `completed_at` | timestamps de cada transição |

Index em `created_at desc` e `status`. Realtime ativado.

### 2. Edge function `ai-autonomous-evaluator`
Adicionar 3 escritas mínimas (sem mudar a lógica de IA):
- No início do `serve`: `INSERT` task com `status='pending'`.
- Antes do `fetch` da LLM: `UPDATE` para `status='running'` + provider/model.
- No `try` final / `catch`: `UPDATE` para `success` ou `error` com latência, tokens e mensagem.
- Filtro determinístico (mensagem muito curta) marca como `ignored` em vez de simplesmente sumir.

Isso não interfere na tabela `llm_usage_logs` (continua igual, para histórico longo).

### 3. UI — novo componente `TaskQueuePanel.tsx` dentro do `AdvancedAiPanel`
Posicionado **acima** do `ProviderMonitoring` atual. Visual estilo "live activity":

- **Heartbeat bar** no topo: dot pulsante verde quando há atividade recente (<30s), âmbar se só `pending`/`running` há mais de 30s (= IA travada), cinza se vazio.
- **Lista compacta** (últimas ~25 tasks, ordem cronológica reversa) com linha por task:
  - Ícone de status animado: `pending` = círculo cinza, `running` = spinner colorido do provider, `success` = check verde com flash, `error` = X vermelho.
  - `content_preview` (truncado) + horário relativo ("há 4s").
  - Latência em ms quando completa.
- **Realtime** via `supabase.channel().on('postgres_changes', { table: 'ai_task_queue' })` — sem polling, atualiza no instante que o status muda.
- **Contadores** no header: `Pendentes: X · Rodando: Y · ✓ últimos 5min: Z · ✗ últimos 5min: W`.

### 4. Ajustes no `ProviderMonitoring` existente
- Trocar polling de 15s por subscription realtime em `llm_usage_logs`.
- Adicionar **toggle "Só sucessos / Só erros / Todos"** ao lado do select de provider — resolve a queixa de "não aparecem os que dão certo".
- Destacar visualmente as linhas SUCESSO com uma barra lateral verde fina (hoje a única diferença é o badge no meio da linha).

## Detalhes técnicos

- Migration cria `ai_task_queue` com RLS aberta (mesmo padrão das outras tabelas do projeto), GRANTs pra `authenticated`, `anon` (SELECT) e `service_role`.
- Realtime habilitado via `ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_task_queue;` e `REPLICA IDENTITY FULL`.
- Edge function: writes da fila envolvidos em try/catch silencioso — falha de log nunca quebra a avaliação real.
- Cleanup: cron simples (opcional, não nesta entrega) para apagar tasks `success`/`ignored` com mais de 24h e manter `error` por 7 dias. Por enquanto sem cron, só um `LIMIT 200` no fetch inicial e realtime daí em diante.
- Branding por provider (cores HSL já definidas em `ProviderMonitoring`) reutilizadas no spinner do `running`.

## Fora de escopo (proponho deixar pra depois)
- Corrigir a torrente de erros `gemini-1.5-flash 404` no fallback — é outro problema (modelo descontinuado na API v1beta). Posso atacar em seguida se quiser, mas a fila já vai expor isso claramente.
- Retry automático de tasks `error`.