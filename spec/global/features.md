# Features Mapeadas (GerentesMec)

## Auditoria (PWA Antifraude)
- Componente `AuditoriaApp` (`/auditoria`): Stepper direcional para inspeção de lojas offline-first.
- Componente `AuditItem`: Controla as evidências e validação por quantidade mínima de fotos.
- Componente `CameraCapture`: Bloqueia galeria e exige foto nativa com GPS.
- Hook `useAuditStorage`: Grava drafts no IndexedDB (localforage) antes do upload final para garantir integridade.
- Tabela Supabase: `store_inspections` (com `completed_at`, `started_at`, `store_id`, `unit_id`, `status`, `device_info`, `score`, `raw_payload`), `inspection_items`, `inspection_photos`.

## Dashboards de Vistorias
- Tela `AuditHistory` (`/historico-auditorias`): Lista vistorias finalizadas.

## CRM e Kanban (IA)
- Tela `Crm`: Kanban board integrado com LLM.
- Componentes: `KanbanCard`, `KanbanView`.
- Script: `autonomous_auditor_v2.mjs` (Zero Trust, Parking Lot para controle estrito de estágios).

## Integração Tempario (n8n + Playwright)
- Worker Node.js: Microserviço Playwright executado isoladamente (sem dependências de UI React).
- Integração n8n: Fluxo orquestrador e roteamento de requisições do WhatsApp.
- Persistência de Sessão: Reutilização de `storageState.json` para evitar relogin constante.
- ServiceMatcher: Busca híbrida e fuzzy (normalização, sinônimos, trigramas, Levenshtein) para encontrar serviços aproximados e solicitar confirmação do usuário quando necessário.

## TV Dashboards (Immersive Mode)
- `ManagerDashboard` (`/tv/operacional`): TV Operacional (Radar por Unidade e Slides Globais).
- `ExecutiveDashboard` (`/tv/executivo`): TV Executiva (Radar Limpo, Ranking Semáforo e Operações).
- Roteamento imersivo (sidebar e header auto-ocultados via hooks de rota).

## Supabase Cloud Infrastructure (Ref: ijomsruroyeaapurnbqu)
- **Instância Cloud**: `https://ijomsruroyeaapurnbqu.supabase.co`
- **Extensões Ativas**: `uuid-ossp`, `pgvector`
- **Storage Buckets**: `audits` (público), `inspections` (público)
- **Tabelas do Schema**: `units`, `store_inspections`, `inspection_items`, `inspection_photos`, `audits`, `weekly_critical_insights`, `ai_settings`, `system_configs`, `leads`, `profiles`, `user_roles`, `business_hours`
- **Cliente**: `src/integrations/supabase/client.ts`

  
- **Regra de Neg�cio (Auditorias):** Score � calculado h�brido (coluna \score\ nativa para IA, ou fallback \aw_payload.categories\ para manuais via PWA). Filtro de UI abrange status \synced\ e \completed\. 
