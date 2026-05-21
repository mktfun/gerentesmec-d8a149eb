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

  const now = new Date();

  const totalWait = leadsList.reduce((acc, l) => {
    let wait = 0;

    // @ts-ignore
    const snoozedUntil = l.chatwoot_snoozed_until;
    if (snoozedUntil && new Date(snoozedUntil).getTime() > now.getTime()) {
      return acc; // Snoozado — não conta
    }

    // @ts-ignore
    const waitingSince: string | null = l.chatwoot_waiting_since;

    if (waitingSince) {
      const from = new Date(waitingSince);
      wait = businessHours
        ? getWorkMinutes(from, now, businessHours)
        : Math.round((now.getTime() - from.getTime()) / 60000);
    } else if (l.last_client_message_at) {
      // @ts-ignore
      const cTime = new Date(l.last_client_message_at).getTime();
      // @ts-ignore
      const aTime = l.last_agent_message_at ? new Date(l.last_agent_message_at).getTime() : 0;

      if (cTime > aTime) {
        const from = new Date(cTime);
        wait = businessHours
          ? getWorkMinutes(from, now, businessHours)
          : Math.round((now.getTime() - cTime) / 60000);
      }
    } else {
      wait = l.wait_time_minutes || 0;
    }

    return acc + (wait > 0 ? wait : 0);
  }, 0);

  return Math.round(totalWait / leadsList.length);
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
  const now = new Date();

  return leadsList.filter(l => {
    if (l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost') return false;

    // @ts-ignore
    const snoozedUntil = l.chatwoot_snoozed_until;
    if (snoozedUntil && new Date(snoozedUntil).getTime() > now.getTime()) return false;

    let wait = 0;

    // @ts-ignore
    const waitingSince: string | null = l.chatwoot_waiting_since;

    if (waitingSince) {
      const from = new Date(waitingSince);
      wait = businessHours
        ? getWorkMinutes(from, now, businessHours)
        : Math.round((now.getTime() - from.getTime()) / 60000);
    } else if (l.last_client_message_at) {
      // @ts-ignore
      const cTime = new Date(l.last_client_message_at).getTime();
      // @ts-ignore
      const aTime = l.last_agent_message_at ? new Date(l.last_agent_message_at).getTime() : 0;
      if (cTime > aTime) {
        const from = new Date(cTime);
        wait = businessHours
          ? getWorkMinutes(from, now, businessHours)
          : Math.round((now.getTime() - cTime) / 60000);
      }
    }

    return l.sla_status === 'danger' || wait > slaMinutes;
  });
};
