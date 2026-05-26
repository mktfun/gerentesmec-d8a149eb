import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Clock, List, ChevronRight } from 'lucide-react';
import { Lead } from '@/context/AppDataContext';
import { supabase } from '@/integrations/supabase/client';
import { getMissingQualityItems, qualityFeedbackMap, auditStepsConfig } from '@/utils/scoreUtils';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props { lead: Lead; onClose: () => void; }

interface ChatMessage {
  id: string; content: string; sender: string; created_at: string;
}

// ─── Timeline item types ───────────────────────────────────────────────────
type InlineEventType = 'quality_pass' | 'quality_fail' | 'response_delay';

interface InlineEvent {
  kind: 'event';
  id: string;
  eventType: InlineEventType;
  label: string;
  detail: string;
}

interface MessageItem { kind: 'message'; data: ChatMessage; }

type TimelineItem = MessageItem | InlineEvent;

// ─── Heuristic positioning ─────────────────────────────────────────────────
// Each step covers a % window of the conversation length
const STEP_WINDOWS: Record<string, [number, number]> = {
  step1: [0.00, 0.20],  // Cordialidade
  step2: [0.20, 0.65],  // Orçamento + Vídeo
  step3: [0.65, 0.85],  // Checklist Mecânico
  step4: [0.85, 1.00],  // Encerramento
};

const DELAY_THRESHOLD = 30; // minutes

const getScoreColor = (s: number | null) =>
  s === null ? '#6366f1' : s >= 75 ? '#34d399' : s >= 50 ? '#818cf8' : '#f87171';

// ─── Build timeline ────────────────────────────────────────────────────────
function buildTimeline(messages: ChatMessage[], checklist: Record<string, boolean>): TimelineItem[] {
  const n = messages.length;
  const timeline: TimelineItem[] = [];
  const injectedIds = new Set<string>();

  // Prepare quality events per step, in order (fails first then passes)
  const qualityByStep: Record<string, InlineEvent[]> = {};
  auditStepsConfig.forEach(step => {
    const events: InlineEvent[] = [];
    step.items.forEach(item => {
      const pass = !!checklist[item.id];
      events.push({
        kind: 'event',
        id: `quality-${item.id}`,
        eventType: pass ? 'quality_pass' : 'quality_fail',
        label: qualityFeedbackMap[item.id]?.label ?? item.text,
        detail: pass
          ? qualityFeedbackMap[item.id]?.detail ?? ''
          : `Este ponto não foi cumprido: "${item.text}"`,
      });
    });
    qualityByStep[step.id] = events;
  });

  // Decide injection index for each step
  const stepInjectionIndex: Record<string, number> = {};
  auditStepsConfig.forEach(step => {
    const [lo, hi] = STEP_WINDOWS[step.id];
    const idx = Math.min(Math.floor(lo * n) + Math.floor((hi - lo) * n * 0.5), n - 1);
    stepInjectionIndex[step.id] = Math.max(0, idx);
  });

  // Build map: after which message index to inject step events
  const injectAfter: Record<number, InlineEvent[]> = {};
  Object.entries(stepInjectionIndex).forEach(([stepId, idx]) => {
    if (!injectAfter[idx]) injectAfter[idx] = [];
    (injectAfter[idx] as InlineEvent[]).push(...(qualityByStep[stepId] ?? []));
  });

  for (let i = 0; i < n; i++) {
    const msg = messages[i];
    timeline.push({ kind: 'message', data: msg });

    // Response delay alert (between different senders)
    if (i < n - 1) {
      const next = messages[i + 1];
      if (msg.sender !== next.sender) {
        const delay = differenceInMinutes(new Date(next.created_at), new Date(msg.created_at));
        if (delay >= DELAY_THRESHOLD) {
          timeline.push({
            kind: 'event',
            id: `delay-${i}`,
            eventType: 'response_delay',
            label: `Demora de ${delay} min`,
            detail: `Resposta levou ${delay} minutos. O padrão é até ${DELAY_THRESHOLD} min.`,
          });
        }
      }
    }

    // Quality events injected after this message index
    if (injectAfter[i]) {
      injectAfter[i].forEach(ev => {
        if (!injectedIds.has(ev.id)) {
          injectedIds.add(ev.id);
          timeline.push(ev);
        }
      });
    }
  }

  return timeline;
}

