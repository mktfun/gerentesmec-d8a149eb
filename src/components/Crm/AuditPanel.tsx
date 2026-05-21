import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Circle, UploadCloud, Link as LinkIcon, DollarSign, Loader2, Sparkles } from 'lucide-react';
import { Lead } from '@/context/AppDataContext';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import ChatHistoryView, { ChatMessage } from './ChatHistoryView';
import { supabase } from '@/integrations/supabase/client';

const auditStepsConfig = [
  {
    id: 'step1', title: '1. Cordialidade e Registro', weight: 25,
    items: [
      { id: '1a', text: 'Atendimento foi cordial e respeitoso?' },
      { id: '1b', text: 'Registrou no WhatsApp o que foi acordado presencialmente/por telefone?' },
    ],
  },
  {
    id: 'step2', title: '2. Orçamento + Vídeo + Efeitos', weight: 25,
    items: [
      { id: '2a', text: 'Enviou o link do orçamento?' },
      { id: '2b', text: 'Enviou vídeo mostrando o defeito?' },
      { id: '2c', text: 'Explicou os efeitos e consequências de não fazer o reparo?' },
    ],
  },
  {
    id: 'step3', title: '3. Checklist Mecânico (Up-sell)', weight: 25,
    items: [
      { id: '3a', text: 'Enviou o checklist complementar do mecânico?' },
      { id: '3b', text: 'Enviou vídeo do que mais precisa ser feito?' },
      { id: '3c', text: 'Explicou o texto justificando os serviços extras?' },
    ],
  },
  {
    id: 'step4', title: '4. Encerramento + Review', weight: 25,
    items: [
      { id: '4a', text: 'Enviou mensagem de agradecimento padrão?' },
      { id: '4b', text: 'Pediu avaliação no Google de forma explícita?' },
    ],
  },
];

import { useAppData } from '@/context/AppDataContext';

interface Props { lead: Lead; onClose: () => void; }

