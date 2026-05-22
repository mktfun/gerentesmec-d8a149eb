-- Add audit_checklist_messages column to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS audit_checklist_messages JSONB DEFAULT '{}'::jsonb;
