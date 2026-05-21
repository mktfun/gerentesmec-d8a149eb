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
    if (l.last_client_message_at) {
      // @ts-ignore
      const cTime = new Date(l.last_client_message_at).getTime();
      // @ts-ignore
      const aTime = l.last_agent_message_at ? new Date(l.last_agent_message_at).getTime() : 0;
      
      // Se o cliente foi o último a mandar, calculamos o gap
      if (cTime > aTime) {
        wait = Math.round((new Date().getTime() - cTime) / 60000);
      } else {
        // Se o agente respondeu, zera a espera dele atual.
        wait = 0;
      }
    } else {
      // Fallback para leads antigos que não tem last_client_message_at
      // Se ele estiver 'danger', a gente garante que mostre o wait dele se for > 0, ou se for <=0, assumimos 0.
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
    if (l.last_client_message_at) {
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
