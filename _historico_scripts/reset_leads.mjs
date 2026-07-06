import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || "https://qtjitszradxsmnilnqtj.supabase.co";
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k";
const supabase = createClient(url, key);

const targetLeads = [
  "5a432279-e0db-4e62-b75a-09cabae7943f",
  "ee08ab26-2990-40a4-98ec-6f8124908682",
  "473979db-4696-41fc-a5d5-452105693f8a",
  "68b6b888-da61-481f-a4bf-df8f291c02fd",
  "b84b5739-bdab-4ebc-90df-4af4e684f8fb",
  "986bb7ab-aa1c-499d-8af7-2bd66cfc43b6",
  "569f9d1f-02bd-496f-8691-136bfb0c00a0",
  "e2bc46fe-631a-4572-b368-07992d764c76"
];

async function resetLeads() {
  console.log("Resetando leads afetados pelos bots fakes...");

  for (const id of targetLeads) {
    // Retorna para negociação para ser re-avaliado pela verdadeira Edge Function
    const { error: err1 } = await supabase.from('leads').update({
      funnel_stage: 'negotiation',
      score: null,
      audit_checklist: null,
      closing_summary: null
    }).eq('id', id);

    if (err1) {
      console.error(`Erro ao resetar lead ${id}:`, err1);
      continue;
    }

    // Marca mensagens como não auditadas para forçar a re-leitura
    const { error: err2 } = await supabase.from('chat_messages').update({
      ai_audited: false
    }).eq('lead_id', id);

    if (err2) {
      console.error(`Erro ao resetar mensagens do lead ${id}:`, err2);
    } else {
      console.log(`Lead ${id} resetado com sucesso!`);
    }
  }
  
  console.log("Concluido! O bot verdadeiro vai puxar eles na próxima fila.");
}

resetLeads();
