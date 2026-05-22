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
    const { action, conversation_id, labels } = await req.json();

    if (!action || !conversation_id) {
      return new Response(JSON.stringify({ error: 'Missing action or conversation_id' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar credenciais do Chatwoot do DB
    const { data: settings } = await supabaseClient
      .from('integration_settings')
      .select('chatwoot_url, chatwoot_token, chatwoot_account_id')
      .limit(1)
      .maybeSingle();

    if (!settings?.chatwoot_url || !settings?.chatwoot_token || !settings?.chatwoot_account_id) {
      return new Response(JSON.stringify({ error: 'Integration settings missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const baseUrl = settings.chatwoot_url.startsWith('http')
      ? settings.chatwoot_url.replace(/\/$/, '')
      : `https://${settings.chatwoot_url.replace(/\/$/, '')}`;

    if (action === 'add_labels') {
      // 1. Fetch existing labels so we don't overwrite them
      const getRes = await fetch(`${baseUrl}/api/v1/accounts/${settings.chatwoot_account_id}/conversations/${conversation_id}/labels`, {
        method: 'GET',
        headers: { 'api_access_token': settings.chatwoot_token },
      });
      let existingLabels: string[] = [];
      if (getRes.ok) {
        const getLabelData = await getRes.json();
        existingLabels = getLabelData.payload || [];
      }

      // 2. Merge with new labels (deduplicate)
      const mergedLabels = Array.from(new Set([...existingLabels, ...(labels || [])]));

      const response = await fetch(`${baseUrl}/api/v1/accounts/${settings.chatwoot_account_id}/conversations/${conversation_id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api_access_token': settings.chatwoot_token },
        body: JSON.stringify({ labels: mergedLabels })
      });

      if (!response.ok) {
        throw new Error(`Chatwoot API error: ${response.statusText}`);
      }

      const result = await response.json();
      return new Response(JSON.stringify({ status: 'success', data: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });

  } catch (error: any) {
    console.error('Error in chatwoot-action:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
