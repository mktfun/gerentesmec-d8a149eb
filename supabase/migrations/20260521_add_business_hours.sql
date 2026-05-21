ALTER TABLE public.integration_settings 
ADD COLUMN IF NOT EXISTS business_hours jsonb 
DEFAULT '{"days":[1,2,3,4,5],"start":"08:00","end":"18:00","timezone":"America/Sao_Paulo"}'::jsonb;

UPDATE public.integration_settings 
SET business_hours = '{"days":[1,2,3,4,5],"start":"08:00","end":"18:00","timezone":"America/Sao_Paulo"}'::jsonb 
WHERE business_hours IS NULL;
