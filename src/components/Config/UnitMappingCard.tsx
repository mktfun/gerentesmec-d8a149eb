import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, ChevronDown, ExternalLink, Trash2 } from 'lucide-react';
import { Unit, Manager } from '@/context/AppDataContext';

interface Props {
  unit: Unit;
  manager: Manager | undefined;
  slaMinutes: number;
  unitScore: number;
  onSlaChange: (minutes: number) => void;
  onDelete?: () => void;
}

const UnitMappingCard: React.FC<Props> = ({ unit, manager, slaMinutes, unitScore, onSlaChange, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [slaInput, setSlaInput] = useState(String(slaMinutes));

  const scoreColor = unitScore >= 80
    ? 'text-emerald-600 dark:text-emerald-400'
    : unitScore >= 65
    ? 'text-indigo-600 dark:text-indigo-400'
    : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 flex items-center gap-4">
        {/* Unit score chip */}
        <div className={`text-2xl font-black shrink-0 ${scoreColor}`}>{unitScore}%</div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-foreground">{unit.name}</p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground
              bg-muted px-2 py-0.5 rounded-full">Unidade</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium">
                Canal: <span className="font-bold text-foreground">"{unit.name}"</span>
              </span>
            </div>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-xs text-muted-foreground">
              Gerente: <span className="font-bold text-foreground">{manager?.name ?? '—'}</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onDelete && (
            <button onClick={onDelete}
              className="p-2 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
              title="Remover unidade">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setExpanded(v => !v)}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatedExpand open={expanded}>
        <div className="px-5 pb-5 pt-1 border-t border-border space-y-4">

          {/* Mapping explanation */}
          <div className="p-3 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              Como o sistema identifica esta unidade
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quando uma conversa chega pelo Chatwoot, o sistema lê o campo{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-primary font-mono text-[11px]">inbox.name</code>.
              Se o valor for <span className="font-bold text-foreground">"{unit.name}"</span>,
              a conversa é atribuída a esta unidade e ao gerente{' '}
              <span className="font-bold text-foreground">{manager?.name}</span>.
            </p>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Nome no Chatwoot (Inbox)
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl border border-border">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-sm font-semibold text-foreground">{unit.name}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Gerente Responsável
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl border border-border">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center
                  text-[10px] font-black text-primary shrink-0">{manager?.name[0]}</div>
                <span className="text-sm font-semibold text-foreground">{manager?.name ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* SLA */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
              SLA de Alerta (minutos sem resposta)
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-muted rounded-xl border border-border">
                <input
                  type="number" value={slaInput} min={5} max={120}
                  onChange={e => setSlaInput(e.target.value)}
                  onBlur={() => onSlaChange(parseInt(slaInput) || 20)}
                  className="w-16 bg-transparent text-sm font-bold text-foreground focus:outline-none"
                />
                <span className="text-xs text-muted-foreground">minutos</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Alerta após {slaInput || 20}m
              </div>
            </div>
          </div>
        </div>
      </AnimatedExpand>
    </div>
  );
};

// Simple animated expand helper
const AnimatedExpand: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => (
  <motion.div
    initial={false}
    animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
    transition={{ duration: 0.25 }}
    style={{ overflow: 'hidden' }}
  >
    {children}
  </motion.div>
);

export default UnitMappingCard;
