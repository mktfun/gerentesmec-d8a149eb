import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Target, Clock, XCircle, Calendar } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { calculateTmr } from '@/utils/metrics';

const TvDashboard: React.FC = () => {
  const { leads, units, setIsTvMode, businessHours } = useAppData();
  const [page, setPage] = useState(0);
  const [intervalTime, setIntervalTime] = useState(15000); // 15s default

  const ITEMS_PER_PAGE = 3;
  const totalPages = Math.ceil(units.length / ITEMS_PER_PAGE);

  // Pagination Timer
  useEffect(() => {
    if (totalPages <= 1) return;
    const timer = setInterval(() => {
      setPage(p => (p + 1) % totalPages);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [totalPages, intervalTime]);


  const visibleUnits = units.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const toggleTvMode = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsTvMode(false);
  };

  type DateFilter = 'today' | 'yesterday' | '7d' | 'month';
  const [dateFilter, setDateFilter] = useState<DateFilter>(() => {
    return (localStorage.getItem('tv_date_filter') as DateFilter) || 'today';
  });

  useEffect(() => {
    localStorage.setItem('tv_date_filter', dateFilter);
  }, [dateFilter]);

  const getDateRange = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch(dateFilter) {
      case 'today': return startOfDay.getTime();
      case 'yesterday': return startOfDay.getTime() - 86400000;
      case '7d': return startOfDay.getTime() - (86400000 * 7);
      case 'month': return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      default: return startOfDay.getTime();
    }
  };

  const getEndDate = () => {
    if (dateFilter === 'yesterday') {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    }
    return Infinity;
  };

  const getUnitMetrics = (unitId: string) => {
    const startDate = getDateRange();
    const endDate = getEndDate();
    
    const unitLeads = leads.filter(l => l.unit_id === unitId);
    
    // Filter by selected date
    const periodLeads = unitLeads.filter(l => {
      // Fallback to created_at if last_message_at is missing
      const t = new Date(l.last_message_at || l.created_at).getTime();
      return t >= startDate && t < endDate;
    });

    const scored = periodLeads.filter(l => l.score !== null);
    const score = (periodLeads.length > 0 && scored.length > 0)
      ? Math.round((scored.reduce((a, l) => a + Number(l.score), 0) / periodLeads.length) * 10) / 10
      : null;

    // Trend vs previous identical period
    const periodDuration = dateFilter === 'today' || dateFilter === 'yesterday' ? 86400000 
                          : dateFilter === '7d' ? 86400000 * 7 
                          : 86400000 * 30;
    const prevStart = startDate - periodDuration;
    const prevEnd = startDate;
    
    const prevLeads = unitLeads.filter(l => {
      const t = new Date(l.last_message_at || l.created_at).getTime();
      return t >= prevStart && t < prevEnd;
    });
    const prevScored = prevLeads.filter(l => l.score !== null);

    let diff: number | null = null;
    if (prevLeads.length && score !== null) {
      const prevScore = prevScored.reduce((a, l) => a + Number(l.score), 0) / prevLeads.length;
      diff = Math.round((score - prevScore) * 10) / 10;
    }

    const tmrFallback = calculateTmr(periodLeads, businessHours);
    const dangerCount = periodLeads.filter(l => calculateTmr([l], businessHours) > 20 || l.sla_status === 'danger').length;

    return {
      score,
      diff,
      tmrFallback,
      dangerCount,
      periodLeadsCount: periodLeads.length
    };
  };



  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="h-20 border-b border-border px-10 flex items-center justify-between shrink-0 bg-black/5 dark:bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
            <span className="text-indigo-500 font-black text-xl">M</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">COMANDO CENTRAL</h1>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Live Feed • {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Date Filter */}
          <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-full p-1 border border-border">
            <Calendar className="w-4 h-4 text-muted-foreground ml-3 mr-1" />
            {(['today', 'yesterday', '7d', 'month'] as const).map(f => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all uppercase tracking-wider ${
                  dateFilter === f ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/40 hover:text-white/80'
                }`}
              >
                {f === 'today' ? 'Hoje' : f === 'yesterday' ? 'Ontem' : f === '7d' ? '7 Dias' : 'Mês'}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Pagination dots & Timer Controls */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === page ? 'w-6 bg-indigo-500' : 'w-1.5 bg-black/20 dark:bg-white/20'}`} />
              ))}
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full">
              {[15, 30, 60].map(s => (
                <button key={s} onClick={() => { setIntervalTime(s * 1000); setPage(0); }}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${intervalTime === s * 1000 ? 'bg-black/10 dark:bg-white/20 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {s}s
                </button>
              ))}
            </div>
          </div>

          <button onClick={toggleTvMode} className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition-colors text-xs font-bold text-muted-foreground">
            <XCircle className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>

      {/* COLUMNS */}
      <div className="flex-1 relative overflow-hidden p-8 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -100, filter: 'blur(10px)' }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="grid grid-cols-3 gap-8 h-full"
          >
            {visibleUnits.map((unit, i) => {
              const { score, diff, tmrFallback, dangerCount } = getUnitMetrics(unit.id);
              const displayTmr = tmrFallback > 0 ? `${tmrFallback}m` : '—';
              const displayScore = score ?? 0;
              
              const isDanger = score !== null && score < 70;
              const isStrong = score !== null && score > 85;
              const glowColor = isDanger ? 'rgba(244,63,94,0.15)' : isStrong ? 'rgba(52,211,153,0.15)' : 'rgba(129,140,248,0.15)';
              const accentClass = isDanger ? 'text-rose-500' : isStrong ? 'text-emerald-500' : 'text-indigo-500';

              const glowColorFull = glowColor.slice(0, -5) + '1)';

              return (
                <div
                  key={unit.id}
                  className="relative rounded-[2rem] bg-card border border-border flex flex-col h-full overflow-hidden"
                  style={{ boxShadow: `0 0 120px ${glowColor}` }}
                >
                  {/* Radial background glow (Fixed Clipping) */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] opacity-20 pointer-events-none"
                       style={{ background: `radial-gradient(ellipse at top, ${glowColorFull} 0%, transparent 70%)` }} />

                  <div className="px-8 pt-10 pb-6 text-center relative z-10 flex-1 flex flex-col">
                    <h2 className="text-3xl font-black text-foreground mb-2">{unit.name}</h2>
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-8">Performance Atual</p>

                    {/* Massive Score */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="relative inline-flex items-center justify-center w-64 h-64 rounded-full border-[8px] border-border mb-6">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 256 256">
                          <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="none"
                                  className={`${accentClass} transition-all duration-1000`}
                                  strokeDasharray={`${(displayScore / 100) * (2 * Math.PI * 120)} 1000`}
                                  strokeLinecap="round" />
                        </svg>
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-7xl font-black tracking-tighter text-foreground">
                            {score !== null ? score : '—'}
                          </span>
                          {score !== null && <span className="text-xl font-bold text-muted-foreground">%</span>}
                        </div>
                      </div>
                      
                      <div className="h-10 flex items-center justify-center">
                        {diff !== null ? (
                          <div className={`flex items-center gap-2 text-xl font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {diff >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                            {Math.abs(diff)}% vs ant.
                          </div>
                        ) : (
                          <div className="text-sm font-semibold text-white/30">Sem comparativo disponível</div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Footer Alertas */}
                  <div className="p-6 bg-black/5 dark:bg-black/40 border-t border-border relative z-10">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status Operacional</span>
                      {dangerCount > 0 ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-xs font-bold text-rose-500">ALERTA SLA</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs font-bold text-emerald-500">OPERAÇÃO NORMAL</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-black/5 dark:bg-white/[0.02] border border-border">
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Leads em Risco</span>
                        </div>
                        <span className={`text-2xl font-black ${dangerCount > 0 ? 'text-rose-500' : 'text-foreground'}`}>
                          {dangerCount}
                        </span>
                      </div>
                      <div className="p-4 rounded-xl bg-black/5 dark:bg-white/[0.02] border border-border">
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">T.M.R.</span>
                        </div>
                        <span className="text-2xl font-black text-foreground">
                          {displayTmr}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TvDashboard;
