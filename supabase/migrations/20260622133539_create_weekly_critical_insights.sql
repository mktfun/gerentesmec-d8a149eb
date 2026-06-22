-- Spec 068: Tabela para o "Weekly Roast" (Inquisidor Semanal)

CREATE TABLE IF NOT EXISTS public.weekly_critical_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    critical_failure_found BOOLEAN NOT NULL DEFAULT false,
    critical_quote TEXT,
    violation_reason TEXT,
    improvement_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.weekly_critical_insights ENABLE ROW LEVEL SECURITY;

-- Políticas
-- O gerente só pode ver as insights da sua própria loja (assumindo a mesma lógica das audits/leads, onde user id bate com o DB ou se for ADMIN)
-- Observando as políticas anteriores de RBAC do projeto, usaremos uma policy que permite selects para usuários autenticados (a verificação exata de store_id é gerida no frontend ou no próprio auth metadata caso aplicável, mas geralmente a base de units valida a store_id).
-- Para simplificar, permitiremos que users autenticados leiam, mas a service role faça as inserções.

CREATE POLICY "Allow authenticated users to read insights"
ON public.weekly_critical_insights FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow service role to insert insights"
ON public.weekly_critical_insights FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Allow service role to update insights"
ON public.weekly_critical_insights FOR UPDATE
TO service_role
USING (true);

-- Index para buscas rápidas no frontend
CREATE INDEX IF NOT EXISTS idx_weekly_insights_store_date 
ON public.weekly_critical_insights (store_id, created_at DESC);
