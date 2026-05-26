UPDATE public.leads SET funnel_stage = 'lead_new' WHERE funnel_stage = 'new';
ALTER TABLE public.leads ALTER COLUMN funnel_stage SET DEFAULT 'lead_new';
