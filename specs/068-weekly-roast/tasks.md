# Implementação - Inquisidor Semanal (Spec 068)

- [ ] **1. Banco de Dados (Supabase Migration)**
  - [ ] Criar migration local: `supabase migration new create_weekly_critical_insights`
  - [ ] Escrever DDL para a tabela `weekly_critical_insights` (`id`, `store_id`, `week_start`, `week_end`, `critical_failure_found`, `critical_quote`, `violation_reason`, `improvement_action`, `created_at`).
  - [ ] Configurar Row Level Security (RLS) permitindo `SELECT` para usuários autenticados cujas roles permitam (via `app_metadata.role` e mapeamento de `store_id`).
  - [ ] Configurar `INSERT` exclusivo para a role `service_role`.

- [ ] **2. Backend (Supabase Edge Function & Cron)**
  - [ ] Criar edge function: `supabase functions new ai-weekly-inquisitor`
  - [ ] Implementar integração com a API da OpenAI (ou Gemini) exigindo `response_format` como JSON object (`critical_failure_found`, `critical_quote`, `violation_reason`, `improvement_action`).
  - [ ] Implementar logic fetch no Supabase (bypass RLS via Supabase Admin SDK) lendo `chat_messages` / `leads` da última semana com filtro `status = 'resolved'`.
  - [ ] Inserir payload validado na tabela `weekly_critical_insights`.
  - [ ] Configurar cron trigger na infraestrutura (via `supabase/config.toml` ou console de db puro com `pg_cron`) `0 16 * * 5`.

- [ ] **3. Frontend (UI de Relatórios)**
  - [ ] Localizar ou criar a interface/aba de `Relatórios.tsx`.
  - [ ] Adicionar um hook que faça `SELECT * FROM weekly_critical_insights WHERE store_id = ... ORDER BY created_at DESC LIMIT 1`.
  - [ ] Criar componente visual estrito de Acerto (`Atendimento Ouro`, em verde) se `critical_failure_found === false`.
  - [ ] Criar componente visual de Falha Crítica (`Estudo de Caso`, em vermelho) renderizando aspas duplas, itálico e blockquotes cinzas com o motivo/ação.
  - [ ] Garantir compatibilidade de impressão para PDF (sem quebras de layout) usando Tailwind styles (ex: `print:bg-red-50`).

- [ ] **4. Testes e Validação**
  - [ ] Testar chamadas simuladas locais (`supabase functions serve`).
  - [ ] Validar UI com `npm run build`.
