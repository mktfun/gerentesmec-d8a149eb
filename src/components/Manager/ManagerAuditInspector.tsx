import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { Lead } from '@/context/AppDataContext';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import ChatHistoryView, { ChatMessage } from '../Crm/ChatHistoryView';

interface Props { lead: Lead; onClose: () => void; }

const ManagerAuditInspector: React.FC<Props> = ({ lead, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const customerName = (lead as any).name || lead.customer_name || 'Cliente';

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

  // Lock body scroll while inspector is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
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
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 border ${isDark ? 'bg-white/5 text-white border-white/10' : 'bg-black/5 text-black border-black/10'}`}>
          {customerName.substring(0, 2).toUpperCase()}
        </div>

        {/* Name + phone */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-black truncate leading-tight">{customerName}</p>
          <p className={`text-xs mt-0.5 truncate ${isDark ? 'opacity-60' : 'opacity-60'}`}>{(lead as any).phone || lead.customer_phone || ''}</p>
        </div>
      </div>

      {/* ── Body: chat ─────────────────────────── */}
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

        <div className="flex-1 min-h-0 relative">
          <ChatHistoryView lead={lead} messages={messages} isLoading={loading} />
        </div>
      </div>
    </motion.div>
  );
};

export default ManagerAuditInspector;
