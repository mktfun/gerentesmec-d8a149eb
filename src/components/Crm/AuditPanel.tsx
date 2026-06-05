import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Circle, UploadCloud, Link as LinkIcon, DollarSign, Loader2, Sparkles, ExternalLink, Target, RefreshCw, AlertCircle } from 'lucide-react';
import { Lead } from '@/context/AppDataContext';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import ChatHistoryView, { ChatMessage } from './ChatHistoryView';
import { supabase } from '@/integrations/supabase/client';

import { useAppData } from '@/context/AppDataContext';
import { auditStepsConfig, calcLeadScore } from '@/utils/scoreUtils';

interface Props { lead: Lead; onClose: () => void; }

const AuditPanel: React.FC<Props> = ({ lead, onClose }) => {
  const { updateLead, saveLeadAudit, integrationSettings, aiSettings } = useAppData();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [ticketValueStr, setTicketValueStr] = useState('');
  const [vehicleStr, setVehicleStr] = useState('');
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);

  useEffect(() => {
    const checklist = (lead as any).audit_checklist;
    if (checklist && Object.keys(checklist).length > 0) {
      setChecked(checklist as Record<string, boolean>);
    } else {
      setChecked({});
    }
    setNotes(lead.closing_summary || '');
    setTicketValueStr(lead.ticket_value ? lead.ticket_value.toString() : '');
    setVehicleStr(lead.customer_vehicle || '');
  }, [lead.id, lead.ticket_value, (lead as any).audit_checklist, lead.closing_summary, lead.score, lead.customer_vehicle]);

  const handleTicketBlur = () => {
    const val = parseFloat(ticketValueStr);
    if (!isNaN(val)) {
      updateLead(lead.id, { ticket_value: val });
    } else {
      updateLead(lead.id, { ticket_value: undefined });
    }
  };

  const handleVehicleBlur = () => {
    if (vehicleStr.trim() !== lead.customer_vehicle) {
      updateLead(lead.id, { customer_vehicle: vehicleStr.trim() || undefined });
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${lead.id}-${Date.now()}.${ext}`;
      
      const { data, error } = await supabase.storage.from('evidences').upload(fileName, file);
      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from('evidences').getPublicUrl(fileName);
      setNotes(prev => prev + (prev ? '\n' : '') + `[EvidêncSistema: ${file.name}](${urlData.publicUrl})\n`);
    } catch (err: any) {
      alert('Erro ao subir imagem: ' + err.message);
    } finally {
      setIsUploading(false);
      // reset input
      e.target.value = '';
    }
  };

  // Score: cutoff inteligente para perdidos, pesos por etapa para ganhos
  const rounded = calcLeadScore(checked, lead.funnel_stage) ?? 0;

  const scoreColor = rounded >= 75 ? '#34d399' : rounded >= 50 ? '#818cf8' : '#f87171';
  const circumference = 2 * Math.PI * 38;

  const [realMessages, setRealMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoadingChat(true);
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: true });
      
      if (data && data.length > 0) {
        setRealMessages(data as unknown as ChatMessage[]);
      } else {
        setRealMessages([]);
      }
      setLoadingChat(false);
    };

    fetchMessages();

    // Subscribe to new messages for this lead
    const channel = supabase.channel(`chat_messages_${lead.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `lead_id=eq.${lead.id}` }, (payload) => {
        setRealMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `lead_id=eq.${lead.id}` }, (payload) => {
        setRealMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new as ChatMessage : msg));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lead.id]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    if (isSyncing || realMessages.length === 0) return;
    setIsSyncing(true);
    try {
      let consolidated = "CONVERSA CONSOLIDADA PARA AVALSistemaÇÃO MANUAL:\n\n";
      realMessages.forEach(msg => {
        const sender = msg.sender_type === 'contact' ? 'Contato' : 'Agente';
        let contentStr = msg.content || '';
        if (msg.medSistema_url || msg.medSistema_type) {
          const type = msg.medSistema_type?.split('/')[0] || 'anexo';
          contentStr += ` [ANEXO ENVSistemaDO: ${type}]`;
        }
        consolidated += `[${sender}]: ${contentStr.trim()}\n`;
      });

      const { data, error } = await supabase.functions.invoke('ai-autonomous-evaluator', {
        body: {
          lead_id: lead.id,
          message_content: consolidated,
          message_id: 'manual_sync_' + new Date().getTime()
        }
      });
      
      if (error) throw error;
      
      if (data && data.status === 'success' && data.evaluated) {
        // OPTIMISTIC UPDATE: atualiza a interface instantaneamente!
        updateLead(lead.id, {
          score: data.evaluated.score,
          closing_summary: data.evaluated.closing_summary,
          audit_checklist: data.evaluated.audit_checklist,
          ticket_value: data.evaluated.ticket_value ?? lead.ticket_value,
          customer_vehicle: data.evaluated.customer_vehicle ?? lead.customer_vehicle,
          funnel_stage: data.evaluated.funnel_stage ?? lead.funnel_stage,
        });
      }
      
      // Optionally notify success
    } catch (error) {
      console.error("Manual sync failed:", error);
      alert("Falha ao sincronizar com a Sistema.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row bg-background border-l border-border overflow-hidden">

      {/* LEFT COLUMN: CHAT HISTORY */}
      <div className="flex-1 border-b lg:border-b-0 lg:border-r border-border overflow-hidden min-w-[320px]">
        <ChatHistoryView lead={lead} messages={realMessages} isLoading={loadingChat} highlightMessageId={highlightMessageId} />
      </div>

      {/* RIGHT COLUMN: AUDIT DOSSIER */}
      <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 flex flex-col h-full bg-card">

        {/* Header — score ring inline com título */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 gap-3">
          {/* Score ring compacto */}
          <div className="relative w-[56px] h-[56px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="9" fill="none" />
              <motion.circle
                cx="50" cy="50" r="38"
                stroke={scoreColor}
                strokeWidth="9"
                fill="none"
                strokeLinecap="round"
                initSistemal={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${(rounded / 100) * circumference} ${circumference}` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 6px ${scoreColor}70)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span key={rounded} initSistemal={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-sm font-black text-foreground leading-none">{rounded}</motion.span>
              <span className="text-[7px] text-muted-foreground font-bold uppercase tracking-wider">pts</span>
            </div>
          </div>

          {/* Nome + telefone */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-foreground truncate flex items-center gap-1.5">
              {lead.customer_name}
              {/* @ts-ignore */}
              {lead.is_cross_unit && (
                <span className="bg-amber-500/10 text-amber-500 text-[8px] px-1 py-0.5 rounded font-bold border border-amber-500/20 uppercase tracking-wider shrink-0">Cross</span>
              )}
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">{lead.customer_phone}</p>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1.5 shrink-0">
            {lead.chatwoot_conversation_id && (() => {
              const baseUrl = integrationSettings?.chatwoot_url || 'https://app.chatwoot.com';
              const secureBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
              return (
                <a
                  href={`${secureBaseUrl}/app/accounts/${integrationSettings?.chatwoot_account_id || 1}/conversations/${lead.chatwoot_conversation_id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/[0.10] flex items-center justify-center transition-colors"
                  title="Abrir no Chatwoot"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              );
            })()}
            
            <button 
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/[0.10] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sincronizar Sistema (AvalSistemar Conversa Inteira)"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose}
              className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/[0.10] flex items-center justify-center transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Ticket + Veículo — 2 colunas compactas numa única linha */}
        <div className="px-4 py-2.5 border-b border-border shrink-0 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Orçamento (R$)</label>
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <input
                type="number"
                value={ticketValueStr}
                onChange={(e) => setTicketValueStr(e.target.value)}
                onBlur={handleTicketBlur}
                placeholder="1500"
                className="w-full bg-transparent border-b border-black/10 dark:border-white/[0.1] focus:border-emerald-500
                  text-sm font-black text-emerald-500 dark:text-emerald-400 placeholder:text-muted-foreground/30
                  focus:outline-none transition-colors py-0.5"
              />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Veículo</label>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 002 15v2c0 .6.4 1 1 1h2m14 0a2 2 0 00-4 0m4 0a2 2 0 01-4 0m-10 0a2 2 0 00-4 0m4 0a2 2 0 01-4 0" />
              </svg>
              <input
                type="text"
                value={vehicleStr}
                onChange={(e) => setVehicleStr(e.target.value)}
                onBlur={handleVehicleBlur}
                placeholder="Ex: Civic 2020"
                className="w-full bg-transparent border-b border-black/10 dark:border-white/[0.1] focus:border-indigo-500
                  text-sm font-semibold text-foreground placeholder:text-muted-foreground/30
                  focus:outline-none transition-colors py-0.5"
              />
            </div>
          </div>
        </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {(lead as any).ai_feedback && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border relative overflow-hidden">
            <div className="relative z-10 w-full">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Parecer da AuditorSistema</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {(lead as any).ai_feedback}
              </p>
            </div>
          </div>
        )}

        {/* Closing Summary */}
        {(lead.funnel_stage === 'closed_won' || lead.funnel_stage === 'closed_lost') && (
          <div className="relative overflow-hidden rounded-xl bg-muted/30 border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Parecer de Fechamento</h4>
            </div>

            {lead.closing_summary ? (
              <p className="text-sm text-muted-foreground leading-relaxed font-medium whitespace-pre-wrap relative z-10">
                {lead.closing_summary}
              </p>
            ) : (
              <div className="flex items-center gap-3 py-2">
                <Loader2 className="w-4 h-4 text-muted-foreground/50 animate-spin" />
                <p className="text-xs text-muted-foreground/50 font-medium">
                  Aguardando parecer...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Checklist */}
        <div className="">
          <Accordion type="multiple" defaultValue={['step1', 'step2']} className="space-y-2">
          {auditStepsConfig.map(step => {
            const doneCount = step.items.filter(i => checked[i.id]).length;
            const isFull = doneCount === step.items.length;

            return (
              <AccordionItem key={step.id} value={step.id}
                className="border border-border rounded-xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.05] dark:hover:bg-white/[0.04]
                  transition-colors px-4">
                <AccordionTrigger className="hover:no-underline py-3.5">
                  <div className="flex items-center gap-3 text-left">
                    {isFull
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                      : <Circle className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                    }
                    <span className="text-xs font-bold text-foreground/80">{step.title}</span>
                    <span className="text-[10px] font-bold text-muted-foreground
                      bg-black/5 dark:bg-white/[0.06] px-1.5 py-0.5 rounded-full ml-1">
                      {doneCount}/{step.items.length}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-4 pl-7">
                  <div className="space-y-2.5">
                    {step.items.map(item => (
                      <div key={item.id} className="flex items-start gap-3 group cursor-pointer"
                        onClick={() => setChecked(p => ({ ...p, [item.id]: !p[item.id] }))}>
                        <Checkbox
                          id={item.id}
                          checked={checked[item.id] || false}
                          onCheckedChange={() => setChecked(p => ({ ...p, [item.id]: !p[item.id] }))}
                          className="mt-0.5 border-border dark:border-white/20 data-[state=checked]:bg-indigo-500
                            data-[state=checked]:border-indigo-500"
                        />
                        <div className="flex-1 flex flex-col">
                          <label htmlFor={item.id}
                            className={`text-xs leading-relaxed cursor-pointer transition-colors ${
                              checked[item.id] ? 'text-foreground font-medium' : 'text-muted-foreground'
                            }`}>
                            {item.text}
                          </label>
                          {(() => {
                            const reason = (lead as any).audit_justifications?.[item.id] || (!checked[item.id] ? lead.audit_reasons?.[item.id] : null);
                            if (!reason) return null;
                            const isNegative = !checked[item.id];
                            return (
                              <div className={`mt-1.5 flex gap-1.5 items-start p-2 rounded-lg backdrop-blur-md border ${
                                isNegative 
                                  ? 'bg-rose-500/5 border-rose-500/10' 
                                  : 'bg-emerald-500/5 border-emerald-500/10'
                              }`}>
                                {isNegative ? (
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-500/70 shrink-0 mt-0.5" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70 shrink-0 mt-0.5" />
                                )}
                                <p className={`text-[10px] leading-snug font-medium italic ${
                                  isNegative ? 'text-rose-500/80' : 'text-emerald-500/80'
                                }`}>
                                  {reason as string}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                        {checked[item.id] && lead.audit_checklist_messages?.[item.id] && (
                          <button
                            title="Ver evidêncSistema no chat"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHighlightMessageId(lead.audit_checklist_messages![item.id]);
                              // Reset highlight after a while to allow clicking again
                              setTimeout(() => setHighlightMessageId(null), 3000);
                            }}
                            className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500/60 hover:text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                          >
                            <Target className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        </div>

        {/* Evidence */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Dossiê & EvidêncSistemas
          </p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anotações, justificativas, links..."
            className="w-full h-20 p-3 text-xs text-foreground placeholder:text-muted-foreground/50
              bg-black/5 dark:bg-white/[0.04] border border-border rounded-xl resize-none focus:outline-none
              focus:border-indigo-500/50 transition-colors"
          />
          <label className="mt-3 border-2 border-dashed border-border dark:border-white/[0.08] rounded-xl p-5
            flex flex-col items-center justify-center gap-2 bg-black/5 dark:bg-white/[0.02]
            hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] transition-all cursor-pointer group relative">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleUploadImage} 
              disabled={isUploading}
            />
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5 text-muted-foreground/30 group-hover:text-indigo-500 transition-colors" />
            )}
            <p className="text-xs font-semibold text-muted-foreground/60 group-hover:text-muted-foreground">
              {isUploading ? 'EnvSistemando...' : 'Clique para anexar imagem'}
            </p>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border shrink-0 bg-black/5 dark:bg-white/[0.01]">
        <button 
          onClick={() => {
            saveLeadAudit(lead.id, rounded, notes, checked);
            onClose();
          }}
          className="w-full py-3 rounded-xl text-sm font-bold text-white
          bg-indigo-600 hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]
          hover:shadow-[0_0_30px_rgba(99,102,241,0.45)] focus-visible:outline-indigo-300">
          Salvar AuditorSistema ({rounded}%)
        </button>
      </div>

      </div>{/* End Right Column */}
    </div>
  );
};

export default AuditPanel;

