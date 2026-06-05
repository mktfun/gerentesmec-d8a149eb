import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = 'https://qtjitszradxsmnilnqtj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const scenarios = [
  {
    name: "TESTE 1 - Caminho Feliz Perfeito",
    messages: [
      { sender: 'contact', content: "Bom dia, meu carro ta fazendo um barulho estranho na roda dianteira." },
      { sender: 'user', content: "Bom dia! Trouxe pra gente dar uma olhada. Acabei de gravar um vídeo mostrando o problema." },
      { sender: 'user', content: "Veja aqui o vazamento e o barulho na correia.", media_type: 'video' },
      { sender: 'user', content: "O orçamento final para a troca das peças fica em R$ 1.850,00." },
      { sender: 'contact', content: "Nossa, meio caro, mas pode fazer." },
      { sender: 'user', content: "Perfeito, carro pronto! Segue o link pra avaliar a oficina no Google: http://g.page/xxx" }
    ]
  },
  {
    name: "TESTE 2 - Cliente Rejeita",
    messages: [
      { sender: 'contact', content: "Boa tarde, qual o valor da troca de óleo do meu civic?" },
      { sender: 'user', content: "Boa tarde! O valor fica R$ 350,00. Segue a foto dos produtos." },
      { sender: 'user', content: "Foto dos produtos que vamos usar no seu carro", media_type: 'image' },
      { sender: 'contact', content: "Ah achei muito caro. Vou fazer em outro lugar, obrigado." },
      { sender: 'user', content: "Tudo bem, agradecemos o contato. Se precisar de algo, estamos à disposição." }
    ]
  },
  {
    name: "TESTE 3 - Gerente Pula Etapas (Sufoco)",
    messages: [
      { sender: 'contact', content: "Oi, quanto é o freio do gol?" },
      { sender: 'user', content: "Fica R$ 800,00 com peças e mão de obra" },
      { sender: 'contact', content: "Blz pode marchar mano" }
    ]
  },
  {
    name: "TESTE 4 - Áudio do Mecânico e Upsell Falso",
    messages: [
      { sender: 'contact', content: "E aí, descobriram o problema do carro?" },
      { sender: 'user', content: "Sim, gravamos um áudio detalhando. O problema é na suspensão dianteira.", media_type: 'audio' },
      { sender: 'contact', content: "Certo. E a troca das palhetas que pedi?" },
      { sender: 'user', content: "As palhetas a gente não mexe aqui." },
      { sender: 'user', content: "O orçamento do freio ficou R$ 1200,00." },
      { sender: 'contact', content: "Pode aprovar tudo" }
    ]
  },
  {
    name: "TESTE 5 - Apenas Conversa Longa, Sem Orçamento Ainda",
    messages: [
      { sender: 'contact', content: "Oi, tudo bem? Preciso de ajuda" },
      { sender: 'user', content: "Olá, tudo sim! Como posso ajudar?" },
      { sender: 'contact', content: "meu carro ta esquentando demais" },
      { sender: 'user', content: "Pode ser o radiador ou válvula termostática. Traz aqui na rua das flores, 123 que a gente olha" },
      { sender: 'contact', content: "Chego ai em 10 min, valeu" }
    ]
  },
  {
    name: "TESTE 6 - Gírias (Pode meter marcha)",
    messages: [
      { sender: 'user', content: "Fala meu patrão! Mandei as fotos lá do vazamento embaixo. O total deu 450 reais, beleza?", media_type: 'image' },
      { sender: 'contact', content: "ta sussa, pode meter marcha no bgl ai" }
    ]
  },
  {
    name: "TESTE 7 - Orçamento com Link Externo",
    messages: [
      { sender: 'contact', content: "Tudo certo com o carro? Já viram?" },
      { sender: 'user', content: "Tudo sim, montamos o orçamento e checklist aqui no nosso sistema, dá uma olhada no link" },
      { sender: 'contact', content: "ok vou ver e te falo depois" }
    ]
  },
  {
    name: "TESTE 8 - Apenas Mídias sem Texto (Teste Extremo)",
    messages: [
      { sender: 'contact', content: "Oi, o que acharam?" },
      { sender: 'user', content: "[ANEXO ENVIADO: video]", media_type: 'video' },
      { sender: 'user', content: "Total ficou R$ 400,00" },
      { sender: 'contact', content: "pode fazer, aprovado" }
    ]
  },
  {
    name: "TESTE 9 - Desistência no Meio do Caminho",
    messages: [
      { sender: 'user', content: "Boa tarde, gravamos um áudio explicando o problema.", media_type: 'audio' },
      { sender: 'contact', content: "Vou passar ai pra buscar o carro, não vou fazer nada não. Ta mt caro pra mim." }
    ]
  },
  {
    name: "TESTE 10 - Mix Complexo de Mídias",
    messages: [
      { sender: 'contact', content: "Qual o problema do meu carro afinal?" },
      { sender: 'user', content: "Veja a foto do vazamento:", media_type: 'image' },
      { sender: 'user', content: "E veja o video do barulho:", media_type: 'video' },
      { sender: 'user', content: "O total ficou em R$ 900,00 com tudo incluso" },
      { sender: 'contact', content: "Ok, e se eu pagar no pix tem desconto?" },
      { sender: 'user', content: "No pix faço por R$ 800,00." },
      { sender: 'contact', content: "aprovado, pix feito agora" },
      { sender: 'user', content: "Obrigado pela confiança! Pode avaliar a gente?" }
    ]
  }
];