// ─── Component ────────────────────────────────────────────────────────────
const ManagerAuditInspector: React.FC<Props> = ({ lead, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIndex, setShowIndex] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const score = lead.score as number | null;
  const scoreColor = getScoreColor(score);
  const customerName = lead.name || lead.customer_name || 'Cliente';
  const checklist = (lead.audit_checklist as Record<string, boolean>) ?? {};

  // All quality items for the index panel
  const allQualityItems = auditStepsConfig.flatMap(step =>
    step.items.map(item => ({
      id: item.id,
      label: qualityFeedbackMap[item.id]?.label ?? item.text,
      pass: !!checklist[item.id],
      eventId: `quality-${item.id}`,
    }))
  );

  const passingCount = allQualityItems.filter(i => i.pass).length;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('chat_messages').select('*')
        .eq('lead_id', lead.id).order('created_at', { ascending: true });
      setMessages((data as ChatMessage[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [lead.id]);

  const timeline = buildTimeline(messages, checklist);

  const scrollToEvent = useCallback((eventId: string) => {
    setShowIndex(false);
    setTimeout(() => {
      const el = document.getElementById(eventId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 60 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5"
        style={{
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors focus-visible:outline-primary"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0"
          style={{ background: scoreColor + '20', color: scoreColor, border: `1.5px solid ${scoreColor}40` }}
        >
          {customerName.substring(0, 2).toUpperCase()}
        </div>

        {/* Name + phone */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{customerName}</p>
          <p className="text-[10px] text-muted-foreground truncate">{lead.phone || lead.customer_phone || ''}</p>
        </div>

        {/* Score badge */}
        {score !== null && (
          <div
            className="shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-2xl border"
            style={{ borderColor: scoreColor + '40', background: scoreColor + '12' }}
          >
            <span className="text-lg font-black leading-none" style={{ color: scoreColor }}>{score}</span>
            <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: scoreColor + 'aa' }}>Score</span>
          </div>
        )}

        {/* Index toggle */}
        <button
          onClick={() => setShowIndex(v => !v)}
          className="relative w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors focus-visible:outline-primary"
          aria-label="Índice de Qualidade"
        >
          <List className="w-4 h-4" />
          {/* mini badge with fail count */}
          {allQualityItems.filter(i => !i.pass).length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center">
              {allQualityItems.filter(i => !i.pass).length}
            </span>
          )}
        </button>
      </div>

      {/* ── Body: chat + index overlay ─────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Chat timeline */}
        <div ref={chatRef} className="h-full overflow-y-auto px-3 py-4 space-y-1">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <Clock className="w-9 h-9 opacity-20" />
              <p className="text-sm font-semibold">Nenhuma mensagem nesta conversa.</p>
            </div>
          )}

          {!loading && timeline.map((item, idx) => {
            // ── Quality / Delay Event ──────────────────────────────────
            if (item.kind === 'event') {
              const ev = item as InlineEvent;
              const isPass = ev.eventType === 'quality_pass';
              const isDelay = ev.eventType === 'response_delay';
              const color = isPass ? '#34d399' : isDelay ? '#fb923c' : '#f87171';
              const bg = isPass ? 'rgba(52,211,153,0.08)' : isDelay ? 'rgba(251,146,60,0.08)' : 'rgba(248,113,113,0.08)';
              const border = isPass ? 'rgba(52,211,153,0.2)' : isDelay ? 'rgba(251,146,60,0.2)' : 'rgba(248,113,113,0.2)';
              const Icon = isPass ? CheckCircle2 : AlertTriangle;

              return (
                <div
                  key={ev.id}
                  id={ev.id}
                  className="flex justify-center my-2.5 px-2"
                >
                  <div
                    className="flex items-start gap-2 max-w-[90%] w-full rounded-2xl px-3.5 py-2.5"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color }} />
                    <div>
                      <p className="text-[11px] font-bold" style={{ color }}>{ev.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: color + 'aa' }}>{ev.detail}</p>
                    </div>
                  </div>
                </div>
              );
            }

            // ── Chat Message ──────────────────────────────────────────
            const { data: msg } = item as MessageItem;
            const isClient = msg.sender === 'client' || msg.sender === 'contact' || msg.sender === 'customer';
            const isSystem = msg.sender === 'system' || msg.sender === 'bot';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="text-[10px] text-muted-foreground bg-white/5 rounded-full px-3 py-1">{msg.content}</span>
                </div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.005 }}
                className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={
                    isClient
                      ? {
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'hsl(var(--foreground))',
                          borderRadius: '18px 18px 18px 4px',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                        }
                      : {
                          background: 'rgba(99,102,241,0.25)',
                          border: '1px solid rgba(99,102,241,0.35)',
                          color: '#e0e0ff',
                          borderRadius: '18px 18px 4px 18px',
                          boxShadow: '0 0 20px rgba(99,102,241,0.15), 0 1px 4px rgba(0,0,0,0.12)',
                        }
                  }
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className="text-[9px] mt-1 text-right opacity-50">
                    {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Quality Index Drawer ───────────────────────────────── */}
        <AnimatePresence>
          {showIndex && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/60 z-10"
                onClick={() => setShowIndex(false)}
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                className="absolute inset-y-0 right-0 w-[85%] max-w-sm z-20 flex flex-col"
                style={{
                  background: 'rgba(15,15,20,0.95)',
                  backdropFilter: 'blur(24px)',
                  borderLeft: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
                }}
              >
                {/* Drawer header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                  <div>
                    <p className="text-sm font-black text-foreground">Análise de Qualidade</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {passingCount}/{allQualityItems.length} critérios cumpridos
                    </p>
                  </div>
                  <button
                    onClick={() => setShowIndex(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-white/5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Score mini */}
                {score !== null && (
                  <div className="px-5 py-3 border-b border-white/5 shrink-0">
                    <div
                      className="w-full py-3 rounded-2xl flex items-center justify-center gap-3"
                      style={{ background: scoreColor + '12', border: `1px solid ${scoreColor}25` }}
                    >
                      <span className="text-3xl font-black" style={{ color: scoreColor }}>{score}</span>
                      <div>
                        <p className="text-xs font-bold text-foreground">Score Final</p>
                        <p className="text-[10px] text-muted-foreground">{customerName}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items list */}
                <div className="flex-1 overflow-y-auto py-2">
                  {auditStepsConfig.map(step => (
                    <div key={step.id} className="mb-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/20 px-5 py-2">{step.title}</p>
                      {step.items.map(item => {
                        const pass = !!checklist[item.id];
                        const col = pass ? '#34d399' : '#f87171';
                        return (
                          <button
                            key={item.id}
                            onClick={() => scrollToEvent(`quality-${item.id}`)}
                            className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/4 transition-colors text-left focus-visible:outline-primary"
                          >
                            {pass
                              ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: col }} />
                              : <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: col }} />
                            }
                            <span className="flex-1 text-[12px] font-semibold text-foreground/80 leading-tight">
                              {qualityFeedbackMap[item.id]?.label ?? item.text}
                            </span>
                            <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ManagerAuditInspector;
