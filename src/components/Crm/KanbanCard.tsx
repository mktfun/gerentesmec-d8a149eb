import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, DollarSign, GripVertical, FileText, Trash2, User, CheckCheck } from 'lucide-react';
import { useAppData, Lead, FunnelStage } from '@/context/AppDataContext';
import { isLeadDanger } from '@/utils/metrics';

interface Props {
  lead: Lead;
  isDragging?: boolean;
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

const KanbanCard: React.FC<Props> = ({ lead, isDragging, onClick }) => {
  const { managers, units, deleteLead } = useAppData();
  let manager = managers.find(m => m.id === lead.manager_id);
  if (!manager) manager = managers.find(m => m.unit_id === lead.unit_id);
  const unit = units.find(u => u.id === lead.unit_id);
  const isDanger = isLeadDanger(lead, undefined, 20);
  // @ts-ignore
  const cTime = lead.last_client_message_at ? new Date(lead.last_client_message_at).getTime() : 0;
  // @ts-ignore
  const aTime = lead.last_agent_message_at ? new Date(lead.last_agent_message_at).getTime() : 0;
  
  // Se cTime é 0 (foi anulado pelo webhook após resposta do gerente) ou aTime >= cTime, então está respondido.
  // Só não está respondido se cTime for maior que aTime e cTime > 0.
  const isAnswered = cTime === 0 || aTime >= cTime;
  
  const getElapsed = () => {
    const ms = new Date().getTime() - new Date(lead.last_message_at).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const waitMs = new Date().getTime() - new Date(lead.last_message_at).getTime();
  const waitMins = Math.floor(waitMs / 60000);

  let timeColor = 'text-muted-foreground';
  const isClosed = lead.funnel_stage === 'closed_won' || lead.funnel_stage === 'closed_lost';

  if (!isClosed) {
    if (!isAnswered) {
      if (waitMins >= 120) timeColor = 'text-rose-600 dark:text-rose-400 font-bold';
      else if (waitMins >= 20) timeColor = 'text-amber-500 font-bold';
    } else {
      timeColor = 'text-muted-foreground/60';
    }
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`rounded-xl border border-t-2 bg-card cursor-pointer
        p-3 space-y-2 ${stageColors[lead.funnel_stage]} 
        ${isDragging ? 'shadow-xl border-primary/50 rotate-1 z-50' : 'border-border shadow-sm hover:border-primary/30 hover:shadow-md'} 
        transition-all duration-200 group relative`}
    >
      {/* Action Buttons (visible on hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-center">
        <div className="p-1 cursor-grab">
          <GripVertical className="w-4 h-4 text-muted-foreground/30 hover:text-muted-foreground/80 transition-colors" />
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); if(confirm('Mover para Lixeira? A exclusão é irreversível.')) deleteLead(lead.id); }}
          className="p-1 hover:bg-rose-500/20 rounded text-muted-foreground/30 hover:text-rose-500 transition-colors"
          title="Excluir Lead"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Header & Ticket Value */}
      <div className="flex items-start justify-between gap-2 pr-5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight truncate">{lead.customer_name}</p>
          <p className="text-[11px] text-muted-foreground font-medium truncate">{lead.customer_vehicle}</p>
        </div>
        
        <div className="flex flex-col items-end shrink-0 gap-1">
          {lead.ticket_value !== null && (
            <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400
              bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
              {formatMoney(lead.ticket_value)}
            </div>
          )}
          {lead.closing_summary && (
            <span className="flex items-center justify-center w-5 h-5 text-muted-foreground
              bg-muted border border-border rounded-full" title="Parecer disponível">
              <FileText className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

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
        <div className={`flex items-center gap-1 text-[11px] font-semibold ${timeColor}`}>
          {isClosed ? (
            <div className="flex items-center gap-1 text-muted-foreground/40" title="Venda Finalizada">
              <CheckCheck className="w-3.5 h-3.5" />
              Finalizado
            </div>
          ) : isAnswered ? (
            <div className="flex items-center gap-1" title="Respondido pelo Gerente">
              <CheckCheck className="w-3.5 h-3.5" />
              {getElapsed()}
            </div>
          ) : (
            <div className="flex items-center gap-1" title="Aguardando Resposta">
              <User className="w-3.5 h-3.5" />
              {getElapsed()}
            </div>
          )}
        </div>
      </div>

      {/* Score */}
      {lead.score !== null && (
        <div className="pt-1.5 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Score</span>
            <span className={`text-[11px] font-black ${
              lead.score >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>{Math.round(lead.score)}%</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default KanbanCard;
