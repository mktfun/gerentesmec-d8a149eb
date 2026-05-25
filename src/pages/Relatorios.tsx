import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, ShieldCheck, Download, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { supabase } from '@/integrations/supabase/client';
import { calculateTmr, calculateDangerLeads } from '@/utils/metrics';
import { avgScore, avgScoreInt } from '@/utils/scoreUtils';
import { DateRangePicker, DateRange } from '@/components/ui/DateRangePicker';
import ChatHistoryView from '@/components/Crm/ChatHistoryView';
import { AnimatePresence } from 'framer-motion';

import { fadeUp } from '@/utils/motion';


const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };

const Relatorios = () => {
  // Paginação
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

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
  const [expandedManager, setExpandedManager] = useState<string | null>(null);

  // Audit Modal
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const [modalMessages, setModalMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (selectedLeadId) {
      setIsLoadingMessages(true);
      supabase.from('chat_messages').select('*').eq('lead_id', selectedLeadId).order('created_at', { ascending: true })
        .then(({ data }) => {
          if (data) setModalMessages(data);
          setIsLoadingMessages(false);
        });
    } else {
      setModalMessages([]);
    }
  }, [selectedLeadId]);

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

  // Score global do período — usa apenas leads auditados (lead.score da IA)
  const currentLeadsWithScore = currentLeads.filter(l => l.score !== null);
  const prevLeadsWithScore    = prevLeads.filter(l => l.score !== null);

  const scoreCur  = avgScore(currentLeads);
  const scorePrev = avgScore(prevLeads);
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
  
  const filteredLeads = leads.filter(l => {
    const lDate = startOfDay(new Date(l.created_at));
    const isWithinDate = lDate >= startOfDay(dateRange.from) && lDate <= startOfDay(dateRange.to);
    const isUnitMatch = selectedUnit === 'all' || l.unit_id === selectedUnit;
    return isWithinDate && isUnitMatch;
  });

  const auditedLeads = filteredLeads.filter(l => l.score !== null).sort((a, b) => {
    if (scoreOrder === 'desc') return (b.score || 0) - (a.score || 0);
    if (scoreOrder === 'asc') return (a.score || 0) - (b.score || 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Estado derivado da Paginação
  const totalPages = Math.ceil(auditedLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = auditedLeads.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const managerPerformanceMap: Record<string, {
    managerName: string;
    unitName: string;
    e1: number[]; e2: number[]; e3: number[]; e4: number[];
    scores: number[];
    items: Record<string, number[]>;
    totalLeads: number;
  }> = {};

  currentLeads.forEach(lead => {
    const managerId = lead.manager_id || 'sem_gerente';
    if (!managerPerformanceMap[managerId]) {
      const manager = managers.find(m => m.id === lead.manager_id);
      const unit = units.find(u => u.id === lead.unit_id);
      managerPerformanceMap[managerId] = {
        managerId,
        managerName: manager?.name || 'Sem Gerente',
        unitName: unit?.name || 'Sem Unidade',
        e1: [], e2: [], e3: [], e4: [], totalLeads: 0,
        items: {
          '1a': [], '1b': [], '2a': [], '2b': [], '2c': [],
          '3a': [], '3b': [], '3c': [], '4a': [], '4b': []
        }
      };
    }
    const mp = managerPerformanceMap[managerId];
    mp.totalLeads += 1;
    
    const checklist = lead.audit_checklist as Record<string, any> | null;
    const isTrue = (val: any) => val === true || val === 'true';

    if (checklist) {
      const allKeys = ['1a', '1b', '2a', '2b', '2c', '3a', '3b', '3c', '4a', '4b'];
      allKeys.forEach(key => {
        mp.items[key].push(isTrue(checklist[key]) ? 1 : 0);
      });
      
      // E1: Cordialidade (1a, 1b)
      let e1Val = ((isTrue(checklist['1a']) ? 1 : 0) + (isTrue(checklist['1b']) ? 1 : 0)) / 2 * 100;
      mp.e1.push(e1Val);

      // E2: Orçamento + Vídeo (2a, 2b, 2c)
      let e2Val = ((isTrue(checklist['2a']) ? 1 : 0) + (isTrue(checklist['2b']) ? 1 : 0) + (isTrue(checklist['2c']) ? 1 : 0)) / 3 * 100;
      mp.e2.push(e2Val);

      // E3: Upsell Mecânico (3a, 3b, 3c)
      let e3Val = ((isTrue(checklist['3a']) ? 1 : 0) + (isTrue(checklist['3b']) ? 1 : 0) + (isTrue(checklist['3c']) ? 1 : 0)) / 3 * 100;
      mp.e3.push(e3Val);

      // E4: Encerramento (4a, 4b)
      let e4Val = ((isTrue(checklist['4a']) ? 1 : 0) + (isTrue(checklist['4b']) ? 1 : 0)) / 2 * 100;
      mp.e4.push(e4Val);
    }
    // Sempre acumula lead.score (se auditado) para o Score Geral
    // (independente de ter checklist ou não)
  });

  const customAvg = (nums: number[]) => (nums.length > 0) ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  const round = (n: number | null) => n === null ? null : Math.round(n);

  const managerPerformance = Object.entries(managerPerformanceMap).map(([mId, mp]) => {
    const itemAvgs: Record<string, number | null> = {};
    Object.keys(mp.items).forEach(key => {
      itemAvgs[key] = round((customAvg(mp.items[key]) || 0) * 100);
    });

    // Score Geral = média do lead.score (fonte da IA), apenas auditados
    const mLeads = currentLeads.filter(l => (l.manager_id || 'sem_gerente') === mId);
    
    return {
      managerName: mp.managerName,
      unitName: mp.unitName,
      e1: round(customAvg(mp.e1)),
      e2: round(customAvg(mp.e2)),
      e3: round(customAvg(mp.e3)),
      e4: round(customAvg(mp.e4)),
      score: avgScoreInt(mLeads),
      itemAvgs
    };
  }).sort((a, b) => (b.score || 0) - (a.score || 0));

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

  const VisualMetricRow = ({ label, value }: { label: string, value: number | null }) => {
    if (value === null) {
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground/70">{label}</span>
            <span className="text-muted-foreground/30 font-medium">—</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/5" />
        </div>
      );
    }

    const isExcellent = value >= 75;
    const isWarning = value >= 50 && value < 75;
    
    const colorClasses = isExcellent 
      ? 'text-emerald-500 dark:text-emerald-400' 
      : isWarning 
        ? 'text-amber-500 dark:text-amber-400' 
        : 'text-rose-500 dark:text-rose-400';

    const bgClasses = isExcellent 
      ? 'bg-emerald-500 dark:bg-emerald-400' 
      : isWarning 
        ? 'bg-amber-500 dark:bg-amber-400' 
        : 'bg-rose-500 dark:bg-rose-400';

    return (
      <div className="flex flex-col gap-1.5 group">
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground/80 font-medium group-hover:text-foreground transition-colors">{label}</span>
          <span className={`font-black ${colorClasses}`}>{value}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${bgClasses} shadow-[0_0_8px_rgba(var(--${isExcellent ? 'emerald' : isWarning ? 'amber' : 'rose'})-500,0.5)]`}
          />
        </div>
      </div>
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
                setCurrentPage(1); // Reseta paginação ao mudar filtro
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
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 transition-opacity duration-300 ${isUpdating ? 'opacity-40' : 'opacity-100'}`}>
        
        {/* Score Geral */}
        <motion.div {...fadeUp(0.1)} className="p-8 rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-3xl relative overflow-hidden shadow-[0_16px_32px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.1)] group hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(99,102,241,0.15)] transition-all duration-500 cursor-default">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-500"><ShieldCheck className="w-32 h-32 text-indigo-500" /></div>
          <div className="absolute -left-1/4 -top-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12)_0%,transparent_70%)] pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-500" />
          
          <div className="relative z-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400 mb-4 opacity-80">Score Global de Qualidade</p>
            <h2 className="text-6xl font-black text-foreground mb-6 tracking-tighter drop-shadow-sm group-hover:scale-[1.02] origin-left transition-transform duration-500">
              {metrics.score !== null ? <>{metrics.score}<span className="text-3xl text-muted-foreground/60">%</span></> : <span className="text-muted-foreground/30">—</span>}
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
        <motion.div {...fadeUp(0.15)} className="p-8 rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-3xl relative overflow-hidden shadow-[0_16px_32px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.1)] group hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(52,211,153,0.15)] transition-all duration-500 cursor-default">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:-rotate-12 transition-all duration-500"><Clock className="w-32 h-32 text-emerald-500" /></div>
          <div className="absolute -left-1/4 -top-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.12)_0%,transparent_70%)] pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-500" />
          
          <div className="relative z-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-4 opacity-80">Tempo Médio de Resposta (TMR)</p>
            <h2 className="text-6xl font-black text-foreground mb-6 tracking-tighter drop-shadow-sm group-hover:scale-[1.02] origin-left transition-transform duration-500">
              {metrics.tmr !== null ? <>{metrics.tmr}<span className="text-3xl text-muted-foreground/60">m</span></> : <span className="text-muted-foreground/30">—</span>}
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
        <motion.div {...fadeUp(0.2)} className="p-8 rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-3xl relative overflow-hidden shadow-[0_16px_32px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.1)] group hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(244,63,94,0.15)] transition-all duration-500 cursor-default">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-500"><AlertTriangle className="w-32 h-32 text-rose-500" /></div>
          <div className="absolute -left-1/4 -top-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.12)_0%,transparent_70%)] pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-500" />
          
          <div className="relative z-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 mb-4 opacity-80">Orçamentos em Risco (SLA)</p>
            <h2 className="text-6xl font-black text-foreground mb-6 tracking-tighter drop-shadow-sm group-hover:scale-[1.02] origin-left transition-transform duration-500">{metrics.slasRisk}</h2>
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
                  <React.Fragment key={idx}>
                    <tr 
                      onClick={() => setExpandedManager(expandedManager === mp.managerName ? null : mp.managerName)}
                      className="hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="px-8 py-4 font-bold text-foreground flex items-center gap-2">
                        <ChevronDown className={`w-4 h-4 text-muted-foreground/50 transition-transform ${expandedManager === mp.managerName ? 'rotate-180' : ''}`} />
                        {mp.managerName}
                      </td>
                      <td className="px-8 py-4 text-muted-foreground font-semibold">{mp.unitName}</td>
                      <td className="px-8 py-4 text-center"><ScoreBadge score={mp.e1} /></td>
                      <td className="px-8 py-4 text-center"><ScoreBadge score={mp.e2} /></td>
                      <td className="px-8 py-4 text-center"><ScoreBadge score={mp.e3} /></td>
                      <td className="px-8 py-4 text-center"><ScoreBadge score={mp.e4} /></td>
                      <td className="px-8 py-4 text-center"><ScoreBadge score={mp.score} /></td>
                    </tr>
                    
                    {/* Linha Expandida: Detalhamento dos Itens */}
                    {expandedManager === mp.managerName && (
                      <tr className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-border shadow-inner">
                        <td colSpan={7} className="px-8 py-8">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
                            
                            {/* E1 */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">E1. Cordialidade</h4>
                              <div className="flex flex-col gap-4">
                                <VisualMetricRow label="1a. Cordial e respeitoso" value={mp.itemAvgs['1a']} />
                                <VisualMetricRow label="1b. Registrou no WhatsApp" value={mp.itemAvgs['1b']} />
                              </div>
                            </div>

                            {/* E2 */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">E2. Orçamento+Vídeo</h4>
                              <div className="flex flex-col gap-4">
                                <VisualMetricRow label="2a. Enviou link/valor claro" value={mp.itemAvgs['2a']} />
                                <VisualMetricRow label="2b. Enviou evidência visual" value={mp.itemAvgs['2b']} />
                                <VisualMetricRow label="2c. Explicou consequências" value={mp.itemAvgs['2c']} />
                              </div>
                            </div>

                            {/* E3 */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">E3. Upsell Mecânico</h4>
                              <div className="flex flex-col gap-4">
                                <VisualMetricRow label="3a. Ofereceu melhoria (Upsell)" value={mp.itemAvgs['3a']} />
                                <VisualMetricRow label="3b. Enviou evidência extra" value={mp.itemAvgs['3b']} />
                                <VisualMetricRow label="3c. Explicou necessidade extra" value={mp.itemAvgs['3c']} />
                              </div>
                            </div>

                            {/* E4 */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">E4. Encerramento</h4>
                              <div className="flex flex-col gap-4">
                                <VisualMetricRow label="4a. Enviou agradecimento" value={mp.itemAvgs['4a']} />
                                <VisualMetricRow label="4b. Pediu Google Reviews" value={mp.itemAvgs['4b']} />
                              </div>
                            </div>
                            
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
              {paginatedLeads.length > 0 ? (
                paginatedLeads.map((lead) => (
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
        
        {/* Controles de Paginação */}
        {totalPages > 1 && (
          <div className="px-8 py-4 border-t border-border flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
            <p className="text-xs text-muted-foreground font-medium">
              Mostrando <span className="text-foreground font-bold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="text-foreground font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, auditedLeads.length)}</span> de <span className="text-foreground font-bold">{auditedLeads.length}</span> auditorias
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-card border border-border text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-foreground mx-2">Página {currentPage} de {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-card border border-border text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
            className="fixed inset-y-0 right-0 z-50 w-full md:w-[600px] shadow-2xl flex border-l border-border"
          >
            {/* Backdrop */}
            <div 
              className="absolute -left-[100vw] inset-y-0 w-[100vw] bg-black/40 backdrop-blur-sm -z-10 cursor-pointer"
              onClick={() => setSelectedLeadId(null)}
            />
            <div className="flex-1 w-full h-full bg-background overflow-hidden relative flex flex-col">
              <button 
                onClick={() => setSelectedLeadId(null)}
                className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <ChatHistoryView 
                lead={selectedLead} 
                messages={modalMessages}
                isLoading={isLoadingMessages} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Relatorios;
