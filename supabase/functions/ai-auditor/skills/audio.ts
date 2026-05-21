export const analyzeAudio = async (content: string, apiKey: string) => {
  // Simulação de chamada Whisper -> LLM
  console.log(`[Audio Skill] Transcribing and analyzing audio url: ${content}`);
  
  return {
    type: 'audio',
    summary: 'Áudio do cliente autorizando o serviço completo (R$ 850) e agradecendo a clareza do vídeo.',
    sentiment: 'positive',
    intent: 'approval'
  };
};
