import fs from 'fs';

const CHATWOOT_URL = "https://chat.tork.services/app/accounts/5/conversations";

const relatorio = [
  {
    id: 3646,
    cliente: "Michel",
    score: 0,
    falhas: [
      {
        regra: "Promessa de Prazo Irreal / Pressão Financeira (Coação)",
        quote: "[27/06/2026 11:03] [Cliente]: O grande problema amigo e que vcs ficaram me pressionando pra pagar a entrada e falou que entregaria no dia seguinte eu fiz um corre danado pra conseguir o dinheiro (...) Cara estou muito chateado com isso"
      },
      {
        regra: "Falta de Tato Comercial",
        quote: "[26/06/2026 11:53] [Gerente]: O senhor consegue fazer pix? | A cobrança de 60% foi forçada repetidas vezes enquanto o cliente relatava limite baixo."
      }
    ],
    resumo: "🚨 DESASTRE DE RETENÇÃO (20/06 a 27/06). A sua análise foi precisa. O gerente focou apenas no pagamento imediato (60% de 4.888) usando a desculpa de pedir peças. O cliente se desdobrou, e na hora H, o gerente empurrou a entrega para a segunda-feira, quebrando a confiança."
  },
  {
    id: 3248,
    cliente: "Willian Martins",
    score: 20,
    falhas: [
      {
        regra: "Falta de Cordialidade / Hostilidade Burocrática",
        quote: "[19/06/2026 09:06] [Gerente]: Caso a peça não seja entregue até esse momento, passarão a ser aplicadas as condições de permanência previstas... | O gerente tratou o cliente como um transtorno, ameaçando cobrar pátio se a peça do mercado livre não chegasse em 48h."
      },
      {
        regra: "Dissonância de Relacionamento (Só pensa em dinheiro)",
        quote: "[18/06/2026 17:15] [Gerente]: Está em histórico acima nas conversas | Ao invés de tentar confortar o cliente que já estava assustado com o orçamento, o gerente o atacou jogando regras de contrato na cara dele."
      }
    ],
    resumo: "🚨 ALERTA VERMELHO (17/06 a 24/06). Você cravou. O cara queria fugir do preço abusivo comprando peças fora, e o gerente o tratou como estorvo. Ameaçou cobrar diária de pátio e forçou o limite. Venda feita, mas cliente jamais voltará."
  },
  {
    id: 2650,
    cliente: "Murillo Beluchi",
    score: 50,
    falhas: [
      {
        regra: "Serviço Iniciado sem Cobertura Financeira do Cliente",
        quote: "[05/06/2026 14:47] [Gerente]: vi agora a mensagem desculpe o mecânico já havia dado andamento ao serviço | O cliente estava literalmente chorando por limite de cartão pedindo pra segurar, e o gerente executou."
      },
      {
        regra: "Automatização Sem Tato",
        quote: "[06/06/2026 14:03] [Gerente]: Oi Murilo a avaliação foi para a unidade errada depois se conseguir fazer aqui... | Copia e cola preguiçoso do link do Google sem nenhum tipo de calor humano."
      }
    ],
    resumo: "⚠️ RISCO DE NÃO PAGAMENTO (05/06 a 06/06). Como você observou, o robô anterior falhou. O gerente cometeu o erro fatal de autorizar mecânico sem o cliente confirmar que tinha grana. Depois tentou remediar sendo seco."
  },
  {
    id: 2682,
    cliente: "Karina",
    score: 60,
    falhas: [
      {
        regra: "Frieza e Comunicação Robótica",
        quote: "[05/06/2026 16:26] [Cliente]: Meu Deus / Não tem o q fazer né? | A cliente entrou em desespero ao receber o orçamento do cabeçote (tampa empenada), e o gerente não deu nenhuma palavra de apoio, apenas um sim seco."
      }
    ],
    resumo: "⚠️ ATENDIMENTO SECO (05/06 a 06/06). Cumpriu todas as etapas burocráticas (orçamento, vídeo, links). Porém, nota-se 0 empatia. Na hora do impacto financeiro, deixou a cliente processar a dor sozinha."
  },
  {
    id: 2559,
    cliente: "Cayo Carvalho",
    score: 75,
    falhas: [
      {
        regra: "Falta de Rapport no Fechamento",
        quote: "[06/06/2026 10:52] [Gerente]: R$1.736,80 | Resposta extremamente seca para um orçamento. Não houve explicação dos benefícios ou das quebras do custo."
      }
    ],
    resumo: "✅ ATENDIMENTO MEDIANO (03/06 a 06/06). Gerente seguiu as diretrizes básicas. Aprovou peças a tempo, porém falhou na construção de proximidade durante o envio de orçamentos, parecendo um caixa de supermercado."
  },
  {
    id: 3231,
    cliente: "Sergio",
    score: 85,
    falhas: [
      {
        regra: "Oportunidade Perdida de Follow-Up",
        quote: "[22/06/2026 11:34] [Gerente]: Entendo, por está relacionado ao tempo frio, acompanha e vai me avisando | Como você notou, hoje já é dia 26/29 e ele simplesmente NUNCA MAIS chamou o Sergio para saber se as falhas pararam."
      }
    ],
    resumo: "🏆 ATENDIMENTO EXCELENTE - MAS INCOMPLETO (15/06 a 26/06). Você tinha razão: O gerente brilhou. O cliente deu Nota 10! Mas no momento do pós-venda, quando o cliente citou que o carro estava falhando no gelado, o gerente lavou as mãos e não fez contato ativo depois de uma semana."
  },
  {
    id: 3244,
    cliente: "Ivan",
    score: 95,
    falhas: [
      {
        regra: "Envio de Link do Google",
        quote: "O link de pesquisa de satisfação não foi enviado na entrega do dia 22/06."
      }
    ],
    resumo: "🏆 QUASE PERFEITO (16/06 a 22/06). Foi transparente, não pressionou o cliente a aprovar o freio (soube recuar e vender segurança). Conduziu maravilhosamente a retenção. Faltou o empurrão do Google."
  },
  {
    id: 3073,
    cliente: "Julio Iglesias",
    score: 100,
    falhas: [],
    resumo: "🏅 GABARITO DE PÓS-VENDA (10/06 a 29/06). A maior surpresa da auditoria. Ao contrário dos outros, o gerente ativou o cliente DUAS VEZES depois que o carro foi liberado, nos dias 15/06 e 29/06, perguntando proativamente: 'Como está o carro até o momento, tudo certo?'. Isso é fidelização de elite."
  }
];

