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
    // (Exemplo simbólico chamando o provedor configurado)
    const geminiKey = aiSettings.api_key;
    if (!geminiKey) throw new Error("Chave Gemini não configurada");

    const prompt = `
      ${aiSettings.system_prompt}
      
      CRITÉRIOS ATUAIS:
      ${JSON.stringify(aiSettings.evaluation_criteria)}
      
      HISTÓRICO DA NEGOCIAÇÃO ATÉ AGORA (Resumido):
      ${compressedHistory || "Nenhum histórico prévio."}
      
      NOVA MENSAGEM DO CLIENTE/GERENTE:
      "${text}"
      
      Retorne APENAS um JSON válido com a seguinte estrutura obrigatória:
      {
        "score": (número de 0 a 100),
        "funnel_stage": (sugestão de nova etapa),
        "new_compressed_history": (novo histórico resumido),
        "closing_summary": (Texto narrativo claro com o parecer da auditoria/dossiê. Obrigatório ao fechar o lead),
        "ticket_value": (número correspondente ao orçamento final negociado, ou null se não houver),
        "customer_vehicle": (string do modelo do veículo mencionado, ou null se não houver)
      }
    `;

    // Chamada real ao Gemini ficaria aqui. 
    // Mockando a resposta estruturada baseada no processamento:
    const mockOutput = {
      score: 85,
      ticket_value: 1200,
      customer_vehicle: "Honda Civic",
      closing_summary: "O gerente cumpriu quase todo o protocolo. O orçamento de R$1200 para o Honda Civic foi aprovado. Pendente apenas oferecer os serviços adicionais preventivos.",
      funnel_stage: 'budget_sent',
      new_compressed_history: compressedHistory + " | Cliente (Honda Civic) pediu orçamento e enviamos valor de R$1200."
    };

    // 5. Atualiza o DB (Score, Funil, Ticket, Dossiê, Veículo)
    await supabaseClient.from('leads').update({
      score: mockOutput.score,
      ticket_value: mockOutput.ticket_value,
      customer_vehicle: mockOutput.customer_vehicle,
      closing_summary: mockOutput.closing_summary,
      ...(aiSettings.features?.auto_pipeline ? { funnel_stage: mockOutput.funnel_stage } : {})
    }).eq('id', lead_id);

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
