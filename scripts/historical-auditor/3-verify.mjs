import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
  console.log("=== INICIANDO VERIFICAÇÃO DE DADOS ===\n");

  const { data: leads, error } = await supabase.from('leads').select('id, customer_name, score, funnel_stage, audit_checklist, audit_reasons').not('score', 'is', null);
  
  if (error) {
    console.error("Erro ao buscar leads:", error);
    return;
  }

  console.log(`Total de Leads Auditados no Banco: ${leads.length}\n`);

  const stages = {};
  let totalScore = 0;

  for (const lead of leads) {
    stages[lead.funnel_stage] = (stages[lead.funnel_stage] || 0) + 1;
    totalScore += lead.score || 0;
  }

  console.log("Distribuição por Etapa de Funil:");
  console.table(stages);

  console.log(`\nScore Médio Global (Auditorias Históricas): ${(totalScore / leads.length).toFixed(1)}`);

  console.log("\n--- Amostra de um Lead Atualizado (Sucesso) ---");
  const sample = leads.find(l => l.score > 0 && l.score < 100);
  if (sample) {
    console.log(`Nome: ${sample.customer_name}`);
    console.log(`Etapa: ${sample.funnel_stage}`);
    console.log(`Score: ${sample.score}`);
    console.log(`Checklist Realizado:`, sample.audit_checklist);
    console.log(`Justificativas:`, sample.audit_reasons);
  }

  console.log("\n=== VERIFICAÇÃO CONCLUÍDA ===");
}

verify();
