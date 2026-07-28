# Proposal: Correção de Schema e Colunas em `store_inspections` (072-fix-store-inspections-schema)

## Problema
Ao tentar finalizar ou consultar uma auditoria no PWA (`/auditoria` e `/historico-auditorias`), a aplicação gera o erro Postgres **`42703 (undefined_column)`: `column store_inspections.completed_at does not exist`**. A tabela `store_inspections` na nuvem Supabase está sem as colunas temporais e de metadados (`completed_at`, `started_at`, `store_id`, `device_info`, `status`, `auditor_user_id`), impedindo a gravação e a listagem de inspeções.

## Solução Proposta
1. Executar DDL DML no banco de dados Cloud para adicionar todas as colunas necessárias na tabela `store_inspections` (`completed_at`, `started_at`, `store_id`, `device_info`, `status`, `auditor_user_id`, `raw_payload`, `score`, `updated_at`).
2. Adicionar retrocompatibilidade de nomes de colunas (`store_id` e `unit_id`) permitindo consultas via `store_id` ou `unit_id`.
3. Garantir a existência e compatibilidade das tabelas filhas `inspection_items` e `inspection_photos` com RLS liberado para gravação e leitura.
4. Testar o fluxo completo de sincronização de inspeção no PWA.

## Contratos de Dados
- **Tabela `store_inspections`**:
  - `id`: `uuid` (PRIMARY KEY)
  - `store_id`: `uuid` / `text` (REFERENCES `public.units(id)`)
  - `unit_id`: `uuid` (REFERENCES `public.units(id)`)
  - `auditor_user_id`: `uuid` (REFERENCES `auth.users(id)`)
  - `auditor_name`: `text`
  - `started_at`: `timestamptz` (DEFAULT `now()`)
  - `completed_at`: `timestamptz` (DEFAULT `now()`)
  - `device_info`: `text`
  - `status`: `text` (DEFAULT `'synced'`)
  - `score`: `numeric`
  - `raw_payload`: `jsonb`
  - `created_at`: `timestamptz` (DEFAULT `now()`)
  - `updated_at`: `timestamptz` (DEFAULT `now()`)

- **Políticas RLS**:
  - `ENABLE ROW LEVEL SECURITY` em `store_inspections`, `inspection_items`, `inspection_photos`.
  - Políticas de `SELECT`, `INSERT`, `UPDATE` abertas para usuários autenticados e anônimos (público).

## API / Interface
- `supabase.from('store_inspections').select('id, store_id, completed_at, raw_payload')`
- `supabase.from('store_inspections').insert(...)`

## Features Existentes Impactadas
- `AuditoriaApp` (`/auditoria`): Listagem das últimas 3 vistorias concluídas.
- `AuditoriaExecution` (`/auditoria/execucao`): Sincronização do payload final da inspeção.
- `AuditHistory` (`/historico-auditorias`): Filtros por data (`completed_at`) e loja (`store_id`).

## Risco Principal
- Incompatibilidade de tipo em `store_id` / `unit_id` caso alguma FK existente estivesse travando como text.
- **Mitigação**: Executar `ALTER TABLE` com `ADD COLUMN IF NOT EXISTS` garantindo flexibilidade e compatibilidade de tipos.
