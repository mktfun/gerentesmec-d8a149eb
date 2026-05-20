import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { mockLeads, mockManagers, mockUnits } from '@/data/mockData';
import AuditPanel from '@/components/Crm/AuditPanel';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 300, damping: 28, delay },
});

const Crm = () => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [closedOpen, setClosedOpen] = useState(false);

  const selectedLead = mockLeads.find(l => l.id === selectedLeadId) ?? null;

  // Auto-group by urgency
  const danger  = mockLeads.filter(l => l.wait_time_minutes >= 20 && l.status !== 'closed');
  const warning = mockLeads.filter(l => l.status === 'in_progress' || (l.wait_time_minutes < 20 && l.wait_time_minutes > 0 && l.status === 'waiting_reply'));
  const closed  = mockLeads.filter(l => l.status === 'closed');

  const LeadCard = ({ lead, i }: { lead: typeof mockLeads[0]; i: number }) => {
    const manager = mockManagers.find(m => m.id === lead.manager_id);
    const unit    = mockUnits.find(u => u.id === manager?.unit_id);
    const isDanger  = lead.wait_time_minutes >= 20;
    const isWarning = lead.status === 'in_progress' || (lead.wait_time_minutes >= 10 && !isDanger);
    const isSelected = selectedLeadId === lead.id;

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
        whileHover={{ x: 3 }}
        onClick={() => setSelectedLeadId(lead.id)}
        className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl
          transition-all duration-200 group
          ${isDanger  ? 'status-danger  bg-rose-500/[0.04]   hover:bg-rose-500/[0.08]'  : ''}
          ${isWarning ? 'status-warning bg-amber-500/[0.04]  hover:bg-amber-500/[0.08]' : ''}
          ${!isDanger && !isWarning ? 'status-success bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]' : ''}
          ${isSelected ? 'ring-1 ring-indigo-500/40' : ''}
        `}
      >
        {/* Manager avatar */}
        <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center
          text-sm font-black text-indigo-300 shrink-0">
          {manager?.name[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground truncate">{lead.customer_name}</p>
            {isDanger && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400
                bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                SLA Estourado
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-medium">
            <span>{manager?.name}</span>
            <span className="opacity-40">·</span>
            <span>{unit?.name}</span>
            <span className="opacity-40">·</span>
            <span className={`flex items-center gap-1 ${isDanger ? 'text-rose-400 font-bold' : ''}`}>
              <Clock className="w-3 h-3" />
              {lead.wait_time_minutes}m
            </span>
          </div>
        </div>

        {/* Score or status */}
        <div className="shrink-0 text-right">
          {lead.score !== null
            ? <span className={`text-sm font-black ${lead.score >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {Math.round(lead.score)}%
              </span>
            : <span className="text-xs text-muted-foreground font-medium">Pendente</span>
          }
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground
          transition-colors shrink-0" />
      </motion.div>
    );
  };

  const SectionHeader = ({
    icon: Icon, label, count, color, delay = 0,
  }: { icon: any; label: string; count: number; color: string; delay?: number }) => (
    <motion.div {...fadeUp(delay)} className="flex items-center gap-2 mb-2 px-1">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
        color === 'text-rose-400' ? 'bg-rose-500/10 text-rose-400' :
        color === 'text-amber-400' ? 'bg-amber-500/10 text-amber-400' :
        'bg-emerald-500/10 text-emerald-400'
      }`}>{count}</span>
    </motion.div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">

      {/* ── Left: Lead List ─────────────────────────────────── */}
      <div className={`flex flex-col bg-[#111118] border-r border-white/[0.06] overflow-hidden
        transition-all duration-300
        ${selectedLead ? 'w-[360px] shrink-0' : 'flex-1'}`}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-black text-foreground">Inbox de Auditoria</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mockLeads.length} atendimentos hoje
          </p>
        </div>

        {/* Grouped List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* 🔴 Ação Imediata */}
          {danger.length > 0 && (
            <div>
              <SectionHeader icon={AlertTriangle} label="Ação Imediata" count={danger.length} color="text-rose-400" delay={0} />
              <div className="space-y-1">
                {danger.map((l, i) => <LeadCard key={l.id} lead={l} i={i} />)}
              </div>
            </div>
          )}

          {/* 🟡 Em Andamento */}
          {warning.length > 0 && (
            <div>
              <SectionHeader icon={Clock} label="Em Andamento" count={warning.length} color="text-amber-400" delay={0.05} />
              <div className="space-y-1">
                {warning.map((l, i) => <LeadCard key={l.id} lead={l} i={i} />)}
              </div>
            </div>
          )}

          {/* ✅ Concluídos — collapsible */}
          {closed.length > 0 && (
            <div>
              <button
                onClick={() => setClosedOpen(v => !v)}
                className="w-full flex items-center gap-2 mb-2 px-1 group"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Concluídos
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                  {closed.length}
                </span>
                <motion.div
                  animate={{ rotate: closedOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-auto"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />
                </motion.div>
              </button>
              <AnimatePresence>
                {closedOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden space-y-1"
                  >
                    {closed.map((l, i) => <LeadCard key={l.id} lead={l} i={i} />)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Audit Panel ──────────────────────────────── */}
      <AnimatePresence mode="wait">
        {selectedLead && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex-1 overflow-hidden"
          >
            <AuditPanel lead={selectedLead} onClose={() => setSelectedLeadId(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty State ─────────────────────────────────────── */}
      {!selectedLead && (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-[#0d0d14]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08]
              flex items-center justify-center mx-auto mb-4">
              <ChevronRight className="w-7 h-7 text-white/15" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">Selecione um atendimento</p>
            <p className="text-xs text-muted-foreground/60 mt-1">para iniciar a auditoria</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Crm;
