import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qtjitszradxsmnilnqtj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '...';

async function testDBUpdate() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('leads').update({ score: 99 }).eq('id', '6c6dadc8-b46e-45ff-801e-a12e5c67babe');
  console.log("Error:", error);
}
testDBUpdate();
