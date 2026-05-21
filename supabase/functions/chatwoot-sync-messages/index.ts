import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // 1. Fetch integration settings from DB
    const { data: settings, error: settingsErr } = await supabase
      .from('integration_settings')
      .select('chatwoot_url, chatwoot_token')
      .limit(1)
      .maybeSingle()

    if (settingsErr || !settings || !settings.chatwoot_url || !settings.chatwoot_token) {
      throw new Error('Chatwoot credentials not found in integration_settings')
    }

    let baseUrl = settings.chatwoot_url.replace(/\/$/, '')
    if (!baseUrl.startsWith('http')) {
      baseUrl = 'https://' + baseUrl
    }
    const token = settings.chatwoot_token
    const headers = { 'api_access_token': token }

    // 2. Fetch Profile to get account_id
    const profileRes = await fetch(`${baseUrl}/api/v1/profile`, { headers })
    if (!profileRes.ok) throw new Error(`Failed to fetch Chatwoot profile: ${profileRes.statusText}`)
    const profileData = await profileRes.json()
    const accountId = profileData.account_id

    if (!accountId) throw new Error('Account ID not found in Chatwoot profile')

    // 3. Get all leads with chatwoot_conversation_id
    const { data: leads, error: leadsErr } = await supabase
      .from('leads')
      .select('id, chatwoot_conversation_id')
      .not('chatwoot_conversation_id', 'is', null)

    if (leadsErr || !leads) throw new Error('Error fetching leads: ' + leadsErr?.message)

    let updatedCount = 0;

    for (const lead of leads) {
      const convId = lead.chatwoot_conversation_id;
      // Fetch messages for conversation
      const messagesRes = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/conversations/${convId}/messages`, { headers })
      
      if (!messagesRes.ok) {
        console.error(`Failed to fetch messages for conv ${convId}: ${messagesRes.statusText}`)
        continue;
      }
      
      const messagesData = await messagesRes.json()
      const cwMessages = messagesData.payload || []

      for (const cwMsg of cwMessages) {
        const msgId = cwMsg.id;
        const msgType = Number(cwMsg.message_type);
        let senderType = 'bot';
        if (msgType === 0) senderType = 'contact';
        else if (msgType === 1 || msgType === 2) senderType = 'user';

        // Update in Supabase
        const { error: updateErr } = await supabase
          .from('chat_messages')
          .update({ sender_type: senderType })
          .eq('chatwoot_message_id', msgId)
          .eq('sender_type', 'bot') // Only update if it's currently bot (the buggy ones)

        if (!updateErr) {
          updatedCount++;
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Sync completed. Processed ${updatedCount} message updates.` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
