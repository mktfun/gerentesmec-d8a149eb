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
    const rawBody = await req.text()
    
    // Validate Signature and fetch ignored labels
    const { data: settings } = await supabase
      .from('integration_settings')
      .select('chatwoot_webhook_secret, ignored_labels')
      .limit(1)
      .maybeSingle()

    if (settings?.chatwoot_webhook_secret) {
      const signatureHeader = req.headers.get('x-hub-signature')
      if (!signatureHeader) {
        console.error('Missing x-hub-signature')
        return new Response(JSON.stringify({ message: "Missing signature" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
      }
      
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(settings.chatwoot_webhook_secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (signatureHeader !== hashHex && signatureHeader !== `sha256=${hashHex}`) {
        console.error('Invalid signature mismatch')
        return new Response(JSON.stringify({ message: "Invalid signature" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
      }
    }

    const payload = JSON.parse(rawBody)

    // 1. Validate event types we care about
    const event = payload.event
    if (event !== 'conversation_created' && event !== 'message_created') {
      return new Response(JSON.stringify({ message: "Event ignored" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Filter out conversations with specific labels
    const conversation = payload.conversation || payload;
    const labels: string[] = conversation.labels || [];
    const ignoredLabels: string[] = settings?.ignored_labels || ['fornecedor', 'dono', 'ignorar', 'ignore', 'equipe', 'grupo', 'rh', 'socios'];
    const hasIgnoredLabel = labels.some(label => ignoredLabels.some(ig => label.toLowerCase() === ig.toLowerCase()));
    
    if (hasIgnoredLabel) {
      console.log('Ignored due to label filter:', labels);
      return new Response(JSON.stringify({ message: "Ignored by label filter" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // 2. Extract Data
    // inboxId pode estar em locais diferentes dependendo do evento e versão do Chatwoot
    const inboxId = payload.inbox_id                          // message_created (top-level)
      || payload.conversation?.inbox_id                       // message_created (dentro de conversation)
      || payload.inbox?.id;                                   // fallback legacy

    console.log('[webhook] event:', event, '| inboxId:', inboxId, '| payload.inbox_id:', payload.inbox_id, '| payload.conversation?.inbox_id:', payload.conversation?.inbox_id);

    if (!inboxId) {
      console.log('[webhook] No inbox id found, exiting. payload keys:', Object.keys(payload));
      return new Response(JSON.stringify({ message: "No inbox id found" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Sender/Contact can be in different places depending on version and event
    const contact = payload.meta?.sender || payload.conversation?.meta?.sender || payload.sender || payload.contact || {};
    const conversationId = payload.conversation?.id || payload.id; // in conversation_created, payload.id is conversation id

    console.log('[webhook] conversationId:', conversationId, '| contact.name:', contact.name, '| contact.phone:', contact.phone_number);

    // Message specific data
    const message = payload.message || payload; // fallback to payload if not nested
    const messageId = event === 'message_created' ? message.id || payload.id : null;
    let content = message.content || payload.content || '';
    const rawMessageType = message.message_type ?? payload.message_type;
    const messageType = Number(rawMessageType);
    
    let senderType = 'bot';

    // 1. Variável de ouro: message_type
    if (messageType === 0 || rawMessageType === 'incoming') {
      senderType = 'contact';
    } else if (messageType === 1 || messageType === 2 || rawMessageType === 'outgoing' || rawMessageType === 'template') {
      senderType = 'user';
    } else {
      // 2. Fallback: se o message_type for vazio ou bizarro, tenta ler o sender.type
      const sType = payload.sender?.type?.toLowerCase() || message.sender?.type?.toLowerCase();
      if (sType === 'contact' || sType === 'user') {
        senderType = sType;
      }
    }

    // 3. Match Unit by chatwoot_inbox_id
    const { data: unitData, error: unitError } = await supabase
      .from('units')
      .select('id')
      .eq('chatwoot_inbox_id', inboxId)
      .maybeSingle()

    console.log('[webhook] unitData:', JSON.stringify(unitData), '| unitError:', unitError?.message);

    if (unitError || !unitData) {
      console.log(`[webhook] No mapped unit found for inbox id: ${inboxId}`);
      return new Response(JSON.stringify({ message: "Unmapped unit", inboxId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
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

    let leadId = null;

    if (existingLead) {
      leadId = existingLead.id;
      // Update existing lead's last message time
      const updateData: any = { last_message_at: now };
      if (senderType === 'contact') {
        updateData.last_client_message_at = now;
      } else {
        updateData.last_agent_message_at = now;
      }
      
      const { error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId)
      
      if (updateError) {
        console.error('Error updating lead last_message_at:', updateError)
      }
    } else {
      // 5.1 Check for cross-unit duplicate
      let isCrossUnit = false;
      if (customerPhone && customerPhone !== 'Sem Contato') {
        const { data: crossUnitLead } = await supabase
          .from('leads')
          .select('id')
          .eq('customer_phone', customerPhone)
          .neq('unit_id', unitData.id)
          .limit(1)
          .maybeSingle();
        if (crossUnitLead) {
          isCrossUnit = true;
        }
      }

      // Insert new lead
      leadId = crypto.randomUUID()
      const insertData: any = {
        id: leadId,
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
        is_cross_unit: isCrossUnit,
      };
      if (senderType === 'contact') {
        insertData.last_client_message_at = now;
      } else {
        insertData.last_agent_message_at = now;
      }
      
      await supabase
        .from('leads')
        .insert(insertData)
    }

    // 6. Insert Message History if it's a message
    if (event === 'message_created' && messageId) {
      let mediaUrl = null;
      let mediaType = null;
      if (message.attachments && message.attachments.length > 0) {
        mediaUrl = message.attachments[0].data_url;
        mediaType = message.attachments[0].file_type;
        content = (content + `\n[ANEXO ENVIADO: ${mediaType || 'mídia'}]`).trim();
      }
      
      // ignore errors for duplicates if message already exists
      if (content || mediaUrl) {
        await supabase
          .from('chat_messages')
          .insert({
            lead_id: leadId,
            chatwoot_message_id: messageId,
            content: content || '',
            sender_type: senderType,
            media_url: mediaUrl,
            media_type: mediaType
            // created_at will default to now() in DB
          });
      }
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
