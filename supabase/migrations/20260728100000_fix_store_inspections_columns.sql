-- Migration: Fix store_inspections missing columns & PostgREST cache reload
-- Fixes error 42703 (undefined_column: completed_at) in PWA Audit submission and history

-- 1. Ensure all columns exist on store_inspections
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.units(id) ON DELETE CASCADE;
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS auditor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS auditor_name TEXT;
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS device_info TEXT;
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'synced';
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS score NUMERIC;
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE public.store_inspections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Backfill null dates and store_id/unit_id mappings
UPDATE public.store_inspections SET completed_at = created_at WHERE completed_at IS NULL;
UPDATE public.store_inspections SET started_at = created_at WHERE started_at IS NULL;
UPDATE public.store_inspections SET store_id = unit_id WHERE store_id IS NULL AND unit_id IS NOT NULL;
UPDATE public.store_inspections SET unit_id = store_id WHERE unit_id IS NULL AND store_id IS NOT NULL;

-- 3. Ensure inspection_items and inspection_photos columns
ALTER TABLE public.inspection_items ADD COLUMN IF NOT EXISTS category_name TEXT;
ALTER TABLE public.inspection_items ADD COLUMN IF NOT EXISTS is_compliant BOOLEAN;
ALTER TABLE public.inspection_photos ADD COLUMN IF NOT EXISTS inspection_item_id UUID REFERENCES public.inspection_items(id) ON DELETE CASCADE;
ALTER TABLE public.inspection_photos ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.inspection_photos ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE public.inspection_photos ADD COLUMN IF NOT EXISTS long NUMERIC;
ALTER TABLE public.inspection_photos ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Enable RLS and add public access policies
ALTER TABLE public.store_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public Full Access store_inspections" ON public.store_inspections FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public Full Access inspection_items" ON public.inspection_items FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public Full Access inspection_photos" ON public.inspection_photos FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
