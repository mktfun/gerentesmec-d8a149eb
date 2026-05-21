import { Lead } from '@/context/AppDataContext';

/**
 * Calcula o Tempo Médio de Resposta (TMR) da fila de leads.
 * O TMR é focado no tempo de espera do cliente, ou seja:
 * Só conta se a última mensagem foi do cliente.
 * Como fallback para leads antigos (antes da migration), usamos o wait_time_minutes legado.
 */
export const calculateTmr = (leadsList: Lead[]) => {
  if (!leadsList.length) return 0;
  
  const totalWait = leadsList.reduce((acc, l) => {
    let wait = l.wait_time_minutes || 0;
    
    // @ts-ignore
    const waitingSince = l.chatwoot_waiting_since;
    // @ts-ignore
    const snoozedUntil = l.chatwoot_snoozed_until;

    if (snoozedUntil && new Date(snoozedUntil).getTime() > new Date().getTime()) {
      // If snoozed, wait time is paused/0 for SLA purposes
      wait = 0;
    } else if (waitingSince) {
      // Use official chatwoot waiting since
      const wTime = new Date(waitingSince).getTime();
      wait = Math.round((new Date().getTime() - wTime) / 60000);
    } else if (l.last_client_message_at) {
      // Fallback to our internal calculation
      // @ts-ignore
      const cTime = new Date(l.last_client_message_at).getTime();
      // @ts-ignore
      const aTime = l.last_agent_message_at ? new Date(l.last_agent_message_at).getTime() : 0;
      
      if (cTime > aTime) {
        wait = Math.round((new Date().getTime() - cTime) / 60000);
      } else {
        wait = 0;
      }
    } else {
      wait = wait > 0 ? wait : 0;
    }
    
    return acc + wait;
  }, 0);

  return Math.round(totalWait / leadsList.length);
};

export const calculateDangerLeads = (leadsList: Lead[]) => {
  return leadsList.filter(l => {
    if (l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost') return false;
    
    let wait = l.wait_time_minutes || 0;
    
    // @ts-ignore
    const waitingSince = l.chatwoot_waiting_since;
    // @ts-ignore
    const snoozedUntil = l.chatwoot_snoozed_until;

    if (snoozedUntil && new Date(snoozedUntil).getTime() > new Date().getTime()) {
      wait = 0;
    } else if (waitingSince) {
      const wTime = new Date(waitingSince).getTime();
      wait = Math.round((new Date().getTime() - wTime) / 60000);
    } else if (l.last_client_message_at) {
      // @ts-ignore
      const cTime = new Date(l.last_client_message_at).getTime();
      // @ts-ignore
      const aTime = l.last_agent_message_at ? new Date(l.last_agent_message_at).getTime() : 0;
      if (cTime > aTime) {
        wait = Math.round((new Date().getTime() - cTime) / 60000);
      } else {
        wait = 0;
      }
    }
    return l.sla_status === 'danger' || wait > 20;
  });
};
