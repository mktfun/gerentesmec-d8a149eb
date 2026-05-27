import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Clock, List, ChevronRight } from 'lucide-react';
import { Lead } from '@/context/AppDataContext';
import { supabase } from '@/integrations/supabase/client';
import { getMissingQualityItems, qualityFeedbackMap, auditStepsConfig } from '@/utils/scoreUtils';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '@/context/ThemeContext';

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

// ─── Build timeline ────────────────────────────────────────────────────────
function buildTimeline(messages: ChatMessage[], checklist: Record<string, boolean>): TimelineItem[] {
  const n = messages.length;
  const timeline: TimelineItem[] = [];
  const injectedIds = new Set<string>();

  // Only inject PASSING items inline — fails are shown only in the side index drawer
  const qualityByStep: Record<string, InlineEvent[]> = {};
  auditStepsConfig.forEach(step => {
    const events: InlineEvent[] = [];
    step.items.forEach(item => {
      const pass = !!checklist[item.id];
      if (!pass) return; // ← skip failed items from timeline
      events.push({
        kind: 'event',
        id: `quality-${item.id}`,
        eventType: 'quality_pass',
        label: qualityFeedbackMap[item.id]?.label ?? item.text,
        detail: qualityFeedbackMap[item.id]?.detail ?? '',
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
  
  const { isDark } = useTheme();

  const score = lead.score as number | null;
  const customerName = lead.name || lead.customer_name || 'Cliente';
  const checklist = (lead.audit_checklist as Record<string, boolean>) ?? {};

  let scoreBg = isDark ? 'bg-white/5' : 'bg-black/5';
  let scoreText = isDark ? 'text-white' : 'text-black';
  let scoreBorder = isDark ? 'border-white/10' : 'border-black/10';
  
  if (score !== null) {
    if (score >= 75) { scoreBg = isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'; scoreText = isDark ? 'text-emerald-400' : 'text-emerald-600'; scoreBorder = isDark ? 'border-emerald-500/30' : 'border-emerald-200'; }
    else if (score >= 50) { scoreBg = isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'; scoreText = isDark ? 'text-indigo-400' : 'text-indigo-600'; scoreBorder = isDark ? 'border-indigo-500/30' : 'border-indigo-200'; }
    else { scoreBg = isDark ? 'bg-rose-500/20' : 'bg-rose-100'; scoreText = isDark ? 'text-rose-400' : 'text-rose-600'; scoreBorder = isDark ? 'border-rose-500/30' : 'border-rose-200'; }
  }

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

  // Lock body scroll while inspector is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden font-instrument ${isDark ? 'bg-[#212529] text-white' : 'bg-[#f5f6f7] text-[#212529]'}`}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={`shrink-0 flex items-center gap-3 px-4 py-4 border-b ${isDark ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
        <button
          onClick={onClose}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 border ${scoreBg} ${scoreText} ${scoreBorder}`}>
          {customerName.substring(0, 2).toUpperCase()}
        </div>

        {/* Name + phone */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-black truncate leading-tight">{customerName}</p>
          <p className={`text-xs mt-0.5 truncate ${isDark ? 'opacity-60' : 'opacity-60'}`}>{lead.phone || lead.customer_phone || ''}</p>
        </div>

        {/* Score badge */}
        {score !== null && (
          <div className={`shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl border ${scoreBg} ${scoreBorder}`}>
            <span className={`text-xl font-black leading-none ${scoreText}`}>{score}</span>
            <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${scoreText} opacity-80`}>Score</span>
          </div>
        )}

        {/* Index toggle */}
        <button
          onClick={() => setShowIndex(v => !v)}
          className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
          aria-label="Índice de Qualidade"
        >
          <List className="w-6 h-6" />
          {/* mini badge with fail count */}
          {allQualityItems.filter(i => !i.pass).length > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center border-2 border-white dark:border-[#1a1a1a]">
              {allQualityItems.filter(i => !i.pass).length}
            </span>
          )}
        </button>
      </div>

      {/* ── Body: chat + index overlay ─────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Chat timeline */}
        <div ref={chatRef} className="h-full overflow-y-auto px-4 py-6 space-y-2">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
              <Clock className="w-12 h-12 mb-2" />
              <p className="text-lg font-bold">Nenhuma mensagem registrada.</p>
            </div>
          )}

          {!loading && timeline.map((item, idx) => {
            // ── Quality / Delay Event ──────────────────────────────────
            if (item.kind === 'event') {
              const ev = item as InlineEvent;
              const isPass = ev.eventType === 'quality_pass';
              const isDelay = ev.eventType === 'response_delay';
              
              let evBg, evText, Icon;
              if (isPass) {
                evBg = isDark ? 'bg-emerald-500/20' : 'bg-emerald-50';
                evText = isDark ? 'text-emerald-400' : 'text-emerald-600';
                Icon = CheckCircle2;
              } else if (isDelay) {
                evBg = isDark ? 'bg-amber-500/20' : 'bg-amber-50';
                evText = isDark ? 'text-amber-400' : 'text-amber-600';
                Icon = AlertTriangle;
              } else {
                evBg = isDark ? 'bg-rose-500/20' : 'bg-rose-50';
                evText = isDark ? 'text-rose-400' : 'text-rose-600';
                Icon = AlertTriangle;
              }

              return (
                <div key={ev.id} id={ev.id} className="flex justify-center my-4 px-2">
                  <div className={`flex items-start gap-3 w-full max-w-sm rounded-3xl p-4 shadow-sm ${evBg}`}>
                    <Icon className={`w-5 h-5 shrink-0 ${evText}`} />
                    <div>
                      <p className={`text-sm font-black ${evText}`}>{ev.label}</p>
                      <p className={`text-xs mt-1 font-semibold ${evText} opacity-80`}>{ev.detail}</p>
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
                <div key={msg.id} className="flex justify-center my-4">
                  <span className={`text-xs font-semibold px-4 py-2 rounded-full ${isDark ? 'bg-white/10 text-white/60' : 'bg-black/5 text-black/60'}`}>
                    {msg.content}
                  </span>
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
                  className={`max-w-[85%] px-5 py-3.5 text-base leading-relaxed shadow-sm ${
                    isClient 
                      ? (isDark ? 'bg-[#1a1a1a] rounded-[1.5rem_1.5rem_1.5rem_0.25rem] border border-white/5' : 'bg-white rounded-[1.5rem_1.5rem_1.5rem_0.25rem] border border-black/5')
                      : ('bg-indigo-600 text-white rounded-[1.5rem_1.5rem_0.25rem_1.5rem]')
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-2 text-right font-bold tracking-wider ${isClient ? (isDark ? 'opacity-40' : 'opacity-40') : 'text-indigo-200'}`}>
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
                className={`absolute inset-0 z-10 ${isDark ? 'bg-black/60' : 'bg-[#212529]/40 backdrop-blur-sm'}`}
                onClick={() => setShowIndex(false)}
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                className={`absolute inset-y-0 right-0 w-[85%] max-w-sm z-20 flex flex-col shadow-2xl ${isDark ? 'bg-[#1a1a1a] border-l border-white/5' : 'bg-white border-l border-black/5'}`}
              >
                {/* Drawer header */}
                <div className={`flex items-center justify-between px-6 py-5 border-b shrink-0 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                  <div>
                    <p className="text-lg font-black">Vistoria de Qualidade</p>
                    <p className={`text-xs font-semibold mt-1 ${isDark ? 'opacity-60' : 'opacity-60'}`}>
                      {passingCount} de {allQualityItems.length} critérios cumpridos
                    </p>
                  </div>
                  <button
                    onClick={() => setShowIndex(false)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Score mini */}
                {score !== null && (
                  <div className={`px-6 py-5 border-b shrink-0 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    <div className={`w-full py-4 rounded-3xl flex items-center justify-center gap-4 border ${scoreBg} ${scoreBorder}`}>
                      <span className={`text-4xl font-black ${scoreText}`}>{score}</span>
                      <div>
                        <p className="text-sm font-bold">Score Final</p>
                        <p className={`text-xs font-semibold truncate max-w-[120px] mt-0.5 ${isDark ? 'opacity-60' : 'opacity-60'}`}>{customerName}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items list */}
                <div className="flex-1 overflow-y-auto py-4">
                  {auditStepsConfig.map(step => (
                    <div key={step.id} className="mb-4">
                      <p className={`text-xs font-black uppercase tracking-widest px-6 py-2 ${isDark ? 'opacity-40' : 'opacity-40'}`}>
                        {step.title}
                      </p>
                      {step.items.map(item => {
                        const pass = !!checklist[item.id];
                        let iconColor = pass ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-rose-400' : 'text-rose-600');
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => scrollToEvent(`quality-${item.id}`)}
                            className={`w-full flex items-center gap-4 px-6 py-3.5 transition-colors text-left ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                          >
                            {pass
                              ? <CheckCircle2 className={`w-5 h-5 shrink-0 ${iconColor}`} />
                              : <AlertTriangle className={`w-5 h-5 shrink-0 ${iconColor}`} />
                            }
                            <span className="flex-1 text-sm font-bold leading-tight">
                              {qualityFeedbackMap[item.id]?.label ?? item.text}
                            </span>
                            <ChevronRight className={`w-4 h-4 shrink-0 ${isDark ? 'opacity-20' : 'opacity-20'}`} />
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