let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8"><title>Auditoria Semântica 2.0 (8 Finais)</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #0b0f19; color: #e2e8f0; padding: 30px; }
        h1 { text-align: center; color: #3b82f6; text-transform: uppercase; font-size: 2.2rem;}
        h3 { text-align: center; color: #94a3b8; font-weight: normal; margin-bottom: 40px;}
        .conv-card { background: #0f172a; padding: 25px; margin-bottom: 25px; border-radius: 12px; border-left: 8px solid #3b82f6;}
        .card-alert { border-color: #ef4444; } .card-warn { border-color: #f59e0b; } .card-success { border-color: #10b981; }
        .score { font-weight: 800; background: #1e3a8a; padding: 5px 12px; border-radius: 6px; color: white;}
        .score.red { background: #7f1d1d; } .score.yellow { background: #78350f; } .score.green { background: #064e3b; }
        .falha-box { margin-bottom: 15px; background: #182335; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; }
        .falha-regra { color: #fca5a5; font-weight: bold; margin-bottom: 8px; display: block;}
        .quote { font-family: monospace; color: #94a3b8; font-style: italic;}
        .resumo { background-color: #1e293b; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3b82f6; line-height: 1.7;}
        a { color: #0ea5e9; font-weight: bold; text-decoration: none;} a:hover{text-decoration:underline;}
    </style>
</head>
<body>
    <h1>Visão Semântica - Auditoria Jorge Beretta</h1>
    <h3>Comprovação de Datas, Coação Financeira e Cordialidade</h3>
`;

for (const conv of relatorio) {
    let cl = "green", card = "card-success";
    if (conv.score < 60) { cl = "red"; card = "card-alert"; }
    else if (conv.score < 90) { cl = "yellow"; card = "card-warn"; }

    html += `<div class="conv-card ${card}"><h3>👤 Cliente: ${conv.cliente} | <span class="score ${cl}">Score Real: ${conv.score}/100</span></h3>`;
    html += `<div class="resumo"><strong>🧠 Visão da Conversa:</strong> ${conv.resumo}</div>`;
    
    if (conv.falhas.length > 0) {
        html += `<div>${conv.falhas.map(f => `<div class="falha-box"><span class="falha-regra">O que o algoritmo deixou passar: ${f.regra}</span><span class="quote">📜 Prova Extraída: ${f.quote}</span></div>`).join('')}</div>`;
    } else {
        html += `<p>✅ <b>Sem objeções de contato, atendimento cordato e preocupado.</b></p>`;
    }
    html += `<a href="${CHATWOOT_URL}/${conv.id}" target="_blank">🔍 Auditar no Chatwoot</a></div>`;
}
html += `</body></html>`;

fs.writeFileSync('C:/Users/admin/.gemini/antigravity/brain/a1bb7b9f-c0fc-44b5-8ab9-a96509508605/Relatorio_Semantico_Jorge_Beretta.html', html);
console.log('Painel Semântico (Humano) gerado com sucesso!');
