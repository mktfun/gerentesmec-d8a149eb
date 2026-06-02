import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const AUDITS_DIR = path.resolve(process.cwd(), '.agents', 'audits');

async function run() {
  console.log("=== INICIANDO SINCRONIZAÇÃO DE AUDITORIA (FASE 3) ===");

  if (!fs.existsSync(AUDITS_DIR)) {
    console.error("Diretório de auditorias não encontrado.");
    return;
  }

  const leadsFolders = fs.readdirSync(AUDITS_DIR);
  let processedCount = 0;

  for (const leadId of leadsFolders) {
    const resultPath = path.join(AUDITS_DIR, leadId, 'result.json');
    
    if (fs.existsSync(resultPath)) {
      try {
        const rawJson = fs.readFileSync(resultPath, 'utf-8');
        // Clean markdown backticks if any
        const cleanedJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        console.log(`Subindo auditoria do Lead ${leadId}... (Score: ${parsed.score})`);

        // Update leads
        const { error: updErr } = await supabase.from('leads').update({
          score: parsed.score,
          funnel_stage: parsed.funnel_stage,
          audit_checklist: parsed.audit_checklist,
          audit_reasons: parsed.audit_justifications,
          ticket_value: parsed.ticket_value || null,
          customer_vehicle: parsed.customer_vehicle || null
        }).eq('id', leadId);

        if (updErr) console.error("Erro ao atualizar lead:", updErr);

        // Update memory
        await supabase.from('lead_memories').upsert({
          lead_id: leadId,
          compressed_history: parsed.new_compressed_history
        });

        processedCount++;
      } catch (e) {
        console.error(`Erro ao ler ou processar JSON do lead ${leadId}:`, e.message);
      }
    }
  }

  console.log(`\n=== SINCRONIZAÇÃO CONCLUÍDA (${processedCount} leads atualizados) ===`);
}

run();
