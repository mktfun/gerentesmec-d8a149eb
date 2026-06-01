import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AuditorStatus = 'idle' | 'processing' | 'cooldown' | 'paused_error';

interface BackgroundAuditorContextType {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  cooldown: number;
  setCooldown: (v: number) => void;
  status: AuditorStatus;
  lastError: string | null;
}

const BackgroundAuditorContext = createContext<BackgroundAuditorContextType | undefined>(undefined);

export const BackgroundAuditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('background_auditor_enabled');
    return saved === 'true';
  });

  const [cooldown, setCooldown] = useState(() => {
    const saved = localStorage.getItem('background_auditor_cooldown');
    return saved ? parseInt(saved, 10) : 15;
  });

  const [status, setStatus] = useState<AuditorStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem('background_auditor_enabled', String(enabled));
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem('background_auditor_cooldown', String(cooldown));
  }, [cooldown]);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const processNext = async () => {
      setStatus('processing');
      try {
        const { data, error } = await supabase.from('chat_messages')
          .select(`
            *,
            leads!inner(funnel_stage)
          `)
          .or('ai_audited.eq.false,ai_audited.is.null')
          .eq('sender_type', 'user')
          .order('created_at', { ascending: true })
          .limit(200);

        if (error) throw error;

        if (data && data.length > 0) {
          const STAGE_PRIORITY: Record<string, number> = {
            'em_orcamento': 1,
            'orcamento_enviado': 2,
            'em_atendimento': 3,
            'novo_lead': 4,
            'closed_won': 5,
            'closed_lost': 6
          };

          // Prioriza pela etapa do funil (1 a 6) e, como o banco já ordenou por created_at (ascending),
          // o sort estável manterá a ordem dos mais antigos primeiro dentro de cada etapa.
          const sorted = [...data].sort((a, b) => {
            const stageA = (a.leads as any)?.funnel_stage || 'novo_lead';
            const stageB = (b.leads as any)?.funnel_stage || 'novo_lead';
            return (STAGE_PRIORITY[stageA] || 99) - (STAGE_PRIORITY[stageB] || 99);
          });

          const msg = sorted[0];

          await supabase.functions.invoke('ai-autonomous-evaluator', {
            body: {
              message_content: msg.content,
              lead_id: msg.lead_id,
              message_id: msg.id,
              media_url: msg.media_url,
              media_type: msg.media_type,
              sender_type: msg.sender_type
            }
          });
          
          setLastError(null);
          setStatus('cooldown');
          timeoutRef.current = setTimeout(processNext, cooldown * 1000);
        } else {
          // Fila vazia, descansa por 1 minuto
          setStatus('idle');
          timeoutRef.current = setTimeout(processNext, 60000);
        }
      } catch (err: any) {
        setLastError(err.message || 'Erro desconhecido');
        setStatus('paused_error');
        // Backoff exponencial/fixo: pausa forçada de 2 minutos
        timeoutRef.current = setTimeout(processNext, 120000);
      }
    };

    processNext();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, cooldown]);

  return (
    <BackgroundAuditorContext.Provider value={{ enabled, setEnabled, cooldown, setCooldown, status, lastError }}>
      {children}
    </BackgroundAuditorContext.Provider>
  );
};

export const useBackgroundAuditor = () => {
  const context = useContext(BackgroundAuditorContext);
  if (!context) throw new Error('useBackgroundAuditor must be used within BackgroundAuditorProvider');
  return context;
};
