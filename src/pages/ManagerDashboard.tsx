import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppData, Lead } from '@/context/AppDataContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { avgScore } from '@/utils/scoreUtils';
import { calculateDangerLeads } from '@/utils/metrics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Clock, ChevronRight, TrendingUp, Users, Target } from 'lucide-react';
import ManagerAuditInspector from '@/components/Manager/ManagerAuditInspector';

const getScoreColor = (s: number | null) =>
  s === null ? '#6366f1' : s >= 75 ? '#34d399' : s >= 50 ? '#818cf8' : '#f87171';

const getScoreGlow = (s: number | null) =>
  s === null ? 'rgba(99,102,241,0.25)' : s >= 75 ? 'rgba(52,211,153,0.25)' : s >= 50 ? 'rgba(129,140,248,0.25)' : 'rgba(248,113,113,0.25)';

const ManagerDashboard: React.FC = () => {
  const { leads, managers, businessHours } = useAppData();
  const { user } = useAuth();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const currentManager = managers.find(m => m.auth_user_id === user?.id);
  const managerLeads = leads.filter(l => currentManager ? l.manager_id === currentManager.id : true);

  const score = avgScore(managerLeads);
  const displayScore = score !== null ? Math.round(score) : 0;
  const dangerLeads = calculateDangerLeads(managerLeads, businessHours);
  const scoredLeads = managerLeads.filter(l => l.score !== null);
  const todayLeads = managerLeads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString());

  const scoreColor = getScoreColor(score);
  const scoreGlow = getScoreGlow(score);

  // SVG circle params
  const R = 116;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - displayScore / 100);

  const sortedLeads = [...managerLeads].sort((a, b) => {
    if (a.score !== null && b.score !== null) return Number(a.score) - Number(b.score);
    if (a.score !== null) return -1;
    if (b.score !== null) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }).slice(0, 40);

  return (
    <div className="min-h-screen bg-background pb-10">

      {/* ── HERO: Score Card ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mx-4 mt-4 rounded-[2rem] overflow-hidden border border-white/10"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          backdropFilter: 'blur(24px)',
          boxShadow: `0 0 80px ${scoreGlow}, 0 1px 2px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        {/* Radial glow background */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] pointer-events-none opacity-30"
          style={{ background: `radial-gradient(ellipse at top, ${scoreColor} 0%, transparent 70%)` }}
        />

        <div className="relative z-10 flex items-center gap-6 px-8 py-8">
          {/* SVG Score Circle */}
          <div className="relative shrink-0 w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
              <circle cx="128" cy="128" r={R} stroke="currentColor" strokeWidth="14" fill="transparent" className="text-white/5" />
              <motion.circle
                cx="128" cy="128" r={R}
                stroke={scoreColor}
                strokeWidth="14"
                fill="transparent"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 12px ${scoreColor}80)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black tracking-tighter leading-none" style={{ color: scoreColor }}>{score !== null ? displayScore : '—'}</span>
              {score !== null && <span className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: scoreColor + '99' }}>Score</span>}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-1">Sua Loja</p>
            <h1 className="text-2xl font-black text-foreground leading-tight truncate">
              {currentManager?.name || 'Gerente'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{scoredLeads.length} avaliação{scoredLeads.length !== 1 ? 'ões' : ''} registrada{scoredLeads.length !== 1 ? 's' : ''}</p>

            {/* Mini metrics */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-sm font-bold text-foreground">{todayLeads.length}</span>
                <span className="text-xs text-muted-foreground">hoje</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <AlertTriangle className={`w-3.5 h-3.5 ${dangerLeads.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                <span className={`text-sm font-bold ${dangerLeads.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{dangerLeads.length}</span>
                <span className="text-xs text-muted-foreground">em risco</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── LEADS LIST ────────────────────────────────────────────── */}
      <div className="px-4 mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3 pl-1">
          Atendimentos · {managerLeads.length} total
        </p>

        {sortedLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Target className="w-10 h-10 opacity-20" />
            <p className="text-sm font-semibold">Nenhum atendimento ainda.</p>
          </div>
        )}

        <div className="space-y-2">
          {sortedLeads.map((lead, i) => {
            const sc = lead.score as number | null;
            const col = getScoreColor(sc);
            const glow = getScoreGlow(sc);
            const isDanger = dangerLeads.some(d => d.id === lead.id);
            const name = lead.name || lead.customer_name || 'Cliente Sem Nome';
            const date = format(new Date(lead.created_at), "dd MMM, HH:mm", { locale: ptBR });
            const hasScore = sc !== null;

            return (
              <motion.button
                key={lead.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025, duration: 0.3 }}
                onClick={() => setSelectedLead(lead)}
                className="group w-full flex items-center gap-3.5 p-4 rounded-2xl border border-white/5 text-left transition-all duration-300 hover:border-white/10 active:scale-[0.98] relative overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 30px ${glow}, 0 1px 2px rgba(0,0,0,0.06)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)';
                }}
              >
                {/* Score badge */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-base border"
                  style={{
                    background: col + '15',
                    color: col,
                    borderColor: col + '30',
                  }}
                >
                  {hasScore ? sc : '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">{name}</p>
                    {isDanger && <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{date}</p>
                </div>

                {/* Right */}
                <div className="shrink-0 flex items-center gap-2">
                  {hasScore
                    ? sc! >= 75
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <AlertTriangle className="w-4 h-4 text-amber-400" />
                    : <Clock className="w-4 h-4 text-white/20" />
                  }
                  <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── AUDIT INSPECTOR ───────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLead && (
          <ManagerAuditInspector
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagerDashboard;
