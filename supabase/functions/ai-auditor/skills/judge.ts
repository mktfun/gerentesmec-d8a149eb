export const judgeLead = async (leadId: string, analysisResult: any, supabase: any, apiKey: string) => {
  console.log(`[Judge Skill] Evaluating lead ${leadId} based on new insight:`, analysisResult);
  
  // Aqui você buscaria as mensagens anteriores do Lead para contexto total
  // const { data: messages } = await supabase.from('chat_messages').select('*').eq('lead_id', leadId);

  // E usaria System Prompts muito restritos para preencher o JSON do scorecard.
  // Simulando a lógica de auditoria (incrementando o score do lead):
  
  const { data: lead } = await supabase.from('leads').select('score').eq('id', leadId).single();
  
  let currentScore = lead?.score !== null ? lead?.score : 50; // starts at 50 if null
  let auditNotes = "";

  if (analysisResult.type === 'vision' && analysisResult.identified_defects.length > 0) {
    currentScore += 15; // Pontua por mandar vídeo do defeito
    auditNotes = "Vídeo/foto com defeito validado pela IA.";
  } else if (analysisResult.type === 'audio' && analysisResult.intent === 'approval') {
    currentScore += 20; // Pontua por conduzir o fechamento
    auditNotes = "Cliente aprovou o orçamento por áudio de forma positiva.";
  } else {
    currentScore += 2; // Interação normal mantem ou sobe um pouquinho a pontuação
    auditNotes = "Interação padrão. " + analysisResult.summary.substring(0, 50);
  }

  // Cap score
  if (currentScore > 100) currentScore = 100;

  // Atualiza o lead
  await supabase.from('leads').update({ score: currentScore }).eq('id', leadId);

  return {
    newScore: currentScore,
    reasoning: auditNotes
  };
};
