import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qtjitszradxsmnilnqtj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testAiAuditor() {
  const url = `${SUPABASE_URL}/functions/v1/ai-auditor`;
  
  // We need a real lead_id and chat_message_id to test properly
  const { data: leads } = await supabase.from('leads').select('id, funnel_stage').limit(1);
  if (!leads || leads.length === 0) {
    console.log("No leads found");
    return;
  }
  const lead = leads[0];
  console.log('Testing with lead:', lead.id, 'Stage:', lead.funnel_stage);

  // create a dummy message
  const { data: message, error: msgErr } = await supabase.from('chat_messages').insert({
    lead_id: lead.id,
    content: "Poxa, o valor ficou um pouco alto, consegue fazer um desconto à vista?",
    sender_type: 'contact',
    chatwoot_message_id: 'test-' + Date.now()
  }).select('*').single();

  if (msgErr) {
    console.error("Msg error:", msgErr);
    return;
  }

  const payload = {
    record: message
  };

  try {
    console.log('Sending payload to ai-auditor...');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);

    const { data: updatedLead } = await supabase.from('leads').select('funnel_stage').eq('id', lead.id).single();
    console.log('Lead stage is now:', updatedLead?.funnel_stage);
  } catch (error) {
    console.error('Error fetching:', error);
  }
}

testAiAuditor();
