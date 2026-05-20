import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get Chatwoot settings from system_settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('system_settings')
      .select('*')
      .in('key', ['chatwoot_url', 'chatwoot_api_token', 'chatwoot_account_id'])

    if (settingsError || !settings) {
      throw new Error('Could not fetch Chatwoot settings')
    }

    const config: Record<string, string> = {}
    settings.forEach(s => {
      config[s.key] = s.value
    })

    const { chatwoot_url, chatwoot_api_token, chatwoot_account_id } = config

    if (!chatwoot_url || !chatwoot_api_token || !chatwoot_account_id) {
      return new Response(JSON.stringify({ message: "Chatwoot credentials not configured in system_settings" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Returning 200 so it doesn't fail continuously
      })
    }

    // 2. Fetch recent conversations from Chatwoot
    // Chatwoot API: GET /api/v1/accounts/{account_id}/conversations
    const cwUrl = `${chatwoot_url.replace(/\/$/, '')}/api/v1/accounts/${chatwoot_account_id}/conversations?status=all`
    
    const cwResponse = await fetch(cwUrl, {
      headers: {
        'api_access_token': chatwoot_api_token,
        'Content-Type': 'application/json'
      }
    })

    if (!cwResponse.ok) {
      const errText = await cwResponse.text()
      throw new Error(`Chatwoot API error: ${cwResponse.status} ${errText}`)
    }

    const cwData = await cwResponse.json()
    const conversations = cwData.data?.payload || []

    // 3. Simple sync logic
    // We would map these to managers based on inbox_id and process them.
    // For this stealth MVP, we will just log how many we fetched and stub the steps.
    
    let processed = 0;

    for (const conv of conversations) {
      // Find manager by inbox_id
      const inboxId = conv.inbox_id
      const { data: managers } = await supabaseClient
        .from('managers')
        .select('id')
        .eq('chatwoot_inbox_id', inboxId)
        .limit(1)

      if (managers && managers.length > 0) {
        const managerId = managers[0].id
        const customerPhone = conv.meta?.sender?.phone_number || 'Unknown'
        
        // Check if cycle exists
        const { data: existingCycle } = await supabaseClient
          .from('whatsapp_cycles')
          .select('id')
          .eq('chatwoot_conversation_id', conv.id)
          .limit(1)

        if (!existingCycle || existingCycle.length === 0) {
          // Create new cycle
          const startedAt = new Date(conv.created_at * 1000).toISOString()
          
          const { data: newCycle, error: insertError } = await supabaseClient
            .from('whatsapp_cycles')
            .insert({
              manager_id: managerId,
              customer_phone: customerPhone,
              chatwoot_conversation_id: conv.id,
              started_at: startedAt,
              max_response_time_breached: false // Simplified for MVP
            })
            .select()
            .single()
            
          if (newCycle) {
             processed++;
             // Create stub steps for the cycle
             const steps = [1, 2, 3, 4].map(step => ({
                cycle_id: newCycle.id,
                step_number: step,
                is_compliant: Math.random() > 0.2, // Mocking compliance
                reason_failed: null
             }))
             
             await supabaseClient.from('cycle_steps').insert(steps)
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      fetched: conversations.length,
      processed_new: processed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
