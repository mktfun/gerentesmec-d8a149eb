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
        
        let generatedSummary = '';
        try {
          const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${aiSettings.api_key}`
            },
            body: JSON.stringify({
              model: aiSettings.model || 'gpt-4o-mini',
              messages: [{
                role: 'system',
                content: 'Você é um analista de qualidade sênior de uma rede de oficinas premium. Crie um parecer detalhado e premium do fechamento deste atendimento de vendas, baseado nas informações fornecidas. Crie um texto em um único parágrafo, sem formatação excessiva, destacando os pontos fortes e o resultado.'
              }, {
                role: 'user',
                content: prompt
              }]
            })
          });
          
          if (!openAiRes.ok) {
            const errBody = await openAiRes.text();
            throw new Error(`OpenAI API Error: ${openAiRes.status} ${errBody}`);
          }
          
          const data = await openAiRes.json();
          if (data.choices && data.choices.length > 0) {
            generatedSummary = data.choices[0].message.content;
          } else {
            throw new Error('No completion returned from OpenAI');
          }
        } catch (e: any) {
          console.error("OpenAI fallback:", e.message);
          generatedSummary = `O atendimento com ${record.customer_name} (Veículo: ${record.customer_vehicle || 'Não informado'}) foi ${record.funnel_stage === 'closed_won' ? 'fechado com sucesso' : 'perdido'}. Ticket Final: ${record.ticket_value ? 'R$ ' + record.ticket_value : 'Não informado'}. (Resumo automático devido a falha na API da IA)`;
        }

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