// Resultados para o relatório final
const results = [];

async function callEdgeFunction(leadId, msgId, content, senderType, mediaUrl, mediaType) {
  const payload = {
    lead_id: leadId,
    message_id: msgId,
    message_content: content,
    sender_type: senderType,
    media_url: mediaUrl || null,
    media_type: mediaType || null,
  };
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-autonomous-evaluator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify(payload)
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function run() {
  console.log("=== BATERIA DE TESTES DE FERRO (v2 - Incremental) ===\n");

  // Pegar unidade de exemplo
  const { data: units } = await supabase.from('units').select('id').limit(1);
  const unitId = units?.[0]?.id;
  if (!unitId) throw new Error("Sem unit_id no banco!");

  // Buscar mídias reais já existentes no banco para reciclar
  const { data: existingMedia } = await supabase
    .from('chat_messages')
    .select('media_url, media_type')
    .not('media_url', 'is', null)
    .limit(50);

  const audioUrls = (existingMedia || []).filter(m => m.media_type?.includes('audio')).map(m => m.media_url);
  const videoUrls = (existingMedia || []).filter(m => m.media_type?.includes('video')).map(m => m.media_url);
  const imageUrls = (existingMedia || []).filter(m => m.media_type?.includes('image')).map(m => m.media_url);

  console.log(`Mídias encontradas: ${audioUrls.length} áudios, ${videoUrls.length} vídeos, ${imageUrls.length} imagens\n`);

  for (const scenario of scenarios) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📋 ${scenario.name}`);
    console.log(`${'─'.repeat(60)}`);
    
    // 1. Criar Lead
    const leadId = crypto.randomUUID();
    const { error: leadErr } = await supabase.from('leads').insert({
      id: leadId,
      customer_name: scenario.name,
      customer_phone: '+55119' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
      unit_id: unitId,
      funnel_stage: 'lead_new',
      last_message_at: new Date().toISOString()
    });

    if (leadErr) {
      console.error("❌ Erro ao criar lead:", leadErr.message);
      continue;
    }

    // 2. Inserir mensagens incrementalmente e chamar a IA para cada uma
    for (let i = 0; i < scenario.messages.length; i++) {
      const msg = scenario.messages[i];
      
      // Selecionar mídia real do banco
      let mUrl = null;
      let mType = null;
      if (msg.media_type === 'video' && videoUrls.length > 0) {
        mUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];
        mType = 'video/mp4';
      } else if (msg.media_type === 'audio' && audioUrls.length > 0) {
        mUrl = audioUrls[Math.floor(Math.random() * audioUrls.length)];
        mType = 'audio/ogg';
      } else if (msg.media_type === 'image' && imageUrls.length > 0) {
        mUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
        mType = 'image/jpeg';
      }

      const msgId = crypto.randomUUID();
      const { error: msgErr } = await supabase.from('chat_messages').insert({
        id: msgId,
        lead_id: leadId,
        content: msg.content || '',
        sender_type: msg.sender,
        media_url: mUrl,
        media_type: mType
      });

      if (msgErr) {
        console.error(`  ❌ Erro ao inserir msg ${i+1}:`, msgErr.message);
        continue;
      }

      // Chamar a IA incrementalmente para cada mensagem
      const senderLabel = msg.sender === 'contact' ? '👤 CLIENTE' : '🏪 GERENTE';
      const mediaLabel = msg.media_type ? ` [${msg.media_type.toUpperCase()}]` : '';
      console.log(`  ${i+1}. ${senderLabel}${mediaLabel}: "${msg.content?.substring(0, 50)}..."`);
      
      try {
        const result = await callEdgeFunction(leadId, msgId, msg.content || '', msg.sender, mUrl, mType);
        if (result.status === 200 && result.body.success) {
          console.log(`     ✅ Score: ${result.body.score} | Insight: ${result.body.insight?.substring(0, 70) || '—'}`);
        } else if (result.body.status === 'ignored_by_deterministic_filter') {
          console.log(`     ⏭️  Ignorada (filtro curta/sem pergunta)`);
        } else if (result.body.error === 'ai_automation_disabled') {
          console.log(`     ⚙️  auto_scoring desabilitado no ai_settings`);
        } else {
          console.log(`     ⚠️  Status ${result.status}:`, JSON.stringify(result.body).substring(0, 120));
        }
      } catch (e) {
        console.error(`     ❌ Erro na chamada:`, e.message);
      }

      // Espera entre mensagens
      await new Promise(r => setTimeout(r, 500));
    }

    // 3. Obter resultado final do DB
    const { data: finalLead } = await supabase.from('leads')
      .select('audit_checklist, score, funnel_stage, ticket_value, customer_vehicle')
      .eq('id', leadId).single();

    const checklist = finalLead?.audit_checklist || {};
    const trueCount = Object.values(checklist).filter(v => v === true).length;
    const falseCount = Object.values(checklist).filter(v => v === false).length;

    console.log(`\n  📊 RESULTADO FINAL:`);
    console.log(`     Score: ${finalLead?.score ?? 'null'}`);
    console.log(`     Funil: ${finalLead?.funnel_stage}`);
    console.log(`     Ticket: ${finalLead?.ticket_value ?? 'null'}`);
    console.log(`     Veículo: ${finalLead?.customer_vehicle ?? 'null'}`);
    console.log(`     Checklist: ${trueCount}✅ / ${falseCount}❌`);
    console.log(`     Items TRUE:`, Object.keys(checklist).filter(k => checklist[k]).join(', ') || 'nenhum');
    console.log(`     Items FALSE:`, Object.keys(checklist).filter(k => !checklist[k]).join(', ') || 'nenhum');

    results.push({
      name: scenario.name,
      score: finalLead?.score,
      funnel: finalLead?.funnel_stage,
      ticket: finalLead?.ticket_value,
      trueItems: Object.keys(checklist).filter(k => checklist[k]),
      falseItems: Object.keys(checklist).filter(k => !checklist[k]),
      totalTrue: trueCount,
      totalFalse: falseCount,
    });
  }

  // 4. Relatório resumido
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log(`📝 RELATÓRIO FINAL - BATERIA DE TESTES`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`\n#  | CENÁRIO                          | SCORE | FUNIL        | ✅  | ❌`);
  console.log(`${'─'.repeat(80)}`);
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const name = r.name.replace(/TESTE \d+ - /, '').padEnd(32).substring(0, 32);
    const score = String(r.score ?? '—').padStart(5);
    const funnel = (r.funnel || '—').padEnd(12).substring(0, 12);
    console.log(`${String(i+1).padStart(2)} | ${name} | ${score} | ${funnel} | ${String(r.totalTrue).padStart(2)} | ${String(r.totalFalse).padStart(2)}`);
  }
  console.log(`${'─'.repeat(80)}`);

  console.log("\n✅ Teste de Ferro v2 concluído!");
}

run().catch(e => {
  console.error("ERRO FATAL:", e);
  process.exit(1);
});
