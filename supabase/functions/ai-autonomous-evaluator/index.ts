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
    const { message_content, lead_id, message_id, media_url, media_type, sender_type } = payload;

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
      
      ${sender_type === 'contact' 
        ? `⚠️ ATENÇÃO: Esta mensagem foi enviada pelo CLIENTE (contact), NÃO pelo gerente.
          REGRA DE OURO: Você NÃO DEVE pontuar NENHUM item de auditoria (1a a 4b). 
          Todos os itens do checklist no JSON de saída DEVEM manter o valor atual do histórico (como true ou false). Nunca altere um item de false para true baseado em ação do cliente.
          Você pode APENAS atualizar funnel_stage, customer_vehicle, ticket_value e new_compressed_history.` 
        : `✅ Esta mensagem foi enviada pelo GERENTE. Avalie todos os critérios de auditoria (1a a 4b) normalmente baseando-se nesta ação do gerente.`}
      
      NOVA MENSAGEM:
      "${text}"
      
      Você é um auditor de qualidade de vendas mecânicas automotivas.
      Analise a conversa e preencha os itens da auditoria. Se a informação já foi passada antes (segundo o resumo), mantenha como true.
      
      IMPORTANTE:
      1. Para "ticket_value", NUNCA invente ou extraia valores de chaves PIX, CNPJ, números de telefone ou links de pagamento. Só preencha se o gerente falar EXPLICITAMENTE o valor total do orçamento (ex: "ficou 1650,00", "total de 2700"). Se ele enviou apenas um link de pagamento e não falou o valor, deixe como null.
      2. Considere a tag "[ANEXO ENVIADO: video]" e "[ANEXO ENVIADO: image]" como evidência cabal de envio de mídia.
      
      CRITÉRIOS RÍGIDOS PARA MUDANÇA DE ETAPA (funnel_stage) - INTERPRETE O CONTEXTO COM EXTREMO RIGOR:
      - 'closed_won' (Ganho): USE APENAS SE o cliente pagou (enviou comprovante) OU se ele deu uma confirmação EXPLÍCITA INEQUÍVOCA de que aprovou o serviço (ex: "Pode fazer", "Aprovado", "Manda brasa", "Vou levar o carro amanhã para fazer"). Um simples "Ok", "Beleza" ou "Obrigado" NÃO é aprovação. Na dúvida, não feche.
      - 'closed_lost' (Perdido): USE APENAS SE o cliente disse explicitamente que não vai fazer (ex: "Tá caro, deixa pra lá", "Vou fazer em outro lugar") ou se o gerente encerrou o atendimento negativamente.
      - 'negotiation' (Em Negociação): O gerente passou o valor/orçamento e eles estão conversando sobre formas de pagamento, parcelamento, prazos, ou o cliente está tirando dúvidas.
      - 'quote' (Em Orçamento): O gerente acabou de mandar o orçamento mas o cliente ainda não respondeu (ou respondeu apenas algo genérico como "Vou analisar").
      - 'lead_new' (Novo Lead): Estão apenas diagnosticando o problema ou agendando visita. Não há orçamento final passado ainda.

      INTRUÇÕES CRÍTICAS DE AVALIAÇÃO DO CHECKLIST (Seja Rigoroso - APLICÁVEL APENAS A MENSAGENS DO GERENTE):
      1. Foco na Intenção Real: Os gerentes usam linguagem informal. Se a INTENÇÃO da mensagem for explicar um defeito (mesmo com gírias), marque que ele justificou serviços.
      2. Orçamento (2a): Só marque true se o gerente de fato passar o valor total ou enviar um PDF/link claro do orçamento.
      3. Upsell (3a): Se o gerente oferecer qualquer serviço ou peça adicional para melhorar o carro além do que o cliente pediu inicialmente, marque como true.
      4. Avaliação Google (4b): Só marque true se o gerente pedir de forma EXPLÍCITA para o cliente avaliar a oficina (mandando link ou texto claro).
      5. Vá pontuando aos poucos: O objetivo é marcar os checks como 'true' gradativamente. Nunca reverta um 'true' para 'false' se já foi cumprido no histórico.
      ${(media_url || text.includes('[ANEXO ENVIADO: video]') || text.includes('[ANEXO ENVIADO: audio]')) ? `\n[SISTEMA]: Uma mídia foi anexada. SE foi enviada pelo gerente, avalie de fato explicou o defeito (2c, 3c) ou enviou evidência clara (2b, 3b).` : ''}
      
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
    
    console.log("[AI-EVALUATOR] Chamando LLM...");
    
    // Processamento de Mídia: Fetch e Base64
    let mediaBase64 = null;
    let actualMime = media_type || 'application/octet-stream';
    if (media_url) {
      try {
        console.log(`[AI-EVALUATOR] Baixando mídia de ${media_url} ...`);
        const mediaRes = await fetch(media_url);
        if (mediaRes.ok) {
          const arrayBuffer = await mediaRes.arrayBuffer();
          // Limite de segurança de 15MB para não estourar a memória da Edge Function
          if (arrayBuffer.byteLength < 15 * 1024 * 1024) {
            mediaBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            actualMime = mediaRes.headers.get('content-type') || actualMime;
            console.log(`[AI-EVALUATOR] Mídia baixada com sucesso. Tamanho: ${arrayBuffer.byteLength} bytes. Tipo: ${actualMime}`);
          } else {
            console.log("[AI-EVALUATOR] Mídia ignorada por exceder o limite de 15MB.");
          }
        }
      } catch (err) {
        console.error("[AI-EVALUATOR] Erro ao baixar mídia:", err);
      }
    }

    if (apiKey.startsWith("sk-")) {
      // OpenAI / OpenRouter
      if (mediaBase64) {
        // Formato compátivel com visao/audio em APIs padrão OpenAI (suportado pelo OpenRouter)
        userMessageContent = [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${actualMime};base64,${mediaBase64}` } }
        ];
      }
      
      const requestModel = aiSettings.model?.includes('gpt') || aiSettings.model?.includes('flash') || aiSettings.model?.includes('claude') || aiSettings.model?.includes('gemini') ? aiSettings.model : 'gpt-4o';
      
      const res = await fetch(aiSettings.api_url || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: requestModel,
          response_format: { type: "json_object" },
          messages: [{ role: 'user', content: userMessageContent }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      llmOutputText = data.choices[0].message.content;
    } else {
      // Gemini (Direct Google API)
      let parts: any[] = [{ text: prompt }];
      if (mediaBase64) {
        parts.push({
          inlineData: {
            mimeType: actualMime,
            data: mediaBase64
          }
        });
      } else if (media_url) {
        parts[0].text += `\n\n[SISTEMA]: O usuário anexou uma mídia, mas não pôde ser baixada. Assuma que há um anexo.`;
      }
      
      const model = aiSettings.model?.includes('gemini') ? aiSettings.model : 'gemini-1.5-flash';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }],
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
    if (mockOutput.audit_checklist && sender_type !== 'contact') {
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

    const updatePayload: any = {
      score: calculatedScore,
      closing_summary: mockOutput.closing_summary,
      audit_checklist: mergedChecklist,
      audit_checklist_messages: newMessagesMap
    };
    
    // Atualiza ticket apenas se a IA não retornou null
    if (mockOutput.ticket_value !== null && mockOutput.ticket_value !== undefined) {
      updatePayload.ticket_value = mockOutput.ticket_value;
    }
    
    if (mockOutput.customer_vehicle) {
      updatePayload.customer_vehicle = mockOutput.customer_vehicle;
    }

    if (mockOutput.funnel_stage) {
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

    return new Response(JSON.stringify({ status: 'success', evaluated: updatePayload }), {
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
