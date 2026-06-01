-- Add audit_justifications and media_summaries columns to leads table

ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS audit_justifications JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS media_summaries JSONB DEFAULT '{}';

-- Create an index to quickly filter leads with specific justifications (optional but useful)
-- CREATE INDEX IF NOT EXISTS idx_leads_audit_justifications ON leads USING GIN (audit_justifications);
