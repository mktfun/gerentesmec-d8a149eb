import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log("=== INICIANDO SINCRONIZAÇÃO HISTÓRICA (ZERO CUSTO) ===");

  // 1. Fetch AI Settings
  const { data: aiSettings, error: errSettings } = await supabase.from('ai_settings').select('*').single();
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error("ERRO: GEMINI_API_KEY não encontrada no arquivo .env ou nas variáveis de ambiente!");
    console.error("Para usar a versão 100% gratuita, gere uma chave em https://aistudio.google.com/ e adicione GEMINI_API_KEY=sua_chave no .env");
    process.exit(1);
  }

  const criteria = aiSettings.evaluation_criteria || {};

  // Check args
  const leadIdArg = process.argv.find(arg => arg.startsWith('--lead_id='));
  let leadsToProcess = [];

  if (leadIdArg) {
    const leadId = leadIdArg.split('=')[1];
    const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
    if (lead) leadsToProcess.push(lead);
  } else {
    // Process all un-audited or score 0 leads
    const { data: leads } = await supabase.from('leads').select('*').or('score.is.null,score.eq.0').limit(50);
    if (leads) leadsToProcess = leads;
  }

  console.log(`Encontrados ${leadsToProcess.length} leads para sincronizar.`);

  for (const lead of leadsToProcess) {
    console.log(`\nProcessando Lead: ${lead.customer_name} (${lead.id})`);

    // 2. Fetch all messages
    const { data: messages, error: errMsgs } = await supabase.from('chat_messages').select('*').eq('lead_id', lead.id).order('created_at', { ascending: true });
    
    if (errMsgs || !messages || messages.length === 0) {
      console.log(`Sem mensagens para o lead ${lead.id}. Pulando.`);
      continue;
    }

    // 3. Build Transcript
    let transcript = '';
    for (const msg of messages) {
      let role = msg.sender_type === 'user' || msg.sender_type === 'bot' ? 'Gerente' : 'Cliente';
      let content = msg.content || '';

      // Skip media logic (Zero Cost approach)
      if (msg.media_url) {
        content += `\n[ANEXO MULTIMÍDIA RECEBIDO: ${msg.media_type || 'arquivo'}] (Ação Humana Necessária: Mídia não auditada automaticamente para economizar custos.)`;
        
        // Save the pending human action to the DB directly so it shows up in ChatHistoryView
        await supabase.from('chat_messages').update({
            ai_transcription: "Ação Humana Necessária: Mídia ignorada automaticamente para economizar custos.",
            ai_insight: "Mídia pendente de revisão."
        }).eq('id', msg.id);
      }

      if (content.trim()) {
        transcript += `[${new Date(msg.created_at).toISOString()}] ${role}: ${content}\n`;
      }
    }

    if (!transcript.trim()) {
      console.log(`Conversa vazia para lead ${lead.id}. Pulando.`);
      continue;
    }

    // 4. Mount Prompt
    const prompt = `
      Você é um auditor de qualidade de vendas mecânicas automotivas.
      Analise a conversa inteira abaixo e preencha os itens da auditoria DE UMA SÓ VEZ.
      Como estamos processando o histórico completo, você deve definir a etapa de funil correta e preencher o checklist baseando-se em todo o contexto.

      CRITÉRIOS ATUAIS:
      ${JSON.stringify(criteria)}
      
      TRANSCRIÇÃO COMPLETA DA CONVERSA:
      ${transcript}
      
      IMPORTANTE:
      1. Para "ticket_value", NUNCA invente ou extraia valores de chaves PIX, CNPJ, números de telefone ou links de pagamento. Só preencha se o gerente falar EXPLICITAMENTE o valor total do orçamento.
      2. Mídias que aparecem como "Ação Humana Necessária" devem ter suas etapas correspondentes de auditoria ignoradas (se você não pode ver o vídeo, não pode dar a nota, deixe como falso).
      
      CRITÉRIOS RÍGIDOS PARA MUDANÇA DE ETAPA (funnel_stage) - INTERPRETE O CONTEXTO COM EXTREMO RIGOR:
      - 'closed_won' (Ganho): USE APENAS SE o cliente pagou OU se ele deu uma confirmação EXPLÍCITA INEQUÍVOCA de que aprovou o serviço (ex: "Pode fazer", "Aprovado", "manda bala") APÓS o gerente já ter enviado o link do orçamento/checklist.
      - 'closed_lost' (Perdido): USE APENAS SE o cliente disse explicitamente que não vai fazer ou achou muito caro e encerrou.
      - 'quote' (Orçamento Enviado): O gerente CRAVOU O PREÇO ou enviou o PDF/link do orçamento e checklist, e agora está aguardando aprovação. Use esta etapa assim que os valores forem enviados.
      - 'negotiation' (Em Atendimento): O gerente respondeu ao cliente e INICIOU o atendimento.
      - 'lead_new' (Novo Lead): O cliente mandou a 1ª mensagem e o gerente AINDA NÃO RESPONDEU. 

      INSTRUÇÕES CRÍTICAS DE AVALIAÇÃO DO CHECKLIST E JUSTIFICATIVAS:
      1. AVALIAÇÃO FINAL PARA 1a, 1b, 4a e 4b: Estes itens SÓ PODEM SER MARCADOS COMO TRUE NO MOMENTO EM QUE FINALIZAR O ATENDIMENTO (quando o funnel_stage mudar para 'closed_won' ou 'closed_lost'). Durante o atendimento, MANTENHA-OS COMO false.
      2. MENSAGEM DE AGRADECIMENTO E AVALIAÇÃO (4a, 4b): NEGATIVE CONSTRAINT: Um simples "Valeu" ou "Obrigado" do gerente NO MEIO do atendimento NÃO é mensagem de finalização.
      3. CHAIN-OF-THOUGHT (OBRIGATÓRIO): A PRIMEIRA CHAVE do seu JSON de resposta DEVE ser "reasoning_step_by_step".
      
      Retorne APENAS um JSON válido com a seguinte estrutura obrigatória:
      {
        "reasoning_step_by_step": "String descrevendo passo a passo o raciocínio da sua avaliação, interpretando o histórico inteiro",
        "audit_checklist": {
          "1a": true ou false,
          "1b": true ou false,
          "2a": true ou false,
          "2b": true ou false,
          "2c": true ou false,
          "2d": true ou false,
          "2e": true ou false,
          "3a": true ou false,
          "3b": true ou false,
          "3c": true ou false,
          "4a": true ou false,
          "4b": true ou false
        },
        "score": (número de 0 a 100 baseando-se no preenchimento do checklist),
        "funnel_stage": (sugestão de nova etapa),
        "audit_justifications": {
           // Dicionário. Justifique por que marcou true ou false para os itens alterados. Ex: "2c": "..."
        },
        "new_compressed_history": "Resumo super conciso de toda a negociação, peças orçadas, etc",
        "ticket_value": (número decimal ou null),
        "customer_vehicle": (string ou null)
      }
    `;

    // 5. Call Gemini
    console.log("-> Chamando Gemini 1.5 Flash (Gratuito) para processamento...");
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 }
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API do Gemini: ${response.statusText} - ${await response.text()}`);
      }

      const jsonBody = await response.json();
      const rawText = jsonBody.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonStr = rawText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      console.log(`-> Score calculado: ${parsed.score} | Etapa: ${parsed.funnel_stage}`);

      // 6. Update Database
      const { error: updErr } = await supabase.from('leads').update({
        score: parsed.score,
        funnel_stage: parsed.funnel_stage,
        audit_checklist: parsed.audit_checklist,
        audit_reasons: parsed.audit_justifications,
        ticket_value: parsed.ticket_value || lead.ticket_value,
        customer_vehicle: parsed.customer_vehicle || lead.customer_vehicle
      }).eq('id', lead.id);

      if (updErr) console.error("Erro ao atualizar lead:", updErr);

      await supabase.from('lead_memories').upsert({
        lead_id: lead.id,
        compressed_history: parsed.new_compressed_history,
        last_processed_message_id: messages[messages.length - 1].id
      });

      console.log("-> Lead sincronizado com sucesso!");
    } catch (e) {
      console.error("Erro ao processar LLM:", e.message);
    }

    // Rate Limiting Protection (15 RPM Free Tier limit)
    await delay(4000); 
  }

  console.log("\\n=== SINCRONIZAÇÃO CONCLUÍDA ===");
}

run();
