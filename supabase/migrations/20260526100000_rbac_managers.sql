-- Criar tabela de perfis para RBAC
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Profiles are viewable by owner" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Adicionar auth_user_id na tabela managers
ALTER TABLE public.managers 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Trigger para criar perfil automaticamente quando um usuário for criado no auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (new.id, new.email, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a trigger exista (removendo e recriando para evitar erro se já existir algo parecido)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir os usuários que já existem (Backfill)
INSERT INTO public.profiles (id, email, is_admin)
SELECT id, email, false FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Definir o email mktfunil1@gmail.com como administrador
UPDATE public.profiles SET is_admin = true WHERE email = 'mktfunil1@gmail.com';

-- Políticas de RLS para as outras tabelas baseadas em Admin ou Unit
-- Função auxiliar para checar se é admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para pegar a unit_id do usuário logado (se for gerente)
CREATE OR REPLACE FUNCTION auth.my_unit_id()
RETURNS UUID AS $$
DECLARE
  v_unit_id UUID;
BEGIN
  SELECT unit_id INTO v_unit_id FROM public.managers WHERE auth_user_id = auth.uid() LIMIT 1;
  RETURN v_unit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar RLS da tabela leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leads select policy" ON public.leads;
CREATE POLICY "Leads select policy" ON public.leads
  FOR SELECT USING (
    auth.is_admin() OR unit_id = auth.my_unit_id()
  );

-- Atualizar RLS da tabela units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Units select policy" ON public.units;
CREATE POLICY "Units select policy" ON public.units
  FOR SELECT USING (
    auth.is_admin() OR id = auth.my_unit_id()
  );

-- Atualizar RLS da tabela messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages select policy" ON public.chat_messages;
CREATE POLICY "Messages select policy" ON public.chat_messages
  FOR SELECT USING (
    auth.is_admin() OR lead_id IN (SELECT id FROM public.leads WHERE unit_id = auth.my_unit_id())
  );

-- Configurações para insert/update (Opcionais, por enquanto deixamos o backend service role ou admin cuidar)
-- Se precisar que gerentes escrevam/atualizem algo (ex: notes no futuro), as políticas de UPDATE seguirão a mesma lógica.
