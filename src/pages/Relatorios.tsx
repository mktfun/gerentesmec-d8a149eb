import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, ShieldCheck, Download } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { calculateTmr, calculateDangerLeads } from '@/utils/metrics';
import { DateRangePicker, DateRange } from '@/components/ui/DateRangePicker';
import AuditPanel from '@/components/Crm/AuditPanel';
import { AnimatePresence } from 'framer-motion';

import { fadeUp } from '@/utils/motion';


const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };

const Relatorios = () => {
  const { leads, units, managers, businessHours } = useAppData();
  const now = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(new Date(now.getTime() - 29 * 86400000)),
    to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Novos Filtros
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [scoreOrder, setScoreOrder] = useState<string>('none');
  const [slaOrder, setSlaOrder] = useState<string>('none');

  // Audit Modal
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const periodStart = dateRange.from.getTime();
  const periodEnd = dateRange.to.getTime();
  const periodDays = Math.max(1, Math.ceil((periodEnd - periodStart) / 86400000));
  const prevPeriodStart = periodStart - periodDays * 86400000;

  const inRange = (l: typeof leads[number], from: number, to: number) => {
    const t = new Date(l.last_message_at).getTime();
    return t >= from && t <= to;
  };

  // Base leads filtered by date and unit
  let baseCurrentLeads = leads.filter(l => inRange(l, periodStart, periodEnd));
  let basePrevLeads    = leads.filter(l => inRange(l, prevPeriodStart, periodStart - 1));

  if (selectedUnit !== 'all') {
    baseCurrentLeads = baseCurrentLeads.filter(l => l.unit_id === selectedUnit);
    basePrevLeads    = basePrevLeads.filter(l => l.unit_id === selectedUnit);
  }

  // Calculate danger leads to assign risk status for sorting
  const dangerLeadIds = new Set(calculateDangerLeads(baseCurrentLeads, businessHours).map(l => l.id));

  // Sorting
  baseCurrentLeads.sort((a, b) => {
    if (slaOrder === 'critical') {
      const aDanger = dangerLeadIds.has(a.id) ? 1 : 0;
      const bDanger = dangerLeadIds.has(b.id) ? 1 : 0;
      if (aDanger !== bDanger) return bDanger - aDanger; // critical first
    } else if (slaOrder === 'ok') {
      const aDanger = dangerLeadIds.has(a.id) ? 1 : 0;
      const bDanger = dangerLeadIds.has(b.id) ? 1 : 0;
      if (aDanger !== bDanger) return aDanger - bDanger; // ok first
    }

    if (scoreOrder === 'asc') {
      const aScore = a.score !== null ? Number(a.score) : 999;
      const bScore = b.score !== null ? Number(b.score) : 999;
      if (aScore !== bScore) return aScore - bScore;
    } else if (scoreOrder === 'desc') {
      const aScore = a.score !== null ? Number(a.score) : -1;
      const bScore = b.score !== null ? Number(b.score) : -1;
      if (aScore !== bScore) return bScore - aScore;
    }
    
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const currentLeads = baseCurrentLeads;
  const prevLeads = basePrevLeads;

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

  // Performance por Etapa
  const managerPerformanceMap: Record<string, {
    managerName: string;
    unitName: string;
    e1: number[]; e2: number[]; e3: number[]; e4: number[];
    scores: number[];
    totalLeads: number;
  }> = {};

  currentLeads.forEach(lead => {
    const managerId = lead.manager_id || 'sem_gerente';
    if (!managerPerformanceMap[managerId]) {
      const manager = managers.find(m => m.id === lead.manager_id);
      const unit = units.find(u => u.id === lead.unit_id);
      managerPerformanceMap[managerId] = {
        managerName: manager?.name || 'Sem Gerente',
        unitName: unit?.name || 'Sem Unidade',
        e1: [], e2: [], e3: [], e4: [], scores: [], totalLeads: 0
      };
    }
    const mp = managerPerformanceMap[managerId];
    mp.totalLeads += 1;
    if (lead.score !== null) mp.scores.push(Number(lead.score));
    const es = (lead as any).etapa_scores || {};
    if (es.e1 !== undefined) mp.e1.push(Number(es.e1));
    if (es.e2 !== undefined) mp.e2.push(Number(es.e2));
    if (es.e3 !== undefined) mp.e3.push(Number(es.e3));
    if (es.e4 !== undefined) mp.e4.push(Number(es.e4));
  });

  const customAvg = (nums: number[], total: number) => (total > 0 && nums.length > 0) ? nums.reduce((a, b) => a + b, 0) / total : null;

  const managerPerformance = Object.values(managerPerformanceMap).map(mp => ({
    managerName: mp.managerName,
    unitName: mp.unitName,
    e1: round(customAvg(mp.e1, mp.totalLeads)),
    e2: round(customAvg(mp.e2, mp.totalLeads)),
    e3: round(customAvg(mp.e3, mp.totalLeads)),
    e4: round(customAvg(mp.e4, mp.totalLeads)),
    score: round(customAvg(mp.scores, mp.totalLeads))
  })).sort((a, b) => (b.score || 0) - (a.score || 0));

  const ScoreBadge = ({ score }: { score: number | null }) => {
    if (score === null) return <span className="text-white/20">—</span>;
    return (
      <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-[11px] border ${
        score >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
        score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
        'bg-rose-500/10 text-rose-400 border-rose-500/20'
      }`}>
        {score}%
      </span>
    );
  };


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

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <select
              value={selectedUnit}
              onChange={(e) => { setIsUpdating(true); setSelectedUnit(e.target.value); setTimeout(() => setIsUpdating(false), 300); }}
              className="px-3 py-2 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todas Unidades</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            
            <select
              value={scoreOrder}
              onChange={(e) => { setIsUpdating(true); setScoreOrder(e.target.value); setTimeout(() => setIsUpdating(false), 300); }}
              className="px-3 py-2 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-indigo-500"
            >
              <option value="none">Ordenação (Score)</option>
              <option value="desc">Melhor Score</option>
              <option value="asc">Pior Score</option>
            </select>

            <select
              value={slaOrder}
              onChange={(e) => { setIsUpdating(true); setSlaOrder(e.target.value); setTimeout(() => setIsUpdating(false), 300); }}
              className="px-3 py-2 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-indigo-500"
            >
              <option value="none">Filtro de SLA</option>
              <option value="critical">Risco/Críticos Topo</option>
              <option value="ok">Atendidos Topo</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <DateRangePicker 
              date={dateRange} 
              onChange={(d) => {
                setIsUpdating(true);
                setDateRange(d);
                setTimeout(() => setIsUpdating(false), 300);
              }} 
            />
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.25)]">
              <Download className="w-4 h-4" />
              Exportar XLS
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards Premium ── */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 transition-opacity duration-300 ${isUpdating ? 'opacity-40' : 'opacity-100'}`}>
        
        {/* Score Geral */}
        <motion.div {...fadeUp(0.1)} className="p-6 rounded-3xl bg-card border border-border relative overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.05)]">
          <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck className="w-24 h-24" /></div>
          <div className="absolute -left-1/4 -top-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">Score Global de Qualidade</p>
            <h2 className="text-5xl font-black text-foreground mb-4 tracking-tighter">
              {metrics.score !== null ? <>{metrics.score}<span className="text-2xl text-muted-foreground">%</span></> : <span className="text-muted-foreground/50">—</span>}
            </h2>
            {metrics.scoreChange !== null ? (
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${metrics.scoreChange >= 0 ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'}`}>
                  {metrics.scoreChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {metrics.scoreChange >= 0 ? '+' : ''}{metrics.scoreChange}%
                </span>
                <span className="text-xs text-muted-foreground font-medium">vs período anterior</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/50 font-medium">Sem comparativo disponível</span>
            )}
          </div>
        </motion.div>

        {/* TMR */}
        <motion.div {...fadeUp(0.15)} className="p-6 rounded-3xl bg-card border border-border relative overflow-hidden shadow-[0_0_40px_rgba(52,211,153,0.05)]">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Clock className="w-24 h-24" /></div>
          <div className="absolute -left-1/4 -top-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.15)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mb-3">Tempo Médio de Resposta (TMR)</p>
            <h2 className="text-5xl font-black text-foreground mb-4 tracking-tighter">
              {metrics.tmr !== null ? <>{metrics.tmr}<span className="text-2xl text-muted-foreground">m</span></> : <span className="text-muted-foreground/50">—</span>}
            </h2>
            {metrics.tmrChange !== null ? (
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${metrics.tmrChange <= 0 ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'}`}>
                  {metrics.tmrChange <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {metrics.tmrChange <= 0 ? '' : '+'}{metrics.tmrChange}m {metrics.tmrChange <= 0 ? '(Melhoria)' : ''}
                </span>
                <span className="text-xs text-muted-foreground font-medium">vs período anterior</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/50 font-medium">Sem comparativo disponível</span>
            )}
          </div>
        </motion.div>

        {/* SLAs */}
        <motion.div {...fadeUp(0.2)} className="p-6 rounded-3xl bg-card border border-border relative overflow-hidden shadow-[0_0_40px_rgba(244,63,94,0.05)]">
          <div className="absolute top-0 right-0 p-6 opacity-10"><AlertTriangle className="w-24 h-24" /></div>
          <div className="absolute -left-1/4 -top-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.15)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-500 dark:text-rose-400 mb-3">Orçamentos em Risco (SLA)</p>
            <h2 className="text-5xl font-black text-foreground mb-4 tracking-tighter">{metrics.slasRisk}</h2>
            {(metrics.slasChange !== 0 || hasData) ? (
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${metrics.slasChange <= 0 ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'}`}>
                  {metrics.slasChange <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {metrics.slasChange >= 0 ? '+' : ''}{metrics.slasChange} leads
                </span>
                <span className="text-xs text-muted-foreground font-medium">vs período anterior</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/50 font-medium">Sem dados para o período</span>
            )}
          </div>
        </motion.div>

      </div>

      {/* ── Performance por Etapa ── */}
      <motion.div {...fadeUp(0.25)} className={`mb-8 bg-card border border-border rounded-3xl overflow-hidden transition-opacity duration-300 ${isUpdating ? 'opacity-40' : 'opacity-100'} shadow-[0_0_80px_rgba(0,0,0,0.02)]`}>
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-black/5 dark:bg-white/[0.02]">
          <div>
            <h3 className="text-base font-black text-foreground">Performance por Etapa</h3>
            <p className="text-xs font-medium text-muted-foreground mt-1">Detalhamento do cumprimento das 4 etapas fundamentais por gerente.</p>
          </div>
          <Target className="w-5 h-5 text-indigo-500/50 dark:text-indigo-400/50" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-white/[0.01] border-b border-border text-xs uppercase text-muted-foreground tracking-wider font-bold">
              <tr>
                <th className="px-8 py-4">Gerente</th>
                <th className="px-8 py-4">Unidade</th>
                <th className="px-8 py-4 text-center">E1. Cordialidade</th>
                <th className="px-8 py-4 text-center">E2. Orçamento+Vídeo</th>
                <th className="px-8 py-4 text-center">E3. Upsell Mecânico</th>
                <th className="px-8 py-4 text-center">E4. Encerramento</th>
                <th className="px-8 py-4 text-center">Score Geral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {managerPerformance.length > 0 ? (
                managerPerformance.map((mp, idx) => (
                  <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-8 py-4 font-bold text-foreground">{mp.managerName}</td>
                    <td className="px-8 py-4 text-muted-foreground font-semibold">{mp.unitName}</td>
                    <td className="px-8 py-4 text-center"><ScoreBadge score={mp.e1} /></td>
                    <td className="px-8 py-4 text-center"><ScoreBadge score={mp.e2} /></td>
                    <td className="px-8 py-4 text-center"><ScoreBadge score={mp.e3} /></td>
                    <td className="px-8 py-4 text-center"><ScoreBadge score={mp.e4} /></td>
                    <td className="px-8 py-4 text-center"><ScoreBadge score={mp.score} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-8 py-8 text-center text-muted-foreground/50">Sem dados de performance para este período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Log de Auditoria ── */}
      <motion.div {...fadeUp(0.3)} className={`bg-card border border-border rounded-3xl overflow-hidden transition-opacity duration-300 ${isUpdating ? 'opacity-40' : 'opacity-100'} shadow-[0_0_80px_rgba(0,0,0,0.02)]`}>
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-black/5 dark:bg-white/[0.02]">
          <div>
            <h3 className="text-base font-black text-foreground">Log de Auditorias Recentes</h3>
            <p className="text-xs font-medium text-muted-foreground mt-1">Transparência total nos apontamentos de qualidade.</p>
          </div>
          <Target className="w-5 h-5 text-muted-foreground/30" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-white/[0.01] border-b border-border text-xs uppercase text-muted-foreground tracking-wider font-bold">
              <tr>
                <th className="px-8 py-4">Cliente / Veículo</th>
                <th className="px-8 py-4">Unidade</th>
                <th className="px-8 py-4">Status Funil</th>
                <th className="px-8 py-4 text-right">Score Auditado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditedLeads.length > 0 ? (
                auditedLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    onClick={() => setSelectedLeadId(lead.id)}
                    className="hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="px-8 py-4">
                      <p className="font-bold text-foreground">{lead.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{lead.customer_vehicle}</p>
                    </td>
                    <td className="px-8 py-4 text-muted-foreground font-semibold">{lead.unit_id ? (units.find(u => u.id === lead.unit_id)?.name || lead.unit_id) : 'Sem unidade'}</td>
                    <td className="px-8 py-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground border border-border px-2 py-1 rounded-md bg-black/5 dark:bg-white/[0.02]">
                        {lead.funnel_stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      {lead.score && (
                        <div className={`inline-flex items-center gap-1 font-black px-2.5 py-1 rounded-lg border
                          ${lead.score >= 75 ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                            : lead.score >= 50 ? 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20' 
                            : 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                          {Math.round(lead.score)}%
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-8 text-center text-muted-foreground/50">Nenhuma auditoria registrada neste período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Global Audit Panel Overlay */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div
            key="global-audit"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-full md:w-[85vw] lg:w-[1200px] shadow-2xl flex border-l border-border"
          >
            {/* Backdrop */}
            <div 
              className="absolute -left-[100vw] inset-y-0 w-[100vw] bg-black/40 backdrop-blur-sm -z-10 cursor-pointer"
              onClick={() => setSelectedLeadId(null)}
            />
            <div className="flex-1 w-full h-full bg-background overflow-hidden relative">
              <AuditPanel lead={selectedLead} onClose={() => setSelectedLeadId(null)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Relatorios;
