import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2, Clock, ChevronDown } from 'lucide-react';
import { Lead } from '@/context/AppDataContext';
import { supabase } from '@/integrations/supabase/client';
import { getMissingQualityItems, qualityFeedbackMap, auditStepsConfig } from '@/utils/scoreUtils';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  lead: Lead;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  created_at: string;
  message_type?: string;
}

interface TimelineItem {
  type: 'message' | 'alert';
  timestamp: string;
  data: ChatMessage | { id: string; label: string; detail: string; alertType: 'response_delay' | 'quality_fail' | 'quality_pass' };
}

const DELAY_THRESHOLD_MINUTES = 30;

const ManagerAuditInspector: React.FC<Props> = ({ lead, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const score = lead.score ?? null;
  const scoreColor = score === null ? '#94a3b8' : score >= 75 ? '#34d399' : score >= 50 ? '#818cf8' : '#f87171';
  const customerName = lead.name || lead.customer_name || 'Cliente';
  const checklist = (lead.audit_checklist as Record<string, boolean>) ?? {};

  // Build passing and failing quality items
  const passingItems = auditStepsConfig.flatMap(s =>
    s.items.filter(i => checklist[i.id]).map(i => ({ ...i, stepTitle: s.title }))
  );
  const missingItems = getMissingQualityItems(checklist);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: true });
      setMessages((data as ChatMessage[]) ?? []);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    fetch();
  }, [lead.id]);

  // Build timeline: messages + injected response-delay alerts
  const timeline: TimelineItem[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    timeline.push({ type: 'message', timestamp: msg.created_at, data: msg });

    // Inject delay alert if next message from a different sender is too late
    if (i < messages.length - 1) {
      const next = messages[i + 1];
      if (msg.sender !== next.sender) {
        const delay = differenceInMinutes(new Date(next.created_at), new Date(msg.created_at));
        if (delay >= DELAY_THRESHOLD_MINUTES) {
          timeline.push({
            type: 'alert',
            timestamp: msg.created_at,
            data: {
              id: `delay-${i}`,
              label: `Demora de ${delay} min para responder`,
              detail: `O cliente aguardou ${delay} minutos pela próxima resposta. O padrão recomendado é até ${DELAY_THRESHOLD_MINUTES} minutos.`,
              alertType: 'response_delay',
            },
          });
        }
      }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex flex-col bg-background"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/90 backdrop-blur-xl">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-sm shrink-0">
            {customerName.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{customerName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{lead.phone || lead.customer_phone || ''}</p>
          </div>
          {score !== null && (
            <div
              className="shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-2xl border"
              style={{ borderColor: scoreColor + '40', backgroundColor: scoreColor + '15' }}
            >
              <span className="text-base font-black leading-none" style={{ color: scoreColor }}>{score}</span>
              <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: scoreColor + 'aa' }}>Score</span>
            </div>
          )}
        </div>

        {/* Chat timeline */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && timeline.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <Clock className="w-8 h-8 opacity-40" />
              <p className="text-sm">Nenhuma mensagem encontrada nesta conversa.</p>
            </div>
          )}

          {!loading && timeline.map((item, idx) => {
            if (item.type === 'alert') {
              const alert = item.data as { id: string; label: string; detail: string; alertType: string };
              return (
                <div key={alert.id} className="flex justify-center my-3">
                  <div className="flex items-start gap-2 max-w-[85%] bg-rose-500/10 border border-rose-500/20 rounded-2xl px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-rose-400">{alert.label}</p>
                      <p className="text-[10px] text-rose-300/70 mt-0.5">{alert.detail}</p>
                    </div>
                  </div>
                </div>
              );
            }

            const msg = item.data as ChatMessage;
            const isClient = msg.sender === 'client' || msg.sender === 'contact' || msg.sender === 'customer';
            const isSystem = msg.sender === 'system' || msg.sender === 'bot';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="text-[10px] text-muted-foreground bg-muted/60 rounded-full px-3 py-1">{msg.content}</span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  isClient
                    ? 'bg-muted text-foreground rounded-tl-sm'
                    : 'bg-primary text-white rounded-tr-sm'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[9px] mt-1 text-right ${isClient ? 'text-muted-foreground' : 'text-white/60'}`}>
                    {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* Quality Summary Panel */}
        {score !== null && (missingItems.length > 0 || passingItems.length > 0) && (
          <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-xl">
            <button
              onClick={() => setShowSummary(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: scoreColor }}
                />
                Análise de Qualidade · Score {score}
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showSummary ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showSummary && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2 max-h-60 overflow-y-auto">
                    {missingItems.map(item => (
                      <div key={item.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/8 border border-rose-500/15">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-rose-400">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                    {passingItems.map(item => (
                      <div key={item.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-emerald-400">
                            {qualityFeedbackMap[item.id]?.label ?? item.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ManagerAuditInspector;
