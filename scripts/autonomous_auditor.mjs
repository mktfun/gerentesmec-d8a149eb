import { createClient } from '@supabase/supabase-js';
import { spawnSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

function extractJSON(text) {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("No JSON object found");
    const jsonStr = text.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (err) {
    // console.error("Falha ao extrair JSON de:", text);
    throw err;
  }
}

const FUNNEL_RANK = {
  'lead_new': 1,
  'negotiation': 2,
  'quote': 3,
  'closed_won': 4,
  'closed_lost': 4 // Both are final
};

async function processTask(task) {
  console.log(`\n[TASK ${task.id}] Processing Lead: ${task.lead_id}`);
  
  try {
    // 1. Mark as processing
    await supabase.from('ai_task_queue').update({ 
      status: 'processing', 
      started_at: new Date().toISOString() 
    }).eq('id', task.id);

    // 2. Fetch Lead Data
    const { data: leadData, error: leadErr } = await supabase
      .from('leads')
      .select('*')
      .eq('id', task.lead_id)
      .single();

    if (leadErr || !leadData) throw new Error(`Lead not found: ${leadErr?.message}`);

    // 3. Fetch Messages
    const { data: messages, error: msgErr } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('lead_id', task.lead_id)
      .order('created_at', { ascending: true });

    if (msgErr) throw new Error(`Messages fetch error: ${msgErr.message}`);

    const chatHistory = messages.map(m => {
      const time = new Date(m.created_at).toLocaleString();
      return `[${time}] ${m.sender_type}: ${m.content}`;
    }).join('\n');

    // 4. Construct Prompt
    const superPrompt = `
Você é um auditor de qualidade automotiva experiente. Sua tarefa é auditar a conversa abaixo e preencher o checklist de performance do gerente.

CONVERSA:
${chatHistory}

DADOS ATUAIS DO LEAD:
Nome: ${leadData.customer_name || 'Desconhecido'}
Veículo: ${leadData.customer_vehicle || 'Não informado'}
Estágio Atual: ${leadData.funnel_stage}

CRITÉRIOS DE AUDITORIA (CHECKLIST):
1a: Gerente se apresentou e perguntou como pode ajudar?
1b: Solicitou placa do veículo?
2a: Explicou a necessidade do diagnóstico?
2b: Enviou o link/PDF do Checklist de Diagnóstico?
2c: Informou os problemas com clareza?
2d: Enviou vídeo demonstrando o defeito?
2e: Enviou orçamento detalhado com peças e mão de obra?
3a: Respondeu objeções técnicas do cliente?
3b: Ofereceu alternativas de pagamento?
3c: Passou confiança e profissionalismo?
4a: Agradeceu após finalizar atendimento? (Apenas se fechar ou perder)
4b: Enviou link de avaliação do Google? (Apenas se fechar ou perder)

REGRAS DE FUNIL:
- 'closed_won' (Ganho): O cliente aprovou explicitamente (ex: "Pode fazer") APÓS o envio do orçamento (2e).
- 'closed_lost' (Perdido): Cliente recusou o serviço ou parou de responder definitivamente após preço.
- 'quote' (Orçamento Enviado): O gerente enviou valores ou PDF/link de orçamento.
- 'negotiation' (Em Atendimento): Conversa em andamento, sem orçamento final enviado.
- 'lead_new': Apenas o contato inicial.

IMPORTANTE: NUNCA sugira um estágio inferior ao atual (${leadData.funnel_stage}).

RETORNE APENAS JSON:
{
  "reasoning": "Breve explicação da sua decisão",
  "audit_checklist": { "1a": true, "1b": false, "2a": true, "2b": false, "2c": true, "2d": false, "2e": true, "3a": false, "3b": false, "3c": true, "4a": false, "4b": false },
  "score": 85,
  "funnel_stage": "quote",
  "ticket_value": 0,
  "customer_vehicle": "Modelo do Carro"
}
`;

    // 5. Call Gemini CLI
    const startTime = performance.now();
    const cliProcess = spawnSync('gemini', ['-o', 'json', '-y'], { 
      input: superPrompt,
      encoding: 'utf8', 
      shell: true
    });
    
    if (cliProcess.error) throw new Error("Gemini CLI execution error: " + cliProcess.error.message);
    
    const cliOutput = cliProcess.stdout;
    if (!cliOutput) throw new Error("Gemini CLI returned empty output");

    let parsed;
    try {
      const outer = JSON.parse(cliOutput);
      parsed = extractJSON(outer.response || cliOutput);
    } catch (e) {
      parsed = extractJSON(cliOutput);
    }

    const latencyMs = Math.round(performance.now() - startTime);

    // 6. Validation & Persistence Logic
    let newStage = parsed.funnel_stage || leadData.funnel_stage;
    // Prevent regression
    if (FUNNEL_RANK[newStage] < FUNNEL_RANK[leadData.funnel_stage]) {
      newStage = leadData.funnel_stage;
    }

    const updatePayload = {
      audit_checklist: { ...(leadData.audit_checklist || {}), ...parsed.audit_checklist },
      score: parsed.score || leadData.score,
      funnel_stage: newStage,
      customer_vehicle: parsed.customer_vehicle || leadData.customer_vehicle,
      ticket_value: parsed.ticket_value || leadData.ticket_value
    };

    const { error: updErr } = await supabase.from('leads').update(updatePayload).eq('id', task.lead_id);
    if (updErr) throw new Error(`Lead update failed: ${updErr.message}`);

    await supabase.from('ai_task_queue').update({
      status: 'success',
      latency_ms: latencyMs,
      completed_at: new Date().toISOString(),
      error_message: null
    }).eq('id', task.id);

    console.log(`✅ Success: Score ${parsed.score}, Stage ${newStage}`);

  } catch (err) {
    console.error(`❌ Task ${task.id} Failed: ${err.message}`);
    await supabase.from('ai_task_queue').update({
      status: 'error',
      error_message: err.message,
      completed_at: new Date().toISOString()
    }).eq('id', task.id);
  }
}

const CONCURRENCY_LIMIT = 20;

async function runAuditor() {
  console.log("=== Autonomous Auditor Started (Optimized) ===");
  
  let activeTasks = 0;

  while (true) {
    if (activeTasks >= CONCURRENCY_LIMIT) {
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }

    const { data: tasks, error } = await supabase
      .from('ai_task_queue')
      .select('*')
      .in('status', ['pending', 'error'])
      .order('created_at', { ascending: true })
      .limit(CONCURRENCY_LIMIT - activeTasks);

    if (error) {
      console.error("Queue fetch error:", error);
      await new Promise(r => setTimeout(r, 10000));
      continue;
    }

    if (!tasks || tasks.length === 0) {
      if (activeTasks === 0) {
        console.log("Queue empty. Waiting 10s...");
        await new Promise(r => setTimeout(r, 10000));
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
      continue;
    }

    for (const task of tasks) {
      activeTasks++;
      processTask(task).finally(() => {
        activeTasks--;
      });
    }
  }
}

runAuditor();
