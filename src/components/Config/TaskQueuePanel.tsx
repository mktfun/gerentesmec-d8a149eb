import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle2, XCircle, Loader2, Circle, Clock, MinusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Task {
  id: string;
  lead_id: string | null;
  message_id: string | null;
  content_preview: string | null;
  sender_type: string | null;
  status: 'pending' | 'running' | 'success' | 'error' | 'ignored';
  provider: string | null;
  model: string | null;
  latency_ms: number | null;
  tokens_used: number | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

const relTime = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 5) return 'agora';
  if (diff < 60) return `há ${Math.floor(diff)}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
};

const providerColor = (p: string | null) => {
  const v = (p || '').toLowerCase();
  if (v.includes('openai')) return '#10a37f';
  if (v.includes('google') || v.includes('gemini') || v.includes('vertex')) return '#4285f4';
  if (v.includes('nvidia') || v.includes('nim')) return '#76b900';
  if (v.includes('anthropic')) return '#eb6821';
  return '#6366f1';
};

export const TaskQueuePanel: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tick, setTick] = useState(0); // forces re-render for relative timestamps

  // Re-render every second so "há Xs" stays live
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('ai_task_queue' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25);
      if (data) setTasks(data as any);
    })();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('ai_task_queue_stream')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'ai_task_queue' },
        (payload: any) => {
          const newRow = payload.new as Task | null;
          const oldRow = payload.old as Task | null;
          setTasks((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((t) => t.id !== oldRow?.id);
            }
            if (!newRow) return prev;
            const idx = prev.findIndex((t) => t.id === newRow.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = newRow;
              return copy;
            }
            return [newRow, ...prev].slice(0, 25);
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const counts = useMemo(() => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    let pending = 0, running = 0, ok = 0, err = 0;
    for (const t of tasks) {
      if (t.status === 'pending') pending++;
      else if (t.status === 'running') running++;
      else {
        const ts = new Date(t.completed_at || t.created_at).getTime();
        if (ts > fiveMinAgo) {
          if (t.status === 'success') ok++;
          else if (t.status === 'error') err++;
        }
      }
    }
    return { pending, running, ok, err };
  }, [tasks, tick]);

  // Heartbeat color
  const heartbeat = useMemo(() => {
    const now = Date.now();
    const recent = tasks.find((t) => now - new Date(t.created_at).getTime() < 30000);
    const stalePending = tasks.find(
      (t) =>
        (t.status === 'pending' || t.status === 'running') &&
        now - new Date(t.created_at).getTime() > 30000
    );
    if (stalePending) return { color: 'bg-amber-500', label: 'Travado' };
    if (recent) return { color: 'bg-emerald-500', label: 'Vivo' };
    return { color: 'bg-muted-foreground/40', label: 'Ocioso' };
  }, [tasks, tick]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-black/5 dark:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${heartbeat.color}`} />
            <div className={`absolute inset-0 w-3 h-3 rounded-full ${heartbeat.color} animate-ping opacity-60`} />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              Fila de Tarefas da IA
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                {heartbeat.label}
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Cada mensagem que chega vira uma task — acompanhe ao vivo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-bold">
          <span className="text-muted-foreground">
            Pendentes <strong className="text-foreground">{counts.pending}</strong>
          </span>
          <span className="text-muted-foreground">
            Rodando <strong className="text-foreground">{counts.running}</strong>
          </span>
          <span className="text-emerald-500">✓ {counts.ok}</span>
          <span className="text-rose-500">✗ {counts.err}</span>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2 animate-pulse" />
            <p className="text-xs font-bold text-muted-foreground">Fila vazia.</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Aguardando próxima mensagem chegar do Chatwoot.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {tasks.map((t) => {
              const color = providerColor(t.provider);
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                >
                  {/* Status icon */}
                  <div className="shrink-0 w-7 h-7 flex items-center justify-center">
                    {t.status === 'pending' && (
                      <Circle className="w-4 h-4 text-muted-foreground/60 animate-pulse" />
                    )}
                    {t.status === 'running' && (
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color }} />
                    )}
                    {t.status === 'success' && (
                      <motion.div
                        initial={{ scale: 0.6 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </motion.div>
                    )}
                    {t.status === 'error' && <XCircle className="w-4 h-4 text-rose-500" />}
                    {t.status === 'ignored' && (
                      <MinusCircle className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Sender chip */}
                  <span
                    className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      t.sender_type === 'contact'
                        ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}
                  >
                    {t.sender_type === 'contact' ? 'CLIENTE' : 'GERENTE'}
                  </span>

                  {/* Preview */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {t.content_preview || '(sem conteúdo)'}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{relTime(t.created_at)}</span>
                      {t.model && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{t.model}</span>
                        </>
                      )}
                      {t.latency_ms != null && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{t.latency_ms}ms</span>
                        </>
                      )}
                      {t.tokens_used != null && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{t.tokens_used} tk</span>
                        </>
                      )}
                    </div>
                    {t.status === 'error' && t.error_message && (
                      <p className="text-[10px] text-rose-400 mt-1 truncate font-mono">
                        {t.error_message}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
