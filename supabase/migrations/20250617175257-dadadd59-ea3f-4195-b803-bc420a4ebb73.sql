
-- Adicionar campos de branding à tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_website TEXT;

-- Criar bucket de storage para PDFs gerados
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-pdfs', 'generated-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Política para o bucket de PDFs
CREATE POLICY "Anyone can view generated PDFs" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'generated-pdfs');

CREATE POLICY "Authenticated users can upload PDFs" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'generated-pdfs' AND auth.role() = 'authenticated');

-- Criar bucket para logos das empresas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para o bucket de logos
CREATE POLICY "Anyone can view company logos" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'company-logos');

CREATE POLICY "Users can upload their company logo" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their company logo" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');
