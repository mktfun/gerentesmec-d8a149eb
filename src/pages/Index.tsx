import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import {
  mockUnitBarData, mockRadarData, mockChartDataMultiline,
  mockManagers, mockUnits, mockLeads,
} from '@/data/mockData';

// ─── Count-up ───────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(parseFloat((ease * target).toFixed(1)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 280, damping: 26, delay },
});

// ─── Custom tooltips ────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl bg-card border border-border text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-bold" style={{ color: p.color }}>{p.value}%</p>
      ))}
    </div>
  );
};

const unitColor = (score: number) =>
  score >= 80 ? 'hsl(160 84% 56%)' : score >= 65 ? 'hsl(239 84% 67%)' : 'hsl(0 84% 70%)';

// ─── Main ────────────────────────────────────────────────────
const Index = () => {
  const globalScore = useCountUp(78.5);
  const slaLeads = mockLeads.filter(l => l.sla_status === 'danger').length;
  const totalToday = mockLeads.length;
  const closedWon = mockLeads.filter(l => l.funnel_stage === 'closed_won').length;

  return (
    <div className="p-8 space-y-5">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)}
        className="relative overflow-hidden rounded-2xl p-7 bg-card border border-border"
        style={{ boxShadow: '0 4px 40px hsl(239 84% 67% / 0.12)' }}
      >
        <div className="orb w-64 h-64 opacity-30"
          style={{ background: 'hsl(239 84% 67%)', top: -80, left: -60 }} />
        <div className="orb w-48 h-48 opacity-20"
          style={{ background: 'hsl(270 84% 60%)', top: -20, right: 40 }} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1">
            <p className="label-caps text-primary/70 mb-3">Score Global da Rede</p>
            <div className="flex items-end gap-3 flex-wrap">
              <span className="hero-number text-foreground">{globalScore}</span>
              <span className="text-4xl font-black text-muted-foreground mb-1">%</span>
              <motion.span
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400
                  bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full mb-1.5"
              >
                <TrendingUp className="w-3 h-3" />+2.5% esta semana
              </motion.span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Média de qualidade de atendimento · Hoje, {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          {/* Unit chips */}
          <div className="flex gap-3 flex-wrap">
            {mockUnits.map((u, i) => (
              <motion.div key={u.id} {...fadeUp(0.3 + i * 0.1)}
                className="flex flex-col items-center px-4 py-3 rounded-2xl
                  bg-background/60 border border-border hover:border-primary/30
                  transition-colors cursor-pointer min-w-[90px]"
              >
                <span className="text-2xl font-black" style={{ color: unitColor(u.score) }}>
                  {u.score}%
                </span>
                <span className="text-[11px] text-muted-foreground font-semibold mt-0.5">{u.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── KPI CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Atendimentos Hoje', value: totalToday, sub: '3 unidades ativas', icon: Clock, accent: 'text-primary', bg: 'bg-primary/10', delay: 0.05 },
          { label: 'Concluídos com Sucesso', value: closedWon, sub: `${Math.round((closedWon/totalToday)*100)}% de resolução`, icon: CheckCircle2, accent: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', delay: 0.1 },
          { label: 'SLA Estourado (>20m)', value: slaLeads, sub: 'Leads perdendo calor', icon: AlertTriangle, accent: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', delay: 0.15 },
          { label: 'Receita em Risco', value: `R$${slaLeads * 300}`, sub: `${slaLeads} lead${slaLeads>1?'s':''} × R$300 ticket`, icon: DollarSign, accent: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', delay: 0.2 },
        ].map(({ label, value, sub, icon: Icon, accent, bg, delay }) => (
          <motion.div key={label} {...fadeUp(delay)}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="rounded-2xl p-5 bg-card border border-border cursor-default"
          >
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-4`}>
              <Icon className={`w-4.5 h-4.5 ${accent}`} />
            </div>
            <p className="text-2xl font-black text-foreground mb-0.5">{value}</p>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className={`text-xs font-medium mt-1.5 ${accent}`}>{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── ROW: Bar Chart + Radar ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bar Chart — Score por Unidade */}
        <motion.div {...fadeUp(0.25)} className="rounded-2xl p-6 bg-card border border-border">
          <p className="text-sm font-bold text-foreground mb-1">Ranking de Unidades</p>
          <p className="text-xs text-muted-foreground mb-5">Score médio de qualidade por mecânica</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={mockUnitBarData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }} width={72} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10 }}
                formatter={(v: any) => [`${v}%`, 'Score']}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar dataKey="score" radius={6} label={{ position: 'right', fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700, formatter: (v: number) => `${v}%` }}>
                {mockUnitBarData.map((entry) => (
                  <Cell key={entry.name} fill={unitColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar Chart — Etapas por Unidade */}
        <motion.div {...fadeUp(0.3)} className="rounded-2xl p-6 bg-card border border-border">
          <p className="text-sm font-bold text-foreground mb-1">Cumprimento por Etapa</p>
          <p className="text-xs text-muted-foreground mb-3">Onde cada unidade está falhando</p>
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            {[
              { label: 'Dom Pedro', color: 'hsl(0 84% 70%)' },
              { label: 'Jabaquara', color: 'hsl(160 84% 56%)' },
              { label: 'Kennedy',   color: 'hsl(239 84% 67%)' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={mockRadarData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="step" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Radar dataKey="dom_pedro" stroke="hsl(0 84% 70%)" fill="hsl(0 84% 70%)" fillOpacity={0.15} />
              <Radar dataKey="jabaquara" stroke="hsl(160 84% 56%)" fill="hsl(160 84% 56%)" fillOpacity={0.15} />
              <Radar dataKey="kennedy" stroke="hsl(239 84% 67%)" fill="hsl(239 84% 67%)" fillOpacity={0.15} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10 }}
                formatter={(v: any) => [`${v}%`]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── ROW: MultiLine Chart + Ranking ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* MultiLine */}
        <motion.div {...fadeUp(0.35)} className="lg:col-span-2 rounded-2xl p-6 bg-card border border-border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-foreground">Evolução por Unidade</p>
            <div className="flex items-center gap-4">
              {[
                { label: 'Dom Pedro', color: 'hsl(0 84% 70%)' },
                { label: 'Jabaquara', color: 'hsl(160 84% 56%)' },
                { label: 'Kennedy', color: 'hsl(239 84% 67%)' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Últimos 7 dias</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockChartDataMultiline} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" axisLine={false} tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} dy={6} />
              <YAxis axisLine={false} tickLine={false} domain={[40, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Tooltip content={<DarkTooltip />} />
              <Line type="monotone" dataKey="dom_pedro" name="Dom Pedro" stroke="hsl(0 84% 70%)"
                strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={1200} />
              <Line type="monotone" dataKey="jabaquara" name="Jabaquara" stroke="hsl(160 84% 56%)"
                strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={1400} />
              <Line type="monotone" dataKey="kennedy" name="Kennedy" stroke="hsl(239 84% 67%)"
                strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={1600} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Ranking simplificado */}
        <motion.div {...fadeUp(0.4)} className="rounded-2xl p-6 bg-card border border-border flex flex-col">
          <p className="text-sm font-bold text-foreground mb-5">Gerentes</p>
          <div className="flex-1 space-y-4">
            {[...mockManagers].sort((a, b) => b.score - a.score).map((m, idx) => {
              const unit = mockUnits.find(u => u.id === m.unit_id);
              const trend = idx === 0;
              return (
                <motion.div key={m.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + idx * 0.08, type: 'spring', stiffness: 280 }}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xs font-bold text-muted-foreground/50 w-4">{idx + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center
                      justify-center text-xs font-black text-primary shrink-0">
                      {m.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground/90 truncate">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{unit?.name}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {trend
                        ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                        : <TrendingDown className="w-3 h-3 text-rose-500" />
                      }
                      <span className="text-sm font-black"
                        style={{ color: unitColor(m.score) }}>{m.score}%</span>
                    </div>
                  </div>
                  <div className="ml-7 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.score}%` }}
                      transition={{ delay: 0.5 + idx * 0.08, duration: 0.9, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: unitColor(m.score) }}
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
