-- Adicionar campos de tempo de espera nativo ao lead
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS chatwoot_waiting_since timestamptz,
ADD COLUMN IF NOT EXISTS chatwoot_snoozed_until timestamptz;

-- Tabela para guardar cache das métricas oficiais da API de Relatórios do Chatwoot
CREATE TABLE IF NOT EXISTS public.chatwoot_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type varchar(50) NOT NULL, -- 'account', 'inbox', 'agent'
    entity_id varchar(50) NOT NULL, -- ex: account_id ou inbox_id
    metrics jsonb NOT NULL, -- dados que vem direto da API de summary
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir índice único para que possamos fazer upsert
CREATE UNIQUE INDEX IF NOT EXISTS chatwoot_insights_type_entity_idx ON public.chatwoot_insights (type, entity_id);

-- Trigger de updated_at para chatwoot_insights
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_chatwoot_insights_updated ON public.chatwoot_insights;
CREATE TRIGGER on_chatwoot_insights_updated
    BEFORE UPDATE ON public.chatwoot_insights
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.chatwoot_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users"
ON public.chatwoot_insights
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Permissão para functions
CREATE POLICY "Enable all access for service role"
ON public.chatwoot_insights
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
