import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Clock, List, ChevronRight, Sparkles } from 'lucide-react';
import { Lead } from '@/context/AppDataContext';
import { supabase } from '@/integrations/supabase/client';
import { qualityFeedbackMap, auditStepsConfig } from '@/utils/scoreUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '@/context/ThemeContext';
import { CustomAudioPlayer } from '../Crm/CustomAudioPlayer';
import { ExpandableMedia } from '../Crm/ExpandableMedia';
import { AIXrayModal } from './AIXrayModal';
import { AuditFeedbackModal } from './AuditFeedbackModal';

interface Props { lead: Lead; onClose: () => void; }

interface ChatMessage {
  id: string; 
  content: string; 
  sender: string; 
  created_at: string;
  media_url?: string;
  media_type?: string;
}

// ─── Component ────────────────────────────────────────────────────────────
const ManagerAuditInspector: React.FC<Props> = ({ lead, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIndex, setShowIndex] = useState(false);
  const [showXray, setShowXray] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  
  const { isDark } = useTheme();

  const score = lead.score as number | null;
  const customerName = (lead as any).name || lead.customer_name || 'Cliente';
  const checklist = (lead.audit_checklist as Record<string, boolean>) ?? {};
  const checklistMessages = (lead.audit_checklist_messages as Record<string, string>) ?? {};

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
      setMessages((data as unknown as ChatMessage[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [lead.id]);

  // Helper to identify client messages
  const isClientMsg = (msg: ChatMessage) => msg.sender === 'client' || msg.sender === 'contact' || msg.sender === 'customer';
  const isSystemMsg = (msg: ChatMessage) => msg.sender === 'system' || msg.sender === 'bot';

  // Group quality hits by message ID
  const hitsByMessageId: Record<string, { id: string, label: string, detail: string, pass: boolean }[]> = {};
  auditStepsConfig.forEach(step => {
    step.items.forEach(item => {
      const pass = !!checklist[item.id];
      let msgId = checklistMessages[item.id];

      // Heuristic fallback if backend didn't provide message ID
      if (pass && !msgId && messages.length > 0) {
        if (item.id === 'audio') msgId = messages.find(m => !isClientMsg(m) && !isSystemMsg(m) && m.media_type?.startsWith('audio/'))?.id;
        else if (item.id === 'video') msgId = messages.find(m => !isClientMsg(m) && !isSystemMsg(m) && m.media_type?.startsWith('video/'))?.id;
        else if (item.id === 'image') msgId = messages.find(m => !isClientMsg(m) && !isSystemMsg(m) && m.media_type?.startsWith('image/'))?.id;
        else if (item.id === 'budget' || item.id === 'price') msgId = messages.find(m => !isClientMsg(m) && !isSystemMsg(m) && (m.content.includes('R$') || m.content.toLowerCase().includes('orçamento')))?.id;
        
        // Final fallback: just attach to the last attendant message
        if (!msgId) msgId = [...messages].reverse().find(m => !isClientMsg(m) && !isSystemMsg(m))?.id;
      }

      if (pass && msgId) {
        if (!hitsByMessageId[msgId]) hitsByMessageId[msgId] = [];
        hitsByMessageId[msgId].push({
          id: item.id,
          label: qualityFeedbackMap[item.id]?.label ?? item.text,
          detail: qualityFeedbackMap[item.id]?.detail ?? '',
          pass,
        });
      }
    });
  });

  // Lock body scroll while inspector is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const scrollToEvent = useCallback((eventId: string) => {
    setShowIndex(false);
    setTimeout(() => {
      const el = document.getElementById(eventId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Pulse effect
        el.classList.add('animate-pulse', 'ring-2', 'ring-indigo-500', 'shadow-[0_0_15px_rgba(99,102,241,0.5)]');
        setTimeout(() => {
          el.classList.remove('animate-pulse', 'ring-2', 'ring-indigo-500', 'shadow-[0_0_15px_rgba(99,102,241,0.5)]');
        }, 3000);
      }
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
          <p className={`text-xs mt-0.5 truncate ${isDark ? 'opacity-60' : 'opacity-60'}`}>{(lead as any).phone || lead.customer_phone || ''}</p>
        </div>

        {/* Score badge */}
        {score !== null && (
          <div className={`shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl border ${scoreBg} ${scoreBorder}`}>
            <span className={`text-xl font-black leading-none ${scoreText}`}>{score}</span>
            <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${scoreText} opacity-80`}>Score</span>
          </div>
        )}

        {/* AI X-Ray Button -> Detalhes da Auditoria */}
        <button
          onClick={() => setShowXray(true)}
          className={`relative px-3 h-10 flex items-center justify-center gap-2 rounded-xl transition-all border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}
          aria-label="Detalhes da Auditoria"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Detalhes da Auditoria</span>
        </button>

        {/* Audit Feedback Button */}
        <button
          onClick={() => setShowFeedback(true)}
          className={`relative px-3 h-10 flex items-center justify-center gap-2 rounded-xl transition-all border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}
          aria-label="Corrigir"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Corrigir</span>
        </button>

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
      <div className="flex-1 relative overflow-hidden flex flex-col">

        {/* Funnel Stage Reason Banner */}
        {lead.funnel_stage_reason && (lead.funnel_stage === 'closed_won' || lead.funnel_stage === 'closed_lost') && (
          <div className={`shrink-0 w-full px-5 py-3 border-b flex flex-col gap-1 z-10 shadow-sm
            ${lead.funnel_stage === 'closed_won' 
              ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100')
              : (isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100')}`}>
            <div className="flex items-center gap-2">
              <Sparkles className={`w-3.5 h-3.5 ${lead.funnel_stage === 'closed_won' ? 'text-emerald-500' : 'text-rose-500'}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${lead.funnel_stage === 'closed_won' ? 'text-emerald-600' : 'text-rose-600'}`}>
                Feedback do Sistema ({lead.funnel_stage === 'closed_won' ? 'Ganho' : 'Perdido'})
              </span>
            </div>
            <p className={`text-xs font-semibold leading-relaxed pl-5 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              {lead.funnel_stage_reason}
            </p>
          </div>
        )}

        {/* Chat timeline */}
        <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
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

          {!loading && messages.map((msg) => {
            const isClient = isClientMsg(msg);
            const isSystem = isSystemMsg(msg);
            
            let displayContent = msg.content || '';
            const isAudio = msg.media_type?.startsWith('audio/');
            const isImage = msg.media_type?.startsWith('image/');
            const isVideo = msg.media_type?.startsWith('video/');

            // Clean up the "[ANEXO ENVIADO: audio]" raw string if present
            displayContent = displayContent.replace(/\[ANEXO ENVIADO:[^\]]+\]/gi, '').trim();

            if (isSystem) {
              return (
                <motion.div layout key={msg.id} className="flex justify-center my-4">
                  <span className={`text-xs font-semibold px-4 py-2 rounded-full ${isDark ? 'bg-white/10 text-white/60' : 'bg-black/5 text-black/60'}`}>
                    {msg.content}
                  </span>
                </motion.div>
              );
            }

            const msgHits = hitsByMessageId[msg.id];

            return (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0.2 }}
                className={`flex flex-col w-full my-3 ${isClient ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] px-5 py-3.5 text-base leading-relaxed shadow-sm ${
                    isClient 
                      ? (isDark ? 'bg-[#1a1a1a] rounded-[1.5rem_1.5rem_1.5rem_0.25rem] border border-white/5' : 'bg-white rounded-[1.5rem_1.5rem_1.5rem_0.25rem] border border-black/5')
                      : ('bg-indigo-600 text-white rounded-[1.5rem_1.5rem_0.25rem_1.5rem]')
                  }`}
                >
                  {displayContent && <p className="whitespace-pre-wrap break-words font-medium">{displayContent}</p>}
                  
                  {isAudio && msg.media_url && (
                    <div className={`mt-2 ${displayContent ? 'pt-2' : ''}`}>
                      <CustomAudioPlayer src={msg.media_url} />
                    </div>
                  )}
                  {isImage && msg.media_url && (
                    <div className={`mt-2 ${displayContent ? 'pt-2' : ''}`}>
                      <ExpandableMedia src={msg.media_url} type="image" />
                    </div>
                  )}
                  {isVideo && msg.media_url && (
                    <div className={`mt-2 ${displayContent ? 'pt-2' : ''}`}>
                      <ExpandableMedia src={msg.media_url} type="video" />
                    </div>
                  )}

                  <p className={`text-[10px] mt-2 font-bold tracking-wider ${isClient ? 'text-right' : 'text-right'} ${isClient ? (isDark ? 'opacity-40' : 'opacity-40') : 'text-indigo-200'}`}>
                    {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
                
                {/* AI Notes (Sub-bubbles) */}
                {msgHits && msgHits.length > 0 && (
                  <div className={`flex flex-col gap-1.5 mt-2 max-w-[85%] ${isClient ? 'items-start pl-3' : 'items-end pr-3'}`}>
                    {msgHits.map(hit => (
                      <motion.div 
                        id={`quality-${hit.id}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: -10 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        transition={{ type: 'spring', bounce: 0.3 }}
                        key={hit.id} 
                        className={`flex items-start gap-3 p-3 rounded-2xl shadow-sm border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}
                      >
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <div>
                          <p className={`text-xs font-black leading-tight ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{hit.label}</p>
                          <p className={`text-[10px] leading-tight mt-1 font-semibold opacity-80 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{hit.detail}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
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

                {/* Acertos e Erros Cards */}
                {score !== null && (
                  <div className={`px-6 py-5 border-b shrink-0 grid grid-cols-2 gap-4 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    <div className={`p-4 rounded-3xl border flex flex-col items-center justify-center gap-1 shadow-sm ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                      <span className={`text-4xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{passingCount}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest text-center ${isDark ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>Acertos</span>
                    </div>
                    <div className={`p-4 rounded-3xl border flex flex-col items-center justify-center gap-1 shadow-sm ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
                      <span className={`text-4xl font-black ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{allQualityItems.length - passingCount}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest text-center ${isDark ? 'text-rose-500/60' : 'text-rose-600/60'}`}>Erros</span>
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
                          <div key={item.id} className="w-full flex flex-col items-start px-6 py-3.5 transition-colors border-b border-transparent">
                            <button
                              onClick={() => {
                                if (pass && checklistMessages[item.id]) {
                                  scrollToEvent(`quality-${item.id}`);
                                }
                              }}
                              className={`w-full flex items-center gap-4 text-left ${pass && checklistMessages[item.id] ? (isDark ? 'hover:bg-white/5 cursor-pointer' : 'hover:bg-black/5 cursor-pointer') : 'cursor-default'}`}
                            >
                              {pass
                                ? <CheckCircle2 className={`w-5 h-5 shrink-0 ${iconColor}`} />
                                : <AlertTriangle className={`w-5 h-5 shrink-0 ${iconColor}`} />
                              }
                              <span className="flex-1 text-sm font-bold leading-tight">
                                {qualityFeedbackMap[item.id]?.label ?? item.text}
                              </span>
                              {pass && checklistMessages[item.id] && (
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border flex items-center gap-1 ${isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                                  🔍 Ver Evidência
                                </span>
                              )}
                            </button>
                            
                            {!pass && (lead.audit_reasons as any)?.[item.id] && (
                              <div className="mt-2 pl-9 pr-2">
                                <div className={`relative px-4 py-3 rounded-xl border flex flex-col gap-1.5 ${isDark ? 'bg-rose-950/30 border-rose-900/50' : 'bg-rose-50 border-rose-100'}`}>
                                  <div className="flex items-center gap-1.5 opacity-80">
                                    <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>Análise Contextual</span>
                                  </div>
                                  <p className={`text-xs leading-relaxed font-semibold ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
                                    {(lead.audit_reasons as any)[item.id]}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
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

      {/* AI X-Ray Modal */}
      <AIXrayModal 
        isOpen={showXray} 
        onClose={() => setShowXray(false)} 
        lead={lead} 
      />

      <AuditFeedbackModal 
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        mechanicId={lead.user_id || 'unknown'}
        leadId={lead.id}
        auditReasons={JSON.stringify(lead.audit_reasons || {})}
      />
    </motion.div>
  );
};

export default ManagerAuditInspector;
