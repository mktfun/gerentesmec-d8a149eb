import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, RefreshCw, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const DailyDigestsPanel: React.FC = () => {
  const [digests, setDigests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

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
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-daily-consolidator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (res.ok) {
        await fetchDigests();
      } else {
        console.error("Failed to run consolidator", await res.text());
        alert("Erro ao gerar digest matinal.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao comunicar com a Edge Function.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-[#0a0a0f] p-4 rounded-xl border border-border">
        <div>
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <FileText className="w-4 h-4" /> Resumos Matinais (Daily Digest)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Aqui ficam salvos os relatórios gerados a partir do que ocorreu fora do expediente.
          </p>
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 font-bold text-xs rounded-lg flex items-center gap-2 hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
        >
          {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Executar Auditoria Matinal Agora
        </button>
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
