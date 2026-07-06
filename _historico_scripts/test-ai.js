import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qtjitszradxsmnilnqtj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '...'; 

async function testAI() {
  const res = await fetch(`${supabaseUrl}/functions/v1/ai-autonomous-evaluator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: '8d07df68-dc2c-4746-9361-d36a1f622f18', 
      message_content: `CONVERSA CONSOLIDADA PARA AVALIAÇÃO MANUAL:

[Agente]: 
[Agente]: william seu reservatorio da muito ruim
[Agente]: posso substituir
[Agente]: ae fica uma revisão bem completa
[Agente]: outra seu filtro de ar não deixa de troca não ok esta contaminado
[Agente]: como estamos fazendo o arrefecimento
[Contato]: Não e só sujeira? Limpeza não resolveria?
[Agente]: ele tem desgaste
[Agente]: tampa
`,
      message_id: 'test'
    })
  });
  console.log(await res.text());
}
testAI();
