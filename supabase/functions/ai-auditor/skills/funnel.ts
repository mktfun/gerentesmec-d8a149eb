import { RouterResult } from './router.ts';

export const updateFunnelStage = async (
  leadId: string, 
  currentStage: string,
  routerResult: RouterResult, 
  supabase: any
): Promise<string> => {
  if (!routerResult.requires_funnel_update) {
    return currentStage;
  }

  let targetStage = currentStage;

  switch (routerResult.intent) {
    case 'quote_sent':
      if (currentStage === 'lead_new') {
        targetStage = 'quote';
      }
      break;
    case 'price_objection':
      if (currentStage === 'lead_new' || currentStage === 'quote') {
        targetStage = 'negotiation';
      }
      break;
    case 'approval':
      targetStage = 'closed_won';
      break;
    case 'rejection':
      targetStage = 'closed_lost';
      break;
  }

  if (targetStage !== currentStage) {
    console.log(`[Funnel Brain] Atualizando lead_id ${leadId} para estagio ${targetStage}`);
    const { error } = await supabase
      .from('leads')
      .update({ funnel_stage: targetStage })
      .eq('id', leadId);

    if (error) {
      console.error('[Funnel Brain] Erro ao atualizar funil:', error);
      return currentStage;
    }
  } else {
    console.log(`[Funnel Brain] Estagio mantido em ${currentStage}`);
  }

  return targetStage;
};
