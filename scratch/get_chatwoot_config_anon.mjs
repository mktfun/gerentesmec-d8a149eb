import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qtjitszradxsmnilnqtj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTIwNjEsImV4cCI6MjA5NDg2ODA2MX0.HKR-XAiX8Xgpw769K0pHWioziSHCGtdL_0NjhjzEqsk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('integration_settings')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar configurações:", error.message);
  } else {
    console.log("Configurações do Chatwoot no Supabase:");
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
