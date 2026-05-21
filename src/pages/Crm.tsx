import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, ChevronDown, ChevronRight, List, LayoutGrid, Plus } from 'lucide-react';
import { Lead, FunnelStage } from '@/context/AppDataContext';
import { useAppData } from '@/context/AppDataContext';
import { DropResult } from '@hello-pangea/dnd';
import AuditPanel from '@/components/Crm/AuditPanel';
import KanbanView from '@/components/Crm/KanbanView';
import LeadModalForm from '@/components/Crm/LeadModalForm';
import UnitSwitcher from '@/components/Crm/UnitSwitcher';

type ViewMode = 'list' | 'kanban';

const Crm = () => {
  const { leads, moveLeadStage, managers, units } = useAppData();
  
  const [view, setView] = useState<ViewMode>('kanban');
  const [unitFilter, setUnitFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [closedOpen, setClosedOpen] = useState(false);
  
  // Lead CRUD
  const [formLead, setFormLead] = useState<Lead | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredLeads = unitFilter === 'all'
    ? leads
    : leads.filter(l => l.unit_id === unitFilter);

  const danger  = filteredLeads.filter(l => l.sla_status === 'danger' && l.funnel_stage !== 'closed_won' && l.funnel_stage !== 'closed_lost');
  const active  = filteredLeads.filter(l => l.sla_status !== 'danger' && l.funnel_stage !== 'closed_won' && l.funnel_stage !== 'closed_lost');
  const closed  = filteredLeads.filter(l => l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost');

  const onDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    
    // stageId comes from the droppableId
    const newStage = destination.droppableId as FunnelStage;
    moveLeadStage(draggableId, newStage);
  };

  const handleNewLead = () => {
    setFormLead(null);
    setIsFormOpen(true);
  };

  const LeadListCard = ({ lead, i }: { lead: Lead; i: number }) => {
    const manager = managers.find(m => m.id === lead.manager_id) || managers.find(m => m.unit_id === lead.unit_id);
    const unit    = units.find(u => u.id === lead.unit_id);
    const isDanger  = lead.sla_status === 'danger';
    const isSelected = selectedLead?.id === lead.id;

    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, type: 'spring' }}
        whileHover={{ x: 3 }} onClick={() => setSelectedLead(lead)}
        className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl transition-all duration-200 group
          ${isDanger ? 'status-danger bg-rose-500/[0.04] hover:bg-rose-500/[0.08]' : 'status-success bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]'}
          ${isSelected ? 'ring-1 ring-primary/40' : ''}`}
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-black text-primary shrink-0">
          {manager?.name[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground truncate">{lead.customer_name} · {lead.customer_vehicle}</p>
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
        <div className="shrink-0 text-right">
          {lead.score !== null
            ? <div className={`text-sm font-black ${lead.score >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{Math.round(lead.score)}%</div>
            : <div className="text-xs text-muted-foreground">Pendente</div>
          }
          {lead.ticket_value && <div className="text-[10px] font-bold text-emerald-500 mt-0.5">R$ {lead.ticket_value}</div>}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
      </motion.div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* ── Topbar: View Toggle + Unit Filter ───────────────── */}
      <div className="px-5 py-3 border-b border-border bg-background flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          {/* Unit Switcher */}
          <UnitSwitcher units={units} leads={leads} selectedUnitId={unitFilter} onSelect={setUnitFilter} />

          <div className="h-6 w-px bg-border mx-2" />

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

        <button onClick={handleNewLead}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 text-white
            hover:bg-indigo-600 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.25)]">
          <Plus className="w-3.5 h-3.5" />
          Novo Atendimento
        </button>
      </div>

      {/* ── Content Area ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden bg-background/50">
        <AnimatePresence mode="wait">
          {view === 'kanban' ? (
            /* ── KANBAN ── */
            <motion.div key="kanban"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="flex-1 p-5 overflow-hidden"
            >
              <KanbanView leads={leads} unitFilter={unitFilter} onSelectLead={setSelectedLead} onDragEnd={onDragEnd} />
            </motion.div>
          ) : (
            /* ── LIST ── */
            <motion.div key="list"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="flex overflow-hidden flex-1"
            >
              <div className={`flex flex-col bg-background overflow-hidden border-r border-border transition-all duration-300 ${selectedLead ? 'w-[340px] shrink-0' : 'flex-1'}`}>
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
                      <div className="space-y-1">{danger.map((l, i) => <LeadListCard key={l.id} lead={l} i={i} />)}</div>
                    </div>
                  )}
                  {active.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Em Andamento</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">{active.length}</span>
                      </div>
                      <div className="space-y-1">{active.map((l, i) => <LeadListCard key={l.id} lead={l} i={i} />)}</div>
                    </div>
                  )}
                  {closed.length > 0 && (
                    <div>
                      <button onClick={() => setClosedOpen(v => !v)} className="w-full flex items-center gap-2 mb-2 px-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Concluídos</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{closed.length}</span>
                        <motion.div animate={{ rotate: closedOpen ? 180 : 0 }} className="ml-auto"><ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" /></motion.div>
                      </button>
                      <AnimatePresence>
                        {closedOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1">
                            {closed.map((l, i) => <LeadListCard key={l.id} lead={l} i={i} />)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
              <AnimatePresence mode="wait">
                {selectedLead && view === 'list' && (
                  <motion.div key={selectedLead.id}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="flex-1 overflow-hidden"
                  >
                    <AuditPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Audit Panel Overlay for Kanban View */}
        <AnimatePresence>
          {selectedLead && view === 'kanban' && (
            <motion.div
              key="global-audit"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-y-0 right-0 z-50 w-full md:w-[85vw] lg:w-[1200px] shadow-2xl flex border-l border-white/10"
            >
              {/* Backdrop */}
              <div 
                className="absolute -left-[100vw] inset-y-0 w-[100vw] bg-black/40 backdrop-blur-sm -z-10 cursor-pointer"
                onClick={() => setSelectedLead(null)}
              />
              <div className="flex-1 w-full h-full bg-background overflow-hidden">
                <AuditPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LeadModalForm isOpen={isFormOpen} lead={formLead} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default Crm;
