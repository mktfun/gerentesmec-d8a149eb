import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("Missing env variables.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function syncHistory() {
  console.log("Iniciando Sync Histórico do Chatwoot...");

  // Puxar configurações de integração para pegar a API Key do Chatwoot e URL
  const { data: settings, error: setErr } = await supabase.from('integration_settings').select('*').limit(1).maybeSingle();
  if (setErr || !settings || !settings.chatwoot_url || !settings.chatwoot_token) {
    console.error("Configurações do Chatwoot ausentes na tabela integration_settings");
    process.exit(1);
  }

  const chatwoot_url = settings.chatwoot_url.startsWith('http') ? settings.chatwoot_url : `https://${settings.chatwoot_url}`;
  const chatwoot_token = settings.chatwoot_token;
  const baseUrl = chatwoot_url.replace(/\/$/, '');
  const headers = { 'api_access_token': chatwoot_token };

  // Fetch true account id
  const profileRes = await fetch(`${baseUrl}/api/v1/profile`, { headers });
  const profileData = await profileRes.json();
  const chatwoot_account_id = profileData.account_id || settings.chatwoot_account_id || 1;
  console.log("Usando Account ID:", chatwoot_account_id);

  console.log(`🧹 Limpando tabelas chat_messages e leads...`);
  // Deletar mensagens e leads antigos
  await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log(`📥 Puxando Inbox e Unidades...`);
  const { data: units } = await supabase.from('units').select('id, chatwoot_inbox_id');
  const { data: managers } = await supabase.from('managers').select('id, unit_id');

  const getManagerByUnit = (unitId: string) => managers?.find(m => m.unit_id === unitId)?.id || null;
  const getUnitByInbox = (inboxId: number) => units?.find(u => u.chatwoot_inbox_id === inboxId)?.id || null;

  console.log(`📡 Puxando Conversas (Últimos dias)...`);
  
  let page = 1;
  let allConversations: any[] = [];
  
  // Vamos puxar as últimas 3 páginas (aproximadamente 45-60 conversas recentes)
  while (page <= 3) {
    try {
      const res = await fetch(`${baseUrl}/api/v1/accounts/${chatwoot_account_id}/conversations?status=all&page=${page}`, { headers });
      const data = await res.json();
      if (data.data?.payload?.length) {
        allConversations = [...allConversations, ...data.data.payload];
        page++;
      } else {
        break;
      }
    } catch (err) {
      console.error("Erro ao puxar conversas na pag", page, err);
      break;
    }
  }

  console.log(`Encontradas ${allConversations.length} conversas. Processando...`);

  for (const conv of allConversations) {
    const unitId = getUnitByInbox(conv.inbox_id);
    if (!unitId) continue; // Ignora se não é uma inbox mapeada
    
    const managerId = getManagerByUnit(unitId);
    const contact = conv.meta?.sender;
    if (!contact) continue;
    
    // Ignora se o contato é a propria unidade (mecânico testando)
    const contactPhone = contact.phone_number;
    if (contactPhone && units?.find(u => u.phone === contactPhone)) {
        continue;
    }

    const leadId = crypto.randomUUID();
    
    // Calcula último horário de mensagem do array summary da conversa
    const now = new Date(conv.timestamp * 1000).toISOString();
    
    const insertData: any = {
      id: leadId,
      chatwoot_conversation_id: conv.id,
      chatwoot_contact_id: contact.id,
      customer_name: contact.name || 'Cliente Desconhecido',
      customer_phone: contact.phone_number || contact.email || 'Sem Contato',
      unit_id: unitId,
      manager_id: managerId,
      funnel_stage: conv.status === 'open' ? 'lead_new' : (conv.status === 'resolved' ? 'closed_won' : 'lead_new'),
      sla_status: 'ok',
      wait_time_minutes: 0,
      last_message_at: now,
      created_at: new Date(conv.created_at * 1000).toISOString(),
    };

    await supabase.from('leads').insert(insertData);

    // Puxar Mensagens da Conversa
    try {
      const msgRes = await fetch(`${baseUrl}/api/v1/accounts/${chatwoot_account_id}/conversations/${conv.id}/messages`, { headers });
      const msgData = await msgRes.json();
      const messages = msgData.payload || [];

      for (const msg of messages) {
        if (!msg.content && (!msg.attachments || msg.attachments.length === 0)) continue;

        const rawMessageType = msg.message_type;
        const messageType = Number(rawMessageType);
        
        let senderType = 'bot';

        // 1. Variável de ouro: message_type
        if (messageType === 0 || rawMessageType === 'incoming') {
          senderType = 'contact';
        } else if (messageType === 1 || messageType === 2 || rawMessageType === 'outgoing' || rawMessageType === 'template') {
          senderType = 'user';
        } else {
          // Fallback
          const sType = msg.sender?.type?.toLowerCase();
          if (sType === 'contact' || sType === 'user') {
            senderType = sType;
          }
        }

        let mediaUrl = null;
        let mediaType = null;
        if (msg.attachments && msg.attachments.length > 0) {
          mediaUrl = msg.attachments[0].data_url;
          mediaType = msg.attachments[0].file_type;
        }

        await supabase.from('chat_messages').insert({
          lead_id: leadId,
          chatwoot_message_id: msg.id,
          content: msg.content || null,
          sender_type: senderType,
          media_url: mediaUrl,
          media_type: mediaType,
          created_at: new Date(msg.created_at * 1000).toISOString()
        });
      }
    } catch (e) {
      console.error(`Erro ao puxar mensagens da conv ${conv.id}`, e);
    }
  }

  console.log("✅ Sync Finalizado com Sucesso!");
}

syncHistory();
