import { createClient } from '@supabase/supabase-js';

const url = "https://qtjitszradxsmnilnqtj.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k";
const supabase = createClient(url, key);

async function scanActive() {
  const { data: leads } = await supabase
    .from('leads')
    .select('id, customer_name, funnel_stage')
    .in('funnel_stage', ['lead_new', 'em_atendimento', 'orcamento_enviado', 'negotiation', 'quote'])
    .limit(10);

  if (!leads || leads.length === 0) { console.log("FUNIL: nenhum lead ativo restante."); return; }

  for (const lead of leads) {
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('content, sender_type, created_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true });

    if (!msgs || msgs.length === 0) continue;

    const transcript = msgs.map(m => {
      const time = new Date(m.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
      return `[${time}] ${m.sender_type}: ${m.content || ''}`;
    }).join('\n');

    console.log(`\nLEAD_ID: ${lead.id} | ${lead.customer_name} | STAGE: ${lead.funnel_stage}`);
    console.log(transcript);
    console.log('---');
  }
}

async function scanAudit() {
  const { data: leads } = await supabase
    .from('leads')
    .select('id, customer_name, funnel_stage, score')
    .in('funnel_stage', ['closed_won', 'closed_lost'])
    .is('score', null)
    .limit(5);

  if (!leads || leads.length === 0) { console.log("AUDITORIA: nenhum pendente."); return; }

  for (const lead of leads) {
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('content, sender_type, created_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true });

    const transcript = (msgs || []).map(m => {
      const time = new Date(m.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
      return `[${time}] ${m.sender_type}: ${m.content || ''}`;
    }).join('\n');

    console.log(`\nAUDIT_LEAD_ID: ${lead.id} | ${lead.customer_name} | STAGE: ${lead.funnel_stage}`);
    console.log(transcript);
    console.log('---');
  }
}

(async () => {
  console.log("=== SCAN FUNIL ===");
  await scanActive();
  console.log("\n=== SCAN AUDITORIA ===");
  await scanAudit();
})();
