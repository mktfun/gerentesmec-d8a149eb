import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || "https://qtjitszradxsmnilnqtj.supabase.co";
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k";

const supabase = createClient(url, key);

async function runLoop() {
  console.log(`[${new Date().toLocaleTimeString()}] Iniciando varredura via Edge Function (Verdadeira IA)...`);
  
  const { data, error } = await supabase.from('chat_messages')
    .select('*, leads!inner(funnel_stage)')
    .or('ai_audited.eq.false,ai_audited.is.null')
    .eq('sender_type', 'user')
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) { console.error("Erro na busca:", error); return; }
  if (!data || data.length === 0) { console.log("Nenhum atendimento pendente para a IA."); return; }

  const targetLeadId = data[0].lead_id;
  
  const { data: allMsgs, error: msgErr } = await supabase.from('chat_messages')
    .select('*')
    .eq('lead_id', targetLeadId)
    .order('created_at', { ascending: true });
    
  if (msgErr || !allMsgs) { console.error("Erro ao pegar mensagens:", msgErr); return; }
  
  const bundledContent = allMsgs.map(m => {
    const time = new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `[${time}] ${m.sender_type}: ${m.content || ''}`;
  }).join('\n\n');
  
  const messageIds = allMsgs.filter(m => m.ai_audited === false || m.ai_audited === null).map(m => m.id);

  console.log(`Chamando a Verdadeira IA (Edge Function) para o lead ${targetLeadId} com ${messageIds.length} msgs não auditadas...`);
  
  const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('ai-autonomous-evaluator', {
    body: {
      message_content: bundledContent,
      lead_id: targetLeadId,
      message_ids: messageIds,
      media_url: allMsgs[allMsgs.length - 1]?.media_url,
      media_type: allMsgs[allMsgs.length - 1]?.media_type,
      sender_type: allMsgs[allMsgs.length - 1]?.sender_type
    }
  });

  if (edgeErr) {
    console.error("Erro na Edge Function:", edgeErr);
  } else {
    console.log("Sucesso! IA avaliou e atualizou o lead. Resultado:", edgeData);
  }
}

async function main() {
  while(true) {
    try {
      await runLoop();
    } catch(e) {
      console.error("Erro critico no loop:", e);
    }
    console.log("Aguardando 15 segundos...\n");
    await new Promise(r => setTimeout(r, 15000));
  }
}

main();
