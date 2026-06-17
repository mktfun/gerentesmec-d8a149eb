import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
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
    throw err;
  }
}

const FUNNEL_RANK = {
  'parking_lot': 0,
  'lead_new': 1,
  'negotiation': 2,
  'quote': 3,
  'closed_won': 4,
  'closed_lost': 4
};

async function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    const cli = spawn('gemini', ['-o', 'json', '-y'], { shell: true });
    let stdout = '';
    let stderr = '';

    cli.stdin.write(prompt);
    cli.stdin.end();

    cli.stdout.on('data', (data) => { stdout += data; });
    cli.stderr.on('data', (data) => { stderr += data; });

    cli.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Gemini CLI exited with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

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
      let msgDesc = `ID: ${m.id} | [${time}] ${m.sender_type}: ${m.content || '[Sem texto]'}`;
      if (m.media_type) {
        msgDesc += ` [MÍDIA: ${m.media_type}]`;
      }
      return msgDesc;
    }).join('\n');

    // 4. Construct Prompt
    const superPrompt = `
Você é o Agente Auditor Final Autônomo. Sua tarefa é auditar a conversa abaixo, preencher o checklist de performance do gerente e gerar insights individuais para as mensagens ("Notinhas").

CONVERSA:
${chatHistory}

DADOS ATUAIS DO LEAD:
Nome: ${leadData.customer_name || 'Desconhecido'}
Veículo: ${leadData.customer_vehicle || 'Não informado'}
Estágio Atual: ${leadData.funnel_stage}

TAREFA 1: AVALIAÇÃO GLOBAL (Checklist)
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

TAREFA 2: NOTINHAS E RESUMOS DE MÍDIA
Para cada mensagem ID acima, se for relevante, gere:
- ai_insight: Insight de vendas ou observação de comportamento (ex: "Ancorou preço", "Objeção financeira forte").
- ai_summary: Se houver MÍDIA (audio/video/image), resuma o conteúdo baseado no contexto da conversa.

REGRAS DE CONFIANÇA ZERO (ZERO TRUST):
- PROIBIDO INFERIR: Só marque 'true' no checklist se houver PROVA EXPLÍCITA no texto da conversa. O que não está no texto, não aconteceu.
- MÍNGUA DE CONTEXTO: Se a conversa for muito curta ou apenas um pós-venda (ex: "como ficou o carro?"), e não registrar as etapas comerciais, defina o funnel_stage OBRIGATORIAMENTE como 'parking_lot'.
- Quando o funnel_stage for 'parking_lot', use o campo 'closing_summary' para gerar até 2 perguntas curtas e diretas que o auditor humano deve fazer ao mecânico para descobrir o que aconteceu fora do WhatsApp (ex: "Foi feito diagnóstico presencial? Qual o valor aprovado?").
- AVALIAÇÃO SOMENTE NO FECHAMENTO: Você está ESTRITAMENTE PROIBIDO de preencher o `audit_checklist` ou dar `score` se o estágio deduzido não for `closed_won` ou `closed_lost`. Enquanto o lead estiver rolando (em `lead_new`, `negotiation`, `quote` ou `parking_lot`), você DEVE retornar `audit_checklist: {}` e `score: null`. Nessas etapas, seu trabalho é APENAS mover o funil e gerar as notinhas (`message_insights`).

REGRAS DE FUNIL:
- 'closed_won': Aprovação explícita ("Pode fazer") após orçamento (2e).
- 'closed_lost': Recusa ou parada definitiva após preço.
- 'quote': Envio de valores ou PDF/link de orçamento.
- 'negotiation': Em andamento, sem orçamento final.
- 'lead_new': Contato inicial.
- 'parking_lot': Aguardando contexto do gerente (falta histórico no WhatsApp).

IMPORTANTE: NUNCA sugira um estágio inferior ao atual (${leadData.funnel_stage}), EXCETO se for 'parking_lot'.

RETORNE APENAS JSON:
{
  "reasoning": "Breve explicação",
  "audit_checklist": { "1a": true, "1b": false, "2a": true, "2b": false, "2c": true, "2d": false, "2e": true, "3a": false, "3b": false, "3c": true, "4a": false, "4b": false },
  "score": 85,
  "funnel_stage": "quote",
  "closing_summary": "Parecer ou perguntas pro mecânico (se for parking_lot)",
  "customer_vehicle": "Modelo",
  "ticket_value": 0,
  "message_insights": [
    { "id": "UUID_DA_MENSAGEM", "ai_insight": "Insight aqui", "ai_summary": "Resumo se mídia" }
  ]
}
`;

    // 5. Call Gemini CLI
    const startTime = performance.now();
    let cliOutput;
    try {
      cliOutput = await callGemini(superPrompt);
    } catch (e) {
      throw new Error(`Gemini CLI call failed: ${e.message}`);
    }
    
    if (!cliOutput) throw new Error("Gemini CLI returned empty output");

    let parsed;
    try {
      const outer = JSON.parse(cliOutput);
      parsed = extractJSON(outer.response || cliOutput);
    } catch (e) {
      parsed = extractJSON(cliOutput);
    }

    const latencyMs = Math.round(performance.now() - startTime);

    // 6. Persistence Logic - Leads
    let newStage = parsed.funnel_stage || leadData.funnel_stage;
    if (newStage !== 'parking_lot' && FUNNEL_RANK[newStage] < FUNNEL_RANK[leadData.funnel_stage]) {
      newStage = leadData.funnel_stage;
    }

    const updatePayload = {
      audit_checklist: { ...(leadData.audit_checklist || {}), ...parsed.audit_checklist },
      score: parsed.score !== undefined ? parsed.score : leadData.score,
      funnel_stage: newStage,
      customer_vehicle: parsed.customer_vehicle || leadData.customer_vehicle,
      ticket_value: parsed.ticket_value || leadData.ticket_value
    };
    
    if (parsed.closing_summary) {
      updatePayload.closing_summary = parsed.closing_summary;
    }

    const { error: updErr } = await supabase.from('leads').update(updatePayload).eq('id', task.lead_id);
    if (updErr) throw new Error(`Lead update failed: ${updErr.message}`);

    // 7. Persistence Logic - Chat Messages (Notinhas)
    if (parsed.message_insights && Array.isArray(parsed.message_insights)) {
      for (const insight of parsed.message_insights) {
        if (!insight.id) continue;
        await supabase.from('chat_messages').update({
          ai_insight: insight.ai_insight || null,
          ai_summary: insight.ai_summary || null,
          ai_audited: true
        }).eq('id', insight.id);
      }
    }

    // 8. Mark Task as Success
    await supabase.from('ai_task_queue').update({
      status: 'success',
      latency_ms: latencyMs,
      completed_at: new Date().toISOString(),
      error_message: null
    }).eq('id', task.id);

    console.log(`✅ Success Lead ${task.lead_id}: Score ${parsed.score}, Stage ${newStage}, Insights: ${parsed.message_insights?.length || 0}`);

  } catch (err) {
    console.error(`❌ Task ${task.id} Failed: ${err.message}`);
    await supabase.from('ai_task_queue').update({
      status: 'error',
      error_message: err.message,
      completed_at: new Date().toISOString()
    }).eq('id', task.id);
  }
}

const CONCURRENCY_LIMIT = 10;

async function runAuditor() {
  console.log("=== Autonomous Auditor V2 Started (Async) ===");
  
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
        process.stdout.write("."); // Silent pulse
        await new Promise(r => setTimeout(r, 10000));
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
      continue;
    }

    console.log(`\nFound ${tasks.length} tasks to process.`);

    for (const task of tasks) {
      activeTasks++;
      processTask(task).finally(() => {
        activeTasks--;
      });
    }
  }
}

runAuditor();
