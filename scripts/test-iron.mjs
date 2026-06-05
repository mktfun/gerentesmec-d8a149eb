import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qtjitszradxsmnilnqtj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const scenarios = [
  {
    name: "TESTE 1 - Caminho Feliz Perfeito",
    messages: [
      { sender: 'contact', content: "Bom dia, meu carro ta fazendo um barulho estranho." },
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
      { sender: 'contact', content: "Boa tarde, qual o valor da troca de óleo?" },
      { sender: 'user', content: "Boa tarde! O valor fica R$ 350,00. Segue a foto dos produtos." },
      { sender: 'user', content: "Foto dos produtos", media_type: 'image' },
      { sender: 'contact', content: "Ah achei muito caro. Vou fazer em outro lugar, obrigado." },
      { sender: 'user', content: "Tudo bem, agradecemos o contato. Se precisar de algo, estamos à disposição." }
    ]
  },
  {
    name: "TESTE 3 - Gerente Pula Etapas (Sufoco)",
    messages: [
      { sender: 'contact', content: "Oi, quanto é o freio do gol?" },
      { sender: 'user', content: "Fica R$ 800,00" },
      { sender: 'contact', content: "Blz pode marchar" }
    ]
  },
  {
    name: "TESTE 4 - Áudio do Mecânico e Upsell Falso",
    messages: [
      { sender: 'contact', content: "E aí, descobriram o BO do carro?" },
      { sender: 'user', content: "Sim, gravamos um áudio detalhando. O problema é na suspensão.", media_type: 'audio' },
      { sender: 'contact', content: "Certo. E a troca das palhetas que pedi?" },
      { sender: 'user', content: "As palhetas a gente não mexe." },
      { sender: 'user', content: "O orçamento do freio ficou 1200." },
      { sender: 'contact', content: "Pode aprovar" }
    ]
  },
  {
    name: "TESTE 5 - Apenas Conversa Longa, Sem Orçamento Ainda",
    messages: [
      { sender: 'contact', content: "Oi" },
      { sender: 'user', content: "Olá, como posso ajudar?" },
      { sender: 'contact', content: "meu carro ta esquentando" },
      { sender: 'user', content: "Pode ser o radiador ou válvula. Traz aqui na rua das flores, 123" },
      { sender: 'contact', content: "Chego ai em 10 min" }
    ]
  },
  {
    name: "TESTE 6 - Gírias (Pode meter marcha)",
    messages: [
      { sender: 'user', content: "Fala meu patrão! Mandei as fotos lá do vazamento. O total deu 450 reais, beleza?", media_type: 'image' },
      { sender: 'contact', content: "ta sussa, pode meter marcha no bgl" }
    ]
  },
  {
    name: "TESTE 7 - Orçamento com Link Externo",
    messages: [
      { sender: 'contact', content: "Tudo certo?" },
      { sender: 'user', content: "Tudo sim, montamos o orçamento e checklist aqui no nosso sistema, dá uma olhada: https://example.com/orcamento" },
      { sender: 'contact', content: "ok vou ver" }
    ]
  },
  {
    name: "TESTE 8 - Apenas Mídias sem Texto (Teste Extremo)",
    messages: [
      { sender: 'contact', content: "Oi" },
      { sender: 'user', content: "", media_type: 'video' },
      { sender: 'user', content: "R$ 400" },
      { sender: 'contact', content: "pode fazer" }
    ]
  },
  {
    name: "TESTE 9 - Desistência no Meio do Caminho",
    messages: [
      { sender: 'user', content: "Boa tarde, gravamos um áudio explicando.", media_type: 'audio' },
      { sender: 'contact', content: "Vou passar ai pra buscar o carro, não vou fazer nada não. Ta mt caro." }
    ]
  },
  {
    name: "TESTE 10 - Mix Complexo de Mídias",
    messages: [
      { sender: 'contact', content: "Qual o problema?" },
      { sender: 'user', content: "Veja a foto:", media_type: 'image' },
      { sender: 'user', content: "Veja o video:", media_type: 'video' },
      { sender: 'user', content: "O total é R$ 900,00" },
      { sender: 'contact', content: "Ok, e se eu pagar no pix?" },
      { sender: 'user', content: "No pix faço por 800." },
      { sender: 'contact', content: "aprovado, pix feito" },
      { sender: 'user', content: "Obrigado! Pode avaliar? http://link" }
    ]
  }
];

async function run() {
  console.log("Iniciando bateria de Testes de Ferro...");

  // Pegar unidade de exemplo
  const { data: units } = await supabase.from('units').select('id').limit(1);
  const unitId = units[0]?.id;
  if (!unitId) throw new Error("Sem unit_id!");

  // Pegar medias existentes para reciclar
  const { data: existingMedia } = await supabase
    .from('chat_messages')
    .select('media_url, media_type')
    .not('media_url', 'is', null)
    .limit(50);

  const audioUrls = existingMedia.filter(m => m.media_type?.includes('audio')).map(m => m.media_url);
  const videoUrls = existingMedia.filter(m => m.media_type?.includes('video')).map(m => m.media_url);
  const imageUrls = existingMedia.filter(m => m.media_type?.includes('image')).map(m => m.media_url);

  for (const scenario of scenarios) {
    console.log(`\nCriando ${scenario.name}...`);
    
    // 1. Criar Lead
    const leadId = crypto.randomUUID();
    const { data: leadData, error: leadErr } = await supabase.from('leads').insert({
      id: leadId,
      customer_name: scenario.name,
      customer_phone: '+55119' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
      unit_id: unitId,
      funnel_stage: 'lead_new',
      last_message_at: new Date().toISOString()
    }).select().single();

    if (leadErr) {
      console.error("Erro lead:", leadErr);
      continue;
    }

    // leadId already defined
    let lastMsgId = null;
    let lastMsgContent = null;
    let lastMsgSender = null;
    let lastMsgMedia = null;
    let lastMsgMime = null;

    // 2. Inserir mensagens (1 por segundo para manter a ordem temporal)
    for (const msg of scenario.messages) {
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
      const { data: msgData, error: msgErr } = await supabase.from('chat_messages').insert({
        id: msgId,
        lead_id: leadId,
        content: msg.content || '',
        sender_type: msg.sender,
        media_url: mUrl,
        media_type: mType
      }).select().single();

      if (!msgErr) {
        lastMsgId = msgData.id;
        lastMsgContent = msgData.content;
        lastMsgSender = msgData.sender_type;
        lastMsgMedia = msgData.media_url;
        lastMsgMime = msgData.media_type;
      }
      
      // Espera 1s pra ordenar certo
      await new Promise(r => setTimeout(r, 1000));
    }

    // 3. Forçar a Edge Function pro último passo se ele for o avaliador
    if (lastMsgId) {
      console.log(` > Chamando AI Evaluator para ${scenario.name}...`);
      try {
        const payload = {
          record: {
            id: lastMsgId,
            lead_id: leadId,
            content: lastMsgContent,
            sender_type: lastMsgSender,
            media_url: lastMsgMedia,
            media_type: lastMsgMime
          }
        };
        const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-autonomous-evaluator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify(payload)
        });
        const ans = await res.json();
        console.log(`   [RESULTADO]: Score ${ans.score} | Insight: ${ans.insight?.substring(0,60)}`);
      } catch (e) {
         console.error("   Erro na function:", e);
      }
    }
  }

  console.log("\n✅ Teste de Ferro concluído com sucesso!");
}

run();
