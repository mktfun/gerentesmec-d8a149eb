import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    console.log("Webhook payload:", payload);

    if (payload.type === 'UPDATE' && payload.table === 'leads') {
      const { record, old_record } = payload;
      
      // Check if status changed to closed_won or closed_lost
      const justClosed = (record.funnel_stage === 'closed_won' || record.funnel_stage === 'closed_lost') && 
                         (old_record.funnel_stage !== 'closed_won' && old_record.funnel_stage !== 'closed_lost');

      if (justClosed) {
        console.log(`Lead ${record.id} closed (${record.funnel_stage}). Generating summary...`);

        // Fetch AI settings
        const { data: aiSettings, error: aiError } = await supabaseClient
          .from('ai_settings')
          .select('*')
          .limit(1)
          .single();

        if (aiError || !aiSettings || !aiSettings.api_key) {
          throw new Error('AI settings or API Key not found');
        }

        // Generate summary (Mocking the AI call for this implementation)
        // In a real scenario we'd call the AI provider (Google Gemini, OpenAI, etc.) here
        // using aiSettings.provider, aiSettings.model, aiSettings.api_key
        const prompt = `Faça um resumo do atendimento de vendas do cliente ${record.customer_name} e do veículo ${record.customer_vehicle}. 
        O status da venda foi: ${record.funnel_stage === 'closed_won' ? 'Ganho' : 'Perdido'}. 
        Ticket: ${record.ticket_value ? 'R$ ' + record.ticket_value : 'N/A'}.`;

        console.log("AI Prompt:", prompt);
        
        // Simulating AI delay
        await new Promise(r => setTimeout(r, 1500));
        
        const generatedSummary = `[Resumo AI Automático] 
O atendimento com ${record.customer_name} (Veículo: ${record.customer_vehicle}) foi ${record.funnel_stage === 'closed_won' ? 'fechado com sucesso' : 'perdido'}. 
Ticket Final: ${record.ticket_value ? 'R$ ' + record.ticket_value : 'Não informado'}.
Pontos fortes do atendimento: Rapidez na resposta inicial e orçamento claro.
(Gerado por: ${aiSettings.model} / ${aiSettings.provider})`;

        // Save summary to the lead
        const { error: updateError } = await supabaseClient
          .from('leads')
          .update({ closing_summary: generatedSummary })
          .eq('id', record.id);

        if (updateError) {
          throw updateError;
        }

        return new Response(JSON.stringify({ success: true, summary: generatedSummary }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({ message: "No action taken" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error generating summary:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
