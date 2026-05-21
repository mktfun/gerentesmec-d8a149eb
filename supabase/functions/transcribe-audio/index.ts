import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase Config Missing')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const payload = await req.json()

    // Assuming it's triggered via Database Webhook on INSERT
    const record = payload.record || payload;
    
    if (!record || !record.id || record.media_type !== 'audio' || !record.media_url) {
      return new Response(JSON.stringify({ message: "Not an audio message" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // 1. Fetch AI Settings
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (!aiSettings || !aiSettings.api_key) {
      throw new Error("AI Settings not configured")
    }

    const provider = aiSettings.provider || 'openai';
    
    // 2. Download the audio file
    const audioRes = await fetch(record.media_url);
    if (!audioRes.ok) throw new Error("Failed to download audio");
    
    const arrayBuffer = await audioRes.arrayBuffer();
    // Groq and OpenAI need a File/Blob in FormData
    const blob = new Blob([arrayBuffer]);
    
    let transcription = "";
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

    // 3. Route according to provider
    if (provider === 'groq') {
      const formData = new FormData();
      formData.append("file", blob, "audio.ogg");
      formData.append("model", "whisper-large-v3");
      formData.append("response_format", "json");

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${aiSettings.api_key}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Groq Error");
      transcription = data.text;
    } 
    else if (provider === 'gemini') {
      // Gemini natively accepts base64
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      // Note: MIME type is guessed, assuming ogg or mp3. We can just use audio/mp3 or let it infer if not strict.
      const mimeType = "audio/mp3"; // Or read from response headers

      const model = aiSettings.model || 'gemini-1.5-flash';
      const body = {
        contents: [{
          parts: [
            { text: "Transcreva este áudio na íntegra de forma exata e limpa, sem adicionar comentários." },
            { inline_data: { mime_type: mimeType, data: base64Audio } }
          ]
        }]
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiSettings.api_key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gemini Error");
      transcription = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    else {
      // default: openai
      const formData = new FormData();
      formData.append("file", blob, "audio.mp3");
      formData.append("model", "whisper-1");

      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${aiSettings.api_key}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "OpenAI Error");
      transcription = data.text;
    }

    if (transcription) {
      // 4. Update the record
      const finalContent = `[🎙️ Áudio Transcrito: via ${providerName}]\n${transcription.trim()}`;
      await supabase
        .from('chat_messages')
        .update({ content: finalContent })
        .eq('id', record.id);
    }

    return new Response(JSON.stringify({ success: true, transcription }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
