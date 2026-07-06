import fs from 'fs';

// Workflow /vibe-auditoria (Versão Leitura Bruta)
// Unidade: JORGE BERETTA

const relatorio = {
  "JORGE BERETTA": [
    { 
      "id": 3116, 
      "cliente": "Caroline Fregonesi",
      "score": 0,
      "gatekeeper": "BLOCKED (Orçamento Abandonado)",
      "falhas": [],
      "resumo": "⚠️ GATEKEEPER BLOQUEOU: Li toda a conversa. A cliente orçou e disse 'vou ver com meu noivo e marco... vou me programar então'. Ela nem deixou o carro lá. Conversa não convertida."
    },
    { 
      "id": 3763, 
      "cliente": "Washington Vigorito",
      "score": 0,
      "gatekeeper": "BLOCKED (Fornecedor)",
      "falhas": [],
      "resumo": "⚠️ GATEKEEPER BLOQUEOU: Li toda a conversa. O Washington passou valor de 'R$ 2250,00 Original Ford' para o gerente. A oficina está orçando peça com ele. É Fornecedor."
    },
    { 
      "id": 3233, 
      "cliente": "Braulio Rodrigues",
      "score": 0,
      "gatekeeper": "BLOCKED (Serviço não iniciado)",
      "falhas": [],
      "resumo": "⚠️ GATEKEEPER BLOQUEOU: Li toda a conversa. O carro 'acabou de chegar no guincho' no fim da conversa e o gerente pediu pra ele deixar lá às 8h do outro dia. O atendimento acabou de começar."
    },
    { 
      "id": 3664, 
      "cliente": "Gerson",
      "score": 0,
      "gatekeeper": "BLOCKED (Fornecedor)",
      "falhas": [],
      "resumo": "⚠️ GATEKEEPER BLOQUEOU: Erro corrigido da versão anterior. Li o histórico desde o Início: O gerente começou a conversa 'Aqui é Erik da Mecânica Popular, acabei de ligar ai, vocês trabalham com cardan'. A oficina é o cliente. Descartado."
    },
    { 
      "id": 2560, 
      "cliente": "Daniel",
      "score": 0,
      "gatekeeper": "BLOCKED (Dono/Blacklist)",
      "falhas": [],
      "resumo": "⚠️ GATEKEEPER BLOQUEOU: Nome na blacklist da extração. Conversa interna."
    },
    { 
      "id": 3089, 
      "cliente": "Erivan",
      "score": 0,
      "gatekeeper": "BLOCKED (Serviço não iniciado)",
      "falhas": [],
      "resumo": "⚠️ GATEKEEPER BLOQUEOU: Erro corrigido da versão anterior. A conversa terminou com 'deixa amanhã aqui pra avaliarmos'. O serviço nem iniciou. OS Aberta."
    },
    { 
      "id": 2546, 
      "cliente": "A.Dantas",
      "score": 90,
      "gatekeeper": "PASS (Finalizada / Carro Liberado)",
      "falhas": [
        {
          "regra": "Faltou 4b: Pedir Avaliação do Google",
          "nota": -10,
          "quote_evidence": "Buscando 'google.com/search' em todo o texto final. Resultado Nulo."
        }
      ],
      "resumo": "✅ AUDITADA: Conversa extensa lida do início ao fim. O cliente A.Dantas achou caro o orçamento de 700 da termostática e optou por não fazer agora. Retirou o carro. O gerente atendeu super bem, mandou vídeos completos com narração transcrita e ambos checklists (entrada e garantia)."
    }
  ]
};

let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pipeline de Auditoria (Brute Force Reading) - Jorge Beretta</title>
    <style>
        body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #e2e8f0; padding: 30px; line-height: 1.6; }
        h1 { text-align: center; color: #38bdf8; margin-bottom: 5px; font-size: 2.5em; text-transform: uppercase; letter-spacing: 2px;}
        h3 { text-align: center; color: #94a3b8; font-weight: 400; margin-top: 0; margin-bottom: 40px;}
        .unit-container { background-color: #1e293b; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.6); border: 1px solid #334155; }
        .conv-card { background-color: #0f172a; border-left: 6px solid #ef4444; padding: 20px; margin-bottom: 20px; border-radius: 8px;}
        .conv-card.blocked { border-left: 6px solid #64748b; opacity: 0.7; }
        .conv-card.good { border-left: 6px solid #22c55e; }
        .conv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #1e293b; padding-bottom: 10px;}
        .customer-name { font-size: 1.3em; color: #f8fafc; font-weight: 500;}
        .gatekeeper-badge { font-size: 0.8em; background-color: #64748b; color: #fff; padding: 3px 8px; border-radius: 4px; font-weight: 800; margin-left: 10px; }
        .gatekeeper-badge.pass { background-color: #22c55e; color: #000; }
        .summary-box { background-color: #1e293b; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 3px solid #ef4444;}
        .summary-box.blocked { border-left: 3px solid #64748b; }
        .summary-box.good { border-left: 3px solid #22c55e; }
        .falha-box { margin-bottom: 15px; background: #182335; padding: 10px; border-radius: 6px; border-left: 3px solid #f59e0b; }
        .falha-regra { color: #fca5a5; font-weight: bold; }
        .quote { font-family: monospace; color: #94a3b8; margin-top: 5px; font-style: italic; background: #0b0f19; padding: 5px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Lixeira do Gatekeeper e Bottom-3</h1>
    <h3>Varredura Total: Jorge Beretta (Leitura Completa)</h3>
`;

for (const [unit, convs] of Object.entries(relatorio)) {
    html += `\n    <div class="unit-container">`;
    
    // Sort to put Blocked at top, then score
    convs.sort((a,b) => a.score - b.score);
    
    for (const conv of convs) {
        const isBlocked = conv.gatekeeper.includes('BLOCKED');
        const cardClass = isBlocked ? 'blocked' : (conv.score >= 80 ? 'good' : '');
        const badgeClass = isBlocked ? '' : 'pass';
        
        html += `
        <div class="conv-card ${cardClass}">
            <div class="conv-header">
                <span class="customer-name">👤 ${conv.cliente} (#${conv.id}) <span class="gatekeeper-badge ${badgeClass}">${conv.gatekeeper}</span></span>
                ${!isBlocked ? `<span style="font-size: 1.5em; font-weight: 800; color: #22c55e;">Score: ${conv.score}</span>` : ''}
            </div>
            
            <div class="summary-box ${cardClass}">
                <strong>🤖 Veredito (Leitura Bruta):</strong> ${conv.resumo}
            </div>

            ${conv.falhas.length > 0 ? `
            <strong>❌ Falhas:</strong>
            <div>
                ${conv.falhas.map(f => `
                    <div class="falha-box">
                        <div class="falha-regra">${f.regra} (${f.nota} pts)</div>
                        <div class="quote">📜 Evidência Extraída: ${f.quote_evidence}</div>
                    </div>
                `).join('')}
            </div>` : ''}
        </div>`;
    }
    html += `\n    </div>`;
}

html += `</body></html>`;

fs.writeFileSync('Relatorio_Jorge_Beretta_Full_Read.html', html);
console.log('Relatório Full Read gerado!');
