ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS etapa_scores jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_cross_unit boolean DEFAULT false;

ALTER TABLE public.integration_settings
ADD COLUMN IF NOT EXISTS ignored_labels jsonb DEFAULT '["fornecedor", "dono", "ignorar", "ignore", "equipe", "grupo", "rh", "socios"]'::jsonb;
