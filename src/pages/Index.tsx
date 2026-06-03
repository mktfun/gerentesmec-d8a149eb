import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, Clock, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { useAppData, Lead } from '@/context/AppDataContext';
import { calculateTmr, calculateDangerLeads } from '@/utils/metrics';
import { avgScore, avgScoreInt } from '@/utils/scoreUtils';
import TvDashboard from '@/components/Dashboard/TvDashboard';

import { fadeUp } from '@/utils/motion';

const WEEK_DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b'];

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const avg = (nums: number[]) => nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;

const Index = () => {
  const { leads, managers, units, isTvMode, setIsTvMode, businessHours } = useAppData();

  // â”€â”€ Hooks devem vir antes de qualquer early return (Rules of Hooks) â”€â”€
  
  if (isTvMode) {
    return <TvDashboard />;
  }

  const toggleTvMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsTvMode(true);
    }
  };

  // --- Real-time Metrics Calculation ---
  const now = new Date();
  const today0 = startOfDay(now);

  // Global score (Ãšltimos 30 dias) â€” usa APENAS leads auditados no denominador
  const leads30Days = leads.filter(l => new Date(l.last_message_at).getTime() >= today0.getTime() - 29 * 86400000);
  const globalScore = avgScore(leads30Days);

  // Score series â€” last 7 days (trailing 30-day average for each day to show true global evolution)
  const scoreHistory = useMemo(() => {
    const series: { day: string; score: number | null }[] = [];
    let validPoints = 0;
    
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today0); day.setDate(day.getDate() - i);
      const next = new Date(day); next.setDate(next.getDate() + 1);
      
      const windowStart = new Date(day); windowStart.setDate(windowStart.getDate() - 29);
      
      const trailingLeads = leads.filter(l => {
        const t = new Date(l.last_message_at).getTime();
        return t >= windowStart.getTime() && t < next.getTime();
      });
      const a = avgScore(trailingLeads);
        
      if (a !== null || trailingLeads.length > 0) validPoints++;
      series.push({ day: WEEK_DAY_LABELS[day.getDay()], score: a !== null ? Math.round(a * 10) / 10 : null });
    }

    // Backfill nulls to avoid line dropping to 0 when data is sparse
    if (validPoints > 0) {
      let lastValid = series.find(s => s.score !== null)?.score ?? null;
      for (let i = 0; i < series.length; i++) {
        if (series[i].score === null && lastValid !== null) {
          series[i].score = lastValid;
        } else if (series[i].score !== null) {
          lastValid = series[i].score;
        }
      }
      let firstValid = [...series].reverse().find(s => s.score !== null)?.score ?? null;
      for (let i = series.length - 1; i >= 0; i--) {
        if (series[i].score === null && firstValid !== null) {
          series[i].score = firstValid;
        } else if (series[i].score !== null) {
          firstValid = series[i].score;
        }
      }
    }
    
    return series;
  }, [leads, today0]);

  const hasHistory = scoreHistory.some(d => d.score !== null);

  // Week-over-week trend
  const weekTrend = useMemo(() => {
    const lastWeek = leads.filter(l => {
      const t = new Date(l.last_message_at).getTime();
      return t >= today0.getTime() - 7 * 86400000 && t < today0.getTime() + 86400000;
    });
    const prevWeek = leads.filter(l => {
      const t = new Date(l.last_message_at).getTime();
      return t >= today0.getTime() - 14 * 86400000 && t < today0.getTime() - 7 * 86400000;
    });
    
    const a = avgScore(lastWeek);
    const b = avgScore(prevWeek);
    
    if (a === null || b === null) return null;
    return Math.round((a - b) * 10) / 10;
  }, [leads, today0]);

  // Unit scores â€” usa apenas auditados no denominador
  const unitScores = units.map(u => {
    const uLeadsAll = leads.filter(l => l.unit_id === u.id);
    return { ...u, score: avgScoreInt(uLeadsAll) };
  });

  // Today metrics
  const todayLeads = leads.filter(l => new Date(l.last_message_at).getTime() >= today0.getTime());
  
  const todayTmr = calculateTmr(todayLeads, businessHours);

  const pendingAudits = todayLeads.filter(l => (l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost') && l.score === null).length;
  const completedLeads = todayLeads.filter(l => l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost');
  const resolutionRate = todayLeads.length > 0 ? ((completedLeads.length / todayLeads.length) * 100).toFixed(1) : '0';
  
  const dangerLeads = calculateDangerLeads(todayLeads, businessHours);



  // Manager ranking â€” usa apenas auditados no denominador
  const managerRanking = managers.map(m => {
    const unit = units.find(u => u.id === m.unit_id);
    const mLeadsAll = leads.filter(l => l.manager_id === m.id || (!l.manager_id && l.unit_id === m.unit_id));
    const lastActiveAt = mLeadsAll.reduce((max, l) => {
      const time = new Date(l.last_message_at || l.created_at).getTime();
      return time > max ? time : max;
    }, 0);
    const isInactive = lastActiveAt === 0 || (Date.now() - lastActiveAt) > 24 * 60 * 60 * 1000;
    return { ...m, score: avgScoreInt(mLeadsAll), unitName: unit?.name || 'N/A', isInactive };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const todayStr = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date());

  return (
    <div className="p-8 pb-20 min-h-screen">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <motion.div {...fadeUp(0.3)} className="rounded-2xl p-6 bg-card/50 backdrop-blur-xl border border-border lg:col-span-1 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground">Ranking de Gerentes</h3>
          </div>
          <div className="flex-1 flex flex-col gap-5">
            {managerRanking.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-4">
                <span className="text-sm font-bold text-muted-foreground w-4">{idx + 1}</span>
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 font-black text-sm shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate flex items-center gap-2">
                    {m.name}
                    {m.isInactive && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-sm" title="Inativo há mais de 24h">
                        <AlertTriangle className="w-3 h-3" /> Inativo
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">{m.unitName}</p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-black flex items-center justify-end gap-1 mb-1 ${m.score === null ? 'text-muted-foreground/30' : m.score >= 75 ? 'text-emerald-500 dark:text-emerald-400' : m.score >= 50 ? 'text-indigo-400 dark:text-indigo-300' : 'text-rose-500 dark:text-rose-400'}`}>
                    {m.score !== null ? `${m.score}%` : '—'}
                  </div>
                  <div className="w-16 h-1.5 bg-black/5 dark:bg-[#13111A] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.score ?? 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {managerRanking.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Cadastre gerentes para ver o ranking.</p>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Index;
