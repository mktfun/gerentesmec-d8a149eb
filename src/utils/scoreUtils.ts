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
    id: 'step1', title: '1. Recebimento e Diagnóstico', weight: 40,
    items: [
      { id: '1a', text: 'Atendimento foi cordial e respeitoso?' },
      { id: '1b', text: 'Registrou no WhatsApp o que foi acordado presencialmente/por telefone?' },
      { id: '2d', text: 'Enviou o link do checklist do veículo detalhando os defeitos e as fotos?' },
      { id: '2b', text: 'Enviou vídeo mostrando o defeito?' },
    ],
  },
  {
    id: 'step2', title: '2. Orçamento e Aprovação', weight: 30,
    items: [
      { id: '2a', text: 'Enviou o link do orçamento?' },
      { id: '2c', text: 'Explicou os efeitos e consequências de não fazer o reparo?' },
      { id: '2e', text: 'Obteve resposta (sim/ok) de aprovação do cliente após enviar orçamento/checklist?' },
    ],
  },
  {
    id: 'step3', title: '3. Checklist Mecânico (Up-sell)', weight: 20,
    items: [
      { id: '3a', text: 'Enviou o checklist complementar do mecânico?' },
      { id: '3b', text: 'Enviou vídeo do que mais precisa ser feito?' },
      { id: '3c', text: 'Explicou o texto justificando os serviços extras?' },
    ],
  },
  {
    id: 'step4', title: '4. Encerramento + Review', weight: 10,
    items: [
      { id: '4a', text: 'Enviou mensagem de agradecimento padrão?' },
      { id: '4b', text: 'Pediu avaliação no Google de forma explícita?' },
    ],
  },
];

/**
 * Maps an audit checklist item ID to a human-readable quality feedback message.
 * Used by the Manager View to display quality alerts in the conversation timeline.
 * IMPORTANT: No mention of "IA" or "Inteligência Artificial" - these are "Análise de Qualidade".
 */
export const qualityFeedbackMap: Record<string, { label: string; type: 'pass' | 'fail'; detail: string }> = {
  '1a': {
    label: 'Cordialidade no Atendimento',
    type: 'pass',
    detail: 'O atendimento foi conduzido de forma cordial e respeitosa com o cliente.',
  },
  '1b': {
    label: 'Registro do Combinado',
    type: 'pass',
    detail: 'O que foi acordado presencialmente ou por telefone foi registrado no WhatsApp.',
  },
  '2a': {
    label: 'Link do Orçamento Enviado',
    type: 'pass',
    detail: 'O link do orçamento foi encaminhado ao cliente nesta conversa.',
  },
  '2b': {
    label: 'Vídeo do Defeito Enviado',
    type: 'pass',
    detail: 'Um vídeo mostrando o defeito do veículo foi enviado ao cliente.',
  },
  '2c': {
    label: 'Consequências Explicadas',
    type: 'pass',
    detail: 'Os efeitos e consequências de não realizar o reparo foram explicados.',
  },
  '2d': {
    label: 'Checklist do Veículo Enviado',
    type: 'pass',
    detail: 'O link do checklist do veículo com fotos e defeitos foi enviado.',
  },
  '2e': {
    label: 'Aprovação do Cliente Obtida',
    type: 'pass',
    detail: 'O cliente confirmou e aprovou o orçamento/checklist enviado.',
  },
  '3a': {
    label: 'Checklist Mecânico Enviado',
    type: 'pass',
    detail: 'O checklist complementar de serviços adicionais foi encaminhado.',
  },
  '3b': {
    label: 'Vídeo de Up-sell Enviado',
    type: 'pass',
    detail: 'Foi enviado um vídeo explicando o que mais precisa ser feito no veículo.',
  },
  '3c': {
    label: 'Justificativa dos Serviços Extras',
    type: 'pass',
    detail: 'Os serviços adicionais foram justificados com texto explicativo ao cliente.',
  },
  '4a': {
    label: 'Mensagem de Agradecimento Enviada',
    type: 'pass',
    detail: 'A mensagem padrão de agradecimento foi enviada ao encerrar o atendimento.',
  },
  '4b': {
    label: 'Avaliação no Google Solicitada',
    type: 'pass',
    detail: 'O cliente foi convidado de forma explícita a deixar uma avaliação no Google.',
  },
};

/**
 * Returns the list of checklist items NOT completed for a lead,
 * formatted as quality failure alerts for the manager.
 */
export const getMissingQualityItems = (auditChecklist: Record<string, boolean>) => {
  return auditStepsConfig.flatMap(step =>
    step.items
      .filter(item => !auditChecklist[item.id])
      .map(item => ({
        id: item.id,
        label: qualityFeedbackMap[item.id]?.label ?? item.text,
        detail: `Este ponto não foi cumprido durante o atendimento: "${item.text}"`,
        type: 'fail' as const,
        stepTitle: step.title,
      }))
  );
};

