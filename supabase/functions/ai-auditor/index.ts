import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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

    let analysisResult = null;
    const content = record.content.toLowerCase();

    // Cognitive Router (Simulated via fast heuristics for performance, could be an LLM call)
    if (content.includes('http') && (content.includes('.jpg') || content.includes('.png') || content.includes('.mp4') || content.includes('video'))) {
      analysisResult = await analyzeVision(record.content, OPENAI_API_KEY);
    } else if (content.includes('http') && (content.includes('.ogg') || content.includes('.mp3') || content.includes('.wav') || content.includes('audio'))) {
      analysisResult = await analyzeAudio(record.content, OPENAI_API_KEY);
    } else {
      analysisResult = { type: 'text', summary: record.content };
    }

    // Invoke Judge Mind
    const auditRes = await judgeLead(record.lead_id, analysisResult, supabaseClient, OPENAI_API_KEY);

    // Update message as audited
    await supabaseClient.from('chat_messages').update({ 
      ai_audited: true, 
      ai_summary: analysisResult.summary 
    }).eq('id', record.id);

    return new Response(JSON.stringify({ status: 'audited', auditRes }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("AI Auditor Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 })
  }
})
