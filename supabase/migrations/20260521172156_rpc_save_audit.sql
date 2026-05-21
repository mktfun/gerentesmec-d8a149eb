CREATE OR REPLACE FUNCTION public.save_lead_audit(
  p_lead_id uuid,
  p_score integer,
  p_closing_summary text,
  p_audit_checklist jsonb
) RETURNS void AS $$
BEGIN
  -- We assume that audit_checklist column already exists on the leads table.
  -- Even if PostgREST cache doesn't know about it yet, Postgres directly executing this function will succeed.
  UPDATE public.leads
  SET 
    score = p_score,
    closing_summary = p_closing_summary,
    audit_checklist = p_audit_checklist
  WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (and anon if needed by the frontend)
GRANT EXECUTE ON FUNCTION public.save_lead_audit TO authenticated, anon;
