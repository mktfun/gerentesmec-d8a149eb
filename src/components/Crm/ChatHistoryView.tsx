import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Clock, MessageSquare } from 'lucide-react';
import { Lead } from '@/context/AppDataContext';

export interface ChatMessage {
  id: string;
  content: string;
  sender_type: 'contact' | 'user' | 'bot';
  created_at: string;
}

interface Props {
  lead: Lead;
  messages: ChatMessage[];
  isLoading?: boolean;
}

const ChatHistoryView: React.FC<Props> = ({ lead, messages, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
            Online no Chatwoot
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
              const isUser = msg.sender_type === 'user';
              const isBot = msg.sender_type === 'bot';
              const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: i * 0.05 }}
                  className={`flex items-end gap-2 group w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for Contact/Bot */}
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mb-1
                      bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
                      {isBot ? <Bot className="w-3 h-3 text-indigo-400" /> : <User className="w-3 h-3 text-white/40" />}
                    </div>
                  )}

                  {/* Bubble Container */}
                  <div className={`relative max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    
                    {/* Timestamp (revealed on hover) */}
                    <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-bold text-white/20 flex items-center gap-1
                      ${isUser ? 'right-[100%] mr-3' : 'left-[100%] ml-3'}`}>
                      {timeStr}
                    </div>

                    {/* Bubble */}
                    <div className={`px-4 py-3 text-[13px] leading-relaxed shadow-lg backdrop-blur-md
                      ${isUser 
                        ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-2xl rounded-br-sm shadow-[0_8px_30px_rgba(99,102,241,0.2)]' 
                        : 'bg-white/[0.04] border border-white/[0.08] text-white/80 rounded-2xl rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
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
