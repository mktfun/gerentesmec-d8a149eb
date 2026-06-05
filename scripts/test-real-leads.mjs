import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const SUPABASE_URL = 'https://qtjitszradxsmnilnqtj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);



async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// -------------------------------------------------------------
// HELPER PARA COMPARAR DOIS OBJETOS BOOLEANOS DE FORMA SIMPLES
// -------------------------------------------------------------
function compareChecklists(original, current) {
  const keys = ['1a', '1b', '2a', '2b', '2c', '2d', '2e', '3a', '3b', '3c', '4a', '4b'];
  let matchCount = 0;
  let mismatches = [];

  for (const k of keys) {
    const oVal = !!original[k];
    const cVal = !!current[k];
    if (oVal === cVal) {
      matchCount++;
    } else {
      mismatches.push(`${k}: original=${oVal}, current=${cVal}`);
    }
  }

  const accuracy = (matchCount / keys.length) * 100;
  return { accuracy, mismatches };
}

// -------------------------------------------------------------
// SCRIPT DE VALIDAÇÃO
// -------------------------------------------------------------
async function runValidation() {
  console.log("==================================================");
  console.log("🔍 INICIANDO VALIDAÇÃO COM DADOS REAIS");
  console.log("==================================================\n");

  // 1. Buscar 5 leads reais que já tenham sido auditados (score não é nulo e status fechado)
  const { data: leads, error: leadsErr } = await supabase
    .from('leads')
    .select('id, customer_name, funnel_stage, audit_checklist, score, ticket_value')
    .not('score', 'is', null)
    .in('funnel_stage', ['closed_won', 'closed_lost'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (leadsErr || !leads || leads.length === 0) {
    console.error("Erro ao buscar leads ou não há leads suficientes:", leadsErr);
    process.exit(1);
  }

  console.log(`Encontrados ${leads.length} leads para validação.\n`);

  let totalAccuracy = 0;

  for (const lead of leads) {
    console.log(`--------------------------------------------------`);
    console.log(`LEAD: ${lead.customer_name} (ID: ${lead.id})`);
    console.log(`Funnel Stage Original: ${lead.funnel_stage}`);
    console.log(`Ticket Value Original: ${lead.ticket_value}`);
    console.log(`Checklist Original:`, lead.audit_checklist);
    
    const originalChecklist = { ...lead.audit_checklist };

    // 2. Buscar todas as mensagens do lead em ordem cronológica
    const { data: messages, error: msgsErr } = await supabase
      .from('chat_messages')
      .select('id, lead_id, content, sender_type, media_url, media_type, created_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true });

    if (msgsErr || !messages) {
      console.error(`Erro ao buscar mensagens do lead ${lead.id}:`, msgsErr);
      continue;
    }

    console.log(`> Reprocessando ${messages.length} mensagens...`);

    // 3. Resetar o audit_checklist e score do lead para o teste
    await supabase.from('leads').update({
      audit_checklist: {},
      score: null,
      ticket_value: null,
      new_compressed_history: null,
      funnel_stage: 'lead_new' // Reseta o funil para simular desde o início
    }).eq('id', lead.id);

    // 4. Enviar cada mensagem sequencialmente para a fila
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      const payload = {
        message_id: msg.id,
        lead_id: msg.lead_id,
        text: msg.content || '',
        sender_type: msg.sender_type,
        media_url: msg.media_url,
        media_type: msg.media_type,
        timestamp: new Date().toISOString()
      };

      // Invocar a edge function diretamente
      const { data: result, error: invokeErr } = await supabase.functions.invoke('ai-autonomous-evaluator', {
        body: payload
      });

      if (invokeErr) {
        console.error(`  ❌ Erro ao invocar função para mensagem ${i + 1}:`, invokeErr);
      } else {
        // Delay para garantir que as escritas no banco da edge function propaguem (se necessário)
        await sleep(1500);
      }
    }

    // 6. Buscar o estado final após todo o reprocessamento
    const { data: finalLead } = await supabase
      .from('leads')
      .select('audit_checklist, funnel_stage, score, ticket_value')
      .eq('id', lead.id)
      .single();

    console.log(`\n> ESTADO FINAL ALCANÇADO PELA IA:`);
    console.log(`Funnel Stage: ${finalLead.funnel_stage}`);
    console.log(`Ticket Value: ${finalLead.ticket_value}`);
    console.log(`Checklist IA:`, finalLead.audit_checklist);

    // 7. Comparar
    const { accuracy, mismatches } = compareChecklists(originalChecklist, finalLead.audit_checklist || {});
    totalAccuracy += accuracy;

    console.log(`\n> RESULTADO: Concordância de ${accuracy.toFixed(1)}%`);
    if (mismatches.length > 0) {
      console.log(`> DIVERGÊNCIAS:`);
      mismatches.forEach(m => console.log(`  - ${m}`));
    } else {
      console.log(`> PERFEITO! A IA marcou exatamente igual à auditoria manual.`);
    }

    // 8. Restaurar estado original (Rollback)
    await supabase.from('leads').update({
      audit_checklist: lead.audit_checklist,
      score: lead.score,
      funnel_stage: lead.funnel_stage,
      ticket_value: lead.ticket_value
    }).eq('id', lead.id);
    
    console.log(`> Rollback do lead ${lead.id} concluído.\n`);
  }

  const avgAccuracy = totalAccuracy / leads.length;
  console.log("==================================================");
  console.log(`✅ TESTE CONCLUÍDO. Concordância média geral: ${avgAccuracy.toFixed(1)}%`);
  console.log("==================================================");
}

runValidation().catch(console.error);
