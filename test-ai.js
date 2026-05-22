import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qtjitszradxsmnilnqtj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '...'; // I will use the anon key from the project if possible, or we can just bypass the JWT since it's deployed with --no-verify-jwt.

async function testAI() {
  const res = await fetch(`${supabaseUrl}/functions/v1/ai-autonomous-evaluator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: 'b7c8a1db-4bb3-406b-bb55-38305e7193a8', // random uuid
      message_content: 'CONVERSA CONSOLIDADA:\n[Contato]: Boa tarde\n[Agente]: Opa boa tarde td bem?',
      message_id: 'test'
    })
  });
  console.log(await res.text());
}
testAI();
