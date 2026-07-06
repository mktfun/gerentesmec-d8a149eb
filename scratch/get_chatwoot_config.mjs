import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

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
