import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Garante https:// na URL */
const normalizeUrl = (url: string) => {
  const trimmed = url.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase config missing')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // 1. Puxar configurações do Chatwoot
    const { data: settings, error: setErr } = await supabase
      .from('integration_settings')
      .select('chatwoot_url, chatwoot_token, chatwoot_account_id')
      .limit(1)
      .maybeSingle()

    if (setErr || !settings?.chatwoot_url || !settings?.chatwoot_token) {
      return new Response(JSON.stringify({ error: 'Configurações do Chatwoot ausentes. Configure a URL e o Token na tela de Configurações.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      })
    }

    if (!settings.chatwoot_account_id) {
      return new Response(JSON.stringify({ error: 'Account ID não configurado. Salve o Account ID na tela de Configurações antes de sincronizar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      })
    }

    const baseUrl = normalizeUrl(settings.chatwoot_url)
    const token = settings.chatwoot_token
    const accountId = settings.chatwoot_account_id
    const headers = { 'api_access_token': token }

    // 2. Puxar units e managers do nosso banco
    const { data: units } = await supabase.from('units').select('id, chatwoot_inbox_id, phone')
    const { data: managers } = await supabase.from('managers').select('id, unit_id')

    const getUnitByInbox = (inboxId: number) => units?.find(u => u.chatwoot_inbox_id === inboxId)?.id || null
    const getManagerByUnit = (unitId: string) => managers?.find(m => m.unit_id === unitId)?.id || null
    const unitPhones = new Set(units?.map(u => u.phone).filter(Boolean))

    // 3. Varrer conversas (últimas 3 páginas)
    let allConversations: any[] = []
    for (let page = 1; page <= 3; page++) {
      try {
        const res = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/conversations?status=all&page=${page}`, { headers })
        if (!res.ok) break
        const data = await res.json()
        const payload = data?.data?.payload || []
        if (!payload.length) break
        allConversations = [...allConversations, ...payload]
      } catch {
        break
      }
    }

    let synced = 0
    let skipped = 0

    for (const conv of allConversations) {
      const unitId = getUnitByInbox(conv.inbox_id)
      if (!unitId) { skipped++; continue }

      const contact = conv.meta?.sender || {}
      const contactPhone = contact.phone_number

      // Ignora contatos que são unidades (mecânicos testando)
      if (contactPhone && unitPhones.has(contactPhone)) { skipped++; continue }

      const managerId = getManagerByUnit(unitId)
      const convTimestamp = conv.timestamp ? new Date(conv.timestamp * 1000).toISOString() : new Date().toISOString()
      const convCreated = conv.created_at ? new Date(conv.created_at * 1000).toISOString() : convTimestamp

      // Upsert lead
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('chatwoot_conversation_id', conv.id)
        .maybeSingle()

      let leadId = existingLead?.id

      if (!leadId) {
        leadId = crypto.randomUUID()
        await supabase.from('leads').insert({
          id: leadId,
          chatwoot_conversation_id: conv.id,
          chatwoot_contact_id: contact.id,
          customer_name: contact.name || 'Cliente Desconhecido',
          customer_phone: contactPhone || contact.email || 'Sem Contato',
          unit_id: unitId,
          manager_id: managerId,
          funnel_stage: conv.status === 'resolved' ? 'closed_won' : 'lead_new',
          sla_status: 'ok',
          wait_time_minutes: 0,
          last_message_at: convTimestamp,
          created_at: convCreated,
        })
      }

      // Puxar e upsert mensagens
      try {
        const msgRes = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/conversations/${conv.id}/messages`, { headers })
        if (!msgRes.ok) continue
        const msgData = await msgRes.json()
        const messages = msgData.payload || []

        for (const msg of messages) {
          if (!msg.content && (!msg.attachments || msg.attachments.length === 0)) continue

          // Variável de Ouro: message_type
          const rawMessageType = msg.message_type
          const messageType = Number(rawMessageType)
          let senderType = 'bot'

          if (messageType === 0 || rawMessageType === 'incoming') {
            senderType = 'contact'
          } else if (messageType === 1 || messageType === 2 || rawMessageType === 'outgoing' || rawMessageType === 'template') {
            senderType = 'user'
          } else {
            const sType = msg.sender?.type?.toLowerCase()
            if (sType === 'contact' || sType === 'user') senderType = sType
          }

          let mediaUrl = null
          let mediaType = null
          if (msg.attachments?.length > 0) {
            mediaUrl = msg.attachments[0].data_url
            mediaType = msg.attachments[0].file_type
          }

          // Ignora se já existe
          const { data: existing } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('chatwoot_message_id', msg.id)
            .maybeSingle()

          if (!existing) {
            await supabase.from('chat_messages').insert({
              lead_id: leadId,
              chatwoot_message_id: msg.id,
              content: msg.content || null,
              sender_type: senderType,
              media_url: mediaUrl,
              media_type: mediaType,
              created_at: msg.created_at ? new Date(msg.created_at * 1000).toISOString() : new Date().toISOString()
            })
          }
        }
      } catch {
        // ignora erros por conversa individual
      }

      synced++
    }

    return new Response(JSON.stringify({
      message: `✅ ${synced} conversas sincronizadas. ${skipped} ignoradas (sem inbox mapeada ou número de unidade).`,
      synced,
      skipped,
      total: allConversations.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Sync error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
