# Features Mapeadas (GerentesMec)

## Auditoria (PWA Antifraude)
- Componente `AuditoriaApp` (`/auditoria`): Stepper direcional para inspeção de lojas offline-first.
- Componente `AuditItem`: Controla as evidências e validação por quantidade mínima de fotos.
- Componente `CameraCapture`: Bloqueia galeria e exige foto nativa com GPS.
- Hook `useAuditStorage`: Grava drafts no IndexedDB (localforage) antes do upload final para garantir integridade.
- Tabela Supabase: `store_inspections` (com `raw_payload`), `inspection_items`, `inspection_photos`.

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
