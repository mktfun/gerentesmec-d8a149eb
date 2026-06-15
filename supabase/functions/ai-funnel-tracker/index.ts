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

    // 1. Busca configurações de IA
    const { data: aiSettingsArray } = await supabaseClient.from('ai_settings').select('*');
    const aiSettings = aiSettingsArray?.[0] || {};
    // Padrão do Tracker é ser rápido e barato. "Otimização Máxima" no Tracker = gpt-4o-mini ou claude-3-haiku
    let openAiToken = Deno.env.get('OPENAI_API_KEY') || aiSettings.api_key;
    if (!openAiToken) {
       console.log("Tracker cancelado: Sem chave de API");
       return new Response(JSON.stringify({ error: 'No API key' }), { headers: corsHeaders, status: 500 });
    }

    // 2. Busca todas as mensagens não auditadas
    const { data: pendingMsgs } = await supabaseClient
      .from('chat_messages')
      .select('*, leads!inner(id, funnel_stage, ai_scratchpad)')
      .eq('ai_audited', false)
      .order('created_at', { ascending: true });

    if (!pendingMsgs || pendingMsgs.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma mensagem pendente' }), { headers: corsHeaders });
    }

    // Agrupa por lead
    const leadsMap = new Map<string, { stage: string, scratchpad: string, msgs: any[] }>();
    for (const msg of pendingMsgs) {
      if (!leadsMap.has(msg.lead_id)) {
        leadsMap.set(msg.lead_id, {
          stage: msg.leads.funnel_stage,
          scratchpad: msg.leads.ai_scratchpad || '',
          msgs: []
        });
      }
      leadsMap.get(msg.lead_id)!.msgs.push(msg);
    }

    for (const [leadId, data] of leadsMap.entries()) {
       // Se o lead já estiver fechado, o Tracker ignora e apenas marca as mensagens como lidas
       if (data.stage === 'closed_won' || data.stage === 'closed_lost') {
          await supabaseClient.from('chat_messages').update({ ai_audited: true }).in('id', data.msgs.map(m => m.id));
          continue;
       }

       const transcript = data.msgs.map(m => `[${m.sender_type.toUpperCase()}] ${m.message_content || m.audio_description || '[MÍDIA]'}`).join('\n');
       
       const prompt = `Você é o Rastreador de Funil.
Sua missão é atualizar o estágio do lead e resumir as últimas mensagens.
REGRA DE OURO DO FUNIL: O funil SÓ ANDA PARA FRENTE: lead -> contacted -> proposal -> negotiation -> closed_won OU closed_lost. Se a conversa esfriou mas não foi perdida oficialmente, mantenha no estágio atual. NUNCA regrida o estágio.

Histórico do Lead (Scratchpad atual):
${data.scratchpad}

Novas mensagens a avaliar:
${transcript}

Responda EXATAMENTE neste formato JSON:
{
  "new_funnel_stage": "um dos estágios permitidos (mantenha o atual se não houver avanço claro)",
  "append_to_scratchpad": "Um breve parágrafo com as novas informações importantes (objeções, valores, agendamentos) para ser concatenado no final do scratchpad histórico."
}`;

       const response = await fetch("https://api.openai.com/v1/chat/completions", {
         method: "POST",
         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openAiToken}` },
         body: JSON.stringify({
           model: "gpt-4o-mini", // Tracker usa modelo barato sempre
           messages: [{ role: "user", content: prompt }],
           response_format: { type: "json_object" },
           temperature: 0.1
         })
       });

       if (!response.ok) {
         console.error(`Falha na API pro lead ${leadId}`, await response.text());
         continue;
       }

       const jsonRaw = await response.json();
       const parsed = extractJSON(jsonRaw.choices[0].message.content);

       const newScratchpad = `${data.scratchpad}\n[Atualização]: ${parsed.append_to_scratchpad}`.trim();
       
       // Atualiza Lead
       await supabaseClient.from('leads').update({
         funnel_stage: parsed.new_funnel_stage,
         ai_scratchpad: newScratchpad
       }).eq('id', leadId);

       // Marca msgs como lidas
       await supabaseClient.from('chat_messages').update({ ai_audited: true }).in('id', data.msgs.map(m => m.id));
    }

    return new Response(JSON.stringify({ success: true, processed_leads: leadsMap.size }), { headers: corsHeaders });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { headers: corsHeaders, status: 500 });
  }
});
