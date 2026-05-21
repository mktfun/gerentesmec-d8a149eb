import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, ShieldCheck, Download } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { calculateTmr, calculateDangerLeads } from '@/utils/metrics';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 280, damping: 26, delay },
});

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };

const Relatorios = () => {
  const { leads, businessHours } = useAppData();
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month'>('month');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFilterChange = (filter: 'today' | '7days' | 'month') => {
    setIsUpdating(true);
    setDateFilter(filter);
    setTimeout(() => setIsUpdating(false), 300);
  };

  const periodDays = dateFilter === 'today' ? 1 : dateFilter === '7days' ? 7 : 30;
  const now = new Date();
  const periodStart = startOfDay(now).getTime() - (periodDays - 1) * 86400000;
  const prevPeriodStart = periodStart - periodDays * 86400000;

  const inRange = (l: typeof leads[number], from: number, to: number) => {
    const t = new Date(l.last_message_at).getTime();
    return t >= from && t < to;
  };

  const currentLeads = leads.filter(l => inRange(l, periodStart, now.getTime() + 1));
  const prevLeads    = leads.filter(l => inRange(l, prevPeriodStart, periodStart));

  const avg = (nums: number[]) => nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  const round = (n: number | null) => n === null ? null : Math.round(n);

  const scoreCur  = round(avg(currentLeads.filter(l => l.score !== null).map(l => Number(l.score))));
  const scorePrev = round(avg(prevLeads.filter(l => l.score !== null).map(l => Number(l.score))));
  const tmrCur    = currentLeads.length ? calculateTmr(currentLeads, businessHours) : null;
  const tmrPrev   = prevLeads.length ? calculateTmr(prevLeads, businessHours) : null;
  const slasCur   = calculateDangerLeads(currentLeads, businessHours).length;
  const slasPrev  = calculateDangerLeads(prevLeads, businessHours).length;

  const metrics = {
    score: scoreCur,
    scoreChange: scoreCur !== null && scorePrev !== null ? scoreCur - scorePrev : null,
    tmr: tmrCur,
    tmrChange: tmrCur !== null && tmrPrev !== null ? tmrCur - tmrPrev : null,
    slasRisk: slasCur,
    slasChange: slasCur - slasPrev,
  };

  const hasData = currentLeads.length > 0;
  const auditedLeads = currentLeads.filter(l => l.score !== null);


  return (
    <div className="p-8 pb-20">
      
      {/* ── Header & Filters ── */}
      <motion.div {...fadeUp(0)} className="mb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <p className="label-caps text-indigo-400/70 mb-1">Analytics Premium</p>
          <h1 className="text-2xl font-black text-foreground">Saúde do Atendimento</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas de qualidade, tempo de resposta e gargalos de SLA da rede.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-muted rounded-xl border border-border">
            <button onClick={() => handleFilterChange('today')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${dateFilter === 'today' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Hoje</button>
            <button onClick={() => handleFilterChange('7days')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${dateFilter === '7days' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>7 Dias</button>
            <button onClick={() => handleFilterChange('month')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${dateFilter === 'month' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Este Mês</button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground border border-border rounded-xl text-xs font-bold hover:bg-muted/80 transition-colors">
            <Calendar className="w-4 h-4" />
            Customizado
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.25)]">
            <Download className="w-4 h-4" />
            Exportar XLS
          </button>
        </div>
      </motion.div>

      {/* ── KPI Cards Premium ── */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 transition-opacity duration-300 ${isUpdating ? 'opacity-40' : 'opacity-100'}`}>
        
        {/* Score Geral */}
        <motion.div {...fadeUp(0.1)} className="p-6 rounded-3xl bg-[#0a0a0f] border border-white/[0.08] relative overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.05)]">
          <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck className="w-24 h-24" /></div>
          <div className="absolute -left-1/4 -top-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Score Global de Qualidade</p>
            <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">
              {metrics.score !== null ? <>{metrics.score}<span className="text-2xl text-white/40">%</span></> : <span className="text-white/30">—</span>}
            </h2>
            {metrics.scoreChange !== null ? (
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${metrics.scoreChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {metrics.scoreChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {metrics.scoreChange >= 0 ? '+' : ''}{metrics.scoreChange}%
                </span>
                <span className="text-xs text-white/40 font-medium">vs período anterior</span>
              </div>
            ) : (
              <span className="text-xs text-white/30 font-medium">Sem comparativo disponível</span>
            )}
          </div>
        </motion.div>

        {/* TMR */}
        <motion.div {...fadeUp(0.15)} className="p-6 rounded-3xl bg-[#0a0a0f] border border-white/[0.08] relative overflow-hidden shadow-[0_0_40px_rgba(52,211,153,0.05)]">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Clock className="w-24 h-24" /></div>
          <div className="absolute -left-1/4 -top-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.15)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Tempo Médio de Resposta (TMR)</p>
            <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">
              {metrics.tmr !== null ? <>{metrics.tmr}<span className="text-2xl text-white/40">m</span></> : <span className="text-white/30">—</span>}
            </h2>
            {metrics.tmrChange !== null ? (
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${metrics.tmrChange <= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {metrics.tmrChange <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {metrics.tmrChange <= 0 ? '' : '+'}{metrics.tmrChange}m {metrics.tmrChange <= 0 ? '(Melhoria)' : ''}
                </span>
                <span className="text-xs text-white/40 font-medium">vs período anterior</span>
              </div>
            ) : (
              <span className="text-xs text-white/30 font-medium">Sem comparativo disponível</span>
            )}
          </div>
        </motion.div>

        {/* SLAs */}
        <motion.div {...fadeUp(0.2)} className="p-6 rounded-3xl bg-[#0a0a0f] border border-white/[0.08] relative overflow-hidden shadow-[0_0_40px_rgba(244,63,94,0.05)]">
          <div className="absolute top-0 right-0 p-6 opacity-10"><AlertTriangle className="w-24 h-24" /></div>
          <div className="absolute -left-1/4 -top-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.15)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-3">Orçamentos em Risco (SLA)</p>
            <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">{metrics.slasRisk}</h2>
            {(metrics.slasChange !== 0 || hasData) ? (
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${metrics.slasChange <= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {metrics.slasChange <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {metrics.slasChange >= 0 ? '+' : ''}{metrics.slasChange} leads
                </span>
                <span className="text-xs text-white/40 font-medium">vs período anterior</span>
              </div>
            ) : (
              <span className="text-xs text-white/30 font-medium">Sem dados para o período</span>
            )}
          </div>
        </motion.div>

      </div>

      {/* ── Log de Auditoria ── */}
      <motion.div {...fadeUp(0.3)} className={`bg-[#0a0a0f] border border-white/[0.08] rounded-3xl overflow-hidden transition-opacity duration-300 ${isUpdating ? 'opacity-40' : 'opacity-100'} shadow-[0_0_80px_rgba(255,255,255,0.02)]`}>
        <div className="px-8 py-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div>
            <h3 className="text-base font-black text-white">Log de Auditorias Recentes</h3>
            <p className="text-xs font-medium text-white/50 mt-1">Transparência total nos apontamentos de qualidade.</p>
          </div>
          <Target className="w-5 h-5 text-white/20" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.01] border-b border-white/[0.08] text-xs uppercase text-white/40 tracking-wider font-bold">
              <tr>
                <th className="px-8 py-4">Cliente / Veículo</th>
                <th className="px-8 py-4">Unidade</th>
                <th className="px-8 py-4">Status Funil</th>
                <th className="px-8 py-4 text-right">Score Auditado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {auditedLeads.length > 0 ? (
                auditedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-8 py-4">
                      <p className="font-bold text-white/90">{lead.customer_name}</p>
                      <p className="text-xs text-white/40">{lead.customer_vehicle}</p>
                    </td>
                    <td className="px-8 py-4 text-white/60 font-semibold">{lead.unit_id ? lead.unit_id.replace('unit_', 'Unidade ') : 'Sem unidade'}</td>
                    <td className="px-8 py-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-white/40 border border-white/10 px-2 py-1 rounded-md bg-white/[0.02]">
                        {lead.funnel_stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      {lead.score && (
                        <div className={`inline-flex items-center gap-1 font-black px-2.5 py-1 rounded-lg border
                          ${lead.score >= 75 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                            : lead.score >= 50 ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' 
                            : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                          {Math.round(lead.score)}%
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-8 text-center text-white/30">Nenhuma auditoria registrada neste período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
};

export default Relatorios;
