# Design: Correção de Schema e Colunas em `store_inspections` (072-fix-store-inspections-schema)

## Arquitetura Técnica

```
[PWA AuditoriaApp / AuditHistory]
            │
            ▼ (INSERT / SELECT / ORDER BY completed_at)
[Supabase Cloud PostgreSQL DB]
    └── Tabela: store_inspections
          ├── completed_at (timestamptz)
          ├── started_at (timestamptz)
          ├── store_id (uuid)
          ├── unit_id (uuid)
          ├── status (text)
          ├── device_info (text)
          └── raw_payload (jsonb)
```

## SQL DDL de Atualização do Schema

```sql
-- Adicionar colunas faltantes em store_inspections
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.units(id) ON DELETE CASCADE;
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS auditor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS device_info TEXT;
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'synced';
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS score NUMERIC;
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Atualizar registros legados onde completed_at estava nulo
UPDATE public.store_inspections SET completed_at = created_at WHERE completed_at IS NULL;
UPDATE public.store_inspections SET started_at = created_at WHERE started_at IS NULL;
UPDATE public.store_inspections SET store_id = unit_id WHERE store_id IS NULL AND unit_id IS NOT NULL;
UPDATE public.store_inspections SET unit_id = store_id WHERE unit_id IS NULL AND store_id IS NOT NULL;

-- Notificar PostgREST para recarregar o schema cache
NOTIFY pgrst, 'reload schema';
```

## Componentes & Arquivos Impactados

1. `supabase/migrations/20260728100000_fix_store_inspections_columns.sql`: Nova migration documentando as colunas adicionadas.
2. `specs/072-fix-store-inspections-schema/spec-plan.md`: Tasks físicas de alteração de banco e teste.

## Cenários de Verificação (SCAN → INFER → VERIFY → FIX)

### Cenário 1: Consulta às Últimas Vistorias no Dashboard (`/auditoria`)
- **Estado Inicial**: Usuário abre a página `/auditoria`.
- **Ação**: O componente executa `supabase.from('store_inspections').select('id, store_id, completed_at, raw_payload').order('completed_at')`.
- **Resultado Esperado**: Status HTTP 200/OK, sem o erro `42703 (undefined_column: completed_at)`.

### Cenário 2: Consulta ao Histórico Completo (`/historico-auditorias`)
- **Estado Inicial**: Usuário acessa o histórico de auditorias.
- **Ação**: Executa ordenação e filtro por `completed_at`.
- **Resultado Esperado**: Registros retornados ordenados por data de conclusão.