const AuditPanel: React.FC<Props> = ({ lead, onClose }) => {
  const { updateLead } = useAppData();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [ticketValueStr, setTicketValueStr] = useState('');

  useEffect(() => {
    if (lead.score !== null) {
      setChecked({ '1a': true, '1b': true, '2a': true, '2b': true, '2c': true, '3a': true, '3b': true, '4a': true, '4b': true });
    } else {
      setChecked({});
    }
    setNotes('');
    setTicketValueStr(lead.ticket_value ? lead.ticket_value.toString() : '');
  }, [lead.id, lead.ticket_value]);

  const handleTicketBlur = () => {
    const val = parseFloat(ticketValueStr);
    if (!isNaN(val)) {
      updateLead(lead.id, { ticket_value: val });
    } else {
      updateLead(lead.id, { ticket_value: undefined });
    }
  };

  // Fractional score
  let score = 0;
  auditStepsConfig.forEach(step => {
    const done = step.items.filter(i => checked[i.id]).length;
    score += (done / step.items.length) * step.weight;
  });
  const rounded = Math.round(score);

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
        setRealMessages(data as ChatMessage[]);
      } else {
        // Fallback to mocks if no real messages yet (for testing visual)
        setRealMessages([
          { id: 'm1', content: 'Olá, gostaria de saber se o orçamento do pneu ficou pronto?', sender_type: 'contact', created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
          { id: 'm2', content: 'Olá! Sim, ficou pronto. O valor total com o balanceamento e alinhamento 3D é R$ 850,00.', sender_type: 'user', created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString() },
          { id: 'm3', content: 'Segue o link do vídeo mostrando o desgaste irregular que comentei mais cedo, provando a necessidade do alinhamento: https://link.tork.com/v/desgaste', sender_type: 'user', created_at: new Date(Date.now() - 1000 * 60 * 54).toISOString() },
          { id: 'm4', content: 'Nossa, não sabia que tava assim. Entendi, faz muito sentido. Pode aprovar o serviço completo então!', sender_type: 'contact', created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
        ]);
      }
      setLoadingChat(false);
    };

    fetchMessages();

    // Subscribe to new messages for this lead
    const channel = supabase.channel(`chat_messages_${lead.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `lead_id=eq.${lead.id}` }, (payload) => {
        setRealMessages(prev => {
          // ensure no mock messages are mixed with real ones if it was empty
          const isMock = prev.length > 0 && prev[0].id === 'm1';
          return isMock ? [payload.new as ChatMessage] : [...prev, payload.new as ChatMessage];
        });
      }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lead.id]);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-[#0f0f18] border-l border-white/[0.06] overflow-hidden">

      {/* LEFT COLUMN: CHAT HISTORY */}
      <div className="flex-1 border-b lg:border-b-0 lg:border-r border-white/[0.06] overflow-hidden min-w-[320px]">
        <ChatHistoryView lead={lead} messages={realMessages} isLoading={loadingChat} />
      </div>

      {/* RIGHT COLUMN: AUDIT DOSSIER */}
      <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 flex flex-col h-full bg-[#0a0a0f]">

        {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-black text-foreground">Dossiê: {lead.customer_name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{lead.customer_phone}</p>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.10]
            flex items-center justify-center transition-colors focus-visible:outline-indigo-500">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Score ring */}
      <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-5 shrink-0">
        <div className="relative w-[88px] h-[88px] shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="none" />
            <motion.circle
              cx="50" cy="50" r="38"
              stroke={scoreColor}
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${(rounded / 100) * circumference} ${circumference}` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 8px ${scoreColor}60)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={rounded}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xl font-black text-white leading-none"
            >{rounded}</motion.span>
            <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Score</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">Qualidade do Atendimento</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            Marque cada sub-item para calcular a nota proporcional.
          </p>
        </div>
      </div>

      {/* Inline Ticket Input */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01] shrink-0">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Orçamento Estimado (R$)
        </label>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <input
            type="number"
            value={ticketValueStr}
            onChange={(e) => setTicketValueStr(e.target.value)}
            onBlur={handleTicketBlur}
            placeholder="Ex: 1500"
            className="flex-1 bg-transparent border-b border-white/[0.1] focus:border-emerald-500
              text-lg font-black text-emerald-400 placeholder:text-muted-foreground/30 
              focus:outline-none transition-colors py-1"
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

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
        <Accordion type="multiple" defaultValue={['step1', 'step2']} className="space-y-2">
          {auditStepsConfig.map(step => {
            const doneCount = step.items.filter(i => checked[i.id]).length;
            const isFull = doneCount === step.items.length;

            return (
              <AccordionItem key={step.id} value={step.id}
                className="border border-white/[0.08] rounded-xl bg-white/[0.02] hover:bg-white/[0.04]
                  transition-colors px-4">
                <AccordionTrigger className="hover:no-underline py-3.5">
                  <div className="flex items-center gap-3 text-left">
                    {isFull
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      : <Circle className="w-4 h-4 text-white/20 shrink-0" />
                    }
                    <span className="text-xs font-bold text-foreground/80">{step.title}</span>
                    <span className="text-[10px] font-bold text-muted-foreground
                      bg-white/[0.06] px-1.5 py-0.5 rounded-full ml-1">
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
                          className="mt-0.5 border-white/20 data-[state=checked]:bg-indigo-500
                            data-[state=checked]:border-indigo-500"
                        />
                        <label htmlFor={item.id}
                          className={`text-xs leading-relaxed cursor-pointer transition-colors ${
                            checked[item.id] ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}>
                          {item.text}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Evidence */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Dossiê & Evidências
          </p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anotações, justificativas, links..."
            className="w-full h-20 p-3 text-xs text-foreground placeholder:text-muted-foreground/50
              bg-white/[0.04] border border-white/[0.08] rounded-xl resize-none focus:outline-none
              focus:border-indigo-500/50 transition-colors"
          />
          <div className="mt-3 border-2 border-dashed border-white/[0.08] rounded-xl p-5
            flex flex-col items-center justify-center gap-2 bg-white/[0.02]
            hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] transition-all cursor-pointer group">
            <UploadCloud className="w-5 h-5 text-white/20 group-hover:text-indigo-400 transition-colors" />
            <p className="text-xs font-semibold text-muted-foreground/60 group-hover:text-muted-foreground">
              Arrastar imagem · colar link (Ctrl+V)
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.06] shrink-0 bg-white/[0.01]">
        <button className="w-full py-3 rounded-xl text-sm font-bold text-white
          bg-indigo-600 hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]
          hover:shadow-[0_0_30px_rgba(99,102,241,0.45)] focus-visible:outline-indigo-300">
          Salvar Auditoria
        </button>
      </div>

      </div>{/* End Right Column */}
    </div>
  );
};

export default AuditPanel;
