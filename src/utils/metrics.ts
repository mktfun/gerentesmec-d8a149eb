import { Lead } from '@/context/AppDataContext';
import { BusinessHoursConfig, getWorkMinutes } from './businessHours';

/**
 * Calcula o Tempo Médio de Resposta (TMR) da fila de leads.
 *
 * Se `businessHours` for fornecido, conta apenas minutos dentro
 * do horário de expediente configurado — eliminando distorções
 * de fins de semana e madrugadas.
 *
 * Fallback sem config: comportamento original (diff bruta).
 */
export const calculateTmr = (
  leadsList: Lead[],
  businessHours?: BusinessHoursConfig | null
) => {
  if (!leadsList.length) return 0;

  // Novo Cálculo: Histórico real da conversa baseado em sum(total_response_time) / sum(response_count)
  let totalMins = 0;
  let totalCount = 0;

  leadsList.forEach(l => {
    const leadTotal = (l as any).total_response_time_minutes;
    const leadCount = (l as any).response_count;
    
    if (leadTotal && leadCount) {
      // Hotfix: Se a média por resposta deste lead for > 24h úteis (1440 min),
      // provavelmente é dado legado de antes de implementarmos o bloqueio de fds.
      // Ignorar para não distorcer a média da equipe.
      if (leadTotal / leadCount > 1440) return;

      totalMins += leadTotal;
      totalCount += leadCount;
    }
  });

  if (totalCount === 0) {
    // Fallback para o cálculo atual se não houver dados históricos
    const now = new Date();
    const newLeads = leadsList.filter(l => l.funnel_stage === 'lead_new');
    if (!newLeads.length) return 0;
    
    const currentWait = newLeads.reduce((acc, l) => {
      let wait = 0;
      // @ts-ignore
      const cTime = l.last_client_message_at ? new Date(l.last_client_message_at).getTime() : 0;
      // @ts-ignore
      const aTime = l.last_agent_message_at ? new Date(l.last_agent_message_at).getTime() : 0;
      
      if (cTime > aTime) {
        const from = new Date(cTime);
        wait = businessHours
          ? getWorkMinutes(from, now, businessHours)
          : Math.round((now.getTime() - cTime) / 60000);
      }
      return acc + (wait > 0 ? wait : 0);
    }, 0);
    return Math.round(currentWait / newLeads.length);
  }

  return Math.round(totalMins / totalCount);
};

export const isLeadDanger = (
  l: Lead,
  businessHours?: BusinessHoursConfig | null,
  slaMinutes = 20
) => {
  if (l.funnel_stage !== 'lead_new') return false;

  const now = new Date();
  // @ts-ignore
  const snoozedUntil = l.chatwoot_snoozed_until;
  if (snoozedUntil && new Date(snoozedUntil).getTime() > now.getTime()) return false;

  // @ts-ignore
  const cTime = l.last_client_message_at ? new Date(l.last_client_message_at).getTime() : 0;
  // @ts-ignore
  const aTime = l.last_agent_message_at ? new Date(l.last_agent_message_at).getTime() : 0;
  
  if (aTime >= cTime && cTime > 0) {
    return false; // Agent replied, no danger
  }

  let wait = 0;
  // @ts-ignore
  const waitingSince: string | null = l.chatwoot_waiting_since;

  if (waitingSince) {
    const from = new Date(waitingSince);
    wait = businessHours
      ? getWorkMinutes(from, now, businessHours)
      : Math.round((now.getTime() - from.getTime()) / 60000);
  } else if (cTime > aTime) {
    const from = new Date(cTime);
    wait = businessHours
      ? getWorkMinutes(from, now, businessHours)
      : Math.round((now.getTime() - cTime) / 60000);
  }

  // Se o tempo dinâmico ultrapassou a SLA, ou se o banco diz que é danger E ele não foi respondido (aTime >= cTime tratado acima)
  return wait > slaMinutes || l.sla_status === 'danger';
};

/**
 * Retorna os leads em status de perigo (aguardando > SLA).
 * Com businessHours configurado, o SLA só conta tempo de expediente.
 */
export const calculateDangerLeads = (
  leadsList: Lead[],
  businessHours?: BusinessHoursConfig | null,
  slaMinutes = 20
) => {
  return leadsList.filter(l => isLeadDanger(l, businessHours, slaMinutes));
};
