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
    
    // Validate Signature if secret is configured
    const { data: settings } = await supabase
      .from('integration_settings')
      .select('chatwoot_webhook_secret')
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
    const ignoredLabels = ['fornecedor', 'dono', 'ignorar', 'ignore', 'equipe', 'grupo'];
    const hasIgnoredLabel = labels.some(label => ignoredLabels.includes(label.toLowerCase()));
    
    if (hasIgnoredLabel) {
      console.log('Ignored due to label filter:', labels);
      return new Response(JSON.stringify({ message: "Ignored by label filter" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // 2. Extract Data
    // For `message_created`, it's in payload.inbox.id. For `conversation_created`, it's payload.inbox_id
    const inboxId = payload.inbox?.id || payload.inbox_id;
    if (!inboxId) {
      return new Response(JSON.stringify({ message: "No inbox id found" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Sender/Contact can be in different places depending on version and event
    const contact = payload.meta?.sender || payload.conversation?.meta?.sender || payload.sender || payload.contact || {};
    const conversationId = payload.conversation?.id || payload.id; // in conversation_created, payload.id is conversation id
    
    // Message specific data
    const message = payload.message || payload; // fallback to payload if not nested
    const messageId = event === 'message_created' ? message.id || payload.id : null;
    const content = message.content || payload.content;
    const messageType = Number(message.message_type ?? payload.message_type); // 0=incoming, 1=outgoing
    let senderType = 'bot';
    if (messageType === 0) senderType = 'contact';
    else if (messageType === 1 || messageType === 2) senderType = 'user';

    // 3. Match Unit by chatwoot_inbox_id
    const { data: unitData, error: unitError } = await supabase
      .from('units')
      .select('id')
      .eq('chatwoot_inbox_id', inboxId)
      .maybeSingle()

    if (unitError || !unitData) {
      console.log(`No mapped unit found for inbox id: ${inboxId}`);
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

    let leadId = null;

    if (existingLead) {
      leadId = existingLead.id;
      // Update existing lead's last message time
      await supabase
        .from('leads')
        .update({
          last_message_at: now
        })
        .eq('id', leadId)
    } else {
      // Insert new lead
      leadId = crypto.randomUUID()
      await supabase
        .from('leads')
        .insert({
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
        })
    }

    // 6. Insert Message History if it's a message
    if (event === 'message_created' && messageId && content) {
      // ignore errors for duplicates if message already exists
      await supabase
        .from('chat_messages')
        .insert({
          lead_id: leadId,
          chatwoot_message_id: messageId,
          content: content,
          sender_type: senderType,
          // created_at will default to now() in DB
        });
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
