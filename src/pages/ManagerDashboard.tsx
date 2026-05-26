import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppData, Lead } from '@/context/AppDataContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { avgScore } from '@/utils/scoreUtils';
import { calculateDangerLeads } from '@/utils/metrics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Clock, ChevronRight, TrendingUp, Users } from 'lucide-react';
import ManagerAuditInspector from '@/components/Manager/ManagerAuditInspector';

const scoreColor = (s: number | null) =>
  s === null ? '#94a3b8' : s >= 75 ? '#34d399' : s >= 50 ? '#818cf8' : '#f87171';

const ManagerDashboard: React.FC = () => {
  const { leads, managers, businessHours } = useAppData();
  const { user } = useAuth();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const currentManager = managers.find(m => m.auth_user_id === user?.id);
  const managerLeads = leads.filter(l =>
    currentManager ? l.manager_id === currentManager.id : true
  );

  const score = avgScore(managerLeads);
  const dangerLeads = calculateDangerLeads(managerLeads, businessHours);
  const scoredLeads = managerLeads.filter(l => l.score !== null);
  const todayLeads = managerLeads.filter(l => {
    const d = new Date(l.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  // Sort: lowest score first (problems first), then unaudited, then recent
  const sortedLeads = [...managerLeads].sort((a, b) => {
    if (a.score !== null && b.score !== null) return Number(a.score) - Number(b.score);
    if (a.score !== null) return -1;
    if (b.score !== null) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }).slice(0, 30);

  const cards = [
    {
      label: 'Score da Loja',
      value: score !== null ? `${score}%` : '—',
      sub: `${scoredLeads.length} atendimento${scoredLeads.length !== 1 ? 's' : ''} avaliado${scoredLeads.length !== 1 ? 's' : ''}`,
      icon: TrendingUp,
      color: scoreColor(score),
    },
    {
      label: 'Atendimentos Hoje',
      value: todayLeads.length,
      sub: `Total: ${managerLeads.length}`,
      icon: Users,
      color: '#818cf8',
    },
    {
      label: 'Atenção Imediata',
      value: dangerLeads.length,
      sub: dangerLeads.length > 0 ? 'Clientes aguardando' : 'Tudo em dia 👍',
      icon: AlertTriangle,
      color: dangerLeads.length > 0 ? '#f87171' : '#34d399',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Stats Cards */}
      <div className="px-4 pt-4 pb-2 grid grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-border p-3 flex flex-col gap-1"
            style={{ borderColor: card.color + '30', background: card.color + '08' }}
          >
            <card.icon className="w-4 h-4 mb-1" style={{ color: card.color }} />
            <span className="text-xl font-black leading-none" style={{ color: card.color }}>{card.value}</span>
            <span className="text-[10px] font-semibold text-foreground leading-tight">{card.label}</span>
            <span className="text-[9px] text-muted-foreground leading-tight">{card.sub}</span>
          </motion.div>
        ))}
      </div>

      {/* Leads List */}
      <div className="px-4 pb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 mt-4">
          Atendimentos Recentes
        </p>

        {sortedLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <Clock className="w-8 h-8 opacity-40" />
            <p className="text-sm">Nenhum atendimento ainda.</p>
          </div>
        )}

        <div className="space-y-2">
          {sortedLeads.map((lead, i) => {
            const sc = lead.score;
            const col = scoreColor(sc as number | null);
            const isDanger = dangerLeads.some(d => d.id === lead.id);
            const name = lead.name || lead.customer_name || 'Cliente Sem Nome';
            const date = format(new Date(lead.created_at), "dd MMM, HH:mm", { locale: ptBR });

            return (
              <motion.button
                key={lead.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedLead(lead)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:bg-accent/50 transition-colors text-left active:scale-[0.98]"
              >
                {/* Score badge */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
                  style={{ background: col + '18', color: col }}
                >
                  {sc !== null ? sc : '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground truncate">{name}</p>
                    {isDanger && (
                      <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{date}</p>
                </div>

                {/* Status icon */}
                <div className="shrink-0">
                  {sc !== null ? (
                    sc >= 75
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-foreground/50" />
                  )}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Audit Inspector (full-screen) */}
      {selectedLead && (
        <ManagerAuditInspector
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
};

export default ManagerDashboard;
