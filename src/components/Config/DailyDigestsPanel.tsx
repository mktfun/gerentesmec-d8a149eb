import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, RefreshCw, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const DailyDigestsPanel: React.FC = () => {
  const [digests, setDigests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [progressPct, setProgressPct] = useState(0);

  const fetchDigests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('daily_digests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setDigests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDigests();
  }, []);

  const handleRunNow = async () => {
    setRunning(true);
    setProgressMsg("Buscando conversas pendentes...");
    setProgressPct(5);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      const baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      
      // 1. SWEEP
      const sweepRes = await fetch(`${baseUrl}/functions/v1/ai-daily-consolidator?action=sweep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!sweepRes.ok) throw new Error("Falha no Sweep");
      const { leads } = await sweepRes.json();
      
      if (!leads || leads.length === 0) {
        setProgressMsg("Nenhum lead pendente.");
        setTimeout(() => setRunning(false), 2000);
        return;
      }

      // 2. AVALIAR 1 a 1
      setProgressMsg(`Avaliando ${leads.length} leads sequencialmente...`);
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        setProgressMsg(`Avaliando lead ${i+1}/${leads.length}: ${lead.customer_name}`);
        setProgressPct(5 + Math.floor((i / leads.length) * 80));
        
        try {
           await fetch(`${baseUrl}/functions/v1/ai-autonomous-evaluator`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
              body: JSON.stringify({
                lead_id: lead.id,
                message_content: "[BATCH PROCESSING OFF-HOURS/CATCH-UP]",
                sender_type: "system",
              })
           });
           // Pequeno delay para respeitar rate limits (ex: Gemini 15 RPM free)
           await new Promise(r => setTimeout(r, 1500));
        } catch(e) {
           console.warn("Erro avaliando lead", lead.id, e);
        }
      }

      // 3. DIGEST
      setProgressMsg("Gerando Resumo Executivo...");
      setProgressPct(90);
      
      const digestRes = await fetch(`${baseUrl}/functions/v1/ai-daily-consolidator?action=digest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ leadIds: leads.map((l:any) => l.id) })
      });
      
      if (digestRes.ok) {
        setProgressPct(100);
        setProgressMsg("Finalizado com sucesso!");
        await fetchDigests();
      } else {
        const errTxt = await digestRes.text();
        console.error("Failed to run consolidator", errTxt);
        alert("Erro ao gerar digest matinal.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao comunicar com a Edge Function.");
    } finally {
      setTimeout(() => {
        setRunning(false);
        setProgressMsg("");
        setProgressPct(0);
      }, 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 bg-[#0a0a0f] p-4 rounded-xl border border-border">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <FileText className="w-4 h-4" /> Resumos Matinais (Daily Digest)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Varredura de segurança: avalia tudo que ficou para trás e gera um resumo do dia.
            </p>
          </div>
          <button
            onClick={handleRunNow}
            disabled={running}
            className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 font-bold text-xs rounded-lg flex items-center gap-2 hover:bg-indigo-500/30 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 ml-4"
          >
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {running ? "Processando Lote..." : "Executar Auditoria Completa"}
          </button>
        </div>
        
        {running && (
          <div className="mt-2 space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-indigo-400/80">
              <span>{progressMsg}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 mt-4">
        {loading ? (
          <div className="text-center py-6 text-muted-foreground text-xs font-bold animate-pulse">
            Carregando resumos...
          </div>
        ) : digests.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 border border-border rounded-xl">
            <XCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-muted-foreground">Nenhum resumo gerado ainda.</p>
          </div>
        ) : (
          digests.map((digest) => (
            <motion.div
              key={digest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl bg-[#0a0a0f] border border-border shadow-md"
            >
              <div className="flex justify-between items-start mb-3 border-b border-border/50 pb-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Calendar className="w-4 h-4" />
                  <span className="font-bold text-sm">
                    Referência: {digest.target_date || new Date(digest.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md">
                  Leads Auditados: {digest.leads_processed || 0}
                </div>
              </div>
              <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">
                {digest.summary_text}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
