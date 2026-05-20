import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Target, Clock, XCircle } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';

const TvDashboard: React.FC = () => {
  const { leads, units, setIsTvMode } = useAppData();
  const [ticker, setTicker] = useState(0);

  // Pulse effect
  useEffect(() => {
    const interval = setInterval(() => setTicker(v => v + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleTvMode = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsTvMode(false);
  };

  const getUnitScore = (unitId: string) => {
    if (unitId === 'unit_1') return { val: 62.5, diff: -4 };
    if (unitId === 'unit_2') return { val: 87.5, diff: 2 };
    if (unitId === 'unit_3') return { val: 75.0, diff: 1 };
    return { val: 0, diff: 0 };
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050508] text-white flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="h-20 border-b border-white/[0.05] px-10 flex items-center justify-between shrink-0 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <span className="text-indigo-500 font-black text-xl">M</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white/90">COMANDO CENTRAL</h1>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Live Feed • {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Actionable Insight Central */}
        <div className="flex-1 max-w-3xl mx-8 relative overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/20 px-6 py-3 flex items-center gap-4 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
          <Target className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm font-bold text-amber-50/90 leading-tight">
            <span className="text-amber-400 uppercase tracking-wider mr-2">Foco do Dia:</span>
            Unidade <strong className="text-white">Dom Pedro</strong> com alto volume de orçamentos travados no SLA (+20m). <strong className="text-amber-400">Contato proativo exigido.</strong>
          </p>
        </div>

        <button onClick={toggleTvMode} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition-colors text-xs font-bold text-white/50">
          <XCircle className="w-4 h-4" /> Sair
        </button>
      </div>

      {/* COLUMNS */}
      <div className="flex-1 grid grid-cols-3 gap-6 p-6">
        {units.map((unit, i) => {
          const unitLeads = leads.filter(l => l.unit_id === unit.id);
          const dangerLeads = unitLeads.filter(l => l.sla_status === 'danger' && l.funnel_stage !== 'closed_won' && l.funnel_stage !== 'closed_lost');
          const score = getUnitScore(unit.id);
          
          const isDanger = score.val < 70;
          const glowColor = isDanger ? 'rgba(244,63,94,0.15)' : score.val > 85 ? 'rgba(52,211,153,0.15)' : 'rgba(129,140,248,0.15)';
          const accentClass = isDanger ? 'text-rose-500' : score.val > 85 ? 'text-emerald-500' : 'text-indigo-500';

          return (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, type: 'spring' }}
              className="relative rounded-[2rem] bg-[#0a0a0f] border border-white/[0.05] overflow-hidden flex flex-col"
              style={{ boxShadow: `0 0 120px ${glowColor}` }}
            >
              {/* Radial background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] rounded-[100%] opacity-20 pointer-events-none"
                   style={{ background: `radial-gradient(ellipse at top, ${glowColor.replace('0.15', '1')} 0%, transparent 70%)` }} />

              <div className="p-8 text-center relative z-10 flex-1 flex flex-col">
                <h2 className="text-3xl font-black text-white/90 mb-2">{unit.name}</h2>
                <p className="text-sm font-bold uppercase tracking-widest text-white/40 mb-12">Performance Atual</p>

                {/* Massive Score */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative inline-flex items-center justify-center w-64 h-64 rounded-full border-[8px] border-white/5 mb-8">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="124" cy="124" r="120" stroke="currentColor" strokeWidth="8" fill="none"
                              className={`${accentClass} transition-all duration-1000`}
                              strokeDasharray={`${(score.val / 100) * (2 * Math.PI * 120)} 1000`}
                              strokeLinecap="round" />
                    </svg>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-7xl font-black tracking-tighter text-white">
                        {score.val}
                      </span>
                      <span className="text-xl font-bold text-white/50">%</span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 text-xl font-bold ${score.diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {score.diff >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    {Math.abs(score.diff)}% vs ontem
                  </div>
                </div>

              </div>

              {/* Footer Alertas */}
              <div className="p-6 bg-black/40 border-t border-white/[0.05] relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/40">Status Operacional</span>
                  {dangerLeads.length > 0 ? (
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
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex items-center gap-2 mb-2 text-white/50">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Leads em Risco</span>
                    </div>
                    <span className={`text-2xl font-black ${dangerLeads.length > 0 ? 'text-rose-500' : 'text-white/90'}`}>
                      {dangerLeads.length}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex items-center gap-2 mb-2 text-white/50">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">T.M.R.</span>
                    </div>
                    <span className="text-2xl font-black text-white/90">
                      {isDanger ? '22m' : '7m'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TvDashboard;
