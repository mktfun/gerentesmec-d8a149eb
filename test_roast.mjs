import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: settings } = await supabase.from('ai_settings').select('api_key').single();
  const openAiKey = process.env.OPENAI_API_KEY || (settings && settings.api_key);
  if (!openAiKey) {
    console.log('NO_API_KEY');
    return;
  }
  
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  
  // get real chat messages from the last 7 days
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('content, sender_type, created_at, lead_id')
    .gte('created_at', weekStart.toISOString())
    .order('created_at', { ascending: true })
    .limit(300);
    
  if (error) {
    console.error("Error fetching messages:", error);
    return;
  }
    
  if (!messages || messages.length === 0) {
    console.log('NO_MESSAGES_LAST_7_DAYS');
    return;
  }
  
  console.log('Found ' + messages.length + ' messages. Using first 100 for AI...');
  
  const transcript = messages.slice(0, 100).map(m => {
    const sender = m.sender_type === 'user' || m.sender_type === 'bot' ? 'Gerente/Oficina' : 'Cliente';
    return `[${m.created_at}] ${sender}: ${m.content}`;
  }).join('\n');
  
  const SYSTEM_PROMPT = `Você é um Auditor Sênior Implacável de uma rede de oficinas mecânicas. 
Sua missão é analisar essas transcrições de atendimento e encontrar a falha mais crítica e óbvia cometida pelo gerente. 
Procure por: 1) Ignorar o checklist de qualidade obrigatório; 2) Passar orçamento de forma amadora; 3) Tratar o cliente com descaso; 4) Omissão de informações críticas. 

Se você encontrar um erro grave que justifique uma bronca, defina 'critical_failure_found' como true.
Se o atendimento da semana foi excelente ou as conversas não contêm erros grosseiros (A Rota de Fuga), retorne 'critical_failure_found' como false.

Você DEVE retornar a resposta EXATAMENTE no formato JSON:
{
  "critical_failure_found": boolean,
  "critical_quote": "A citação EXATA do gerente ou cliente provando o erro",
  "violation_reason": "Qual regra de excelência no atendimento ou vendas foi quebrada",
  "improvement_action": "O que o gerente deveria ter feito ou falado no lugar"
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analise a transcrição:\n\n${transcript}` }
      ],
      temperature: 0.1
    })
  });
  
  const aiData = await response.json();
  if (aiData.error) {
    console.error("OpenAI Error:", aiData.error);
    return;
  }
  const result = JSON.parse(aiData.choices[0].message.content);
  console.log(JSON.stringify(result, null, 2));
}

run();
