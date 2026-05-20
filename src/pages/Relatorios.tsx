import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Filter, Download, DollarSign, Target } from 'lucide-react';
import { mockLeads } from '@/data/mockData';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 280, damping: 26, delay },
});

const formatMoney = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const Relatorios = () => {
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month'>('month');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fake "update" effect when changing filters
  const handleFilterChange = (filter: 'today' | '7days' | 'month') => {
    setIsUpdating(true);
    setDateFilter(filter);
    setTimeout(() => setIsUpdating(false), 600);
  };

  // Mock numbers based on filter
  const multiplier = dateFilter === 'today' ? 0.1 : dateFilter === '7days' ? 0.3 : 1;
  
  const metrics = {
    revenue: 45000 * multiplier,
    revenueChange: dateFilter === 'month' ? 15 : dateFilter === '7days' ? 4 : -2,
    closedLeads: Math.floor(42 * multiplier),
    closedChange: dateFilter === 'month' ? 8 : dateFilter === '7days' ? -3 : 0,
    ticketMedio: 1071,
    ticketChange: 5,
  };

  const wonLeads = mockLeads.filter(l => l.funnel_stage === 'closed_won');

  return (
    <div className="p-8">
      {/* ── Header & Filters ── */}
      <motion.div {...fadeUp(0)} className="mb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <p className="label-caps text-emerald-400/70 mb-1">Analytics</p>
          <h1 className="text-2xl font-black text-foreground">Relatórios Financeiros</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resultados comerciais, ticket médio e comparativo com o período anterior.
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
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 transition-opacity duration-300 ${isUpdating ? 'opacity-40' : 'opacity-100'}`}>
        
        {/* Faturamento */}
        <motion.div {...fadeUp(0.1)} className="p-6 rounded-3xl bg-[#111118] border border-white/[0.08] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign className="w-24 h-24" /></div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Faturamento Gerado</p>
          <h2 className="text-4xl font-black text-foreground mb-4">{formatMoney(metrics.revenue)}</h2>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${metrics.revenueChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {metrics.revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(metrics.revenueChange)}%
            </span>
            <span className="text-xs text-muted-foreground font-medium">vs período anterior</span>
          </div>
        </motion.div>

        {/* Fechamentos */}
        <motion.div {...fadeUp(0.15)} className="p-6 rounded-3xl bg-[#111118] border border-white/[0.08] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Target className="w-24 h-24" /></div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Negócios Fechados</p>
          <h2 className="text-4xl font-black text-foreground mb-4">{metrics.closedLeads}</h2>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${metrics.closedChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {metrics.closedChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(metrics.closedChange)}%
            </span>
            <span className="text-xs text-muted-foreground font-medium">vs período anterior</span>
          </div>
        </motion.div>

        {/* Ticket Médio */}
        <motion.div {...fadeUp(0.2)} className="p-6 rounded-3xl bg-[#111118] border border-white/[0.08] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Filter className="w-24 h-24" /></div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Ticket Médio</p>
          <h2 className="text-4xl font-black text-foreground mb-4">{formatMoney(metrics.ticketMedio)}</h2>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${metrics.ticketChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {metrics.ticketChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(metrics.ticketChange)}%
            </span>
            <span className="text-xs text-muted-foreground font-medium">vs período anterior</span>
          </div>
        </motion.div>

      </div>

      {/* ── Extrato Tabela ── */}
      <motion.div {...fadeUp(0.3)} className={`bg-card border border-border rounded-2xl overflow-hidden transition-opacity duration-300 ${isUpdating ? 'opacity-40' : 'opacity-100'}`}>
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/20">
          <h3 className="text-sm font-bold text-foreground">Extrato de Conversões</h3>
          <span className="text-xs font-medium text-muted-foreground">Mostrando os fechamentos mais recentes</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 border-b border-border text-xs uppercase text-muted-foreground tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Veículo</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Valor Negociado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {wonLeads.length > 0 ? (
                wonLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{lead.customer_name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{lead.customer_vehicle}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(lead.last_message_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-500">
                      {lead.ticket_value ? formatMoney(lead.ticket_value) : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Nenhuma conversão encontrada neste período.</td>
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
