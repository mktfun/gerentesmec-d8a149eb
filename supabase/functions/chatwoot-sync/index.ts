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

    // 1. Fetch integration settings from DB
    const { data: settings, error: settingsErr } = await supabase
      .from('integration_settings')
      .select('chatwoot_url, chatwoot_token')
      .limit(1)
      .maybeSingle()

    if (settingsErr || !settings || !settings.chatwoot_url || !settings.chatwoot_token) {
      throw new Error('Chatwoot credentials not found in integration_settings')
    }

    const baseUrl = settings.chatwoot_url.replace(/\/$/, '')
    const token = settings.chatwoot_token
    const headers = { 'api_access_token': token }

    // 2. Fetch Profile to get account_id
    const profileRes = await fetch(`${baseUrl}/api/v1/profile`, { headers })
    if (!profileRes.ok) throw new Error(`Failed to fetch Chatwoot profile: ${profileRes.statusText}`)
    const profileData = await profileRes.json()
    const accountId = profileData.account_id

    if (!accountId) throw new Error('Account ID not found in Chatwoot profile')

    // 3. Fetch Inboxes to map inbox_id -> Unit
    const inboxesRes = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/inboxes`, { headers })
    if (!inboxesRes.ok) throw new Error(`Failed to fetch inboxes: ${inboxesRes.statusText}`)
    const inboxesData = await inboxesRes.json()
    const inboxes = inboxesData.payload || []

    // Fetch our Units from DB
    const { data: units } = await supabase.from('units').select('id, name')
    const { data: managers } = await supabase.from('managers').select('id, unit_id')

    // Map Chatwoot Inbox ID to our Unit ID
    const inboxToUnitMap = new Map<number, { unitId: string, managerId: string | null }>()
    for (const inbox of inboxes) {
      const matchedUnit = units?.find(u => u.name.toLowerCase() === inbox.name.toLowerCase())
      if (matchedUnit) {
        const manager = managers?.find(m => m.unit_id === matchedUnit.id)
        inboxToUnitMap.set(inbox.id, { unitId: matchedUnit.id, managerId: manager?.id || null })
      }
    }

    // 4. Fetch Open Conversations
    const convRes = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/conversations?status=open`, { headers })
    if (!convRes.ok) throw new Error(`Failed to fetch conversations: ${convRes.statusText}`)
    const convData = await convRes.json()
    const conversations = convData.data?.payload || []

    let importedCount = 0

    // 5. Upsert Leads
    const now = new Date().toISOString()
    
    // Process conversations sequentially or via Promise.all mapping
    for (const conv of conversations) {
      const mapped = inboxToUnitMap.get(conv.inbox_id)
      if (!mapped) continue // Conversation belongs to an inbox not mapped to any unit

      const contact = conv.meta?.sender || {}
      const customerName = contact.name || 'Cliente Desconhecido'
      const customerPhone = contact.phone_number || contact.email || 'Sem Contato'
      const lastActivity = conv.timestamp ? new Date(conv.timestamp * 1000).toISOString() : now

      // Check if already exists to decide between insert or update
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('chatwoot_conversation_id', conv.id)
        .maybeSingle()

      if (existingLead) {
        // Update last message time
        await supabase
          .from('leads')
          .update({ last_message_at: lastActivity })
          .eq('id', existingLead.id)
      } else {
        // Insert new lead
        const newLeadId = crypto.randomUUID()
        await supabase
          .from('leads')
          .insert({
            id: newLeadId,
            chatwoot_conversation_id: conv.id,
            chatwoot_contact_id: contact.id,
            customer_name: customerName,
            customer_phone: customerPhone,
            unit_id: mapped.unitId,
            manager_id: mapped.managerId,
            funnel_stage: 'lead_new',
            sla_status: 'ok',
            wait_time_minutes: 0,
            last_message_at: lastActivity,
          })
        importedCount++
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Historical sync completed. ${importedCount} new leads imported.` 
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
