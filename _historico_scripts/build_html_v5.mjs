import fs from 'fs';

const CHATWOOT_URL = "https://chat.tork.services/app/accounts/5/conversations";

// As 3 PIORES conversas capturadas do Extrator V5 da Jorge Beretta, auditadas com as novas diretrizes do Agente Mestre
const data = {
  "JORGE BERETTA": [
    { 
      "id": 3684, 
      "cliente": "Neto",
      "score": 0, 
      "falhas": [
        "Faltou Atendimento Finalizado (-100)"
      ],
      "resumo": "⚠️ CONVERSA EM ANDAMENTO: Após resgatar todo o histórico de mensagens incluindo o link do checklist, notei que a OS ainda está aberta e o carro ainda não foi devolvido ao cliente. Essa conversa NÃO deve ser auditada ainda. Nota anulada e removida das estatísticas."
    },
    { 
      "id": 3646, 
      "cliente": "Michel",
      "score": 35, 
      "falhas": [
        "Faltou 2e: Obteve aprovação explícita (sim/ok) (-10)", 
        "Faltou 2c: Explicou consequências (-9)", 
        "Faltou 4a: Agradecimento padrão (-5)",
        "Faltou 4b: Pediu avaliação no Google (-8)"
      ],
      "resumo": "🚨 ATENDIMENTO RUIM (Atrito): Cliente ficou revoltado porque o gerente pressionou para pagar a entrada, mas atrasou a entrega pela transportadora. Faltou alinhamento claro de expectativas. Gerente tentou contornar, mas perdeu a nota de excelência e cordialidade na negociação."
    },
    { 
      "id": 2560, 
      "cliente": "Daniel",
      "score": 45, 
      "falhas": [
        "Faltou 1a: Cordial/respeitoso (-8)",
        "Faltou 1b: Registrou resumo do acordado (-10)", 
        "Faltou 3a: Checklist complementar (-8)", 
        "Faltou 3c: Explicou serviços extras (-8)"
      ],
      "resumo": "📉 ORÇAMENTO APRESSADO: O orçamento do Fusion bateu R$ 7.600 e a negociação foi dura. O gerente focou muito em tentar receber um cartão parcelado do semi-eixo e omitiu a explicação das consequências e o resumo do que estava sendo pago no final. Uma jornada desgastante."
    }
  ]
};

let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel da Vergonha - Jorge Beretta (Auditoria V5)</title>
    <style>
        body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #e2e8f0; padding: 30px; line-height: 1.6; }
        h1 { text-align: center; color: #ef4444; margin-bottom: 5px; font-size: 2.5em; text-transform: uppercase; letter-spacing: 2px;}
        h3 { text-align: center; color: #94a3b8; font-weight: 400; margin-top: 0; margin-bottom: 40px;}
        .unit-container { background-color: #1e293b; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.6); border: 1px solid #334155; }
        .unit-title { font-size: 1.6em; border-bottom: 2px solid #334155; padding-bottom: 15px; margin-bottom: 25px; color: #ef4444; font-weight: 600;}
        .conv-card { background-color: #0f172a; border-left: 6px solid #ef4444; padding: 20px; margin-bottom: 20px; border-radius: 8px; position: relative;}
        .conv-card.null { border-left: 6px solid #64748b; background-color: #1e293b; opacity: 0.8;}
        .conv-card.medium { border-left: 6px solid #f59e0b; }
        .conv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #1e293b; padding-bottom: 10px;}
        .customer-name { font-size: 1.3em; color: #f8fafc; font-weight: 500;}
        .score { font-size: 1.5em; font-weight: 800; color: #ef4444; background: #450a0a; padding: 4px 10px; border-radius: 6px;}
        .score.null { color: #94a3b8; background: #334155; }
        .score.medium { color: #f59e0b; background: #422006;}
        .summary-box { background-color: #1e293b; padding: 15px; border-radius: 6px; margin-bottom: 15px; font-style: normal; color: #cbd5e1; border-left: 3px solid #ef4444;}
        .summary-box.null { border-left: 3px solid #94a3b8; font-style: italic;}
        ul { margin: 0; padding-left: 20px; color: #fca5a5; }
        li { margin-bottom: 8px; }
        .btn { display: inline-flex; align-items: center; background-color: #0ea5e9; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin-top: 15px; font-weight: 600; transition: all 0.2s;}
        .btn:hover { background-color: #0284c7; transform: translateY(-2px); }
    </style>
</head>
<body>
    <h1>Painel de Falhas: Jorge Beretta</h1>
    <h3>Top 3 Piores Atendimentos (Filtro V5 com Interpretação de Descarte)</h3>
`;

for (const [unit, convs] of Object.entries(data)) {
    html += `\n    <div class="unit-container">\n        <div class="unit-title">🏢 Unidade: ${unit}</div>`;
    
    // Sort by score
    convs.sort((a,b) => a.score - b.score);
    
    for (const conv of convs) {
        let scoreClass = "";
        let cardClass = "";
        
        if (conv.score === 0) { scoreClass = "null"; cardClass = "null"; }
        else if (conv.score > 35) { scoreClass = "medium"; cardClass = "medium"; }
        
        html += `
        <div class="conv-card ${cardClass}">
            <div class="conv-header">
                <span class="customer-name">👤 Cliente: ${conv.cliente} <span style="font-size: 0.7em; color: #64748b;">(#${conv.id})</span></span>
                <span class="score ${scoreClass}">Score: ${conv.score}/100</span>
            </div>
            
            <div class="summary-box ${cardClass}">
                <strong>🤖 Leitura da IA Mestre:</strong> ${conv.resumo}
            </div>

            <strong>❌ Penalidades no Checklist da Mecânica:</strong>
            <ul>
                ${conv.falhas.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <a class="btn" href="${CHATWOOT_URL}/${conv.id}" target="_blank">🔍 Abrir no Chatwoot</a>
        </div>`;
    }
    html += `\n    </div>`;
}

html += `
</body>
</html>
`;

fs.writeFileSync('Painel_da_Vergonha_V5.html', html);
console.log('Painel da Vergonha V5 gerado com sucesso!');
