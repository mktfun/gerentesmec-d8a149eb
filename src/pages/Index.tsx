import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { 
  TrendingUp, MonitorPlay, AlertTriangle, Target, DollarSign, Clock, CheckCircle2
} from 'lucide-react';
import { 
  mockLeads, mockChartDataMultiline, mockRadarData, mockUnitBarData 
} from '@/data/mockData';
import { useAppData } from '@/context/AppDataContext';
import TvDashboard from '@/components/Dashboard/TvDashboard';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 280, damping: 26, delay },
});

const Index = () => {
  const { isTvMode, setIsTvMode } = useAppData();
  
  if (isTvMode) {
    return <TvDashboard />;
  }

  const toggleTvMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsTvMode(true);
    }
  };

  // Derived metrics for Actionable Insight
  const dangerLeads = mockLeads.filter(l => l.sla_status === 'danger' && l.funnel_stage !== 'closed_won' && l.funnel_stage !== 'closed_lost');
  const financialRisk = dangerLeads.length * 300;

  return (
    <div className="p-8 pb-20">
      
      {/* ── Page Header ── */}
      <motion.div {...fadeUp(0)} className="mb-6 flex items-end justify-between">
        <div>
          <p className="label-caps text-primary/70 mb-1">Visão CEO</p>
          <h1 className="text-2xl font-black text-foreground">Comando Central</h1>
        </div>
        <button onClick={toggleTvMode}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-muted text-foreground border border-border
            hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
          <MonitorPlay className="w-4 h-4" />
          TV Mode
        </button>
      </motion.div>

      {/* ── HERO CARD: SCORE GLOBAL ── */}
      <motion.div {...fadeUp(0.05)} className="mb-6 rounded-[2rem] bg-[#0a0a0f] border border-white/[0.08] p-8 lg:p-10 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-[0_0_80px_rgba(99,102,241,0.06)]">
        {/* Glow */}
        <div className="absolute -top-1/2 -left-1/4 w-[150%] h-[200%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex-1">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/40 mb-4">Score Global da Rede</p>
          <div className="flex items-end gap-4 mb-2">
            <h2 className="text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none">
              78.5<span className="text-4xl text-white/40">%</span>
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">
            <TrendingUp className="w-4 h-4" />
            +2.5% esta semana
          </div>
          <p className="text-sm text-white/40 mt-6 font-medium">
            Média ponderada baseada em SLAs (60%) e Auditorias Manuais (40%).
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 lg:w-1/2">
          {[{ name: 'Dom Pedro', val: 62.5, c: 'text-rose-400' }, { name: 'Jabaquara', val: 87.5, c: 'text-emerald-400' }, { name: 'Kennedy', val: 75.0, c: 'text-indigo-400' }].map(u => (
            <div key={u.name} className="bg-white/[0.03] border border-white/[0.05] p-5 rounded-2xl flex flex-col items-center justify-center backdrop-blur-xl">
              <span className={`text-3xl font-black ${u.c} mb-1`}>{u.val}%</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">{u.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── ACTIONABLE INSIGHTS ── */}
      <motion.div {...fadeUp(0.1)} className="mb-8 rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-black text-foreground uppercase tracking-wider">Gargalo Atual</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A unidade <strong className="text-foreground">Dom Pedro</strong> possui <strong>{dangerLeads.length} orçamentos</strong> aguardando envio além do tempo limite (SLA Rompido). O impacto estimado de faturamento travado é de <strong className="text-rose-500">R$ {financialRisk.toLocaleString('pt-BR')}</strong>.
          </p>
        </div>
        <div className="w-px h-16 bg-border hidden md:block" />
        <div className="flex-1 bg-muted/50 p-4 rounded-xl border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-foreground">Ação Recomendada</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Cobrar o gerente imediato sobre a <strong>Etapa 2 (Envio de Orçamento com Vídeo)</strong> e revisar fila de mensagens do Chatwoot na inbox `Dom Pedro`.
          </p>
        </div>
      </motion.div>

      {/* ── MÉTIRICAS SECUNDÁRIAS (4 Cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div {...fadeUp(0.15)} className="rounded-xl p-4 bg-card border border-border">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground"><DollarSign className="w-4 h-4"/> <span className="text-xs font-bold uppercase tracking-wider">Risco Financeiro</span></div>
          <p className="text-2xl font-black text-foreground">R$ {financialRisk}</p>
        </motion.div>
        <motion.div {...fadeUp(0.2)} className="rounded-xl p-4 bg-card border border-border">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground"><CheckCircle2 className="w-4 h-4"/> <span className="text-xs font-bold uppercase tracking-wider">Conversão</span></div>
          <p className="text-2xl font-black text-foreground">68% <span className="text-xs text-emerald-500 ml-1">▲</span></p>
        </motion.div>
        <motion.div {...fadeUp(0.25)} className="rounded-xl p-4 bg-card border border-border">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground"><Clock className="w-4 h-4"/> <span className="text-xs font-bold uppercase tracking-wider">Tempo Médio</span></div>
          <p className="text-2xl font-black text-foreground">14m</p>
        </motion.div>
        <motion.div {...fadeUp(0.3)} className="rounded-xl p-4 bg-card border border-border">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground"><DollarSign className="w-4 h-4"/> <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span></div>
          <p className="text-2xl font-black text-foreground">R$ 1.250</p>
        </motion.div>
      </div>

      {/* ── GRÁFICOS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        <motion.div {...fadeUp(0.35)} className="rounded-2xl p-5 bg-card border border-border lg:col-span-1 flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground">Ranking de Atendimento</h3>
            <p className="text-xs text-muted-foreground mt-1">Score médio por unidade</p>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockUnitBarData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                  {mockUnitBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#34d399' : entry.score >= 65 ? '#818cf8' : '#fb7185'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.4)} className="rounded-2xl p-5 bg-[#0a0a0f] border border-white/[0.06] lg:col-span-1 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05)_0%,transparent_100%)] pointer-events-none" />
          <div className="mb-2 relative z-10">
            <h3 className="text-sm font-bold text-white">Compliance do Funil</h3>
            <p className="text-xs text-white/50 mt-1">Gargalos por etapa (CEO View)</p>
          </div>
          <div className="flex-1 min-h-[250px] -mt-4 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={mockRadarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="step" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Dom Pedro" dataKey="dom_pedro" stroke="#fb7185" fill="#fb7185" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Jabaquara" dataKey="jabaquara" stroke="#34d399" fill="#34d399" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Kennedy"   dataKey="kennedy"   stroke="#818cf8" fill="#818cf8" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: '10px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.45)} className="rounded-2xl p-5 bg-card border border-border lg:col-span-1 flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground">Evolução Diária (Score)</h3>
            <p className="text-xs text-muted-foreground mt-1">Comparativo de qualidade (7 dias)</p>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartDataMultiline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis domain={[40, 100]} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="dom_pedro" stroke="#fb7185" strokeWidth={3} dot={{ r: 3, fill: '#fb7185' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="jabaquara" stroke="#34d399" strokeWidth={3} dot={{ r: 3, fill: '#34d399' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="kennedy"   stroke="#818cf8" strokeWidth={3} dot={{ r: 3, fill: '#818cf8' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Index;
