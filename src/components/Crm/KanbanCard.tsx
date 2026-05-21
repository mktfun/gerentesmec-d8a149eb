import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, DollarSign, GripVertical, FileText } from 'lucide-react';
import { useAppData, Lead, FunnelStage } from '@/context/AppDataContext';

interface Props {
  lead: Lead;
  onClick: () => void;
}

const stageColors: Record<string, string> = {
  lead_new:     'border-t-indigo-500',
  quote:        'border-t-amber-500',
  negotiation:  'border-t-orange-500',
  closed_won:   'border-t-emerald-500',
  closed_lost:  'border-t-muted-foreground',
};

const formatMoney = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const KanbanCard: React.FC<Props> = ({ lead, onClick }) => {
  const { managers, units } = useAppData();
  const manager = managers.find(m => m.id === lead.manager_id);
  const unit = units.find(u => u.id === lead.unit_id);
  const isDanger = lead.sla_status === 'danger';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-t-2 border-border bg-card cursor-pointer
        p-3.5 space-y-2.5 ${stageColors[lead.funnel_stage]} shadow-sm
        hover:border-primary/30 hover:shadow-md transition-shadow group relative`}
    >
      {/* Drag Handle (visible on hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-muted-foreground/30" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 pr-5">
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
        {lead.closing_summary && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-muted-foreground
            bg-muted border border-border px-1.5 py-0.5 rounded-full" title="Parecer disponível">
            <FileText className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Ticket Value */}
      {lead.ticket_value !== null && (
        <div className="flex items-center gap-1 text-sm font-black text-emerald-600 dark:text-emerald-400
          bg-emerald-500/5 px-2 py-1 rounded-md w-fit border border-emerald-500/10">
          {formatMoney(lead.ticket_value)}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center
          justify-center text-[11px] font-black text-primary shrink-0">
          {manager?.name[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground truncate">
            {manager?.name || 'Sem Gerente'} · {unit?.name}
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
    </div>
  );
};

export default KanbanCard;
