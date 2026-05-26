CREATE TABLE IF NOT EXISTS units (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  chatwoot_inbox_id integer,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS managers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  funnel_stage text NOT NULL,
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES managers(id) ON DELETE SET NULL,
  score integer,
  sla_status text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON units FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON managers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON leads FOR ALL TO authenticated USING (true);
