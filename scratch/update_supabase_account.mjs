import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qtjitszradxsmnilnqtj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTIwNjEsImV4cCI6MjA5NDg2ODA2MX0.HKR-XAiX8Xgpw769K0pHWioziSHCGtdL_0NjhjzEqsk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: current } = await supabase
    .from('integration_settings')
    .select('id, chatwoot_account_id')
    .maybeSingle();

  if (current) {
    console.log("Valores atuais:", current);
    const { error } = await supabase
      .from('integration_settings')
      .update({ chatwoot_account_id: 6 })
      .eq('id', current.id);

    if (error) {
      console.error("Erro ao atualizar:", error.message);
    } else {
      console.log("Sucesso! chatwoot_account_id atualizado para 6.");
    }
  } else {
    console.error("Não encontrou registro em integration_settings.");
  }
}

run();
