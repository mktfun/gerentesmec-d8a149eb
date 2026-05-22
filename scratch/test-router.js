const apiKey = process.env.OPENAI_API_KEY || ''; // Pass key here or run with env var

async function routeMessage(content, history) {
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

  const data = await res.json();
  console.log(data.choices[0].message.content);
}

// Mock test
const history = [
  "agent: Olá, o valor do serviço ficou R$ 1500,00."
];
const content = "Poxa, o valor ficou um pouco alto, consegue fazer um desconto à vista?";

if (!apiKey) {
  console.log('Skipping API test due to missing OPENAI_API_KEY');
} else {
  routeMessage(content, history);
}
