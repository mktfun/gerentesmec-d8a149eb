# Tasks: Horário de Atendimento + TMR Real

- [ ] 1. **Adicionar coluna `business_hours` (JSONB) em `integration_settings`**
  - Rodar SQL via Supabase MCP: `ALTER TABLE integration_settings ADD COLUMN IF NOT EXISTS business_hours jsonb;`
  - Valor padrão: `'{"days":[1,2,3,4,5],"start":"08:00","end":"18:00","timezone":"America/Sao_Paulo"}'`

- [ ] 2. **Criar `src/utils/businessHours.ts`**
  - Tipo `BusinessHoursConfig { days: number[], start: string, end: string, timezone?: string }`
  - Função `getWorkMinutes(from: Date, to: Date, config: BusinessHoursConfig): number`
    - Itera minuto a minuto (ou por intervalos) entre `from` e `to`
    - Conta apenas minutos que caem em dias/horários de atendimento
  - Função `isInsideBusinessHours(date: Date, config: BusinessHoursConfig): boolean`
  - Função `nextBusinessMinute(date: Date, config: BusinessHoursConfig): Date`
    - Retorna o próximo momento dentro do expediente

- [ ] 3. **Atualizar `src/utils/metrics.ts`**
  - `calculateTmr(leadsList, businessHours?)` — se config presente, usa `getWorkMinutes()`
  - `calculateDangerLeads(leadsList, businessHours?)` — aplica mesma lógica no wait
  - SLA de perigo agora é 20min de expediente, não 20min de relógio

- [ ] 4. **Atualizar `AppDataContext.tsx`**
  - Ler coluna `business_hours` da tabela `integration_settings`
  - Expor `businessHours: BusinessHoursConfig | null` no contexto
  - Atualizar `updateIntegrationSettings` para incluir `business_hours`

- [ ] 5. **Adicionar UI de Horário de Atendimento em `Config.tsx`**
  - Nova seção "⏰ Horário de Atendimento" acima da seção de IA
  - Pills dos dias da semana (Dom–Sáb) com toggle ativo/inativo
  - Dois inputs `time` (Início / Fim) com estilo do design system
  - Estado local: `businessDays`, `startTime`, `endTime`
  - Inicializar do contexto `businessHours`
  - Salvar junto ao botão "Salvar Configurações de API" ou botão próprio na seção

- [ ] 6. **Propagar `businessHours` nos componentes que chamam `calculateTmr`**
  - `src/pages/Index.tsx` — `calculateTmr(todayLeads, businessHours)`
  - `src/pages/Relatorios.tsx` — `calculateTmr(currentLeads, businessHours)`
  - `src/components/Dashboard/TvDashboard.tsx` — `getUnitMetrics()` com businessHours
  - `src/components/Dashboard/LeadCard.tsx` (se existir) — wait time display

- [ ] 7. **Atualizar `chatwoot-webhook` Edge Function** (opcional/future)
  - `wait_time_minutes` salvo no lead pode usar a mesma lógica se necessário

- [ ] 8. **Commit e push**
