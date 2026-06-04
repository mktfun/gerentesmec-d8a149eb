import type { Lead } from '@/context/AppDataContext';

/**
 * Filtra leads para dashboards:
 * 1. Apenas closed_won e closed_lost
 * 2. Apenas dos últimos N dias (padrão 30)
 */
export function filterDashboardLeads(
  leads: Lead[],
  daysWindow = 30
): Lead[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysWindow);
  cutoffDate.setHours(0, 0, 0, 0);

  return leads.filter(l => {
    const isClosed = l.funnel_stage === 'closed_won'
                  || l.funnel_stage === 'closed_lost';
    if (!isClosed) return false;

    const date = new Date(l.last_message_at || l.created_at);
    return date >= cutoffDate;
  });
}
