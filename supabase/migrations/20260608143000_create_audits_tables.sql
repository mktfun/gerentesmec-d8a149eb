-- Migration: Create Audits Tables & Storage Bucket

-- 1. Create Audits Table
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  auditor_name TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score_percentage INTEGER,
  status TEXT DEFAULT 'in_progress'
);

-- Enable RLS
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users and anon users to insert and read (adjust per real needs)
CREATE POLICY "Enable insert for all users" ON public.audits FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON public.audits FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON public.audits FOR UPDATE USING (true);

-- 2. Create Audit Answers Table
CREATE TABLE IF NOT EXISTS public.audit_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  is_conform BOOLEAN NOT NULL,
  photo_url TEXT NOT NULL,
  observation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_answers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users and anon users to insert and read
CREATE POLICY "Enable insert for all users" ON public.audit_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON public.audit_answers FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON public.audit_answers FOR UPDATE USING (true);

-- 3. Create Storage Bucket for Audit Evidences
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audit_evidences', 'audit_evidences', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'audit_evidences'
CREATE POLICY "Evidences are publicly accessible" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'audit_evidences' );

CREATE POLICY "Anyone can upload evidences" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'audit_evidences' );

CREATE POLICY "Anyone can update evidences" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'audit_evidences' );

CREATE POLICY "Anyone can delete evidences" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'audit_evidences' );
