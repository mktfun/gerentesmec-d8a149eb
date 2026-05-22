import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qtjitszradxsmnilnqtj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStatus() {
  console.log("Checking integration_settings...");
  const { data: settings } = await supabase.from('integration_settings').select('*');
  console.log(settings);

  console.log("\nChecking last 5 messages...");
  const { data: msgs } = await supabase.from('chat_messages').select('id, lead_id, created_at, content, chatwoot_message_id').order('created_at', { ascending: false }).limit(5);
  console.log(msgs);
  
  console.log("\nChecking leads updated recently...");
  const { data: leads } = await supabase.from('leads').select('id, customer_name, last_message_at').order('last_message_at', { ascending: false }).limit(5);
  console.log(leads);
}

checkStatus();
