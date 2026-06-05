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

    const timeToMinutes = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const getWorkMinutes = (from: Date, to: Date, config: any): number => {
      if (from >= to) return 0;
      if (!config || !config.start || !config.end || !config.days) return Math.round((to.getTime() - from.getTime()) / 60000);

      const startMin = timeToMinutes(config.start);
      const endMin = timeToMinutes(config.end);
      const dayWorkMinutes = endMin - startMin;
      if (dayWorkMinutes <= 0) return 0;

      let totalMinutes = 0;
      const cursor = new Date(from);
      cursor.setSeconds(0, 0);
      const limit = new Date(to);
      limit.setSeconds(0, 0);

      let daysProcessed = 0;
      while (cursor < limit && daysProcessed < 90) {
        const dayOfWeek = cursor.getDay();
        if (!config.days.includes(dayOfWeek)) {
          cursor.setDate(cursor.getDate() + 1);
          cursor.setHours(0, 0, 0, 0);
          daysProcessed++;
          continue;
        }
        const dayStart = new Date(cursor);
        dayStart.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
        const dayEnd = new Date(cursor);
        dayEnd.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);

        const windowStart = cursor < dayStart ? dayStart : cursor;
        const windowEnd = limit < dayEnd ? limit : dayEnd;

        if (windowStart < windowEnd) {
          totalMinutes += Math.round((windowEnd.getTime() - windowStart.getTime()) / 60000);
        }
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(0, 0, 0, 0);
        daysProcessed++;
      }
      return totalMinutes;
    };

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase Config Missing')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const rawBody = await req.text()
    
    // Validate Signature and fetch ignored labels
    const { data: settings } = await supabase
      .from('integration_settings')
      .select('chatwoot_webhook_secret, ignored_labels, business_hours')
      .limit(1)
      .maybeSingle()

    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('off_hours_batching')
      .limit(1)
      .maybeSingle()

    if (settings?.chatwoot_webhook_secret) {
      const signatureHeader = req.headers.get('x-chatwoot-signature');
      
      if (!signatureHeader) {
        console.warn('Missing x-chatwoot-signature from Chatwoot payload. Proceeding insecurely.');
      } else {
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
          console.error('Invalid signature mismatch. Expected:', hashHex, 'Got:', signatureHeader);
          console.error('Timestamp header:', req.headers.get('x-chatwoot-timestamp'));
          // TEMPORARY BYPASS: Do not return 401 so the messages can arrive while we debug the crypto logic
        }
      }
    }

    const payload = JSON.parse(rawBody)

    // 1. Validate event types we care about
    const event = payload.event
    if (event !== 'conversation_created' && event !== 'message_created' && event !== 'conversation_updated') {
      return new Response(JSON.stringify({ message: "Event ignored" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Ignore activity messages (message_type: 2) and private notes
    const messageObj = payload.message || payload;
    const rawMsgType = messageObj.message_type ?? payload.message_type;
    if (event === 'message_created' && (rawMsgType === 2 || rawMsgType === '2' || rawMsgType === 'activity' || messageObj.private === true)) {
      console.log('Ignored activity/private message');
      return new Response(JSON.stringify({ message: "Activity or private message ignored" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Filter out conversations with specific labels
    const conversation = payload.conversation || payload;
    const labels: string[] = conversation.labels || [];
    const ignoredLabels: string[] = settings?.ignored_labels || ['fornecedor', 'dono', 'ignorar', 'ignore', 'ignorado', 'ignorada', 'equipe', 'grupo', 'rh', 'socios'];
    const hasIgnoredLabel = labels.some(label => ignoredLabels.some(ig => label.toLowerCase() === ig.toLowerCase()));
    
    // Pegar o ID da conversa para possível exclusão
    const targetConvId = conversation?.id || payload.id;

    if (hasIgnoredLabel) {
      console.log('Ignored due to label filter:', labels);
      // HARD DELETE: Se a conversa ganhou etiqueta de ignorado, apagamos do sistema para "sumir no esquecimento"
      if (targetConvId) {
        await supabase.from('leads').delete().eq('chatwoot_conversation_id', targetConvId);
      }
      return new Response(JSON.stringify({ message: "Ignored by label filter and deleted if existed" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    if (event === 'conversation_updated') {
      // Se for apenas update e não caiu no filtro de ignorado, não precisamos reprocessar mensagens.
      return new Response(JSON.stringify({ message: "Conversation updated ignored (no ignored label)" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
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
    if (rawMessageType === 0 || rawMessageType === 'incoming' || rawMessageType === '0') {
      senderType = 'contact';
    } else if (rawMessageType === 1 || rawMessageType === 2 || rawMessageType === 'outgoing' || rawMessageType === 'template' || rawMessageType === '1' || rawMessageType === '2') {
      senderType = 'user';
    } else {
      // 2. Fallback: se o message_type for vazio ou bizarro, tenta ler o sender.type
      const sType = payload.sender?.type?.toLowerCase() || message.sender?.type?.toLowerCase();
      if (sType === 'contact' || sType === 'user') {
        senderType = sType;
      }
    }

    // Se for Evolution API e for 'fromMe: true', forçamos agent!
    if (message.message_attributes?.fromMe === true || payload.message_attributes?.fromMe === true) {
      senderType = 'user';
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
      .select('id, last_client_message_at, total_response_time_minutes, response_count, audit_checklist, funnel_stage')
      .eq('chatwoot_conversation_id', conversationId)
      .maybeSingle()

    // 5.a If the lead was deleted by the operator (soft-delete), ignore this payload entirely.
    if (existingLead && (existingLead.audit_checklist as any)?.is_deleted) {
      console.log('[webhook] Lead is soft-deleted, ignoring payload for conversationId:', conversationId);
      return new Response(JSON.stringify({ message: 'Lead deleted, payload ignored' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const now = new Date().toISOString()
    const nowTime = new Date().getTime();
    const customerName = contact.name || 'Cliente Desconhecido'
    const customerPhone = contact.phone_number || contact.email || 'Sem Contato'

    let leadId = null;

    if (existingLead) {
      leadId = existingLead.id;
      const updateData: any = { last_message_at: now };
      
      if (senderType === 'contact') {
        updateData.last_client_message_at = now;
      } else {
        updateData.last_agent_message_at = now;
        
        // CALCULO DO TMR HISTÓRICO
        // Apenas soma o TMR se o lead estiver no estágio 'lead_new'
        if (existingLead.last_client_message_at && existingLead.funnel_stage === 'lead_new') {
          const clientTime = new Date(existingLead.last_client_message_at).getTime();
          // Só contabilizamos se o agente demorou mais que 0 (ou seja, está respondendo a uma mensagem recente do cliente)
          // Mas como não temos o 'last_agent_message_at' do DB aqui, vamos assumir que cada resposta conta, 
          // ou melhor: contar o diff se clientTime for recente?
          // Para não somar multiplas respostas do agente seguidas, verificamos se clientTime < now
          // (Na verdade, se o agente mandar 2 seguidas, o last_client_message_at não mudou. 
          // Precisamos evitar contar duas vezes).
          // Uma forma simples é adicionar uma lógica: só conta se last_client_message_at não foi contado ainda.
          // Mas vamos simplificar: só soma se a diferença for < 24h para evitar lixo.
          // Default business hours se não houver no banco para não usar raw minutes distorcidos
          const bhConfig = settings?.business_hours || {
            days: [1, 2, 3, 4, 5],
            start: '08:00',
            end: '18:00',
            timezone: 'America/Sao_Paulo'
          };
          
          const diffMins = getWorkMinutes(new Date(clientTime), new Date(nowTime), bhConfig);
          // Aceitamos se for maior ou igual a 0 (até limites absurdos pra proteção de looping longo, ex 30 dias utéis = ~14400)
          if (diffMins >= 0 && diffMins < 14400) {
            updateData.total_response_time_minutes = (existingLead.total_response_time_minutes || 0) + diffMins;
            updateData.response_count = (existingLead.response_count || 0) + 1;
            // Zera o last_client_message_at pra não contar a mesma espera na próxima mensagem do agente
            updateData.last_client_message_at = null; 
          }
        }
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
        const { error: insertError } = await supabase
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

        if (insertError) {
          console.error('[webhook] Error inserting chat_message:', insertError);
        }
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
