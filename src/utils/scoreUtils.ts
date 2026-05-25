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

export const auditStepsConfig = [
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
      { id: '2d', text: 'Enviou o link do checklist do veículo detalhando os defeitos e as fotos?' },
      { id: '2e', text: 'Obteve resposta (sim/ok) de aprovação do cliente após enviar orçamento/checklist?' },
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
