import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Deleting messages...');
  const { error: msgErr } = await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Messages deleted:', msgErr || 'Success');

  console.log('Deleting leads...');
  const { error: leadsErr } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Leads deleted:', leadsErr || 'Success');
}

run();
