import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractJSON(raw: string): any {
  try { return JSON.parse(raw); } catch {}
  let cleaned = raw.replace(/^[\s\S]*?```(?:json)?\s*\n?/i, '').replace(/\n?\s*```[\s\S]*$/i, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  throw new Error(`Resposta da IA não contém JSON válido.`);
}

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
    const { lead_id } = payload;
    if (!lead_id) throw new Error("Missing lead_id");

    const { data: leadData } = await supabaseClient.from('leads').select('*').eq('id', lead_id).single();
    if (!leadData) throw new Error("Lead not found");

    // Apenas rodar se estiver ganho ou perdido
    if (leadData.funnel_stage !== 'closed_won' && leadData.funnel_stage !== 'closed_lost') {
       return new Response(JSON.stringify({ message: "Lead não está finalizado. Auditoria pulada." }), { headers: corsHeaders });
    }

    const { data: aiSettingsArray } = await supabaseClient.from('ai_settings').select('*');
    const aiSettings = aiSettingsArray?.[0] || {};
    
    // Roteamento "Otimização Máxima" (Modelos Emblemáticos 2026)
    let provider = aiSettings.provider || 'openai';
    let apiKey = Deno.env.get('OPENAI_API_KEY') || aiSettings.api_key;
    let modelName = 'gpt-4.5'; 
    let endpoint = 'https://api.openai.com/v1/chat/completions';

    if (provider.toLowerCase().includes('anthropic')) {
      modelName = 'claude-3-7-sonnet-latest';
      // Lógica de fetch da Anthropic omitida para brevidade (assumindo que a abstração de fetch lida com isso se fosse usar a API deles)
    } else if (provider.toLowerCase().includes('google') || provider.toLowerCase().includes('gemini')) {
      modelName = 'gemini-2.0-pro'; 
    }

    const { data: msgs } = await supabaseClient
      .from('chat_messages')
      .select('*')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: true });

    const transcript = (msgs || []).map(m => `[${m.sender_type.toUpperCase()}] ${m.message_content || m.audio_description || '[MÍDIA]'}`).join('\n');

    const prompt = `Você é o Agente Auditor Final. Sua tarefa é analisar o ciclo de vida completo deste lead e preencher o checklist de qualidade. O modelo que você está rodando é de Otimização Máxima.
    
    ESTADO FINAL: ${leadData.funnel_stage}
    SCRATCHPAD: ${leadData.ai_scratchpad}
    HISTÓRICO COMPLETO DA CONVERSA:
    ${transcript}

    INSTRUÇÕES CRÍTICAS:
    1. ZERO ALUCINAÇÃO. Como o lead já está finalizado, você tem a visão de ponta a ponta.
    2. NOTA PROBATÓRIA (EVIDENCE): Para CADA item do checklist que você avaliar (seja sim ou não), você OBRIGATORIAMENTE deve fornecer a propriedade 'evidence' citando o trecho EXATO da conversa ou a descrição do áudio/imagem que prova a sua decisão.
    3. SEM CONTEXTO: Se a conversa estiver com áudios vitais não transcritos, cheia de furos, ou simplesmente você não tem certeza do que aconteceu para fechar ou perder a venda, defina 'needs_context' como true. Isso acionará a Válvula de Escape e devolverá o lead para revisão humana.

    Responda EXATAMENTE neste formato JSON:
    {
       "needs_context": false, 
       "score": 0, // Nota de 0 a 100
       "checklist": {
          "tempo_resposta_adequado": { "checked": true, "evidence": "Vendedor respondeu em 2 minutos às 10:05" },
          "apresentacao_padrao": { "checked": false, "evidence": "Não encontrei nenhuma mensagem do vendedor se apresentando com o nome da empresa." },
          "orcamento_enviado": { "checked": true, "evidence": "[VENDEDOR] Aqui está o PDF com o orçamento." },
          "fechamento_claro": { "checked": true, "evidence": "[CLIENTE] Ok, vou querer, pode mandar o pix." }
       },
       "summary": "Resumo final da auditoria."
    }`;

    const response = await fetch(endpoint, {
         method: "POST",
         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
         body: JSON.stringify({
           model: modelName,
           messages: [{ role: "user", content: prompt }],
           response_format: { type: "json_object" },
           temperature: 0.1
         })
    });

    if (!response.ok) {
       return new Response(JSON.stringify({ error: await response.text() }), { headers: corsHeaders, status: 500 });
    }

    const jsonRaw = await response.json();
    const parsed = extractJSON(jsonRaw.choices[0].message.content);

    if (parsed.needs_context) {
       // Válvula de Escape: Move o funil para 'parking_lot' (Sem Contexto)
       await supabaseClient.from('leads').update({ funnel_stage: 'parking_lot' }).eq('id', lead_id);
       return new Response(JSON.stringify({ message: "Auditoria falhou por falta de contexto. Lead movido para revisão manual." }), { headers: corsHeaders });
    }

    // Normaliza o checklist e as evidências para o padrão do frontend
    const finalChecklist: Record<string, boolean> = {};
    const finalReasons: Record<string, string> = {};
    
    if (parsed.checklist) {
      for (const [key, val] of Object.entries(parsed.checklist)) {
        if (typeof val === 'object' && val !== null) {
          finalChecklist[key] = Boolean((val as any).checked);
          finalReasons[key] = String((val as any).evidence || '');
        } else {
          finalChecklist[key] = Boolean(val);
        }
      }
    }

    // Auditoria com sucesso
    await supabaseClient.from('leads').update({
       score: parsed.score,
       audit_checklist: finalChecklist,
       audit_reasons: finalReasons,
       closing_summary: parsed.summary
    }).eq('id', lead_id);

    return new Response(JSON.stringify({ success: true, score: parsed.score }), { headers: corsHeaders });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { headers: corsHeaders, status: 500 });
  }
});
