export interface RouterResult {
  intent: 'price_objection' | 'quote_sent' | 'approval' | 'rejection' | 'faq' | 'casual' | 'unknown';
  requires_funnel_update: boolean;
  requires_vision: boolean;
  requires_audio: boolean;
  summary: string;
}

export const routeMessage = async (
  content: string, 
  history: string[], 
  apiKey: string
): Promise<RouterResult> => {
  console.log(`[Router Brain] Analyzing message: "${content.substring(0, 50)}..."`);
  
  // Fast heuristics for media
  const lowerContent = content.toLowerCase();
  const requires_vision = lowerContent.includes('http') && (lowerContent.includes('.jpg') || lowerContent.includes('.png') || lowerContent.includes('.mp4') || lowerContent.includes('video'));
  const requires_audio = lowerContent.includes('http') && (lowerContent.includes('.ogg') || lowerContent.includes('.mp3') || lowerContent.includes('.wav') || lowerContent.includes('audio'));

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é o Cérebro Roteador de um CRM de oficinas automotivas premium.
Sua única função é classificar a intenção da ÚLTIMA MENSAGEM do cliente ou gerente, baseando-se no histórico fornecido.
Analise a mensagem e retorne EXATAMENTE um JSON com este formato:
{
  "intent": "enum: [price_objection, quote_sent, approval, rejection, faq, casual, unknown]",
  "requires_funnel_update": boolean,
  "summary": "string: resumo super curto em 1 frase"
}

Regras de intent:
- 'quote_sent': se o gerente enviou um valor de orçamento ou checklist técnico com valor.
- 'price_objection': se o cliente reclamou do preço, pediu desconto ou quer negociar formas de pagamento.
- 'approval': se o cliente aceitou o orçamento, autorizou o serviço ou mandou áudio positivo de aprovação.
- 'rejection': se o cliente recusou o serviço e mandou parar.
- 'faq' ou 'casual': dúvidas genéricas de horário, localização ou bate-papo sem intenção de venda.

Apenas retorne requires_funnel_update = true se for quote_sent, price_objection, approval ou rejection.`
          },
          {
            role: 'user',
            content: `Histórico recente:\n${history.join('\n')}\n\nÚltima mensagem:\n${content}`
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    
    const data = await res.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    console.log(`[Router Brain] Intent detectada: ${result.intent}`);

    return {
      intent: result.intent || 'unknown',
      requires_funnel_update: result.requires_funnel_update || false,
      summary: result.summary || content,
      requires_vision,
      requires_audio
    };
  } catch (error: any) {
    console.error('[Router Brain] Falha no roteamento LLM:', error.message);
    return {
      intent: 'unknown',
      requires_funnel_update: false,
      summary: content,
      requires_vision,
      requires_audio
    };
  }
};
