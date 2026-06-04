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
export const avgScore = (
  leads: Lead[],
  options?: { statusFilter?: boolean; daysWindow?: number }
): number | null => {
  const { statusFilter = false, daysWindow = 0 } = options ?? {};

  let filtered = leads;

  if (statusFilter) {
    filtered = filtered.filter(
      l => l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost'
    );
  }

  if (daysWindow > 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysWindow);
    cutoffDate.setHours(0, 0, 0, 0);
    filtered = filtered.filter(l => {
      const d = new Date(l.last_message_at || l.created_at);
      return d >= cutoffDate;
    });
  }

  // Agora usamos calcLeadScore dinamicamente para garantir a justiça no Cutoff de leads perdidos.
  // Ignoramos a nota estática do banco que pode ter vindo errada.
  const scored = filtered.filter(l => {
    const dynamicScore = calcLeadScore(l.audit_checklist || {}, l.funnel_stage);
    return dynamicScore !== null && dynamicScore !== undefined;
  });

  if (scored.length === 0) return null;
  const sum = scored.reduce((acc, l) => {
    const dynamicScore = calcLeadScore(l.audit_checklist || {}, l.funnel_stage);
    return acc + Number(dynamicScore);
  }, 0);
  return Math.round((sum / scored.length) * 10) / 10;
};

/**
 * Versão inteira (sem decimal) para displays compactos (ranking, cards).
 */
export const avgScoreInt = (
  leads: Lead[],
  options?: { statusFilter?: boolean; daysWindow?: number }
): number | null => {
  const s = avgScore(leads, options);
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
 * Ordem canônica dos itens do checklist de auditoria.
 * Usada para determinar o cutoff em leads perdidos.
 */
export const ITEM_SEQUENCE = [
  '1a', '1b', '2d', '2b',  // Etapa 1: Recebimento
  '2a', '2c', '2e',        // Etapa 2: Orçamento
  '3a', '3b', '3c',        // Etapa 3: Upsell
  '4a', '4b'               // Etapa 4: Encerramento
] as const;

/**
 * Calcula score para leads PERDIDOS usando cutoff inteligente.
 * Só considera itens até o último item marcado na sequência.
 * Cada item vale peso igual (1 ponto).
 */
export function calcLostScore(checklist: Record<string, boolean>): number | null {
  let lastCheckedIndex = -1;
  for (let i = ITEM_SEQUENCE.length - 1; i >= 0; i--) {
    if (checklist[ITEM_SEQUENCE[i]]) {
      lastCheckedIndex = i;
      break;
    }
  }
  if (lastCheckedIndex === -1) return null;
  const universe = ITEM_SEQUENCE.slice(0, lastCheckedIndex + 1);
  const checked = universe.filter(id => checklist[id]).length;
  return Math.round((checked / universe.length) * 100);
}

/**
 * Calcula score para leads GANHOS usando sistema de pesos por etapa.
 * Mantém lógica existente (40/30/20/10).
 */
export function calcWonScore(checklist: Record<string, boolean>): number {
  let score = 0;
  auditStepsConfig.forEach(step => {
    const done = step.items.filter(i => checklist[i.id]).length;
    score += (done / step.items.length) * step.weight;
  });
  return Math.round(score);
}

/**
 * Calcula o score de um lead baseado no status do funil.
 * - closed_lost → cutoff inteligente (flat)
 * - closed_won/outros → pesos por etapa (40/30/20/10)
 */
export function calcLeadScore(
  checklist: Record<string, boolean>,
  funnelStage: string
): number | null {
  if (funnelStage === 'closed_lost') {
    return calcLostScore(checklist);
  }
  return calcWonScore(checklist);
}

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

