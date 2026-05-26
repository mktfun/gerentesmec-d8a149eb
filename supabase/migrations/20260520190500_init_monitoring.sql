CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. units
CREATE TABLE IF NOT EXISTS public.units (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  google_place_id text,
  created_at timestamptz DEFAULT now()
);

-- 2. managers
CREATE TABLE IF NOT EXISTS public.managers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  chatwoot_inbox_id integer,
  created_at timestamptz DEFAULT now()
);

-- 3. whatsapp_cycles
CREATE TABLE IF NOT EXISTS public.whatsapp_cycles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id uuid REFERENCES public.managers(id) ON DELETE CASCADE,
  customer_phone text,
  started_at timestamptz DEFAULT now(),
  max_response_time_breached boolean DEFAULT false,
  chatwoot_conversation_id integer
);

-- 4. cycle_steps
CREATE TABLE IF NOT EXISTS public.cycle_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id uuid REFERENCES public.whatsapp_cycles(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  is_compliant boolean,
  reason_failed text,
  evaluated_at timestamptz DEFAULT now()
);

-- 5. google_reviews_log
CREATE TABLE IF NOT EXISTS public.google_reviews_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  review_count_diff integer,
  logged_date date DEFAULT CURRENT_DATE
);

-- 6. system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_reviews_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all for units" ON public.units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for managers" ON public.managers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for whatsapp_cycles" ON public.whatsapp_cycles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for cycle_steps" ON public.cycle_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for google_reviews_log" ON public.google_reviews_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);
