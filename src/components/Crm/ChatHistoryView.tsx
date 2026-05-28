import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Clock, MessageSquare, Wrench, CheckCircle2, ChevronDown } from 'lucide-react';
import { Lead } from '@/context/AppDataContext';
import { CustomAudioPlayer } from './CustomAudioPlayer';
import { ExpandableMedia } from './ExpandableMedia';

export interface ChatMessage {
  id: string;
  chatwoot_message_id?: string;
  content: string;
  sender_type: 'contact' | 'user' | 'bot' | 'system';
  created_at: string;
  media_url?: string;
  media_type?: string;
  ai_insight?: string;
}

const formatDividerDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0 && date.getDate() === now.getDate()) return 'Hoje';
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) return 'Ontem';

  if (diffDays < 7) {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[date.getDay()];
  }

  return date.toLocaleDateString('pt-BR');
};

interface Props {
  lead: Lead;
  messages: ChatMessage[];
  isLoading?: boolean;
  highlightMessageId?: string | null;
}

import { auditStepsConfig, qualityFeedbackMap } from '@/utils/scoreUtils';
import { differenceInMinutes } from 'date-fns';

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

const STEP_WINDOWS: Record<string, [number, number]> = {
  step1: [0.00, 0.20],
  step2: [0.20, 0.65],
  step3: [0.65, 0.85],
  step4: [0.85, 1.00],
};
const DELAY_THRESHOLD = 30;

