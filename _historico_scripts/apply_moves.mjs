import { createClient } from '@supabase/supabase-js';

const url = "https://qtjitszradxsmnilnqtj.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aml0c3pyYWR4c21uaWxucXRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI5MjA2MSwiZXhwIjoyMDk0ODY4MDYxfQ.Uaq_eeI4h2UigqKvsdSZKmPJGajQ9aN6afegkys7w8k";
const supabase = createClient(url, key);

const moves = [
  { id: "5a432279-e0db-4e62-b75a-09cabae7943f", stage: "closed_lost",  reason: "Cliente cancelou explicitamente: 'meu vizinho vai fazer pra mim'" },
  { id: "ee08ab26-2990-40a4-98ec-6f8124908682", stage: "parking_lot",   reason: "Conversa só com áudios e imagens, sem texto — contexto offline/insuficiente" },
  { id: "473979db-4696-41fc-a5d5-452105693f8a", stage: "parking_lot",   reason: "Orçamento dado mas sem continuidade textual — contexto incompleto" },
  { id: "68b6b888-da61-481f-a4bf-df8f291c02fd", stage: "parking_lot",   reason: "Conversa truncada, apenas 2 mensagens, sem contexto suficiente" },
  { id: "b84b5739-bdab-4ebc-90df-4af4e684f8fb", stage: "closed_won",    reason: "Gerente disse 'Liberado' e cliente confirmou 'Tô indo' — sinal real de conclusão" },
  { id: "986bb7ab-aa1c-499d-8af7-2bd66cfc43b6", stage: "parking_lot",   reason: "Conversa só com áudio e imagem — contexto insuficiente para classificar" },
];

async function run() {
  for (const m of moves) {
    const { error } = await supabase
      .from('leads')
      .update({ funnel_stage: m.stage })
      .eq('id', m.id);

    if (error) {
      console.error(`❌ Erro ao mover lead ${m.id}:`, error.message);
    } else {
      console.log(`✔️ [${m.stage.toUpperCase()}] ${m.id} — ${m.reason}`);
    }
  }
  console.log('\nDone.');
}

run();
