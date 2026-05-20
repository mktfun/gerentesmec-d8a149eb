import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, ChevronDown, ChevronRight, List, LayoutGrid } from 'lucide-react';
import { mockLeads, mockManagers, mockUnits, Lead } from '@/data/mockData';
import AuditPanel from '@/components/Crm/AuditPanel';
import KanbanView from '@/components/Crm/KanbanView';

type ViewMode = 'list' | 'kanban';

const Crm = () => {
  const [view, setView] = useState<ViewMode>('list');
  const [unitFilter, setUnitFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [closedOpen, setClosedOpen] = useState(false);

  const filteredLeads = unitFilter === 'all'
    ? mockLeads
    : mockLeads.filter(l => l.unit_id === unitFilter);

  const danger  = filteredLeads.filter(l => l.sla_status === 'danger' && l.funnel_stage !== 'closed_won' && l.funnel_stage !== 'closed_lost');
  const active  = filteredLeads.filter(l => l.sla_status !== 'danger' && l.funnel_stage !== 'closed_won' && l.funnel_stage !== 'closed_lost');
  const closed  = filteredLeads.filter(l => l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost');

  const LeadCard = ({ lead, i }: { lead: Lead; i: number }) => {
    const manager = mockManagers.find(m => m.id === lead.manager_id);
    const unit    = mockUnits.find(u => u.id === lead.unit_id);
    const isDanger  = lead.sla_status === 'danger';
    const isSelected = selectedLead?.id === lead.id;

    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 28 }}
        whileHover={{ x: 3 }}
        onClick={() => setSelectedLead(lead)}
        className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl
          transition-all duration-200 group
          ${isDanger ? 'status-danger bg-rose-500/[0.04] hover:bg-rose-500/[0.08]' : 'status-success bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]'}
          ${isSelected ? 'ring-1 ring-primary/40' : ''}
        `}
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center
          text-sm font-black text-primary shrink-0">
          {manager?.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground truncate">
              {lead.customer_name} · {lead.customer_vehicle}
            </p>
            {isDanger && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400
                bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                <span className="w-1 h-1 rounded-full bg-rose-500 pulse-dot" />SLA
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {manager?.name} · {unit?.name}
            {lead.wait_time_minutes > 0 && <span className={isDanger ? ' text-rose-500 font-bold' : ''}> · <Clock className="w-3 h-3 inline" /> {lead.wait_time_minutes}m</span>}
          </p>
        </div>
        <div className="shrink-0">
          {lead.score !== null
            ? <span className={`text-sm font-black ${lead.score >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{Math.round(lead.score)}%</span>
            : <span className="text-xs text-muted-foreground">Pendente</span>
          }
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
      </motion.div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">

      {/* ── Topbar: View Toggle + Unit Filter ───────────────── */}
      <div className="px-5 py-3 border-b border-border bg-background flex items-center justify-between gap-4 shrink-0">
        {/* Unit filter tabs */}
        <div className="flex items-center gap-1">
          {[{ id: 'all', label: 'Todos' }, ...mockUnits.map(u => ({ id: u.id, label: u.name }))].map(({ id, label }) => (
            <button key={id} onClick={() => setUnitFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                ${unitFilter === id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}>
              {label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
          <button onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <List className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setView('kanban')}
            className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Content Area ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        <AnimatePresence mode="wait">
          {view === 'kanban' ? (
            /* ── KANBAN ── */
            <motion.div
              key="kanban"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-5 overflow-x-auto"
            >
              <KanbanView
                leads={mockLeads}
                unitFilter={unitFilter}
                onSelectLead={setSelectedLead}
              />
            </motion.div>
          ) : (
            /* ── LIST ── */
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`flex overflow-hidden flex-1 ${selectedLead ? '' : ''}`}
            >
              {/* Lead list */}
              <div className={`flex flex-col bg-background overflow-hidden border-r border-border
                transition-all duration-300 ${selectedLead ? 'w-[340px] shrink-0' : 'flex-1'}`}>
                <div className="px-5 py-4 border-b border-border shrink-0">
                  <h2 className="text-sm font-black text-foreground">Inbox de Auditoria</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{filteredLeads.length} atendimentos</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  {danger.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ação Imediata</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">{danger.length}</span>
                      </div>
                      <div className="space-y-1">
                        {danger.map((l, i) => <LeadCard key={l.id} lead={l} i={i} />)}
                      </div>
                    </div>
                  )}
                  {active.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Em Andamento</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">{active.length}</span>
                      </div>
                      <div className="space-y-1">
                        {active.map((l, i) => <LeadCard key={l.id} lead={l} i={i} />)}
                      </div>
                    </div>
                  )}
                  {closed.length > 0 && (
                    <div>
                      <button onClick={() => setClosedOpen(v => !v)}
                        className="w-full flex items-center gap-2 mb-2 px-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Concluídos</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{closed.length}</span>
                        <motion.div animate={{ rotate: closedOpen ? 180 : 0 }} className="ml-auto">
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {closedOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
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

              {/* Audit panel */}
              <AnimatePresence mode="wait">
                {selectedLead && (
                  <motion.div
                    key={selectedLead.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="flex-1 overflow-hidden"
                  >
                    <AuditPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
                  </motion.div>
                )}
              </AnimatePresence>

              {!selectedLead && (
                <div className="hidden lg:flex flex-1 items-center justify-center bg-background">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                      <ChevronRight className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">Selecione um atendimento</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">para iniciar a auditoria</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Crm;
