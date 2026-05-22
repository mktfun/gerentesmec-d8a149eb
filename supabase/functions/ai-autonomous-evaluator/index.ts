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

    const { lead_id, message_content, message_id } = await req.json();

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
    
    if (apiKey.startsWith("sk-")) {
      // OpenAI
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: aiSettings.model?.includes('gpt') ? aiSettings.model : 'gpt-4o-mini',
          response_format: { type: "json_object" },
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      llmOutputText = data.choices[0].message.content;
    } else {
      // Gemini
      const model = aiSettings.model?.includes('gemini') ? aiSettings.model : 'gemini-1.5-flash';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      llmOutputText = data.candidates[0].content.parts[0].text;
    }

    const mockOutput = JSON.parse(llmOutputText);

    // 5. Atualiza o DB (Score, Funil, Ticket, Dossiê, Veículo, Checklist)
    const updatePayload: any = {
      score: mockOutput.score,
      ticket_value: mockOutput.ticket_value,
      customer_vehicle: mockOutput.customer_vehicle,
      closing_summary: mockOutput.closing_summary,
      audit_checklist: mockOutput.audit_checklist
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
