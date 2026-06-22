import "jsr:@supabase/functions-js/edge-runtime.js";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const openAiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const SYSTEM_PROMPT = `Você é um Auditor Sênior Implacável de uma rede de oficinas mecânicas. 
Sua missão é analisar essas transcrições de atendimento e encontrar a falha mais crítica e óbvia cometida pelo gerente. 
Procure por: 1) Ignorar o checklist de qualidade obrigatório; 2) Passar orçamento de forma amadora; 3) Tratar o cliente com descaso; 4) Omissão de informações críticas. 

Se você encontrar um erro grave que justifique uma bronca, defina 'critical_failure_found' como true.
Se o atendimento da semana foi excelente ou as conversas não contêm erros grosseiros (A Rota de Fuga), retorne 'critical_failure_found' como false, e preencha os outros campos com strings vazias ou nulas.

Você DEVE retornar a resposta EXATAMENTE no formato JSON:
{
  "critical_failure_found": boolean,
  "critical_quote": "A citação EXATA do gerente ou cliente provando o erro",
  "violation_reason": "Qual regra de excelência no atendimento ou vendas foi quebrada",
  "improvement_action": "O que o gerente deveria ter feito ou falado no lugar"
}`;

serve(async (req) => {
  // Configuração básica do CORS e checagem do request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    if (!openAiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Identificar a semana (últimos 7 dias)
    const weekEnd = new Date();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    // 1. Pegar a lista de unidades (stores)
    const { data: stores, error: storesError } = await supabase
      .from('units')
      .select('id, name');

    if (storesError) throw storesError;

    // Processar o Inquisidor por unidade
    let processedCount = 0;

    for (const store of stores || []) {
      // Buscar conversas da loja nos últimos 7 dias que estejam resolvidas (status = resolved)
      // Como a modelagem do sistema tem leads/chat_messages, vamos pegar mensagens onde a data é da última semana
      // AVISO: Adaptando ao schema de `chatwoot_messages` do sistema
      const { data: messages, error: msgError } = await supabase
        .from('chatwoot_messages')
        .select('content, message_type, created_at, chatwoot_inbox_id')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .order('created_at', { ascending: true })
        .limit(150); // Pegar uma amostra significativa

      if (msgError) {
        console.error(`Erro ao buscar mensagens da loja ${store.name}:`, msgError);
        continue;
      }

      if (!messages || messages.length === 0) {
        // Se não teve mensagem, registra semana perfeita pra loja
        await supabase.from('weekly_critical_insights').insert({
          store_id: store.id,
          week_start: weekStart.toISOString().split('T')[0],
          week_end: weekEnd.toISOString().split('T')[0],
          critical_failure_found: false
        });
        processedCount++;
        continue;
      }

      // Formatar transcrição pro GPT
      const transcript = messages.map(m => {
        const sender = m.message_type === 0 ? "Cliente" : "Gerente/Oficina";
        return `[${m.created_at}] ${sender}: ${m.content}`;
      }).join('\n');

      // 2. Chamar OpenAI com a transcrição (JSON Mode)
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Analise a transcrição de atendimento a seguir (Amostra da Loja: ${store.name}):\n\n${transcript}` }
          ],
          temperature: 0.1
        })
      });

      const aiData = await response.json();
      
      if (aiData.error) {
        console.error("OpenAI Error:", aiData.error);
        continue;
      }

      const content = aiData.choices[0].message.content;
      let parsedInsight;
      try {
        parsedInsight = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse JSON from AI", content);
        continue;
      }

      // 3. Salvar o resultado no banco
      const { error: insertError } = await supabase.from('weekly_critical_insights').insert({
        store_id: store.id,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        critical_failure_found: parsedInsight.critical_failure_found || false,
        critical_quote: parsedInsight.critical_failure_found ? parsedInsight.critical_quote : null,
        violation_reason: parsedInsight.critical_failure_found ? parsedInsight.violation_reason : null,
        improvement_action: parsedInsight.critical_failure_found ? parsedInsight.improvement_action : null
      });

      if (insertError) {
        console.error("Erro ao salvar insight", insertError);
      } else {
        processedCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, processed_stores: processedCount }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Edge Function Error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
