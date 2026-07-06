import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('get_tables'); // Talvez não exista essa RPC
  
  if (error) {
    console.log("Erro ao rodar RPC:", error.message);
    // Vamos tentar fazer uma query no schema de tabelas se pudermos
    const { data: tables, error: sqlError } = await supabase
      .from('pg_tables') // Costuma não ser exposta diretamente via PostgREST
      .select('*');
    if (sqlError) {
      console.log("Erro direto pg_tables:", sqlError.message);
      // Fallback: tentar ler algumas tabelas comuns para ver quais existem
      const commonTables = ['leads', 'units', 'managers', 'chat_messages', 'integration_settings', 'notion_agenda'];
      for (const t of commonTables) {
        const { error: tErr } = await supabase.from(t).select('id').limit(1);
        console.log(`Tabela '${t}': ${tErr ? '❌ Sem Acesso (' + tErr.message + ')' : '✅ OK'}`);
      }
    } else {
      console.log("Tabelas:", tables);
    }
  } else {
    console.log("Tabelas via RPC:", data);
  }
}

run();
