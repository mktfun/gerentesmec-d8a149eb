import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, ChevronDown, ChevronRight, List, LayoutGrid, Plus, Wrench, Search, X, Check, Trash2, User as UserIcon, CheckCheck, Database, Eye } from 'lucide-react';
import { Lead, FunnelStage } from '@/context/AppDataContext';
import { useAppData } from '@/context/AppDataContext';
import { isLeadDanger } from '@/utils/metrics';
import { DropResult } from '@hello-pangea/dnd';
import AuditPanel from '@/components/Crm/AuditPanel';
import KanbanView from '@/components/Crm/KanbanView';
import LeadModalForm from '@/components/Crm/LeadModalForm';
import UnitSwitcher from '@/components/Crm/UnitSwitcher';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBackgroundAuditor } from '@/context/BackgroundAuditorContext';
import { useNavigate } from 'react-router-dom';
import AdvancedFilters, { CreatedPeriod, CustomDateRange } from '@/components/Crm/AdvancedFilters';

type ViewMode = 'list' | 'kanban';

const Crm = () => {
  const { leads, moveLeadStage, managers, units, deleteLeads } = useAppData();
  const { user } = useAuth();
  
  const auditor = useBackgroundAuditor();
  const navigate = useNavigate();

  const isUnitManager = user?.user_metadata?.role === 'unit_manager';
  const userUnitId = user?.user_metadata?.unit_id;
  
  const [view, setView] = useState<ViewMode>('kanban');
  const [unitFilter, setUnitFilter] = useState(isUnitManager && userUnitId ? userUnitId : 'all');
  const [slaFilter, setSlaFilter] = useState(false);
  // Armazena apenas o ID — deriva o lead ao vivo do array (evita flash quando Realtime atualiza)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLead = selectedLeadId ? leads.find(l => l.id === selectedLeadId) ?? null : null;
  const [closedOpen, setClosedOpen] = useState(false);
  
  // Advanced Filters
  const [createdPeriod, setCreatedPeriod] = useState<CreatedPeriod>('30d');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ start: '', end: '' });
  const [unansweredOnly, setUnansweredOnly] = useState(false);
  const [hideInactive, setHideInactive] = useState(false);

  // Lead CRUD
  const [formLead, setFormLead] = useState<Lead | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'global' | 'pipeline'>('pipeline');
  const [selectedForDeletion, setSelectedForDeletion] = useState<string[]>([]);

  // filteredLeads: por unidade (sem busca)
  const filteredLeads = unitFilter === 'all'
    ? leads
    : leads.filter(l => l.unit_id === unitFilter);

  // searchedLeads: aplica busca por cima do filtro de unidade
  const basePool = searchQuery && searchScope === 'global' ? leads : filteredLeads;
  const searchedLeads = searchQuery
    ? basePool.filter(l => {
        const q = searchQuery.toLowerCase();
        return (
          l.customer_name?.toLowerCase().includes(q) ||
          (l as any).customer_phone?.toLowerCase().includes(q)
        );
      })
    : filteredLeads;

  const displayLeads = searchedLeads.filter(l => {
    // SLA Filter
    if (slaFilter && !isLeadDanger(l, undefined, 20)) return false;

    // Advanced Filters: Creation Date
    const createdDate = new Date(l.created_at);
    const now = new Date();
    if (createdPeriod === '7d') {
      if (now.getTime() - createdDate.getTime() > 7 * 24 * 60 * 60 * 1000) return false;
    } else if (createdPeriod === '30d') {
      if (now.getTime() - createdDate.getTime() > 30 * 24 * 60 * 60 * 1000) return false;
    } else if (createdPeriod === '90d') {
      if (now.getTime() - createdDate.getTime() > 90 * 24 * 60 * 60 * 1000) return false;
    } else if (createdPeriod === 'custom' && customDateRange.start && customDateRange.end) {
      const start = new Date(customDateRange.start);
      const end = new Date(customDateRange.end);
      end.setHours(23, 59, 59, 999);
      if (createdDate < start || createdDate > end) return false;
    }

    // Advanced Filters: Interaction
    // @ts-ignore
    const cTime = l.last_client_message_at ? new Date(l.last_client_message_at).getTime() : 0;
    // @ts-ignore
    const aTime = l.last_agent_message_at ? new Date(l.last_agent_message_at).getTime() : 0;
    const isUnanswered = cTime > aTime;

    if (unansweredOnly && !isUnanswered) return false;

    if (hideInactive) {
      const lastMsgTime = new Date(l.last_message_at).getTime();
      const inactiveHours = (now.getTime() - lastMsgTime) / (1000 * 60 * 60);
      if (inactiveHours >= 24) return false;
    }

    return true;
  });

  const danger  = displayLeads.filter(l => isLeadDanger(l, undefined, 20) && l.funnel_stage !== 'parking_lot');
  const active  = displayLeads.filter(l => !isLeadDanger(l, undefined, 20) && l.funnel_stage !== 'closed_won' && l.funnel_stage !== 'closed_lost' && l.funnel_stage !== 'parking_lot');
  const paused  = displayLeads.filter(l => l.funnel_stage === 'parking_lot');
  const closed  = displayLeads.filter(l => l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost');

  const isAllSelected = displayLeads.length > 0 && selectedForDeletion.length === displayLeads.length;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedForDeletion([]);
    } else {
      setSelectedForDeletion(displayLeads.map(l => l.id));
    }
  };

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
    const isDanger  = isLeadDanger(lead, undefined, 20);
    const isSelected = selectedLead?.id === lead.id;
    const isChecked = selectedForDeletion.includes(lead.id);
    // @ts-ignore
    const cTime = lead.last_client_message_at ? new Date(lead.last_client_message_at).getTime() : 0;
    // @ts-ignore
    const aTime = lead.last_agent_message_at ? new Date(lead.last_agent_message_at).getTime() : 0;
    const isAnswered = aTime >= cTime && cTime > 0;
    
    const waitMs = new Date().getTime() - new Date(lead.last_message_at).getTime();
    const waitMins = Math.floor(waitMs / 60000);
    
    const getElapsed = () => {
      if (waitMins < 60) return `${waitMins}m`;
      const hours = Math.floor(waitMins / 60);
      if (hours < 24) return `${hours}h`;
      return `${Math.floor(hours / 24)}d`;
    };

    let timeColor = 'text-muted-foreground';
    if (!isAnswered) {
      if (waitMins >= 120) timeColor = 'text-rose-600 dark:text-rose-400 font-bold';
      else if (waitMins >= 20) timeColor = 'text-amber-500 font-bold';
    } else {
      timeColor = 'text-muted-foreground/60';
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03, type: 'spring' }}
        whileHover={{ x: 3 }} onClick={() => setSelectedLeadId(lead.id)}
        className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl transition-all duration-200 group
          hover:bg-accent/50
          ${isSelected ? 'ring-1 ring-primary/40' : ''}
          ${isChecked ? 'bg-indigo-500/10 ring-1 ring-indigo-500/30' : ''}`}
      >
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setSelectedForDeletion(prev => 
              prev.includes(lead.id) ? prev.filter(id => id !== lead.id) : [...prev, lead.id]
            );
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border
            ${isChecked ? 'bg-indigo-500 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-border bg-background group-hover:border-indigo-500/50'}`}>
            {isChecked && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-black text-indigo-400 shrink-0">
          {lead.customer_name?.charAt(0) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground truncate">{lead.customer_name} · {lead.customer_vehicle}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Wrench className="w-3 h-3" />
            <span className="truncate">{manager?.name} · {unit?.name}</span>
            <span className="shrink-0 text-muted-foreground/30">·</span>
            <span className={`flex items-center gap-1 shrink-0 ${timeColor}`}>
              {isAnswered ? <CheckCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
              {getElapsed()}
            </span>
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
    <div className="flex-1 flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Topbar: View Toggle + Search + New ───────────── */}
      <div className="px-4 md:px-5 py-3 border-b border-border bg-background flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-3 shrink-0 relative z-50">
        {/* Esquerda: Unit Switcher + View Toggle */}
        <div className="flex items-center justify-between md:justify-start gap-2 shrink-0">
          <UnitSwitcher units={units} leads={leads} selectedUnitId={unitFilter} onSelect={setUnitFilter} disabled={isUnitManager} />
          <div className="h-6 w-px bg-border mx-1 hidden md:block" />
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

        {/* Centro: Search Bar */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar nome ou número..."
              className="w-full h-9 pl-9 pr-8 rounded-xl text-xs font-medium
                bg-black/[0.04] dark:bg-white/[0.04] border border-border text-foreground
                placeholder:text-muted-foreground/40
                focus:outline-none focus:border-indigo-500/35 focus:bg-indigo-500/[0.06]
                focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]
                transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Scope Pills — aparecem só quando há texto */}
          <AnimatePresence>
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1"
              >
                <button
                  onClick={() => setSearchScope('pipeline')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    searchScope === 'pipeline'
                      ? 'bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30'
                      : 'bg-black/5 dark:bg-white/5 text-muted-foreground border border-border hover:border-muted-foreground/30'
                  }`}
                >
                  Pipeline
                </button>
                <button
                  onClick={() => setSearchScope('global')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    searchScope === 'global'
                      ? 'bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30'
                      : 'bg-black/5 dark:bg-white/5 text-muted-foreground border border-border hover:border-muted-foreground/30'
                  }`}
                >
                  Global
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Direita: SLA Filter + Novo Atendimento + Auditor de Fundo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/manager')}
            title="Ir para o Manager Dashboard (Auditoria)"
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all border bg-black/5 dark:bg-white/5 text-muted-foreground/50 border-border hover:border-muted-foreground/30 hover:text-indigo-500"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => auditor.setEnabled(!auditor.enabled)}
            title="Auto-Auditar Mensagens Antigas (2º Plano)"
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all border relative ${
              auditor.enabled
                ? 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                : 'bg-black/5 dark:bg-white/5 text-muted-foreground/50 border-border hover:border-muted-foreground/30 hover:text-muted-foreground'
            }`}
          >
            <Database className="w-4 h-4" />
            {auditor.status === 'processing' && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            )}
            {auditor.status === 'cooldown' && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
            {auditor.status === 'paused_error' && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
            )}
          </button>

          <AdvancedFilters 
            createdPeriod={createdPeriod} setCreatedPeriod={setCreatedPeriod}
            customDateRange={customDateRange} setCustomDateRange={setCustomDateRange}
            unansweredOnly={unansweredOnly} setUnansweredOnly={setUnansweredOnly}
            hideInactive={hideInactive} setHideInactive={setHideInactive}
          />

          <button
            onClick={() => setSlaFilter(!slaFilter)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              slaFilter 
                ? 'bg-rose-500/20 text-rose-500 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
                : 'bg-black/5 dark:bg-white/5 text-muted-foreground border-border hover:border-muted-foreground/30'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${slaFilter ? 'text-rose-500' : 'text-muted-foreground/50'}`} />
            Apenas Urgentes
            {leads.filter(l => isLeadDanger(l, undefined, 20)).length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${
                slaFilter ? 'bg-rose-500 text-white' : 'bg-rose-500/20 text-rose-500'
              }`}>
                {leads.filter(l => isLeadDanger(l, undefined, 20)).length}
              </span>
            )}
          </button>
          
          <button onClick={handleNewLead}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 text-white
              hover:bg-indigo-600 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.25)] active:scale-95">
            <Plus className="w-3.5 h-3.5" />
            Novo Atendimento
          </button>
        </div>
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
              <KanbanView leads={displayLeads} unitFilter={searchQuery ? 'all' : unitFilter} onSelectLead={(lead) => setSelectedLeadId(lead.id)} onDragEnd={onDragEnd} />
            </motion.div>
          ) : (
            /* ── LIST ── */
            <motion.div key="list"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="flex overflow-hidden flex-1"
            >
              <div className={`flex flex-col bg-background overflow-hidden border-r border-border transition-all duration-300 ${selectedLead ? 'w-[340px] shrink-0' : 'flex-1'}`}>
                <div className="px-5 py-4 border-b border-border shrink-0 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black text-foreground">Inbox de Auditoria</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{displayLeads.length} atendimentos{searchQuery && <span className="text-indigo-400 font-bold"> · buscando "{searchQuery}"</span>}</p>
                  </div>
                  {displayLeads.length > 0 && (
                    <button 
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-indigo-500/10 text-xs font-bold text-muted-foreground hover:text-indigo-500 transition-colors"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                        ${isAllSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-border bg-background'}`}>
                        {isAllSelected && <Check className="w-3 h-3" />}
                      </div>
                      Selecionar Tudo
                    </button>
                  )}
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
                      <div className="flex items-center gap-2 mb-2 px-1 mt-4">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Em Andamento</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">{active.length}</span>
                      </div>
                      <div className="space-y-1">{active.map((l, i) => <LeadListCard key={l.id} lead={l} i={i} />)}</div>
                    </div>
                  )}
                  {paused.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1 mt-4">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pausados (S/ Contexto)</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">{paused.length}</span>
                      </div>
                      <div className="space-y-1">{paused.map((l, i) => <LeadListCard key={l.id} lead={l} i={i} />)}</div>
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
              <AnimatePresence>
                {selectedLead && view === 'list' && (
                  <motion.div key="audit-panel-list"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="flex-1 overflow-hidden"
                  >
                    <AuditPanel lead={selectedLead} onClose={() => setSelectedLeadId(null)} />
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
              className="absolute inset-y-0 right-0 z-50 w-full md:w-[85vw] lg:w-[1200px] shadow-2xl flex border-l border-border"
            >
              {/* Backdrop */}
              <div 
                className="absolute -left-[100vw] inset-y-0 w-[100vw] bg-black/40 backdrop-blur-sm -z-10 cursor-pointer"
                onClick={() => setSelectedLeadId(null)}
              />
              <div className="flex-1 w-full h-full bg-background overflow-hidden">
                <AuditPanel lead={selectedLead} onClose={() => setSelectedLeadId(null)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Bar (Bulk Delete) */}
      <AnimatePresence>
        {selectedForDeletion.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 px-6 py-4 rounded-2xl
              bg-card/90 backdrop-blur-xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
          >
            <div className="flex flex-col">
              <span className="text-sm font-black text-foreground">{selectedForDeletion.length} selecionados</span>
              <span className="text-[10px] text-muted-foreground font-bold">Prontos para exclusão</span>
            </div>
            <div className="w-px h-8 bg-border mx-2" />
            <button
              onClick={() => setSelectedForDeletion([])}
              className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                if (window.confirm(`Tem certeza que deseja excluir ${selectedForDeletion.length} atendimentos? Essa ação é irreversível.`)) {
                  await deleteLeads(selectedForDeletion);
                  setSelectedForDeletion([]);
                  if (selectedLeadId && selectedForDeletion.includes(selectedLeadId)) {
                    setSelectedLeadId(null);
                  }
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)]"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Selecionados
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <LeadModalForm isOpen={isFormOpen} lead={formLead} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default Crm;
