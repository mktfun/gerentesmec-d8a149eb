import { Lead } from '@/context/AppDataContext';

/**
 * Calcula a média de score de um grupo de leads.
 *
 * REGRA DE OURO:
 * - Apenas leads COM score (score !== null) entram no numerador E no denominador.
 * - Leads sem auditoria NÃO distorcem a média para baixo.
 *
 * Exemplo correto:
 *   10 leads, 4 auditados com scores [80, 70, 90, 60] → avgScore = 75
 *   (NÃO 30, que seria o erro de dividir por 10)
 */
export const avgScore = (leads: Lead[]): number | null => {
  const scored = leads.filter(l => l.score !== null && l.score !== undefined);
  if (scored.length === 0) return null;
  const sum = scored.reduce((acc, l) => acc + Number(l.score), 0);
  return Math.round((sum / scored.length) * 10) / 10;
};

/**
 * Versão inteira (sem decimal) para displays compactos (ranking, cards).
 */
export const avgScoreInt = (leads: Lead[]): number | null => {
  const s = avgScore(leads);
  return s === null ? null : Math.round(s);
};
