import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, Clock, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import TvDashboard from '@/components/Dashboard/TvDashboard';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 280, damping: 26, delay },
});

// Mock data for the Area Chart to match the screenshot
const globalScoreHistory = [
  { day: 'Seg', score: 65 },
  { day: 'Ter', score: 72 },
  { day: 'Qua', score: 85 },
  { day: 'Qui', score: 78 },
  { day: 'Sex', score: 82 },
  { day: 'Sáb', score: 90 },
  { day: 'Dom', score: 95 },
];

const Index = () => {
  const { leads, managers, units, isTvMode, setIsTvMode } = useAppData();
  
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
  
  // 1. Global Score
  const scoredLeads = leads.filter(l => l.score !== null);
  const globalScore = scoredLeads.length > 0 
    ? Math.round(scoredLeads.reduce((acc, l) => acc + (l.score || 0), 0) / scoredLeads.length)
    : 78.5; // fallback

  // 2. Unit Scores
  const unitScores = units.map(u => {
    const uLeads = scoredLeads.filter(l => l.unit_id === u.id);
    const score = uLeads.length > 0 ? Math.round(uLeads.reduce((acc, l) => acc + (l.score || 0), 0) / uLeads.length) : 0;
    return { ...u, score };
  });

  // 3. Status Metrics
  const todayLeads = leads; // Assuming all in context are 'today' for this demo
  const pendingAudits = todayLeads.filter(l => l.funnel_stage === 'closed_won' && l.score === null).length;
  
  const completedLeads = todayLeads.filter(l => l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost');
  const resolutionRate = todayLeads.length > 0 ? ((completedLeads.length / todayLeads.length) * 100).toFixed(1) : 0;
  
  const dangerLeads = todayLeads.filter(l => l.sla_status === 'danger' && l.funnel_stage !== 'closed_won' && l.funnel_stage !== 'closed_lost');

  // 4. Manager Ranking
  const managerRanking = managers.map(m => {
    const mLeads = scoredLeads.filter(l => l.manager_id === m.id);
    const score = mLeads.length > 0 ? Math.round(mLeads.reduce((acc, l) => acc + (l.score || 0), 0) / mLeads.length) : 0;
    const unit = units.find(u => u.id === m.unit_id);
    return { ...m, score, unitName: unit?.name || 'N/A' };
  }).sort((a, b) => b.score - a.score);

  const todayStr = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date());

  return (
    <div className="p-8 pb-20 min-h-screen bg-[#13111A]">
      
      {/* ── Page Header ── */}
      <motion.div {...fadeUp(0)} className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Olá, Administrador 👋</h1>
          <p className="text-sm text-slate-400 mt-1 capitalize">
            {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">Ao vivo</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold cursor-pointer hover:scale-105 transition-transform" onClick={toggleTvMode}>
            D
          </div>
        </div>
      </motion.div>

      {/* ── HERO CARD: SCORE GLOBAL ── */}
      <motion.div {...fadeUp(0.05)} className="mb-6 rounded-[2rem] bg-[#1E1B29] p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-indigo-300/70 mb-4">Score Global da Rede</p>
          <div className="flex items-end gap-6 mb-2">
            <h2 className="text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none">
              {globalScore}<span className="text-4xl text-white/50">%</span>
            </h2>
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-sm">
              <TrendingUp className="w-4 h-4" />
              +2.5% esta semana
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-4">
            Média de qualidade de atendimento · Hoje, {todayStr}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {unitScores.map((u, i) => {
            const colorClass = u.score >= 80 ? 'text-emerald-400' : u.score >= 65 ? 'text-indigo-400' : 'text-rose-400';
            return (
              <div key={u.id} className="bg-[#15121E] px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
                <span className={`text-2xl font-black ${colorClass} mb-1`}>{u.score}%</span>
                <span className="text-[11px] font-semibold text-slate-400">{u.name}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── METRICS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div {...fadeUp(0.1)} className="rounded-2xl p-6 bg-[#1E1B29] shadow-xl relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-4xl font-black text-white mb-2">{todayLeads.length}</h3>
          <p className="text-sm text-slate-300 font-medium mb-1">Atendimentos Hoje</p>
          <p className="text-xs text-indigo-400">{pendingAudits} auditorias pendentes</p>
        </motion.div>

        <motion.div {...fadeUp(0.15)} className="rounded-2xl p-6 bg-[#1E1B29] shadow-xl relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-4xl font-black text-white mb-2">{completedLeads.length}</h3>
          <p className="text-sm text-slate-300 font-medium mb-1">Concluídos com Sucesso</p>
          <p className="text-xs text-emerald-400">{resolutionRate}% de resolução</p>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="rounded-2xl p-6 bg-[#1E1B29] shadow-xl relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <h3 className="text-4xl font-black text-white mb-2">{dangerLeads.length}</h3>
          <p className="text-sm text-slate-300 font-medium mb-1">Leads em Alerta ({'>'}20m)</p>
          <p className="text-xs text-rose-400">Ação imediata necessária</p>
        </motion.div>
      </div>

      {/* ── CHARTS & RANKING ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Area Chart */}
        <motion.div {...fadeUp(0.25)} className="rounded-2xl p-6 bg-[#1E1B29] lg:col-span-2 shadow-xl flex flex-col">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Evolução do Score Global</h3>
              <p className="text-sm text-slate-400 mt-1">Últimos 7 dias</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-1">
              ▲ Semana positiva
            </div>
          </div>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={globalScoreHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#13111A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Ranking */}
        <motion.div {...fadeUp(0.3)} className="rounded-2xl p-6 bg-[#1E1B29] lg:col-span-1 shadow-xl flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Ranking de Gerentes</h3>
          </div>
          <div className="flex-1 flex flex-col gap-5">
            {managerRanking.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-500 w-4">{idx + 1}</span>
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{m.name}</h4>
                  <p className="text-xs text-slate-400 truncate">{m.unitName}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-emerald-400 flex items-center justify-end gap-1 mb-1">
                    ~ {m.score}%
                  </div>
                  <div className="w-16 h-1.5 bg-[#13111A] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Index;
