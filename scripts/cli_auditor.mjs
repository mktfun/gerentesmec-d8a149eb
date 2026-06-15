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
    console.error("Falha ao extrair JSON:", text);
    throw err;
  }
}

async function runAudit() {
  console.log("Iniciando auditoria via Gemini CLI...");
  
  while (true) {
    try {
      // Puxar tarefas da fila com erro ou pendentes
      const { data: tasks, error: qErr } = await supabase
        .from('ai_task_queue')
        .select('*')
        .in('status', ['pending', 'error'])
        .order('created_at', { ascending: true })
        .limit(1);

      if (qErr) {
        console.error("Erro ao ler fila:", qErr);
        await new Promise(r => setTimeout(r, 10000));
        continue;
      }

      if (!tasks || tasks.length === 0) {
        // Nada na fila
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      const task = tasks[0];
      console.log(`\nProcessando Task: ${task.id} (Lead: ${task.lead_id})`);

      // Marcar como em processamento
      await supabase.from('ai_task_queue').update({ status: 'processing', started_at: new Date().toISOString() }).eq('id', task.id);

      // Buscar o lead e as mensagens
      const { data: lead } = await supabase.from('leads').select('*').eq('id', task.id).single();
      // O task na verdade tem lead_id
      const { data: leadData } = await supabase.from('leads').select('*').eq('id', task.lead_id).single();
      
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('lead_id', task.lead_id)
        .order('created_at', { ascending: true });

      if (!leadData || !messages) {
         throw new Error("Lead ou mensagens não encontradas");
      }

      // Montar o histórico formatado
      let chatHistory = messages.map(m => `[${new Date(m.created_at).toLocaleTimeString()}] ${m.sender_type}: ${m.content}`).join('\n');

      const superPrompt = `Você é um auditor autônomo. Analise a seguinte conversa e extraia os dados estritamente no formato JSON abaixo.
      
      CONVERSA:
      ${chatHistory}

      DADOS DO LEAD ATUAL:
      Funnel Stage: ${leadData.funnel_stage}

      REGRAS:
      1. audit_checklist: Objeto com as chaves 1a, 1b, 2a, 2b, 2c, 2d, 2e, 3a, 3b, 3c, 4a, 4b. Marque true se ocorreu, false se não.
      2. score: Calcule de 0 a 100 baseado em quantos itens do checklist foram cumpridos (apenas se finalizado).
      3. funnel_stage: Sugira o novo estágio do funil (lead_new, quote, negotiation, closed_won, closed_lost). NUNCA regrida o funil.
      4. message_insight: Um breve insight sobre a conversa.

      RETORNE APENAS JSON VÁLIDO.
      {
        "audit_checklist": { "1a": true, "1b": false },
        "score": 85,
        "funnel_stage": "negotiation",
        "message_insight": "O cliente demonstrou interesse, aguardando orçamento."
      }`;

      console.log("Enviando prompt para Gemini CLI via stdin...");
      const startTime = performance.now();
      
      const cliProcess = spawnSync('gemini', ['-o', 'json', '-y'], { 
        input: superPrompt,
        encoding: 'utf8', 
        shell: true
      });
      
      if (cliProcess.error) {
        throw new Error("Failed to execute Gemini CLI: " + cliProcess.error.message);
      }
      
      const cliOutput = cliProcess.stdout;
      const cliError = cliProcess.stderr;
      
      if (!cliOutput) {
         throw new Error("Gemini CLI returned no output: " + cliError);
      }
      
      const latencyMs = Math.round(performance.now() - startTime);
      
      // O output do CLI em modo JSON pode precisar de extração do conteúdo real
      let parsedResponse;
      try {
        const cliJson = JSON.parse(cliOutput);
        const llmOutput = cliJson.response || cliOutput;
        parsedResponse = extractJSON(llmOutput);
      } catch (e) {
        parsedResponse = extractJSON(cliOutput);
      }

      console.log("Resposta extraída com sucesso:", parsedResponse);

      // Atualizar o Lead
      const updatePayload = {
        audit_checklist: { ...(leadData.audit_checklist || {}), ...parsedResponse.audit_checklist },
        score: parsedResponse.score || leadData.score,
        funnel_stage: parsedResponse.funnel_stage || leadData.funnel_stage
      };

      await supabase.from('leads').update(updatePayload).eq('id', task.lead_id);
      
      // Atualizar as mensagens
      await supabase.from('chat_messages').update({ ai_audited: true }).eq('lead_id', task.lead_id);

      // Sucesso na fila
      await supabase.from('ai_task_queue').update({
        status: 'success',
        provider: 'gemini-cli',
        model: 'gemini-cli',
        latency_ms: latencyMs,
        completed_at: new Date().toISOString()
      }).eq('id', task.id);

      console.log("Auditoria concluída e banco atualizado!");

    } catch (err) {
      console.error("Erro no loop:", err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

runAudit();
