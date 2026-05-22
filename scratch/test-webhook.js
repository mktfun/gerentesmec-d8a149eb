import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = "https://qtjitszradxsmnilnqtj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testWebhook() {
  const url = `${SUPABASE_URL}/functions/v1/chatwoot-webhook`;
  
  // Get secret from DB
  const { data: settings } = await supabase
    .from('integration_settings')
    .select('chatwoot_webhook_secret')
    .limit(1)
    .maybeSingle();

  const secret = settings?.chatwoot_webhook_secret || '';
  console.log('Secret:', secret);

  const payload = {
    event: 'message_created',
    inbox_id: 1, 
    message_type: 'incoming',
    content: 'Olá, gostaria de saber sobre a simulação.',
    conversation: {
      id: 99999,
      inbox_id: 1,
      labels: []
    },
    sender: {
      id: 88888,
      name: 'Tester Simulation',
      phone_number: '+5511999999999',
      type: 'contact'
    }
  };

  const rawBody = JSON.stringify(payload);

  const signature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature': `sha256=${signature}`
      },
      body: rawBody
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (error) {
    console.error('Error fetching:', error);
  }
}

testWebhook();
