CREATE OR REPLACE FUNCTION public.save_lead_audit(
  p_lead_id text,
  p_score integer,
  p_closing_summary text,
  p_audit_checklist jsonb,
  p_etapa_scores jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  UPDATE public.leads
  SET 
    score = p_score,
    closing_summary = p_closing_summary,
    audit_checklist = p_audit_checklist,
    etapa_scores = p_etapa_scores
  WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
