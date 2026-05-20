import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, FunnelStage, mockUnits } from '@/data/mockData';
import KanbanCard from './KanbanCard';

const COLUMNS: { id: FunnelStage; label: string; color: string; dot: string }[] = [
  { id: 'new',         label: 'Novo Lead',     color: 'text-indigo-600 dark:text-indigo-400',   dot: 'bg-indigo-500' },
  { id: 'quote',       label: 'Em Orçamento',  color: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500' },
  { id: 'negotiation', label: 'Em Negociação', color: 'text-orange-600 dark:text-orange-400',   dot: 'bg-orange-500' },
  { id: 'closed_won',  label: 'Encerrado',     color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
];

interface Props {
  leads: Lead[];
  unitFilter: string;
  onSelectLead: (lead: Lead) => void;
}

const KanbanView: React.FC<Props> = ({ leads, unitFilter, onSelectLead }) => {
  const filtered = unitFilter === 'all'
    ? leads
    : leads.filter(l => l.unit_id === unitFilter);

  // Merge closed_lost into closed_won column for display
  const getColumnLeads = (stageId: FunnelStage) => {
    if (stageId === 'closed_won') {
      return filtered.filter(l => l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost');
    }
    return filtered.filter(l => l.funnel_stage === stageId);
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {COLUMNS.map(col => {
        const colLeads = getColumnLeads(col.id);
        return (
          <div key={col.id} className="w-64 shrink-0 flex flex-col gap-3">
            {/* Column header */}
            <div className="flex items-center gap-2 px-1">
              <div className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                {col.label}
              </span>
              <span className="text-xs font-bold text-muted-foreground bg-muted
                px-1.5 py-0.5 rounded-full ml-auto">{colLeads.length}</span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2.5">
              <AnimatePresence mode="popLayout">
                {colLeads.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-20 rounded-xl border border-dashed border-border
                      flex items-center justify-center"
                  >
                    <span className="text-xs text-muted-foreground/50">Vazio</span>
                  </motion.div>
                ) : (
                  colLeads.map((lead, i) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 28 }}
                    >
                      <KanbanCard lead={lead} onClick={() => onSelectLead(lead)} />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanView;
