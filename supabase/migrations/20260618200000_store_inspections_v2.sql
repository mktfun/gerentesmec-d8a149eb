-- Migration: App de Auditoria Anti-Fraude (Spec 052)
-- Tabelas robustas para o novo fluxo All-or-Nothing

-- 1. store_inspections
CREATE TABLE IF NOT EXISTS public.store_inspections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id TEXT REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  auditor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  device_info TEXT,
  status TEXT DEFAULT 'draft',
  raw_payload JSONB
);

ALTER TABLE public.store_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON public.store_inspections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for anon users" ON public.store_inspections FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for anon users" ON public.store_inspections FOR SELECT USING (true);
CREATE POLICY "Enable update for anon users" ON public.store_inspections FOR UPDATE USING (true);

-- 2. inspection_items
CREATE TABLE IF NOT EXISTS public.inspection_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspection_id UUID REFERENCES public.store_inspections(id) ON DELETE CASCADE NOT NULL,
  category_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('conforme', 'não_conforme', 'na')),
  notes TEXT
);

ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON public.inspection_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for anon users" ON public.inspection_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for anon users" ON public.inspection_items FOR SELECT USING (true);
CREATE POLICY "Enable update for anon users" ON public.inspection_items FOR UPDATE USING (true);

-- 3. inspection_photos
CREATE TABLE IF NOT EXISTS public.inspection_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspection_item_id UUID REFERENCES public.inspection_items(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  lat NUMERIC,
  long NUMERIC,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON public.inspection_photos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for anon users" ON public.inspection_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for anon users" ON public.inspection_photos FOR SELECT USING (true);
CREATE POLICY "Enable update for anon users" ON public.inspection_photos FOR UPDATE USING (true);

-- 4. Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audits', 'audits', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Audits are publicly accessible" ON storage.objects FOR SELECT USING ( bucket_id = 'audits' );
CREATE POLICY "Anyone can upload audits" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'audits' );
CREATE POLICY "Anyone can update audits" ON storage.objects FOR UPDATE USING ( bucket_id = 'audits' );
CREATE POLICY "Anyone can delete audits" ON storage.objects FOR DELETE USING ( bucket_id = 'audits' );
