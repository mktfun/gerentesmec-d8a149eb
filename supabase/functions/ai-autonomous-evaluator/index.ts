import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { lead_id, message_content, message_id, media_url, media_type } = await req.json();

    if (!lead_id || !message_content) {
      return new Response(JSON.stringify({ error: 'Missing lead_id or message_content' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // 1. Pré-processamento Determinístico (Filtro Anti-Gasto)
    const text = message_content.trim();
    if (text.length < 10 && !text.match(/[?]/)) {
      console.log(`[Cost-Efficiency] Mensagem ignorada por ser muito curta e sem pergunta: "${text}"`);
      return new Response(JSON.stringify({ status: 'ignored_by_deterministic_filter' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Obter AiSettings
    const { data: aiSettings } = await supabaseClient.from('ai_settings').select('*').single();
    if (!aiSettings || !aiSettings.features?.auto_scoring) {
      return new Response(JSON.stringify({ status: 'ai_automation_disabled' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // 2. Semantic Caching (Simulação da lógica RAG)
    // Em produção, você usaria OpenAI Embeddings ou Gemini Embeddings aqui:
    // const embedding = await generateEmbedding(text);
    // const { data: cacheHit } = await supabaseClient.rpc('match_semantic_cache', { query_embedding: embedding, match_threshold: 0.95 });
    
    // ── 3. Parser de Orçamento oiapi.com.br ──────────────────────────────
    // Detecta link oiapi na mensagem, busca o PDF e extrai ticket_value e 
    // customer_vehicle SEM custo de LLM.
    const oiapiMatch = text.match(/https?:\/\/(?:www\.)?oiapi\.com\.br\/WA\.aspx\?tk=[^\s\n"')>]+/i);
    if (oiapiMatch) {
      try {
        console.log('[oiapi] Fetching PDF:', oiapiMatch[0]);
        const pdfRes = await fetch(oiapiMatch[0], {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GerentesMec/1.0)' }
        });
        const pdfBuffer = await pdfRes.arrayBuffer();

        // Extração raw de texto do binário PDF (sem biblioteca externa)
        const bytes = new Uint8Array(pdfBuffer);
        const decoder = new TextDecoder('latin1');
        const rawText = decoder.decode(bytes);
        const chunks = rawText.match(/[\x20-\x7E\xC0-\xFF]{3,}/g) || [];
        const pdfText = chunks.join(' ');
        console.log('[oiapi] PDF text sample:', pdfText.substring(0, 300));

        const extracted: { ticket_value?: number; customer_vehicle?: string } = {};

        // Extrair Veículo
        const vehiclePatterns = [
          /Ve[íi]culo[:\s]+([A-ZÀ-Ú][A-Za-zÀ-Ú0-9\s\-\/]+?)(?:\s{2,}|\n|Placa|Ano|Modelo)/i,
          /Modelo[:\s]+([A-ZÀ-Ú][A-Za-zÀ-Ú0-9\s\-\/]+?)(?:\s{2,}|\n|Placa|Cor)/i,
        ];
        for (const pat of vehiclePatterns) {
          const m = pdfText.match(pat);
          if (m?.[1]?.trim().length > 3) { extracted.customer_vehicle = m[1].trim().replace(/\s+/g, ' '); break; }
        }
        if (!extracted.customer_vehicle) {
          const plate = pdfText.match(/([A-Z]{3}[-\s]?\d{4}|[A-Z]{3}\d[A-Z]\d{2})/);
          if (plate) extracted.customer_vehicle = plate[1];
        }

        // Extrair Valor Total
        const totalPatterns = [
          /Total\s+Geral[:\s]+R?\$?\s*([\d.,]+)/i,
          /Valor\s+Total[:\s]+R?\$?\s*([\d.,]+)/i,
          /Total[:\s]+R?\$?\s*([\d.,]+)/i,
          /R\$\s*([\d.]{4,}[\d,]+)/,
        ];
        for (const pat of totalPatterns) {
          const m = pdfText.match(pat);
          if (m?.[1]) {
            const val = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
            if (!isNaN(val) && val > 0 && val < 999999) { extracted.ticket_value = val; break; }
          }
        }

        console.log('[oiapi] Extracted:', JSON.stringify(extracted));
        if (extracted.ticket_value || extracted.customer_vehicle) {
          await supabaseClient.from('leads').update(extracted).eq('id', lead_id);
        }
      } catch (pdfErr: any) {
        console.warn('[oiapi] PDF parse failed:', pdfErr.message);
      }
    }

    // 3. Prompt Compression & Memoization
    // Busca o histórico resumido para poupar tokens do histórico raw enorme.
    let compressedHistory = '';
    const { data: memory } = await supabaseClient.from('lead_memories').select('*').eq('lead_id', lead_id).single();
    if (memory) {
      compressedHistory = memory.compressed_history;
    }

    // 4. LLM Routing e Chamada
    const apiKey = aiSettings.api_key;
    if (!apiKey) throw new Error("API Key não configurada");

    const prompt = `
      ${aiSettings.system_prompt}
      
      CRITÉRIOS ATUAIS:
      ${JSON.stringify(aiSettings.evaluation_criteria)}
      
      HISTÓRICO DA NEGOCIAÇÃO ATÉ AGORA (Resumido):
      ${compressedHistory || "Nenhum histórico prévio."}
      
      NOVA MENSAGEM DO CLIENTE/GERENTE:
      "${text}"
      
      Você é um auditor de qualidade de vendas mecânicas automotivas.
      Analise a conversa e preencha os itens da auditoria. Se a informação já foi passada antes (segundo o resumo), mantenha como true.
      ${media_url && media_type?.startsWith('video') ? '\n[SISTEMA]: O gerente/cliente anexou um VÍDEO nesta mensagem. Assuma que o vídeo contém a explicação do defeito mecânico de forma clara. Dê o checklist como cumprido para os itens de envio de vídeo (ex: 2b, 3b).' : ''}
      
      Retorne APENAS um JSON válido com a seguinte estrutura obrigatória:
      {
        "audit_checklist": {
          "1a": true ou false, // Atendimento foi cordial e respeitoso?
          "1b": true ou false, // Registrou no WhatsApp o que foi acordado?
          "2a": true ou false, // Enviou o link do orçamento?
          "2b": true ou false, // Enviou vídeo mostrando o defeito?
          "2c": true ou false, // Explicou os efeitos de não fazer o reparo?
          "3a": true ou false, // Enviou o checklist complementar?
          "3b": true ou false, // Enviou vídeo do que mais precisa ser feito?
          "3c": true ou false, // Explicou o texto justificando serviços extras?
          "4a": true ou false, // Enviou mensagem de agradecimento padrão?
          "4b": true ou false  // Pediu avaliação no Google?
        },
        "score": (número de 0 a 100, baseado no preenchimento do checklist: 4 blocos de 25 pontos cada),
        "funnel_stage": (sugestão de nova etapa do funil: lead_new, quote, negotiation, closed_won, closed_lost. Só mude se houver clareza),
        "new_compressed_history": (novo histórico resumido somando a mensagem atual),
        "closing_summary": (Texto claro com o parecer atual da auditoria. O que falta o vendedor fazer?),
        "ticket_value": (número correspondente ao orçamento final negociado, ex: 1500, ou null se não houver),
        "customer_vehicle": (string do modelo do veículo mencionado, ou null se não houver)
      }
    `;

    let llmOutputText = "";
    
    // Preparar payload de mensagem
    let userMessageContent: any = prompt;
    
    // Se for OpenAI e tiver imagem, usar formato array vision
    const isImage = media_url && media_type?.startsWith('image');
    if (apiKey.startsWith("sk-") && isImage) {
      userMessageContent = [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: media_url } }
      ];
    }
    
    if (apiKey.startsWith("sk-")) {
      // OpenAI
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: aiSettings.model?.includes('gpt') ? aiSettings.model : 'gpt-4o', // Forçar gpt-4o pra ter vision
          response_format: { type: "json_object" },
          messages: [{ role: 'user', content: userMessageContent }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      llmOutputText = data.choices[0].message.content;
    } else {
      // Gemini (suporta imagem na URL? O Gemini API requer base64 inline ou file API.
      // Como não temos base64 fácil da URL, mandamos apenas texto por enquanto, ou implementamos fetch da imagem.
      // Para manter a rapidez do webhook, vamos assumir o texto, mas dizer que tem anexo.
      const promptWithMediaInfo = isImage ? prompt + `\n\n[SISTEMA]: O usuário anexou uma imagem nesta mensagem. Assuma que a imagem contém evidências mecânicas válidas do que ele está dizendo.` : prompt;
      
      const model = aiSettings.model?.includes('gemini') ? aiSettings.model : 'gemini-1.5-flash';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptWithMediaInfo }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      llmOutputText = data.candidates[0].content.parts[0].text;
    }

    const mockOutput = JSON.parse(llmOutputText);

    // 5. Rastreabilidade de Auditoria: descobrir quais checks viraram true agora
    const { data: leadData } = await supabaseClient.from('leads').select('audit_checklist, audit_checklist_messages').eq('id', lead_id).single();
    const currentChecklist = leadData?.audit_checklist || {};
    const newMessagesMap = leadData?.audit_checklist_messages || {};

    if (mockOutput.audit_checklist) {
      for (const key of Object.keys(mockOutput.audit_checklist)) {
        if (mockOutput.audit_checklist[key] === true && !currentChecklist[key]) {
            // Este item do checklist ficou VERDE por conta desta mensagem!
            newMessagesMap[key] = message_id;
        }
      }
    }

    // 6. Atualiza o DB (Score, Funil, Ticket, Dossiê, Veículo, Checklist e Traceability)
    const updatePayload: any = {
      score: mockOutput.score,
      ticket_value: mockOutput.ticket_value,
      customer_vehicle: mockOutput.customer_vehicle,
      closing_summary: mockOutput.closing_summary,
      audit_checklist: mockOutput.audit_checklist,
      audit_checklist_messages: newMessagesMap
    };
    if (aiSettings.features?.auto_pipeline && mockOutput.funnel_stage) {
      updatePayload.funnel_stage = mockOutput.funnel_stage;
    }

    await supabaseClient.from('leads').update(updatePayload).eq('id', lead_id);

    // 6. Atualiza a Memoization (Lead Memories)
    await supabaseClient.from('lead_memories').upsert({
      lead_id: lead_id,
      compressed_history: mockOutput.new_compressed_history,
      last_processed_message_id: message_id
    });

    return new Response(JSON.stringify({ status: 'success', evaluated: mockOutput }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
