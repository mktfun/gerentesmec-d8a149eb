import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, Activity, CheckCircle2, 
  Clock, AlertTriangle, MonitorPlay, XCircle
} from 'lucide-react';
import { 
  mockLeads, mockChartDataMultiline, mockRadarData, mockUnitBarData 
} from '@/data/mockData';
import { useAppData } from '@/context/AppDataContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 280, damping: 26, delay },
});

const Index = () => {
  const { isTvMode, setIsTvMode } = useAppData();
  
  // Simulated Realtime TV Mode effect
  const [ticker, setTicker] = useState(0);
  useEffect(() => {
    if (!isTvMode) return;
    const interval = setInterval(() => {
      setTicker(v => v + 1);
    }, 15000); // changes slight data or flashes a notification every 15s
    return () => clearInterval(interval);
  }, [isTvMode]);

  const toggleTvMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsTvMode(true);
    } else {
      document.exitFullscreen();
      setIsTvMode(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setIsTvMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [setIsTvMode]);

  // Derived metrics
  const dangerLeads = mockLeads.filter(l => l.sla_status === 'danger' && l.funnel_stage !== 'closed_won' && l.funnel_stage !== 'closed_lost');
  const financialRisk = dangerLeads.length * 300; // Mock 300 ticket avg for at-risk

  return (
    <div className={`p-8 ${isTvMode ? 'h-full flex flex-col justify-center' : ''}`}>
      
      {/* ── Page Header & TV Mode Toggle ── */}
      <motion.div {...fadeUp(0)} className={`mb-8 flex items-end justify-between ${isTvMode ? 'hidden' : ''}`}>
        <div>
          <p className="label-caps text-primary/70 mb-1">Visão CEO</p>
          <h1 className="text-2xl font-black text-foreground">Comando Central</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Status geral das mecânicas, SLAs críticos e métricas de conversão.
          </p>
        </div>
        <button onClick={toggleTvMode}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-muted text-foreground border border-border
            hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">
          <MonitorPlay className="w-4 h-4" />
          TV Mode
        </button>
      </motion.div>

      {/* ── Seção 1: Impacto Financeiro e Alertas ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        <motion.div {...fadeUp(0.1)} className="rounded-2xl p-5 bg-[#111118] border border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.08)] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Risco Imediato</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black text-foreground mb-1">
              R$ {financialRisk.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              Estimação baseada em <span className="text-rose-400">{dangerLeads.length} leads pendentes</span> no SLA.
            </p>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.15)} className="rounded-2xl p-5 bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Conversão (Geral)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-foreground mb-1">
            {Math.floor(Math.random() * 5 + 68)}% <span className={`text-sm ${ticker % 2 === 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>▲</span>
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            Alta de 4% em relação à última semana.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="rounded-2xl p-5 bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tempo Médio Rsp.</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-foreground mb-1">14m</p>
          <p className="text-xs font-medium text-muted-foreground">
            A unidade Dom Pedro puxa a média para cima.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.25)} className="rounded-2xl p-5 bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ticket Médio</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-black text-foreground mb-1">R$ 1.250</p>
          <p className="text-xs font-medium text-muted-foreground">
            Impulsionado por Jabaquara nesta semana.
          </p>
        </motion.div>
      </div>

      {/* ── Seção 2: Gráficos de Perfomance ── */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-5 ${isTvMode ? 'flex-1' : ''}`}>
        
        {/* Gráfico de Barras: Ranking de Qualidade */}
        <motion.div {...fadeUp(0.3)} className="rounded-2xl p-5 bg-card border border-border lg:col-span-1 flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground">Ranking de Atendimento</h3>
            <p className="text-xs text-muted-foreground mt-1">Score médio por unidade (baseado em SLA e auditoria)</p>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockUnitBarData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                  {mockUnitBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#34d399' : entry.score >= 65 ? '#818cf8' : '#fb7185'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico Radar: Onde as mecânicas falham? */}
        <motion.div {...fadeUp(0.35)} className="rounded-2xl p-5 bg-[#111118] border border-white/[0.06] lg:col-span-1 flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-foreground">Compliance do Funil</h3>
            <p className="text-xs text-muted-foreground mt-1">Onde as mecânicas estão errando (CEO View)</p>
          </div>
          <div className="flex-1 min-h-[250px] -mt-4">
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

        {/* Gráfico de Linhas: Evolução 7 dias */}
        <motion.div {...fadeUp(0.4)} className="rounded-2xl p-5 bg-card border border-border lg:col-span-1 flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground">Evolução Diária (Score)</h3>
            <p className="text-xs text-muted-foreground mt-1">Comparativo de qualidade nos últimos 7 dias</p>
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

      {/* Floating Exit TV Mode Button */}
      <AnimatePresence>
        {isTvMode && (
          <motion.button
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            onClick={toggleTvMode}
            className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 rounded-full bg-rose-500 text-white font-bold shadow-2xl hover:bg-rose-600 transition-colors z-50"
          >
            <XCircle className="w-5 h-5" />
            Sair do Modo TV
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
