import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react';
import { mockChartData, mockManagers, mockUnits } from '@/data/mockData';

/* ─── Count-Up Hook ───────────────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((ease * target).toFixed(1)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

/* ─── Fade-in-up stagger helper ──────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 300, damping: 28, delay },
});

/* ─── Custom Tooltip for Chart ───────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="px-3 py-2 rounded-xl bg-[#1a1a28] border border-white/10 text-sm shadow-xl">
        <p className="text-white/50 text-xs mb-0.5">{label}</p>
        <p className="font-bold text-indigo-300">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

/* ─── Main Component ──────────────────────────────────────── */
const Index = () => {
  const globalScore = useCountUp(78.5);
  const sortedManagers = [...mockManagers].sort((a, b) => b.score - a.score);

  return (
    <div className="p-8 space-y-6 min-h-full">

      {/* ── ZONE 1: Hero ─────────────────────────────────────── */}
      <motion.div {...fadeUp(0)}
        className="relative overflow-hidden rounded-3xl p-8
          bg-[#111118] border border-white/[0.08]
          shadow-[0_4px_40px_rgba(0,0,0,0.5)]">

        {/* Background orbs */}
        <div className="orb w-72 h-72 bg-indigo-600/20 -top-20 -left-20" />
        <div className="orb w-60 h-60 bg-violet-700/15 top-0 right-0" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">

          {/* Main score */}
          <div className="flex-1">
            <p className="label-caps text-indigo-400/80 mb-3">Score Global da Rede</p>
            <div className="flex items-end gap-4">
              <span className="hero-number text-white">{globalScore}</span>
              <span className="text-4xl font-black text-white/40 mb-1">%</span>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="flex items-center gap-1 text-sm font-bold text-emerald-400 mb-2
                  bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                +2.5% esta semana
              </motion.span>
            </div>
            <p className="text-sm text-white/40 mt-2 font-medium">
              Média de qualidade de atendimento · Hoje, {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* Unit chips */}
          <div className="flex flex-wrap gap-3">
            {mockUnits.map((unit, i) => (
              <motion.div
                key={unit.id}
                {...fadeUp(0.3 + i * 0.1)}
                className="flex flex-col items-center px-4 py-3 rounded-2xl
                  bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08]
                  transition-colors cursor-pointer min-w-[90px]"
              >
                <span className={`text-2xl font-black ${
                  unit.score >= 80 ? 'text-emerald-400' : unit.score >= 65 ? 'text-indigo-300' : 'text-rose-400'
                }`}>{unit.score}%</span>
                <span className="text-xs text-white/40 font-semibold mt-0.5">{unit.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── ZONE 2: KPI Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Atendimentos Hoje',
            value: '142',
            sub: '4 auditorias pendentes',
            icon: Clock,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            delay: 0.05,
          },
          {
            label: 'Concluídos com Sucesso',
            value: '139',
            sub: '97.9% de resolução',
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            delay: 0.10,
          },
          {
            label: 'Leads em Alerta (>20m)',
            value: '3',
            sub: 'Ação imediata necessária',
            icon: AlertTriangle,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10',
            delay: 0.15,
          },
        ].map(({ label, value, sub, icon: Icon, color, bg, delay }) => (
          <motion.div key={label} {...fadeUp(delay)}
            whileHover={{ scale: 1.02, y: -2 }}
            className="rounded-2xl p-5 bg-[#111118] border border-white/[0.08]
              shadow-[0_2px_20px_rgba(0,0,0,0.3)] cursor-default">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-3xl font-black text-white mb-1">{value}</p>
            <p className="text-xs font-semibold text-white/50">{label}</p>
            <p className={`text-xs font-medium mt-1.5 ${color}`}>{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── ZONE 3: Chart + Ranking ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Chart */}
        <motion.div {...fadeUp(0.2)}
          className="lg:col-span-2 rounded-2xl p-6 bg-[#111118] border border-white/[0.08]
            shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-white text-sm">Evolução do Score Global</p>
              <p className="text-xs text-white/35 mt-0.5">Últimos 7 dias</p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10
              border border-emerald-500/20 px-2.5 py-1 rounded-full">▲ Semana positiva</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={mockChartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="day"
                axisLine={false} tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }}
                dy={8}
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                domain={[50, 100]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.4)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#scoreGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Ranking */}
        <motion.div {...fadeUp(0.25)}
          className="rounded-2xl p-6 bg-[#111118] border border-white/[0.08]
            shadow-[0_2px_20px_rgba(0,0,0,0.3)] flex flex-col">
          <p className="font-bold text-white text-sm mb-5">Ranking de Gerentes</p>
          <div className="flex-1 space-y-4 overflow-y-auto">
            {sortedManagers.map((m, idx) => {
              const unit = mockUnits.find(u => u.id === m.unit_id);
              const trend = idx < 2; // top 2 trending up
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.07, type: 'spring', stiffness: 280, damping: 25 }}
                  whileHover={{ x: 4 }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    {/* Rank + Avatar */}
                    <span className="text-xs font-bold text-white/20 w-4">{idx + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-indigo-500/25 flex items-center
                      justify-center text-xs font-black text-indigo-300 shrink-0">
                      {m.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white/90 truncate">{m.name}</p>
                      <p className="text-[10px] text-white/35 font-medium">{unit?.name}</p>
                    </div>
                    {/* Score + Trend */}
                    <div className="flex items-center gap-1 shrink-0">
                      {trend
                        ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                        : <TrendingDown className="w-3 h-3 text-rose-400" />
                      }
                      <span className={`text-sm font-black ${
                        m.score >= 80 ? 'text-emerald-400' : m.score >= 60 ? 'text-indigo-300' : 'text-rose-400'
                      }`}>{m.score}%</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="ml-7 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.score}%` }}
                      transition={{ delay: 0.4 + idx * 0.07, duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        m.score >= 80 ? 'bg-emerald-400' : m.score >= 60 ? 'bg-indigo-400' : 'bg-rose-400'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
