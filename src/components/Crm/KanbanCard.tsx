import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';
import { Lead, mockManagers, mockUnits, FunnelStage } from '@/data/mockData';

interface Props {
  lead: Lead;
  onClick: () => void;
}

const stageColors: Record<FunnelStage, string> = {
  new:          'border-t-indigo-500',
  quote:        'border-t-amber-500',
  negotiation:  'border-t-orange-500',
  closed_won:   'border-t-emerald-500',
  closed_lost:  'border-t-muted-foreground',
};

const KanbanCard: React.FC<Props> = ({ lead, onClick }) => {
  const manager = mockManagers.find(m => m.id === lead.manager_id);
  const unit = mockUnits.find(u => u.id === lead.unit_id);
  const isDanger = lead.sla_status === 'danger';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      onClick={onClick}
      className={`rounded-xl border border-t-2 border-border bg-card cursor-pointer
        p-3.5 space-y-2.5 ${stageColors[lead.funnel_stage]}
        hover:border-primary/30 hover:shadow-md transition-shadow`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">{lead.customer_name}</p>
          <p className="text-xs text-muted-foreground font-medium">{lead.customer_vehicle}</p>
        </div>
        {isDanger && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400
            bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />SLA
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center
          justify-center text-[11px] font-black text-primary shrink-0">
          {manager?.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground truncate">
            {manager?.name} · {unit?.name}
          </p>
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-semibold ${
          isDanger ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
        }`}>
          <Clock className="w-3 h-3" />
          {lead.wait_time_minutes > 0 ? `${lead.wait_time_minutes}m` : '—'}
        </div>
      </div>

      {/* Score */}
      {lead.score !== null && (
        <div className="pt-1 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Score</span>
            <span className={`text-xs font-black ${
              lead.score >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>{Math.round(lead.score)}%</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default KanbanCard;
