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
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          .select('*')
          .or('ai_audited.eq.false,ai_audited.is.null')
          .eq('sender_type', 'user')
          .order('created_at', { ascending: true })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const msg = data[0];
          await supabase.functions.invoke('ai-autonomous-evaluator', {
            body: { record: msg }
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
