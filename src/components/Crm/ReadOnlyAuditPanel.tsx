import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Circle, Target, XCircle } from 'lucide-react';
import { Lead } from '@/context/AppDataContext';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import ChatHistoryView from './ChatHistoryView';
import { supabase } from '@/integrations/supabase/client';
import { auditStepsConfig } from '@/utils/scoreUtils';

interface Props { lead: Lead; onClose: () => void; }

const ReadOnlyAuditPanel: React.FC<Props> = ({ lead, onClose }) => {
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checklist = (lead as any).audit_checklist;
    if (checklist && Object.keys(checklist).length > 0) {
      setChecked(checklist as Record<string, boolean>);
    } else if (lead.score !== null) {
      setChecked({ '1a': true, '1b': true, '2a': true, '2b': true, '2c': true, '3a': true, '3b': true, '4a': true, '4b': true });
    } else {
      setChecked({});
    }
  }, [lead.id, (lead as any).audit_checklist, lead.score]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoadingChat(true);
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
      setLoadingChat(false);
    };
    fetchMessages();

    const channel = supabase.channel(`chat_messages_${lead.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `lead_id=eq.${lead.id}` }, payload => {
        setMessages(prev => [...prev, payload.new as any]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `lead_id=eq.${lead.id}` }, payload => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as any : m));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [lead.id]);

  let score = 0;
  auditStepsConfig.forEach(step => {
    const done = step.items.filter(i => checked[i.id]).length;
    score += (done / step.items.length) * step.weight;
  });
  const rounded = Math.round(score);
  const scoreColor = rounded >= 75 ? '#34d399' : rounded >= 50 ? '#818cf8' : '#f87171';

  return (
    <div className="flex w-full h-full text-foreground bg-background">
      {/* Left Column: Chat */}
      <div className="flex-[3] min-w-0 border-r border-border bg-black/5 dark:bg-white/[0.01] flex flex-col relative h-[100dvh]">
        <ChatHistoryView 
          lead={lead} 
          messages={messages} 
          isLoading={loadingChat} 
          highlightMessageId={highlightMessageId} 
        />
      </div>

      {/* Right Column: Read-Only Audit Summary */}
      <div className="flex-[2] min-w-[320px] max-w-[450px] flex flex-col bg-background/50 backdrop-blur-xl h-[100dvh] relative overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-black/5 dark:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 border border-border shrink-0">
              <span className="text-sm font-black text-foreground">{lead.name.substring(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground truncate max-w-[200px]">{lead.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{lead.phone}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 custom-scrollbar">
          
          {/* Big Score Section */}
          <div className="flex flex-col items-center justify-center py-6 bg-black/[0.02] dark:bg-white/[0.02] border border-border rounded-3xl">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Qualidade do Atendimento
            </div>
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-black/5 dark:text-white/5" />
                <motion.circle
                  cx="64" cy="64" r="58" stroke={scoreColor} strokeWidth="8" fill="transparent"
                  strokeDasharray={2 * Math.PI * 58}
                  initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 58) * (1 - rounded / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="drop-shadow-md"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-black tracking-tighter" style={{ color: scoreColor }}>{rounded}</span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground mt-1">Pontos</span>
              </div>
            </div>
          </div>

          {/* Checklist Visual */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Checklist de Auditoria (Visualização)
            </p>
            <Accordion type="multiple" defaultValue={['step1', 'step2', 'step3', 'step4']} className="space-y-3">
              {auditStepsConfig.map(step => {
                const doneCount = step.items.filter(i => checked[i.id]).length;
                const isFull = doneCount === step.items.length;

                return (
                  <AccordionItem key={step.id} value={step.id} className="border border-border rounded-xl bg-card overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 text-left">
                        {isFull 
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          : doneCount > 0 
                            ? <Circle className="w-4 h-4 text-indigo-400 shrink-0" />
                            : <Circle className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                        }
                        <span className="text-xs font-bold text-foreground/80">{step.title}</span>
                        <span className="text-[10px] font-bold text-muted-foreground bg-black/5 dark:bg-white/[0.06] px-1.5 py-0.5 rounded-full ml-1">
                          {doneCount}/{step.items.length}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-4 px-4 bg-black/[0.01] dark:bg-white/[0.01]">
                      <div className="space-y-3">
                        {step.items.map(item => {
                          const isChecked = checked[item.id];
                          const hasEvidence = lead.audit_checklist_messages?.[item.id];
                          return (
                            <div key={item.id} className="flex items-start gap-3">
                              <div className="mt-0.5 shrink-0">
                                {isChecked ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-500/50" />
                                )}
                              </div>
                              <div className={`text-xs leading-relaxed flex-1 ${isChecked ? 'text-foreground font-medium' : 'text-muted-foreground/70'}`}>
                                {item.text}
                              </div>
                              {isChecked && hasEvidence && (
                                <button
                                  title="Ver evidência no chat"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHighlightMessageId(hasEvidence);
                                    setTimeout(() => setHighlightMessageId(null), 3000);
                                  }}
                                  className="p-1.5 shrink-0 rounded-full bg-emerald-500/10 text-emerald-500/80 hover:text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                                >
                                  <Target className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          {/* Dossiê IA */}
          {lead.closing_summary && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Dossiê da Inteligência Artificial
              </p>
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs leading-relaxed text-indigo-700 dark:text-indigo-200">
                {lead.closing_summary}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ReadOnlyAuditPanel;