function buildTimeline(messages: ChatMessage[], checklist: Record<string, boolean>): TimelineItem[] {
  const n = messages.length;
  const timeline: TimelineItem[] = [];
  const injectedIds = new Set<string>();

  const qualityByStep: Record<string, InlineEvent[]> = {};
  auditStepsConfig.forEach(step => {
    const events: InlineEvent[] = [];
    step.items.forEach(item => {
      if (!checklist[item.id]) return;
      events.push({
        kind: 'event', id: `quality-${item.id}`, eventType: 'quality_pass',
        label: qualityFeedbackMap[item.id]?.label ?? item.text,
        detail: qualityFeedbackMap[item.id]?.detail ?? '',
      });
    });
    qualityByStep[step.id] = events;
  });

  const stepInjectionIndex: Record<string, number> = {};
  auditStepsConfig.forEach(step => {
    const [lo, hi] = STEP_WINDOWS[step.id];
    const idx = Math.min(Math.floor(lo * n) + Math.floor((hi - lo) * n * 0.5), n - 1);
    stepInjectionIndex[step.id] = Math.max(0, idx);
  });

  const injectAfter: Record<number, InlineEvent[]> = {};
  Object.entries(stepInjectionIndex).forEach(([stepId, idx]) => {
    if (!injectAfter[idx]) injectAfter[idx] = [];
    (injectAfter[idx] as InlineEvent[]).push(...(qualityByStep[stepId] ?? []));
  });

  for (let i = 0; i < n; i++) {
    const msg = messages[i];
    timeline.push({ kind: 'message', data: msg });

    if (i < n - 1) {
      const next = messages[i + 1];
      if (msg.sender_type !== next.sender_type && msg.sender_type !== 'system' && next.sender_type !== 'system') {
        const delay = differenceInMinutes(new Date(next.created_at), new Date(msg.created_at));
        if (delay >= DELAY_THRESHOLD) {
          timeline.push({
            kind: 'event', id: `delay-${i}`, eventType: 'response_delay',
            label: `Demora de ${delay} min`,
            detail: `Resposta levou ${delay} minutos.`,
          });
        }
      }
    }

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

const ChatHistoryView: React.FC<Props> = ({ lead, messages, isLoading, highlightMessageId }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [expandedAudit, setExpandedAudit] = React.useState<string | null>(null);

  // Auto-scroll to bottom or to highlighted message
  useEffect(() => {
    if (highlightMessageId && messageRefs.current[highlightMessageId]) {
      messageRefs.current[highlightMessageId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (scrollRef.current && !highlightMessageId) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, expandedAudit, highlightMessageId]);

  const checklist = (lead as any).audit_checklist || {};
  const timeline = buildTimeline(messages, checklist);

  return (
    <div className="flex flex-col h-full bg-background dark:bg-[#0a0a10] relative overflow-hidden">
      
      {/* Background glow effects for "Liquid Glass" feeling */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-black/5 dark:bg-white/[0.01] backdrop-blur-xl shrink-0 z-10 flex items-center gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-black text-indigo-500 dark:text-indigo-400">{lead.customer_name.charAt(0)}</span>
        </div>
        <div>
          <h3 className="text-sm font-black text-foreground">{lead.customer_name}</h3>
          <p className="text-xs font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            Canal Online
          </p>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 z-10 custom-scrollbar scroll-smooth">
        
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">Sincronizando Chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-bold text-muted-foreground">Nenhuma mensagem encontrada</p>
            <p className="text-xs text-muted-foreground/50">As interações desta conversa aparecerão aqui.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {timeline.map((item, idx) => {
              if (item.kind === 'event') {
                const ev = item as InlineEvent;
                const isPass = ev.eventType === 'quality_pass';
                const isDelay = ev.eventType === 'response_delay';
                const color = isPass ? '#34d399' : isDelay ? '#fb923c' : '#f87171';
                const bg = isPass ? 'rgba(52,211,153,0.08)' : isDelay ? 'rgba(251,146,60,0.08)' : 'rgba(248,113,113,0.08)';
                const border = isPass ? 'rgba(52,211,153,0.2)' : isDelay ? 'rgba(251,146,60,0.2)' : 'rgba(248,113,113,0.2)';
                
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
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color }} />
                      <div>
                        <p className="text-[11px] font-bold" style={{ color }}>{ev.label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: color + 'aa' }}>{ev.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              }

              const { data: msg } = item as MessageItem;
              const isSystem = msg.sender_type === 'system';
              const isUser = msg.sender_type === 'user';
              const isBot = msg.sender_type === 'bot';
              const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              let showDivider = false;
              let dividerText = '';
              
              // We need to compare with the previous MESSAGE, not just timeline[i-1]
              const prevMsgIndex = timeline.findIndex((t, i) => i < idx && t.kind === 'message');
              if (prevMsgIndex === -1) {
                showDivider = true;
                dividerText = formatDividerDate(msg.created_at);
              } else {
                const prevMessages = timeline.filter((t, i) => i < idx && t.kind === 'message');
                if (prevMessages.length > 0) {
                  const prevDate = formatDividerDate((prevMessages[prevMessages.length - 1] as MessageItem).data.created_at);
                  const currDate = formatDividerDate(msg.created_at);
                  if (prevDate !== currDate) {
                    showDivider = true;
                    dividerText = currDate;
                  }
                }
              }

              const dividerEl = showDivider ? (
                <motion.div
                  key={`div-${msg.id}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center w-full my-6"
                >
                  <div className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/[0.04] border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest backdrop-blur-sm shadow-sm">
                    {dividerText}
                  </div>
                </motion.div>
              ) : null;

              if (isSystem) {
                const isAudit = msg.content.startsWith('Auditado e pontuado:');
                const isExpanded = expandedAudit === msg.id;

                return (
                  <div key={msg.id} className="w-full">
                    {dividerEl}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: idx * 0.05 }}
                      className="flex justify-center w-full my-4"
                    >
                      {isAudit ? (
                        <div className="bg-card border border-emerald-500/20 rounded-xl p-3 max-w-[300px] w-full shadow-[0_4px_20px_rgba(52,211,153,0.05)] relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                          <div 
                            className="flex items-center justify-between cursor-pointer relative z-10"
                            onClick={() => setExpandedAudit(isExpanded ? null : msg.id)}
                          >
                            <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" />
                              Auditoria Salva
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-foreground">{msg.content.split(': ')[1]}</span>
                              <ChevronDown className={`w-3 h-3 text-muted-foreground/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                          
                          {/* @ts-ignore */}
                          <AnimatePresence>
                            {/* @ts-ignore */}
                            {isExpanded && lead.etapa_scores && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                className="space-y-1.5 pt-3 border-t border-border relative z-10 overflow-hidden"
                              >
                                {/* @ts-ignore */}
                                {['e1', 'e2', 'e3', 'e4'].map((etapa) => {
                                  // @ts-ignore
                                  const c = lead.audit_checklist as Record<string, boolean> | null;
                                  if (!c) return null;
                                  let score = 0;
                                  if (etapa === 'e1') score = ((c['1a'] ? 1 : 0) + (c['1b'] ? 1 : 0)) / 2 * 100;
                                  if (etapa === 'e2') score = ((c['2a'] ? 1 : 0) + (c['2b'] ? 1 : 0) + (c['2c'] ? 1 : 0)) / 3 * 100;
                                  if (etapa === 'e3') score = ((c['3a'] ? 1 : 0) + (c['3b'] ? 1 : 0) + (c['3c'] ? 1 : 0)) / 3 * 100;
                                  if (etapa === 'e4') score = ((c['4a'] ? 1 : 0) + (c['4b'] ? 1 : 0)) / 2 * 100;
                                  const numScore = Math.round(score);
                                  const isGood = numScore >= 75;
                                  const isWarn = numScore >= 50 && numScore < 75;
                                  const colorClass = isGood ? 'text-emerald-400' : isWarn ? 'text-amber-400' : 'text-rose-400';
                                  const labels = {
                                    e1: 'E1. Cordialidade',
                                    e2: 'E2. Orçamento+Vídeo',
                                    e3: 'E3. Upsell Mecânico',
                                    e4: 'E4. Encerramento'
                                  };
                                  return (
                                    <div key={etapa} className="flex items-center justify-between text-[10px]">
                                      {/* @ts-ignore */}
                                      <span className="text-muted-foreground font-medium">{labels[etapa as keyof typeof labels]}</span>
                                      <span className={`font-bold ${colorClass}`}>{numScore}%</span>
                                    </div>
                                  );
                                })}
                                {/* @ts-ignore */}
                                {lead.audit_checklist && (
                                  <div className="mt-2 pt-2 border-t border-border space-y-1">
                                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-bold mb-1">Checklist</p>
                                    {/* @ts-ignore */}
                                    {Object.entries(lead.audit_checklist).map(([key, val]) => (
                                      <div key={key} className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                                        <div className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-emerald-500' : 'bg-black/10 dark:bg-white/10'}`} />
                                        <span>Item {key}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/[0.04] border border-border text-[10px] font-semibold text-emerald-500 dark:text-emerald-400/80 backdrop-blur-sm shadow-sm flex items-center justify-center">
                          {msg.content}
                        </div>
                      )}
                    </motion.div>
                  </div>
                );
              }

              // Helper para saber se esta mensagem deve ser destacada
              const isHighlighted = highlightMessageId === msg.id || highlightMessageId === msg.chatwoot_message_id;
              
              // Remove the internal media tag for visual rendering
              const cleanContent = msg.content ? msg.content.replace(/\[ANEXO ENVIADO:[^\]]+\]/gi, '').trim() : '';

              return (
                <div key={msg.id} className="w-full">
                  {dividerEl}
                    <motion.div
                      ref={(el) => {
                        messageRefs.current[msg.id] = el;
                        if (msg.chatwoot_message_id) {
                          messageRefs.current[msg.chatwoot_message_id] = el;
                        }
                      }}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: idx * 0.05 }}
                      className={`flex items-end gap-2 group w-full ${isUser ? 'justify-end' : 'justify-start'} ${isHighlighted ? 'relative z-20' : ''}`}
                    >
                    {/* Highlight Glow Effect */}
                    {isHighlighted && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 1, 0.5, 0], scale: [0.9, 1.05, 1.1, 1.2] }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className={`absolute inset-0 -m-4 rounded-3xl z-[-1] pointer-events-none blur-xl bg-indigo-500/30`} 
                      />
                    )}
                    {/* Avatar for Contact/Bot */}
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mb-1
                        bg-black/5 dark:bg-white/[0.03] border border-border backdrop-blur-sm overflow-hidden">
                        {isBot ? <Wrench className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> : <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400">{lead.customer_name.charAt(0)}</span>}
                      </div>
                    )}

                    {/* Bubble Container */}
                    <div className={`relative max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      {/* Media Rendering */}
                      {msg.media_url && msg.media_type?.startsWith('image') && (
                        <div className="mb-2 w-full">
                           <ExpandableMedia src={msg.media_url} type="image" />
                        </div>
                      )}
                      
                      {msg.media_url && msg.media_type?.startsWith('audio') && (
                        <div className="mb-2 w-full">
                           <CustomAudioPlayer src={msg.media_url} />
                        </div>
                      )}

                      {msg.media_url && msg.media_type?.startsWith('video') && (
                        <div className="mb-2 w-full">
                           <ExpandableMedia src={msg.media_url} type="video" />
                        </div>
                      )}

                      {/* Other Document Types */}
                      {msg.media_url && !msg.media_type?.match(/^(image|audio|video)/) && (
                        <a href={msg.media_url} target="_blank" rel="noreferrer" className="mb-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors shadow-sm">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-black text-primary">FILE</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground underline truncate max-w-[150px]">Baixar Anexo</span>
                        </a>
                      )}

                      {/* Bubble (only render if there's text after cleaning, OR no media at all) */}
                      {(cleanContent || !msg.media_url) ? (
                        <motion.div 
                          animate={isHighlighted ? {
                            boxShadow: ['0 0 0 0 rgba(99,102,241,0)', '0 0 24px 4px rgba(99,102,241,0.4)', '0 0 0 0 rgba(99,102,241,0)']
                          } : {}}
                          transition={{ duration: 1.5, repeat: 1 }}
                          className={`px-4 py-3 text-[13px] leading-relaxed shadow-lg backdrop-blur-md relative
                          ${isUser 
                            ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-2xl rounded-br-sm shadow-[0_8px_30px_rgba(99,102,241,0.2)]' 
                            : 'bg-black/5 dark:bg-white/[0.04] border border-border text-foreground/80 rounded-2xl rounded-bl-sm'
                          }
                          ${isHighlighted ? 'ring-2 ring-indigo-400/60 shadow-[0_0_24px_rgba(99,102,241,0.25)]' : ''}
                          transition-all duration-500
                        `}>
                          <div className="pb-3 pr-2">
                            {cleanContent || (msg.media_url ? '' : 'Mensagem vazia')}
                          </div>
                          <div className={`absolute bottom-1.5 right-3 text-[9px] font-bold ${isUser ? 'text-indigo-200' : 'text-muted-foreground/50'}`}>
                            {timeStr}
                          </div>
                        </motion.div>
                      ) : (
                        // If only media, just render a small timestamp below the media
                        <div className={`text-[9px] font-bold mt-0.5 mb-1 ${isUser ? 'text-indigo-400/60 text-right' : 'text-muted-foreground/50 text-left'}`}>
                          {timeStr}
                        </div>
                      )}
                    
                    {/* Renderiza AI Insight (Auditoria Inline - Minimalista) */}
                    {msg.ai_insight && (
                      <div className={`mt-1.5 px-3 py-2 rounded-xl max-w-[85%] bg-black/5 dark:bg-white/5 border border-border/50 flex flex-col gap-1 ${isUser ? 'self-end items-end text-right' : 'self-start items-start text-left'}`}>
                        <div className="flex items-center gap-1.5 opacity-60">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-[9px] uppercase tracking-widest font-bold">Nota de Auditoria</span>
                        </div>
                        <span className="text-[11px] leading-relaxed font-medium text-muted-foreground/80">
                          {msg.ai_insight}
                        </span>
                      </div>
                    )}
                    
                    </div>
                    
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-border bg-black/5 dark:bg-white/[0.01] backdrop-blur-md shrink-0 z-10 flex justify-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          Histórico em Tempo Real
        </p>
      </div>

    </div>
  );
};

export default ChatHistoryView;
