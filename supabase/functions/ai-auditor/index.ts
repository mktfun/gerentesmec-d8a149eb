import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { routeMessage } from "./skills/router.ts";
import { updateFunnelStage } from "./skills/funnel.ts";
import { judgeLead } from "./skills/judge.ts";
import { analyzeVision } from "./skills/vision.ts";
import { analyzeAudio } from "./skills/audio.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record || record.ai_audited) {
      return new Response(JSON.stringify({ status: 'ignored' }), { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

    // Fetch Lead Context and History
    const { data: lead } = await supabaseClient
      .from('leads')
      .select('funnel_stage')
      .eq('id', record.lead_id)
      .single();
      
    const currentStage = lead?.funnel_stage || 'lead_new';

    const { data: messages } = await supabaseClient
      .from('chat_messages')
      .select('content, sender_type')
      .eq('lead_id', record.lead_id)
      .order('created_at', { ascending: false })
      .limit(5);

    const history = (messages || []).reverse().map(m => `${m.sender_type}: ${m.content}`);

    // Cognitive Router Brain
    const content = record.content;
    const routerResult = await routeMessage(content, history, OPENAI_API_KEY);

    // Funnel Brain
    let newStage = currentStage;
    if (routerResult.requires_funnel_update) {
      newStage = await updateFunnelStage(record.lead_id, currentStage, routerResult, supabaseClient);
    }

    let analysisResult: any = { type: 'text', summary: routerResult.summary };

    // Media Brains (Invoked only if required by router)
    if (routerResult.requires_vision) {
      analysisResult = await analyzeVision(record.content, OPENAI_API_KEY);
      analysisResult.summary = routerResult.summary + "\n" + analysisResult.summary;
    } else if (routerResult.requires_audio) {
      analysisResult = await analyzeAudio(record.content, OPENAI_API_KEY);
      analysisResult.summary = routerResult.summary + "\n" + analysisResult.summary;
    }

    // Invoke Judge Brain
    const auditRes = await judgeLead(record.lead_id, analysisResult, supabaseClient, OPENAI_API_KEY);

    // Update message as audited
    await supabaseClient.from('chat_messages').update({ 
      ai_audited: true, 
      ai_summary: analysisResult.summary 
    }).eq('id', record.id);

    return new Response(JSON.stringify({ 
      status: 'audited', 
      intent: routerResult.intent,
      newStage,
      auditRes 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("AI Auditor Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 })
  }
})
