import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Clock, MessageSquare, Wrench, CheckCircle2, ChevronDown } from 'lucide-react';
import { Lead } from '@/context/AppDataContext';

export interface ChatMessage {
  id: string;
  content: string;
  sender_type: 'contact' | 'user' | 'bot' | 'system';
  created_at: string;
  media_url?: string;
  media_type?: string;
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
}

const ChatHistoryView: React.FC<Props> = ({ lead, messages, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [expandedAudit, setExpandedAudit] = React.useState<string | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, expandedAudit]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a10] relative overflow-hidden">
      
      {/* Background glow effects for "Liquid Glass" feeling */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.04] bg-white/[0.01] backdrop-blur-xl shrink-0 z-10 flex items-center gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-black text-indigo-400">{lead.customer_name.charAt(0)}</span>
        </div>
        <div>
          <h3 className="text-sm font-black text-white/90">{lead.customer_name}</h3>
          <p className="text-xs font-medium text-white/40 mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            Canal Online
          </p>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 z-10 custom-scrollbar scroll-smooth">
        
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Sincronizando Chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-4">
            <MessageSquare className="w-8 h-8 text-white/10 mb-2" />
            <p className="text-sm font-bold text-white/40">Nenhuma mensagem encontrada</p>
            <p className="text-xs text-white/20">As interações desta conversa aparecerão aqui.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isSystem = msg.sender_type === 'system';
              const isUser = msg.sender_type === 'user';
              const isBot = msg.sender_type === 'bot';
              const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              let showDivider = false;
              let dividerText = '';
              if (i === 0) {
                showDivider = true;
                dividerText = formatDividerDate(msg.created_at);
              } else {
                const prevDate = formatDividerDate(messages[i - 1].created_at);
                const currDate = formatDividerDate(msg.created_at);
                if (prevDate !== currDate) {
                  showDivider = true;
                  dividerText = currDate;
                }
              }

              const dividerEl = showDivider ? (
                <motion.div
                  key={`div-${msg.id}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center w-full my-6"
                >
                  <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold text-white/40 uppercase tracking-widest backdrop-blur-sm shadow-sm">
                    {dividerText}
                  </div>
                </motion.div>
              ) : null;

              if (isSystem) {
                const isAudit = msg.content.startsWith('Auditado e pontuado:');
                const isExpanded = expandedAudit === msg.id;

                return (
                  <React.Fragment key={msg.id}>
                    {dividerEl}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: i * 0.05 }}
                      className="flex justify-center w-full my-4"
                    >
                      {isAudit ? (
                        <div className="bg-[#12121a] border border-emerald-500/20 rounded-xl p-3 max-w-[300px] w-full shadow-[0_4px_20px_rgba(52,211,153,0.05)] relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                          <div 
                            className="flex items-center justify-between cursor-pointer relative z-10"
                            onClick={() => setExpandedAudit(isExpanded ? null : msg.id)}
                          >
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" />
                              Auditoria Salva
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">{msg.content.split(': ')[1]}</span>
                              <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                                className="space-y-1.5 pt-3 border-t border-white/[0.05] relative z-10 overflow-hidden"
                              >
                                {/* @ts-ignore */}
                                {['e1', 'e2', 'e3', 'e4'].map((etapa) => {
                                  // @ts-ignore
                                  const score = lead.etapa_scores[etapa];
                                  if (score === undefined) return null;
                                  const numScore = Number(score);
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
                                      <span className="text-white/50 font-medium">{labels[etapa]}</span>
                                      <span className={`font-bold ${colorClass}`}>{score}%</span>
                                    </div>
                                  );
                                })}
                                {/* @ts-ignore */}
                                {lead.audit_checklist && (
                                  <div className="mt-2 pt-2 border-t border-white/[0.05] space-y-1">
                                    <p className="text-[9px] uppercase tracking-wider text-white/30 font-bold mb-1">Checklist</p>
                                    {/* @ts-ignore */}
                                    {Object.entries(lead.audit_checklist).map(([key, val]) => (
                                      <div key={key} className="flex items-center gap-1.5 text-[9px] text-white/40">
                                        <div className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-emerald-500' : 'bg-white/10'}`} />
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
                        <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-semibold text-emerald-400/80 backdrop-blur-sm shadow-sm flex items-center justify-center">
                          {msg.content}
                        </div>
                      )}
                    </motion.div>
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={msg.id}>
                  {dividerEl}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: i * 0.05 }}
                    className={`flex items-end gap-2 group w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Avatar for Contact/Bot */}
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mb-1
                        bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm overflow-hidden">
                        {isBot ? <Wrench className="w-3 h-3 text-indigo-400" /> : <span className="text-[10px] font-black text-emerald-400">{lead.customer_name.charAt(0)}</span>}
                      </div>
                    )}

                    {/* Bubble Container */}
                    <div className={`relative max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      {/* Media Rendering */}
                      {msg.media_url && msg.media_type === 'image' && (
                        <div className="mb-2 max-w-full overflow-hidden rounded-xl border border-white/10 shadow-md">
                          <img src={msg.media_url} alt="Anexo" className="object-cover max-h-60" />
                        </div>
                      )}
                      
                      {msg.media_url && msg.media_type === 'audio' && (
                        <div className="mb-2 max-w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2">
                          <audio controls className="h-10 w-48">
                            <source src={msg.media_url} type="audio/mp3" />
                            <source src={msg.media_url} type="audio/ogg" />
                            Seu navegador não suporta áudio.
                          </audio>
                        </div>
                      )}

                      {msg.media_url && msg.media_type === 'video' && (
                        <div className="mb-2 max-w-full overflow-hidden rounded-xl border border-white/10 shadow-md">
                          <video controls className="max-h-60">
                            <source src={msg.media_url} />
                          </video>
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`px-4 py-3 text-[13px] leading-relaxed shadow-lg backdrop-blur-md relative
                        ${isUser 
                          ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-2xl rounded-br-sm shadow-[0_8px_30px_rgba(99,102,241,0.2)]' 
                          : 'bg-white/[0.04] border border-white/[0.08] text-white/80 rounded-2xl rounded-bl-sm'
                      }`}>
                        <div className="pb-3 pr-2">
                          {msg.content || (msg.media_url ? 'Mídia anexada' : '')}
                        </div>
                        <div className={`absolute bottom-1.5 right-3 text-[9px] font-bold ${isUser ? 'text-indigo-200' : 'text-white/30'}`}>
                          {timeStr}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/[0.04] bg-white/[0.01] backdrop-blur-md shrink-0 z-10 flex justify-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          Histórico em Tempo Real
        </p>
      </div>

    </div>
  );
};

export default ChatHistoryView;
