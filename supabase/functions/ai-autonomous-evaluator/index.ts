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

    const payload = await req.json();
    console.log("[AI-EVALUATOR] Iniciando avaliação para payload:", JSON.stringify(payload));
    const { message_content, lead_id, message_id, media_url, media_type } = payload;

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
      INTRUÇÕES CRÍTICAS DE AVALIAÇÃO (Foque na INTENÇÃO, não nas palavras exatas):
      1. Os gerentes usam linguagem informal, gírias, ou enviam áudios transcritos. Não procure frases perfeitas. Se a INTENÇÃO da mensagem for explicar um defeito (mesmo de forma informal), marque que ele justificou serviços (itens 2c e 3c).
      2. Se a INTENÇÃO for oferecer qualquer serviço ou peça adicional que melhore o carro, considere como upsell (item 3a).
      3. Atualização de Etapa: Assim que identificar que o gerente está diagnosticando um problema, mostrando evidências (vídeo/foto) ou oferecendo soluções, mude o "funnel_stage" para "negotiation".
      4. Vá pontuando aos poucos: O objetivo é marcar os checks como 'true' gradativamente, à medida que a conversa avança em tempo real.
      ${(media_url && media_type?.startsWith('video')) || text.includes('[ANEXO ENVIADO: video]') || text.includes('[ANEXO ENVIADO: audio]') ? '\n[SISTEMA]: O gerente anexou um VÍDEO ou ÁUDIO. Assuma que a mídia contém a explicação do defeito mecânico de forma clara. Dê o checklist como cumprido para os itens de envio de evidência (ex: 2b, 3b) e considere que ele está justificando o serviço.' : ''}
      
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
        "ticket_value": (número decimal correspondente ao orçamento final negociado, extraído do texto. Ex: 2600. Se houver 'R$ 2.600,00', retorne 2600. Se não houver clareza, retorne null),
        "customer_vehicle": (string extraída do texto correspondente ao modelo do veículo ou placa. Ex: 'SVH4B83' ou 'Honda Civic'. Se não houver, retorne null)
      }
    `;

    let llmOutputText = "";
    
    // Preparar payload de mensagem
    let userMessageContent: any = prompt;
    
    console.log("[AI-EVALUATOR] Chamando LLM (Gemini)...");
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

    console.log("=== LLM OUTPUT ===");
    console.log(llmOutputText);

    const mockOutput = JSON.parse(llmOutputText);

    // 5. Rastreabilidade de Auditoria: descobrir quais checks viraram true agora
    const { data: leadData } = await supabaseClient.from('leads').select('ticket_value, customer_vehicle, audit_checklist, audit_checklist_messages').eq('id', lead_id).single();
    const currentChecklist = leadData?.audit_checklist || {};
    const newMessagesMap = leadData?.audit_checklist_messages || {};

    const mergedChecklist = { ...currentChecklist };
    if (mockOutput.audit_checklist) {
      for (const key of Object.keys(mockOutput.audit_checklist)) {
        const val = mockOutput.audit_checklist[key];
        if (val === true || val === "true") {
          mergedChecklist[key] = true;
          if (!currentChecklist[key]) {
            // Este item do checklist ficou VERDE por conta desta mensagem!
            newMessagesMap[key] = message_id;
          }
        }
      }
    }

    // 5.2 Calcular o Score Determinístico (Idêntico ao AuditPanel)
    const auditStepsConfig = [
      { id: 'step1', weight: 25, items: ['1a', '1b'] },
      { id: 'step2', weight: 25, items: ['2a', '2b', '2c'] },
      { id: 'step3', weight: 25, items: ['3a', '3b', '3c'] },
      { id: 'step4', weight: 25, items: ['4a', '4b'] },
    ];
    let calculatedScore = 0;
    auditStepsConfig.forEach(step => {
      const done = step.items.filter(id => mergedChecklist[id]).length;
      calculatedScore += (done / step.items.length) * step.weight;
    });
    calculatedScore = Math.round(calculatedScore);

    // 5.3 Preservação de Valores Críticos
    const finalTicket = mockOutput.ticket_value ?? leadData?.ticket_value;
    const finalVehicle = mockOutput.customer_vehicle ?? leadData?.customer_vehicle;

    // 6. Atualiza o DB (Score, Funil, Ticket, Dossiê, Veículo, Checklist e Traceability)
    const updatePayload: any = {
      score: calculatedScore,
      ticket_value: finalTicket,
      customer_vehicle: finalVehicle,
      closing_summary: mockOutput.closing_summary,
      audit_checklist: mergedChecklist,
      audit_checklist_messages: newMessagesMap
    };
    if (aiSettings.features?.auto_pipeline && mockOutput.funnel_stage) {
      updatePayload.funnel_stage = mockOutput.funnel_stage;
    }
    
    console.log("[AI-EVALUATOR] Resultado final da LLM parseado:", JSON.stringify(mockOutput));
    console.log("[AI-EVALUATOR] Salvando no banco de dados (leads). Payload:", JSON.stringify(updatePayload));

    const { error: updateError } = await supabaseClient.from('leads').update(updatePayload).eq('id', lead_id);
    if (updateError) {
      console.error("[AI-EVALUATOR] ERRO CRÍTICO no banco de dados [leads]:", updateError);
      throw new Error("Failed to update lead: " + updateError.message);
    }
    console.log("[AI-EVALUATOR] Update na tabela 'leads' com sucesso!");

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
