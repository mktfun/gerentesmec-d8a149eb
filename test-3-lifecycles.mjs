import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qtjitszradxsmnilnqtj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_LOGS = [];

async function evaluateChunk(leadId, messagesChunk, currentChecklist, currentStage) {
  const content = messagesChunk.map(m => `[${m.sender === 'user' ? 'GERENTE' : 'CLIENTE'}]: ${m.text}`).join('\n\n');
  const senders = new Set(messagesChunk.map(m => m.sender));
  const senderType = senders.has('user') && senders.has('contact') ? 'mixed' : messagesChunk[messagesChunk.length - 1].sender;

  const payload = {
    lead_id: leadId,
    message_content: content,
    sender_type: senderType,
    message_ids: messagesChunk.map((_, i) => `msg-${Date.now()}-${i}`)
  };

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-autonomous-evaluator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error(`HTTP Error: ${res.status} ${await res.text()}`);
    
    const data = await res.json();
    
    // We also want to fetch the actual DB row to see what the AI updated
    const { data: lead } = await supabase.from('leads').select('funnel_stage, score, audit_checklist').eq('id', leadId).single();
    
    return { data, leadState: lead || { funnel_stage: currentStage, audit_checklist: currentChecklist }, rawContent: content };
  } catch (err) {
    return { error: err.message, rawContent: content };
  }
}

async function runScenario(scenarioName, leadId, sequenceChunks) {
  TEST_LOGS.push(`\n======================================================`);
  TEST_LOGS.push(`🚀 INICIANDO CENÁRIO: ${scenarioName} (Lead: ${leadId})`);
  TEST_LOGS.push(`======================================================\n`);
  
  // Reset lead to start
  await supabase.from('leads').upsert({
    id: leadId,
    customer_name: scenarioName,
    funnel_stage: 'lead_new',
    score: null,
    audit_checklist: {},
    audit_checklist_messages: {},
    unit_id: '11111111-1111-1111-1111-111111111111' // Dom Pedro
  });

  let stage = 'lead_new';
  let checklist = {};

  for (let i = 0; i < sequenceChunks.length; i++) {
    const chunk = sequenceChunks[i];
    TEST_LOGS.push(`\n💬 LOTE ${i + 1} DE MENSAGENS:`);
    chunk.forEach(m => TEST_LOGS.push(`   ${m.sender === 'user' ? 'Gerente' : 'Cliente'}: ${m.text}`));
    
    TEST_LOGS.push(`\n🧠 Chamando AI Evaluator...`);
    const result = await evaluateChunk(leadId, chunk, checklist, stage);
    
    if (result.error) {
      TEST_LOGS.push(`❌ ERRO: ${result.error}`);
    } else {
      TEST_LOGS.push(`✅ IA Respondeu!`);
      // Since the edge function parses and logs llm output but doesn't return the full json to client,
      // we can read the llm_usage_logs to get the raw JSON output for 'internal_monologue'.
      // Wait for a second so the log is inserted.
      await new Promise(r => setTimeout(r, 2000));
      
      const { data: logs } = await supabase
        .from('llm_usage_logs')
        .select('error_message')
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(1);

      let aiBrain = {};
      if (logs && logs.length > 0) {
        try {
          aiBrain = JSON.parse(logs[0].error_message);
        } catch(e) {}
      }

      TEST_LOGS.push(`--- MONÓLOGO INTERNO (O que a IA pensou) ---`);
      TEST_LOGS.push(`"${aiBrain.internal_monologue || 'Não capturado'}"`);
      TEST_LOGS.push(`--------------------------------------------`);
      
      stage = result.leadState?.funnel_stage || stage;
      checklist = result.leadState?.audit_checklist || checklist;
      
      TEST_LOGS.push(`📊 STATUS DO CRM ATUALIZADO:`);
      TEST_LOGS.push(`   Funil: ${stage}`);
      TEST_LOGS.push(`   Score Parcial: ${result.data?.score || result.leadState?.score}%`);
      TEST_LOGS.push(`   Insight Gerado: ${result.data?.insight || 'Nenhum'}`);
      TEST_LOGS.push(`   Checklist Preenchido: ${JSON.stringify(checklist)}`);
    }
  }
}

