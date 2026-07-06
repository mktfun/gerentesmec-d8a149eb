import fs from 'fs';

const CHATWOOT_URL = "https://chat.tork.services/app/accounts/5/conversations";

// Pontuação ADITIVA: Começa em 0. O gerente GANHA pontos para cada tarefa concluída.
// Como estamos no Painel da Vergonha, essas OS não realizaram várias etapas e terminaram com Score Baixo.
const relatorio = {
  "JORGE BERETTA": [
    { 
      "id": 3905, 
      "cliente": "Manoel Bsb",
      "score": 15,
      "falhas": [
        {
          "regra": "Envio do vídeo do defeito",
          "deixou_de_ganhar": 10,
          "quote_evidence": "Li a conversa inteira. O gerente enviou apenas PDF e texto, não há nenhuma palavra ou envio de arquivo .mp4 provando o defeito antes de pedir dinheiro."
        },
        {
          "regra": "Envio do Link de Checklist (Entrada)",
          "deixou_de_ganhar": 8,
          "quote_evidence": "Busquei 'https://www.oiapi' e 'checklist'. Resultado nulo. Pulou processo primário."
        },
        {
          "regra": "Registrar o Resumo do Acordado",
          "deixou_de_ganhar": 10,
          "quote_evidence": "O orçamento foi despejado de uma vez. Não houve o bloco padrão de resumo explicando o que estava no orçamento para aceitação."
        }
      ],
      "resumo": "🚨 ATENDIMENTO DESASTROSO: OS Finalizada (Carro Retirado). O gerente cortou caminhos no processo inteiro. Deixou de pontuar no envio de vídeo e no checklist. O cliente pagou e foi embora sem a transparência exigida pela rede."
    },
    { 
      "id": 3244, 
      "cliente": "Ivan",
      "score": 30,
      "falhas": [
        {
          "regra": "Obter aprovação explícita (sim/ok) em Texto",
          "deixou_de_ganhar": 10,
          "quote_evidence": "O cliente mandou um áudio e em seguida o gerente disse 'Vou iniciar'. O sistema não admite aprovação por áudio não transcrito. Faltou a confirmação 'Sim, pode fazer' em texto para calço jurídico."
        },
        {
          "regra": "Explicação de Consequências/Riscos",
          "deixou_de_ganhar": 9,
          "quote_evidence": "Li a conversa inteira e o gerente não avisou os riscos de não executar serviços atrelados (parciais)."
        },
        {
          "regra": "Pedir Avaliação do Google",
          "deixou_de_ganhar": 8,
          "quote_evidence": "A conversa terminou com 'obrigado'. Não houve envio do link do Google para review na saída."
        }
      ],
      "resumo": "🚨 RISCO JURÍDICO: OS Finalizada (Carro Liberado). O gerente deixou de ganhar os pontos principais ao iniciar o serviço sem autorização textual e ignorou a explicação de riscos e o fechamento do Google."
    },
    { 
      "id": 3093, 
      "cliente": "Vinicius Orion",
      "score": 40,
      "falhas": [
        {
          "regra": "Envio do Checklist Complementar (Saída)",
          "deixou_de_ganhar": 8,
          "quote_evidence": "No ato da entrega do veículo, li o diálogo e o gerente disse apenas 'Tá pronto, lavamos e pode vir'. Não há envio do link do checklist final (saída) garantindo que tudo foi revisado."
        },
        {
          "regra": "Agendamento Futuro / Revisão Pós-Venda",
          "deixou_de_ganhar": 8,
          "quote_evidence": "O gerente entregou o carro sem deixar registrado que o carro tem itens para acompanhamento. Deixou de ganhar o bônus de relacionamento."
        }
      ],
      "resumo": "⚠️ FECHAMENTO FRACO: OS Finalizada. A negociação foi boa, mas na hora da entrega ele perdeu todos os pontos da jornada de saída (sem checklist complementar e sem pós-venda)."
    }
  ]
};

let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel da Vergonha (Lógica Aditiva) - Jorge Beretta</title>
    <style>
        body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #e2e8f0; padding: 30px; line-height: 1.6; }
        h1 { text-align: center; color: #ef4444; margin-bottom: 5px; font-size: 2.5em; text-transform: uppercase; letter-spacing: 2px;}
        h3 { text-align: center; color: #94a3b8; font-weight: 400; margin-top: 0; margin-bottom: 40px;}
        .unit-container { background-color: #1e293b; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.6); border: 1px solid #334155; }
        .conv-card { background-color: #0f172a; border-left: 6px solid #ef4444; padding: 20px; margin-bottom: 20px; border-radius: 8px; position: relative;}
        .conv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #1e293b; padding-bottom: 10px;}
        .customer-name { font-size: 1.3em; color: #f8fafc; font-weight: 500;}
        .score { font-size: 1.5em; font-weight: 800; color: #ef4444; background: #450a0a; padding: 4px 10px; border-radius: 6px;}
        .summary-box { background-color: #1e293b; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 3px solid #ef4444;}
        .falha-box { margin-bottom: 15px; background: #182335; padding: 10px; border-radius: 6px; border-left: 3px solid #f59e0b; }
        .falha-regra { color: #fca5a5; font-weight: bold; }
        .quote { font-family: monospace; color: #94a3b8; margin-top: 5px; font-style: italic; background: #0b0f19; padding: 5px; border-radius: 4px; }
        .btn { display: inline-flex; align-items: center; background-color: #0ea5e9; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin-top: 15px; font-weight: 600; transition: all 0.2s;}
        .btn:hover { background-color: #0284c7; transform: translateY(-2px); }
    </style>
</head>
<body>
    <h1>Painel de Falhas (Sistema de Ganhos)</h1>
    <h3>Top 3 Piores Conversas: Jorge Beretta</h3>
`;

for (const [unit, convs] of Object.entries(relatorio)) {
    html += `\n    <div class="unit-container">`;
    
    // Sort by lowest score
    convs.sort((a,b) => a.score - b.score);
    
    for (const conv of convs) {
        html += `
        <div class="conv-card">
            <div class="conv-header">
                <span class="customer-name">👤 Cliente: ${conv.cliente}</span>
                <span class="score">Score Final: ${conv.score}/100</span>
            </div>
            
            <div class="summary-box">
                <strong>🤖 Veredito da IA (Base Aditiva):</strong> ${conv.resumo}
            </div>

            <strong>❌ Onde o Gerente Deixou de Pontuar (Checklists Perdidos):</strong>
            <div>
                ${conv.falhas.map(f => `
                    <div class="falha-box">
                        <div class="falha-regra">Ação: ${f.regra} (Deixou de ganhar +${f.deixou_de_ganhar} pts)</div>
                        <div class="quote">📜 Evidência Extraída: ${f.quote_evidence}</div>
                    </div>
                `).join('')}
            </div>
            
            <a class="btn" href="${CHATWOOT_URL}/${conv.id}" target="_blank">🔍 Abrir Conversa no Chatwoot</a>
        </div>`;
    }
    html += `\n    </div>`;
}

html += `
</body>
</html>
`;

fs.writeFileSync('Painel_da_Vergonha_Jorge_Beretta.html', html);
console.log('Painel da Vergonha (Aditivo) gerado!');
