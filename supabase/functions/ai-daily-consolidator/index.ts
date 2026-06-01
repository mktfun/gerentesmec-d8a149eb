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

    console.log("[CONSOLIDATOR] Inciando varredura por leads com mensagens pendentes fora do expediente...");

    // 2. Buscar todas as mensagens criadas desde as 18:00 de ontem (simplificação: pegamos mensagens das últimas 14 horas, ou simplesmente todas que têm uma flag).
    // Como não temos flag fácil, buscaremos LEADS que tiveram mensagens recentes e cujo funnel_stage não esteja fechado.
    // Uma forma precisa é ver quais Leads possuem mensagens em `chat_messages` que ainda não constam no `audit_checklist_messages`.
    // Isso pode ser complexo. Em vez disso, enviaremos todos os leads que interagiram nas últimas 16 horas. A edge function evaluator cuidará de não duplicar caso já esteja avaliado (ela reavalia a conversa inteira e atualiza).
    
    const now = new Date();
    const threshold = new Date(now.getTime() - 16 * 60 * 60 * 1000).toISOString(); // 16h atrás

    const { data: recentLeads, error: leadsError } = await supabase
      .from("leads")
      .select("id, customer_name")
      .gte("last_message_at", threshold);

    if (leadsError || !recentLeads || recentLeads.length === 0) {
      console.log("[CONSOLIDATOR] Nenhum lead pendente encontrado nas últimas horas.");
      return new Response(JSON.stringify({ message: "No pending leads found", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`[CONSOLIDATOR] Encontrados ${recentLeads.length} leads recentes. Disparando avaliações em lote...`);

    // 3. Forçar processamento do evaluator para cada um deles
    const evaluatorPromises = recentLeads.map(async (lead) => {
      try {
        console.log(`[CONSOLIDATOR] Disparando evaluator para lead: ${lead.id}`);
        // Como o webhook pula o evaluator fora do expediente, a Fila do evaluator não foi chamada.
        // Chamamos forçadamente enviando message_id = null (isso indica que é um reprocessamento global, sem mensagem engatilhada específica)
        await fetch(`${supabaseUrl}/functions/v1/ai-autonomous-evaluator`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceRoleKey}`,
          },
          body: JSON.stringify({
            lead_id: lead.id,
            message_content: "[BATCH PROCESSING OFF-HOURS]",
            sender_type: "system",
          }),
        });
        return { lead, status: "success" };
      } catch (err) {
        console.error(`[CONSOLIDATOR] Erro ao disparar evaluator para ${lead.id}:`, err);
        return { lead, status: "error", error: err };
      }
    });

    await Promise.all(evaluatorPromises);

    // 4. Aguardar um pouco para dar tempo das Edge functions assíncronas do evaluator processarem o banco?
    // Se o evaluator_promises apenas faz a chamada (que não aguarda a conclusão interna se for async), teríamos que esperar.
    // Mas fetch com await espera a resposta HTTP 200. Então após o Promise.all, as avaliações no banco JÁ estão prontas!
    
    // 5. Coletar os relatórios fresquinhos desses leads no banco
    const { data: updatedLeads } = await supabase
      .from("leads")
      .select("id, customer_name, audit_reasons, audit_checklist")
      .in("id", recentLeads.map((l) => l.id));

    // 6. Gerar Daily Digest usando a LLM
    let digestContext = `DADOS DE AUDITORIA FORA DE EXPEDIENTE:\n\n`;
    (updatedLeads || []).forEach((l) => {
      digestContext += `LEAD: ${l.customer_name}\n`;
      digestContext += `ERROS APONTADOS PELA IA: ${JSON.stringify(l.audit_reasons || {})}\n`;
      digestContext += `---\n`;
    });

    console.log("[CONSOLIDATOR] Enviando contexto para a IA gerar Resumo...");

    // Usa API do Provider
    const isProxy = aiSettings?.provider?.toLowerCase() === "local ai proxy";
    const apiKey = aiSettings?.api_key;
    const apiUrl = isProxy ? (aiSettings?.api_url || "http://host.docker.internal:3001/v1/chat/completions") : "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    const model = isProxy ? (aiSettings?.model || "gemini-2.5-flash") : "gemini-2.5-flash";

    const systemPrompt = `Você é o Assessor Matinal do Gerente da Mecânica.
Sua função é ler os logs de auditoria dos clientes que interagiram durante a noite/fora de expediente e escrever um "Daily Digest".
O relatório deve ser executivo, formatado em Markdown, com os seguintes pontos:
1. Resumo Quantitativo (X conversas analisadas).
2. Destaques Críticos: Houve algum cliente furioso? Algum orçamento alto perdido?
3. Falhas do Atendimento: Resuma se a equipe errou algo crucial segundo os "ERROS APONTADOS PELA IA".
Não invente dados. Seja direto e elegante.`;

    let summaryText = "Resumo indisponível devido a erro no provedor de IA.";

    if (isProxy) {
      const llmReq = await fetch(apiUrl, {
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
      // Google Direct
      const llmReq = await fetch(`${apiUrl}?key=${apiKey}`, {
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

    console.log("[CONSOLIDATOR] Salvando Daily Digest...");

    // 7. Salvar no Banco
    const { error: digestError } = await supabase.from("daily_digests").insert({
      target_date: new Date().toISOString().split("T")[0],
      summary_text: summaryText,
      leads_processed: recentLeads.length,
    });

    if (digestError) {
      console.error("[CONSOLIDATOR] Erro salvando digest:", digestError);
    }

    return new Response(JSON.stringify({ success: true, digest: summaryText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[CONSOLIDATOR] Erro Crítico:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