async function main() {
  // Lotes simulam o agrupamento de mensagens pelo Debounce de 5 minutos
  
  const chunksCenario1 = [
    [ // Lote 1: Acolhimento
      { sender: 'contact', text: 'Bom dia, meu carro tá morrendo no farol.' },
      { sender: 'user', text: 'Bom dia! Pode encostar aqui hoje às 14h que a gente avalia.' }
    ],
    [ // Lote 2: Diagnóstico e Orçamento
      { sender: 'user', text: 'Fala patrão, o problema é na injeção. Gravei um vídeo mostrando: [VIDEO_DEFEITO.mp4]. Se não limpar, vai consumir muito combustível e falhar mais.' },
      { sender: 'user', text: 'Segue orçamento. Fica R$ 850,00 completo.' }
    ],
    [ // Lote 3: Aprovação e Execução
      { sender: 'contact', text: 'Pode meter marcha, faz o serviço.' },
      { sender: 'user', text: '👍' }
    ],
    [ // Lote 4: Atualização durante o serviço
      { sender: 'user', text: 'Tudo desmontado, aqui as fotos da peça sendo limpa na máquina [FOTO_MAQUINA]. Daqui 1h fica pronto.' }
    ],
    [ // Lote 5: Entrega
      { sender: 'user', text: 'Prontinho! Pode vir buscar. Obrigado pela confiança. Ajuda a gente deixando uma nota no Google? [LINK_GOOGLE]' }
    ]
  ];

  const chunksCenario2 = [
    [ // Lote 1: Acolhimento e Orçamento Rápido
      { sender: 'contact', text: 'Oi, quanto pra trocar óleo do HB20?' },
      { sender: 'user', text: 'Oi, custa R$ 200,00 com filtro. Traz aqui.' }
    ],
    [ // Lote 2: Recusa
      { sender: 'contact', text: 'Tá meio caro, achei por 150 na esquina. Valeu.' },
      { sender: 'user', text: 'Sem problemas, qualquer coisa estamos à disposição.' }
    ]
  ];

  const chunksCenario3 = [
    [ // Lote 1: Acolhimento
      { sender: 'contact', text: 'Oi, preciso alinhar o carro.' },
      { sender: 'user', text: 'Bom dia, traz aqui. O alinhamento é R$ 100.' }
    ],
    [ // Lote 2: Aprovação 
      { sender: 'contact', text: 'ok, aprovado. tô levando.' },
      { sender: 'user', text: 'Ok.' }
    ],
    [ // Lote 3: Reprova Adicional na execução
      { sender: 'user', text: 'Olha, subi no elevador e vi que a bandeja tá rachada. Custa mais 400. Se não trocar o pneu vai comer por dentro [VIDEO_BANDEJA]' },
      { sender: 'contact', text: 'Vix... faz só o alinhamento mesmo, tô sem grana.' },
      { sender: 'user', text: 'Beleza. Carro alinhado, pode vir.' } // Esqueceu de pedir avaliação do google
    ]
  ];

  await runScenario('1_Jornada_Completa_Ouro', 'test-lead-001-ai-eval', chunksCenario1);
  await runScenario('2_Jornada_Recusa_Imediata', 'test-lead-002-ai-eval', chunksCenario2);
  await runScenario('3_Jornada_Execucao_ReprovaAdicional_Ruim', 'test-lead-003-ai-eval', chunksCenario3);

  fs.writeFileSync('test_lifecycles.log', TEST_LOGS.join('\n'), 'utf-8');
  console.log('✅ Testes concluídos! Logs gravados em test_lifecycles.log');
}

main();
