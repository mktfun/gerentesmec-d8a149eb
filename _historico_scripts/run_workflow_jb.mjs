import fs from 'fs';

// Workflow /vibe-auditoria executado pelo Agente Mestre
// Unidade: JORGE BERETTA
// Fase 1: Extrator Top 50 (Concluída - chatwoot_june_v5_full.json)
// Fase 2: Gatekeeper Booleano (Aplicado: Michel e Neto removidos pois a OS não acabou)
// Fase 3: Auditor Anti-Alucinação (Aplicado com Quote-based Evidence)

const relatorio = {
  "JORGE BERETTA": [
    { 
      "id": 2560, 
      "cliente": "Daniel",
      "score": 35,
      "gatekeeper": "PASS (Finalizado)",
      "falhas": [
        {
          "regra": "Faltou 2b: Enviou vídeo defeito",
          "nota": -10,
          "quote_evidence": "(Arquivo/Mídia anexado) - LLM leu os anexos, porém em nenhum momento o Gerente explicou em texto ou áudio transcrito o que era o vídeo. O protocolo exige explicar o vídeo."
        },
        {
          "regra": "Faltou 1b: Registrou resumo do acordado",
          "nota": -10,
          "quote_evidence": "\"Ficou 7.600\" - LLM acusa falha porque apenas jogar o valor final não resume o serviço acordado."
        }
      ],
      "resumo": "⚠️ GATEKEEPER PASS: OS encerrada/negociada. AUDITORIA: Orçamento alto jogado de forma abrupta (\"Ficou 7.600\"). Falta de clareza na explicação dos itens cobrados."
    },
    { 
      "id": 3664, 
      "cliente": "Gerson",
      "score": 40,
      "gatekeeper": "PASS (Finalizado)",
      "falhas": [
        {
          "regra": "Faltou 2e: Obteve aprovação explícita (sim/ok)",
          "nota": -10,
          "quote_evidence": "O cliente disse \"Eixo cardan da capitiva a base de troca fica 1.400\", o gerente respondeu \"Pode ser tipo assim\". Não houve a captura da palavra \"Aprovado\" ou \"Pode fazer\" por parte do cliente para segurança jurídica."
        },
        {
          "regra": "Faltou 2d: Enviou link checklist",
          "nota": -8,
          "quote_evidence": "Buscando pela string 'http' ou '.aspx' no texto da oficina. Resultado nulo. Não enviado."
        }
      ],
      "resumo": "⚠️ GATEKEEPER PASS: OS encerrada. AUDITORIA: Falha crítica de compliance. O Gerente não exigiu a aprovação textual explícita do cliente após orçar o Eixo Cardan."
    },
    { 
      "id": 3089, 
      "cliente": "Erivan",
      "score": 50,
      "gatekeeper": "PASS (Finalizado)",
      "falhas": [
        {
          "regra": "Faltou 1a: Cordial/respeitoso na recepção",
          "nota": -8,
          "quote_evidence": "O cliente clamou: \"Preciso que você resolva por favor qualquer coisa vc pode mim liga amanhã\" e o gerente apenas soltou uma mensagem genérica sem empatia ao problema recorrente."
        }
      ],
      "resumo": "⚠️ GATEKEEPER PASS: Carro liberado/Problema reportado como crônico. AUDITORIA: Falha na empatia e documentação textual do diagnóstico."
    }
  ]
};

let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pipeline de Auditoria Mestre - Jorge Beretta</title>
    <style>
        body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #e2e8f0; padding: 30px; line-height: 1.6; }
        h1 { text-align: center; color: #38bdf8; margin-bottom: 5px; font-size: 2.5em; text-transform: uppercase; letter-spacing: 2px;}
        h3 { text-align: center; color: #94a3b8; font-weight: 400; margin-top: 0; margin-bottom: 40px;}
        .unit-container { background-color: #1e293b; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.6); border: 1px solid #334155; }
        .unit-title { font-size: 1.6em; border-bottom: 2px solid #334155; padding-bottom: 15px; margin-bottom: 25px; color: #38bdf8; font-weight: 600;}
        .conv-card { background-color: #0f172a; border-left: 6px solid #ef4444; padding: 20px; margin-bottom: 20px; border-radius: 8px; position: relative;}
        .conv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #1e293b; padding-bottom: 10px;}
        .customer-name { font-size: 1.3em; color: #f8fafc; font-weight: 500;}
        .score { font-size: 1.5em; font-weight: 800; color: #ef4444; background: #450a0a; padding: 4px 10px; border-radius: 6px;}
        .gatekeeper-badge { font-size: 0.8em; background-color: #22c55e; color: #000; padding: 3px 8px; border-radius: 4px; font-weight: 800; margin-left: 10px; }
        .summary-box { background-color: #1e293b; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 3px solid #ef4444;}
        .falha-box { margin-bottom: 15px; background: #182335; padding: 10px; border-radius: 6px; border-left: 3px solid #f59e0b; }
        .falha-regra { color: #fca5a5; font-weight: bold; }
        .quote { font-family: monospace; color: #94a3b8; margin-top: 5px; font-style: italic; background: #0b0f19; padding: 5px; border-radius: 4px; }
        .btn { display: inline-flex; align-items: center; background-color: #0ea5e9; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin-top: 15px; font-weight: 600; transition: all 0.2s;}
        .btn:hover { background-color: #0284c7; transform: translateY(-2px); }
    </style>
</head>
<body>
    <h1>Painel de Governança (Zero Alucinação)</h1>
    <h3>Unidade: Jorge Beretta | Apenas Bottom-3 Validadas</h3>
`;

for (const [unit, convs] of Object.entries(relatorio)) {
    html += `\n    <div class="unit-container">\n        <div class="unit-title">🏢 ${unit}</div>`;
    
    convs.sort((a,b) => a.score - b.score);
    
    for (const conv of convs) {
        html += `
        <div class="conv-card">
            <div class="conv-header">
                <span class="customer-name">👤 Cliente: ${conv.cliente} <span style="font-size: 0.7em; color: #64748b;">(#${conv.id})</span> <span class="gatekeeper-badge">${conv.gatekeeper}</span></span>
                <span class="score">Score: ${conv.score}</span>
            </div>
            
            <div class="summary-box">
                <strong>🤖 Veredito da IA (Mestre):</strong> ${conv.resumo}
            </div>

            <strong>❌ Falhas (Evidências Quote-Based):</strong>
            <div>
                ${conv.falhas.map(f => `
                    <div class="falha-box">
                        <div class="falha-regra">${f.regra} (${f.nota} pts)</div>
                        <div class="quote">📜 Evidência Extraída: ${f.quote_evidence}</div>
                    </div>
                `).join('')}
            </div>
            <a class="btn" href="https://chat.tork.services/app/accounts/5/conversations/${conv.id}" target="_blank">🔍 Abrir no Chatwoot</a>
        </div>`;
    }
    html += `\n    </div>`;
}

html += `
</body>
</html>
`;

fs.writeFileSync('Relatorio_Jorge_Beretta_Final.html', html);
console.log('Relatório Final gerado!');
