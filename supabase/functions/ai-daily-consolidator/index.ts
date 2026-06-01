import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Verificar configuração
    const { data: aiSettings } = await supabase
      .from("ai_settings")
      .select("off_hours_batching, provider, api_key, api_url, model")
      .limit(1)
      .maybeSingle();

    if (aiSettings?.off_hours_batching === false) {
      return new Response(JSON.stringify({ message: "Off-hours batching is disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "auto"; // 'sweep', 'digest', or 'auto'

    // ACTION: SWEEP - Apenas retorna quem precisa ser auditado
    if (action === "sweep") {
      const now = new Date();
      // O usuário quer "todas as conversas para não faltar nenhuma sem análise completa"
      // Vamos pegar todas das últimas 24 horas que tiveram mensagens
      const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentLeads } = await supabase
        .from("leads")
        .select("id, customer_name")
        .gte("last_message_at", threshold);
        
      return new Response(JSON.stringify({ success: true, leads: recentLeads || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ACTION: DIGEST - Recebe a lista de leads já processados pelo front e gera o resumo
    if (action === "digest") {
      const { leadIds } = await req.json().catch(() => ({ leadIds: [] }));
      
      let updatedLeads = [];
      if (leadIds && leadIds.length > 0) {
        const { data } = await supabase
          .from("leads")
          .select("id, customer_name, audit_reasons, audit_checklist")
          .in("id", leadIds);
        updatedLeads = data || [];
      } else {
        // Fallback: pega os das últimas 24h
        const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from("leads")
          .select("id, customer_name, audit_reasons, audit_checklist")
          .gte("last_message_at", threshold);
        updatedLeads = data || [];
      }

      let digestContext = `DADOS DE AUDITORIA DAS ÚLTIMAS 24H (Varredura Completa):\n\n`;
      updatedLeads.forEach((l) => {
        digestContext += `LEAD: ${l.customer_name}\n`;
        digestContext += `ERROS APONTADOS PELA IA: ${JSON.stringify(l.audit_reasons || {})}\n`;
        digestContext += `---\n`;
      });

      console.log("[CONSOLIDATOR] Enviando contexto para a IA gerar Resumo...");

      const isProxy = aiSettings?.provider?.toLowerCase() === "local ai proxy";
      const apiKey = aiSettings?.api_key;
      const proxyUrl = aiSettings?.api_url;
      const model = isProxy ? (aiSettings?.model || "gemini-2.5-flash") : "gemini-2.5-flash";

      const systemPrompt = `Você é o Assessor do Gerente da Mecânica.
Sua função é ler os logs de auditoria dos clientes recentes e escrever um "Daily Digest".
Isso inclui não só fora do expediente, mas TUDO que a equipe atendeu e a IA achou de errado.
O relatório deve ser executivo, formatado em Markdown, com os seguintes pontos:
1. Resumo Quantitativo (X conversas analisadas).
2. Destaques Críticos: Clientes furiosos? Orçamentos altos não respondidos?
3. Falhas do Atendimento: Resuma se a equipe esqueceu de algo ou não fez direito, segundo os "ERROS APONTADOS PELA IA".
Seja direto, elegante e não invente dados.`;

      let summaryText = "Resumo indisponível devido a erro no provedor de IA.";

      if (isProxy && proxyUrl) {
        // Limpar url
        const baseUrl = proxyUrl.endsWith('/v1/chat/completions') ? proxyUrl : `${proxyUrl.replace(/\/+$/, '')}/v1/chat/completions`;
        const llmReq = await fetch(baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: digestContext }
            ],
          }),
        });

        if (llmReq.ok) {
          const llmRes = await llmReq.json();
          summaryText = llmRes.choices?.[0]?.message?.content || "Nenhum conteúdo retornado.";
        } else {
          console.error("[CONSOLIDATOR] LLM Proxy erro:", await llmReq.text());
        }
      } else {
        const urlToUse = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
        const llmReq = await fetch(`${urlToUse}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: digestContext }] }]
          })
        });

        if (llmReq.ok) {
          const llmRes = await llmReq.json();
          summaryText = llmRes.candidates?.[0]?.content?.parts?.[0]?.text || "Nenhum conteúdo retornado.";
        } else {
          console.error("[CONSOLIDATOR] Google LLM erro:", await llmReq.text());
        }
      }

      const { error: digestError } = await supabase.from("daily_digests").insert({
        target_date: new Date().toISOString().split("T")[0],
        summary_text: summaryText,
        leads_processed: updatedLeads.length,
      });

      if (digestError) {
        console.error("[CONSOLIDATOR] Erro salvando digest:", digestError);
      }

      return new Response(JSON.stringify({ success: true, digest: summaryText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    console.error("[CONSOLIDATOR] Erro Crítico:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
