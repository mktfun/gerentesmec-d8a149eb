import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('=== TESTE E2E DO WEBHOOK CHATWOOT ===');

  const { data: unit } = await supabase.from('units').select('chatwoot_inbox_id').not('chatwoot_inbox_id', 'is', null).limit(1).single();
  let inboxId = 1;
  if (unit) {
    inboxId = unit.chatwoot_inbox_id;
  } else {
    // Se não tiver chatwoot_inbox_id mapeado, atualiza um pra testes
    const { data: firstUnit } = await supabase.from('units').select('id').limit(1).single();
    await supabase.from('units').update({ chatwoot_inbox_id: 1 }).eq('id', firstUnit.id);
    console.log('Nenhum inbox mapeado. Mapeado Unit 1 para inbox_id = 1');
  }

  const mockConversationId = Math.floor(Math.random() * 1000000);

  const payload = {
    id: Math.floor(Math.random() * 1000000),
    event: 'message_created',
    inbox_id: inboxId,
    message_type: 'incoming',
    conversation: {
      id: mockConversationId,
      inbox_id: inboxId,
      meta: { sender: { id: 999, name: 'Joãozinho E2E', phone_number: '11999999988' } }
    },
    content: 'Oi mecânico, meu carro tá batendo biela! Segue o video.',
    attachments: [ { data_url: 'https://link.com/motor.mp4', file_type: 'video/mp4' } ]
  };

  const rawBody = JSON.stringify(payload);

  const { data: settings } = await supabase.from('integration_settings').select('chatwoot_webhook_secret').single();
  let signature = '';
  if (settings && settings.chatwoot_webhook_secret) {
    const hmac = crypto.createHmac('sha256', settings.chatwoot_webhook_secret);
    hmac.update(rawBody);
    signature = 'sha256=' + hmac.digest('hex');
  }

  const url = process.env.VITE_SUPABASE_URL + '/functions/v1/chatwoot-webhook';
  console.log('-> Disparando POST para:', url);
  
  const headers = { 'Content-Type': 'application/json' };
  if (signature) headers['x-hub-signature'] = signature;

  const res = await fetch(url, { method: 'POST', headers, body: rawBody });
  const status = res.status;
  const body = await res.text();
  console.log(`-> Resposta da Nuvem (HTTP ${status}):`, body);

  if (status === 200) {
    console.log('✔️ Webhook processou a mensagem! Verificando gravação no banco de dados...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const { data: messages } = await supabase.from('chat_messages').select('*').like('content', '%batendo biela%').order('created_at', { ascending: false }).limit(1);
    if (messages && messages.length > 0) {
      console.log('✔️ A mensagem entrou perfeitamente no Supabase:');
      console.log('   - Lead ID:', messages[0].lead_id);
      console.log('   - Media Type:', messages[0].media_type);
      console.log('   - Media URL:', messages[0].media_url);
      console.log('   - Conteúdo final extraído:', messages[0].content);
      console.log('\\nTeste E2E finalizado com SUCESSO! A nuvem está operante.');
    } else {
      console.log('❌ A API retornou 200, mas a mensagem não gravou no DB.');
    }
  }
}
run().catch(console.error);
