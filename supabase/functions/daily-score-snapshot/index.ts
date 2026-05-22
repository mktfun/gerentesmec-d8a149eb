import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Data de hoje (fuso horário do servidor; o cron roda em UTC)
    const now = new Date();
    // Converte para BRT (UTC-3)
    const brtOffset = -3 * 60;
    const brtNow = new Date(now.getTime() + brtOffset * 60000);
    const todayStr = brtNow.toISOString().split('T')[0]; // YYYY-MM-DD

    // Início e fim do dia (em UTC correspondente ao dia BRT)
    const dayStartBRT = new Date(`${todayStr}T00:00:00-03:00`);
    const dayEndBRT = new Date(`${todayStr}T23:59:59-03:00`);

    // Buscar todos os leads do dia
    const { data: todayLeads, error: leadsErr } = await supabase
      .from('leads')
      .select('id, score, unit_id')
      .gte('last_message_at', dayStartBRT.toISOString())
      .lte('last_message_at', dayEndBRT.toISOString());

    if (leadsErr) throw leadsErr;

    const totalLeads = todayLeads?.length ?? 0;
    const scoredLeads = todayLeads?.filter(l => l.score !== null) ?? [];
    const globalScore = totalLeads > 0 && scoredLeads.length > 0
      ? Math.round(scoredLeads.reduce((sum, l) => sum + Number(l.score), 0) / totalLeads * 10) / 10
      : null;

    // Score por unidade
    const { data: units } = await supabase.from('units').select('id, name');
    const unitSnapshots = (units || []).map(u => {
      const uLeads = todayLeads?.filter(l => l.unit_id === u.id) ?? [];
      const uScored = uLeads.filter(l => l.score !== null);
      const uScore = uLeads.length > 0 && uScored.length > 0
        ? Math.round(uScored.reduce((sum, l) => sum + Number(l.score), 0) / uLeads.length * 10) / 10
        : null;
      return { unit_id: u.id, unit_name: u.name, score: uScore, total_leads: uLeads.length };
    });

    // Upsert snapshot do dia
    const { error: upsertErr } = await supabase
      .from('daily_score_snapshots')
      .upsert({
        snapshot_date: todayStr,
        global_score: globalScore,
        total_leads: totalLeads,
        scored_leads: scoredLeads.length,
        unit_breakdown: unitSnapshots,
        created_at: now.toISOString()
      }, { onConflict: 'snapshot_date' });

    if (upsertErr) throw upsertErr;

    console.log(`[daily-score-snapshot] ${todayStr}: globalScore=${globalScore}, totalLeads=${totalLeads}, scoredLeads=${scoredLeads.length}`);

    return new Response(JSON.stringify({
      status: 'success',
      snapshot_date: todayStr,
      global_score: globalScore,
      total_leads: totalLeads,
      scored_leads: scoredLeads.length
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[daily-score-snapshot] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
