/**
 * businessHours.ts
 * Utilitário para calcular Tempo Médio de Resposta (TMR)
 * considerando apenas o horário de expediente configurado.
 */

export type BusinessHoursConfig = {
  days: number[];      // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  start: string;       // "HH:MM" — horário de abertura
  end: string;         // "HH:MM" — horário de fechamento
  timezone?: string;   // ex: "America/Sao_Paulo"
};

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  days: [1, 2, 3, 4, 5],
  start: '08:00',
  end: '18:00',
  timezone: 'America/Sao_Paulo',
};

/** Converte "HH:MM" em minutos desde meia-noite */
const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** Verifica se um Date está dentro do horário de expediente */
export const isInsideBusinessHours = (
  date: Date,
  config: BusinessHoursConfig
): boolean => {
  const dayOfWeek = date.getDay(); // 0=Dom
  if (!config.days.includes(dayOfWeek)) return false;

  const minutesInDay = date.getHours() * 60 + date.getMinutes();
  const startMin = timeToMinutes(config?.start || '08:00');
  const endMin = timeToMinutes(config?.end || '18:00');

  return minutesInDay >= startMin && minutesInDay < endMin;
};

/**
 * Calcula quantos minutos úteis existem entre `from` e `to`,
 * considerando apenas os dias e horários de atendimento configurados.
 *
 * Algoritmo O(dias) — eficiente mesmo para datas de semanas atrás.
 */
export const getWorkMinutes = (
  from: Date,
  to: Date,
  config: BusinessHoursConfig
): number => {
  if (from >= to) return 0;
  if (!config?.days) config = DEFAULT_BUSINESS_HOURS;
  const startMin = timeToMinutes(config?.start || '08:00');
  const endMin = timeToMinutes(config?.end || '18:00');
  const dayWorkMinutes = endMin - startMin; // minutos úteis por dia

  if (dayWorkMinutes <= 0) return 0;

  let totalMinutes = 0;

  // Clonar para não mutar o original; zerar segundos e ms
  const cursor = new Date(from);
  cursor.setSeconds(0, 0);
  const limit = new Date(to);
  limit.setSeconds(0, 0);

  // Proteção: não processar mais de 90 dias
  const maxDays = 90;
  let daysProcessed = 0;

  while (cursor < limit && daysProcessed < maxDays) {
    const dayOfWeek = cursor.getDay();

    if (!config.days.includes(dayOfWeek)) {
      // Dia não útil — avança para a meia-noite do próximo dia
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
      daysProcessed++;
      continue;
    }

    // Calcular janela útil deste dia
    const dayStart = new Date(cursor);
    dayStart.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);

    // Interseção entre [cursor, limit] e [dayStart, dayEnd]
    const windowStart = cursor < dayStart ? dayStart : cursor;
    const windowEnd = limit < dayEnd ? limit : dayEnd;

    if (windowStart < windowEnd) {
      totalMinutes += Math.round((windowEnd.getTime() - windowStart.getTime()) / 60000);
    }

    // Avança para o próximo dia
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);
    daysProcessed++;
  }

  return totalMinutes;
};

/**
 * Retorna o próximo instante dentro do expediente a partir de `date`.
 * Útil para saber "quando começa a contar" o TMR.
 */
export const nextBusinessStart = (
  date: Date,
  config: BusinessHoursConfig
): Date => {
  if (isInsideBusinessHours(date, config)) return date;

  const cursor = new Date(date);
  const startMin = timeToMinutes(config.start);

  // Tenta até 14 dias à frente
  for (let i = 0; i < 14; i++) {
    const dayOfWeek = cursor.getDay();
    if (config.days.includes(dayOfWeek)) {
      const dayStart = new Date(cursor);
      dayStart.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
      if (cursor <= dayStart) return dayStart;
      // Se passou do fim do expediente hoje, tenta amanhã
    }
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);
  }

  return cursor;
};
