-- Migration to add Hierarchical AI Architecture
-- 1. Add ai_scratchpad to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS ai_scratchpad TEXT DEFAULT '';

-- 2. Update ai_debounce_cron to trigger the tracker instead of evaluator
-- Drop the existing cron job if it exists (assuming it was named 'debounce_ai_evaluation')
SELECT cron.unschedule('debounce_ai_evaluation');

-- Schedule the new tracker
SELECT cron.schedule(
    'debounce_ai_tracker',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url:=(SELECT value FROM public.app_settings WHERE key = 'edge_function_url') || '/ai-funnel-tracker',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'service_role_key') || '"}',
        body:='{}'
    );
    $$
);

-- 3. Create Trigger to call ai-final-auditor when lead is closed
CREATE OR REPLACE FUNCTION public.trigger_ai_final_auditor()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.funnel_stage = 'closed_won' OR NEW.funnel_stage = 'closed_lost') AND OLD.funnel_stage NOT IN ('closed_won', 'closed_lost') THEN
        PERFORM net.http_post(
            url:=(SELECT value FROM public.app_settings WHERE key = 'edge_function_url') || '/ai-final-auditor',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || (SELECT value FROM public.app_settings WHERE key = 'service_role_key') || '"}',
            body:='{"lead_id": "' || NEW.id || '"}'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS lead_closed_trigger ON public.leads;
CREATE TRIGGER lead_closed_trigger
    AFTER UPDATE OF funnel_stage ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_ai_final_auditor();
