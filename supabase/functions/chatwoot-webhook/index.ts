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

    // 1. Validate event types we care about
    const event = payload.event
    if (event !== 'conversation_created' && event !== 'message_created') {
      return new Response(JSON.stringify({ message: "Event ignored" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // 2. Extract Data
    const inboxName = payload.inbox?.name
    if (!inboxName) {
      return new Response(JSON.stringify({ message: "No inbox name found" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    const contact = payload.contact || (payload.conversation && payload.conversation.meta?.sender) || {}
    const conversationId = payload.conversation?.id || payload.id // in conversation_created, payload.id is conversation id

    // 3. Match Unit
    const { data: unitData, error: unitError } = await supabase
      .from('units')
      .select('id')
      .ilike('name', inboxName)
      .maybeSingle()

    if (unitError || !unitData) {
      console.log(`No mapped unit found for inbox: ${inboxName}`);
      return new Response(JSON.stringify({ message: "Unmapped unit" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // 4. Find Manager for the unit
    const { data: managerData } = await supabase
      .from('managers')
      .select('id')
      .eq('unit_id', unitData.id)
      .limit(1)
      .maybeSingle()

    // 5. Check if Lead already exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('chatwoot_conversation_id', conversationId)
      .maybeSingle()

    const now = new Date().toISOString()
    const customerName = contact.name || 'Cliente Desconhecido'
    const customerPhone = contact.phone_number || contact.email || 'Sem Contato'

    if (existingLead) {
      // Update existing lead's last message time
      await supabase
        .from('leads')
        .update({
          last_message_at: now
        })
        .eq('id', existingLead.id)
    } else {
      // Insert new lead
      const newLeadId = crypto.randomUUID()
      await supabase
        .from('leads')
        .insert({
          id: newLeadId,
          chatwoot_conversation_id: conversationId,
          chatwoot_contact_id: contact.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          unit_id: unitData.id,
          manager_id: managerData?.id || null,
          funnel_stage: 'lead_new',
          sla_status: 'ok',
          wait_time_minutes: 0,
          last_message_at: now,
        })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
