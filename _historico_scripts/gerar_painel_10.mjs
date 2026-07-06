import fs from 'fs';
import path from 'path';

const DIR = 'conversas_jorge_beretta_FULL_PERIOD';
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.txt'));

const CHATWOOT_URL = "https://chat.tork.services/app/accounts/5/conversations";
let relatorioData = [];

files.forEach(file => {
    const rawTxt = fs.readFileSync(path.join(DIR, file), 'utf-8');
    const matchId = file.match(/Conv_(\d+)_/);
    if (!matchId) return;
    const convId = matchId[1];
    
    const clienteMatch = rawTxt.match(/Cliente: (.*)/);
    const clienteName = clienteMatch ? clienteMatch[1] : 'Desconhecido';

    let score = 0;
    let falhas = [];
    
    const temChecklist = rawTxt.includes('oiapi.com.br');
    if (temChecklist) {
        score += 20;
    } else {
        falhas.push({ regra: "Envio do Link de Checklist (Entrada/Saída)", deixou_de_ganhar: 20, quote_evidence: "Varredura não detectou 'oiapi.com.br'." });
    }
    
    const regexMidia = /\[Oficina \(Gerente\)\]: \(Arquivo\/Mídia anexado\)/g;
    const midias = rawTxt.match(regexMidia);
    if (midias && midias.length > 0) {
        score += 20;
    } else {
        falhas.push({ regra: "Transparência Visual (Mídias)", deixou_de_ganhar: 20, quote_evidence: "Nenhuma foto/vídeo anexada pelo gerente." });
    }

    const temOrcamento = /Orçamento nº/i.test(rawTxt) || /orcamento.pdf/i.test(rawTxt) || /orçamento/i.test(rawTxt) || /R\$/i.test(rawTxt);
    if (temOrcamento) {
        score += 20;
    } else {
        falhas.push({ regra: "Orçamento Formalizado", deixou_de_ganhar: 20, quote_evidence: "Ausência de formalização de valores ($)." });
    }

    const linkGoogle = /google\.com\/search\?q=mecanica\+popular/i.test(rawTxt);
    if (linkGoogle) {
        score += 20;
    } else {
        falhas.push({ regra: "Avaliação Google (Gatilho)", deixou_de_ganhar: 20, quote_evidence: "Link de review não foi enviado na entrega." });
    }

    const posVenda = /Como está o carro|bom final de semana|ótima semana|bom descanso|obrigado/i.test(rawTxt);
    if (posVenda) {
        score += 20;
    } else {
        falhas.push({ regra: "Pós-Venda ou Agradecimento", deixou_de_ganhar: 20, quote_evidence: "Conversa seca sem contato humanizado final." });
    }

    let resumo = "";
    if (score === 100) resumo = "🏆 ATENDIMENTO EXCELENTE: Seguiu perfeitamente as diretrizes.";
    else if (score >= 60) resumo = "⚠️ ATENDIMENTO ACEITÁVEL: Cumpriu etapas de venda mas pecou em processos vitais.";
    else resumo = "🚨 RISCO OPERACIONAL: Gerente entregou o carro fora de diversas regras (pontuação baixíssima).";

    relatorioData.push({ id: convId, cliente: clienteName, score, falhas, resumo });
});

let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8"><title>Auditoria Jorge Beretta (10 Finais)</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #0b0f19; color: #e2e8f0; padding: 30px; }
        h1 { text-align: center; color: #10b981; }
        .conv-card { background: #0f172a; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 6px solid #10b981;}
        .card-alert { border-color: #ef4444; } .card-warn { border-color: #f59e0b; }
        .score { font-weight: bold; background: #064e3b; padding: 4px; border-radius: 4px; }
        .score.red { background: #450a0a; color: #ef4444; } .score.yellow { background: #78350f; color: #f59e0b; }
        .falha-box { margin-bottom: 15px; background: #182335; padding: 10px; border-left: 3px solid #f59e0b; }
        .quote { font-family: monospace; color: #94a3b8; }
        a { color: #0ea5e9; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Painel de Auditoria de Triagem (10 OS Finais)</h1>
`;

relatorioData.sort((a,b) => a.score - b.score);
for (const conv of relatorioData) {
    let cl = "green", card = "";
    if (conv.score < 60) { cl = "red"; card = "card-alert"; }
    else if (conv.score < 100) { cl = "yellow"; card = "card-warn"; }

    html += `<div class="conv-card ${card}"><h3>👤 ${conv.cliente} | <span class="score ${cl}">Score: ${conv.score}/100</span></h3>`;
    html += `<p><strong>🤖 IA:</strong> ${conv.resumo}</p>`;
    
    if (conv.falhas.length > 0) {
        html += `<div>${conv.falhas.map(f => `<div class="falha-box"><b>Faltou: ${f.regra} (-${f.deixou_de_ganhar} pts)</b><br><span class="quote">📜 ${f.quote_evidence}</span></div>`).join('')}</div>`;
    } else {
        html += `<p>✅ <b>GABARITOU TUDO.</b></p>`;
    }
    html += `<a href="${CHATWOOT_URL}/${conv.id}" target="_blank">🔍 Abrir Conversa Histórica no Chatwoot</a></div>`;
}
html += `</body></html>`;
fs.writeFileSync('C:/Users/admin/.gemini/antigravity/brain/a1bb7b9f-c0fc-44b5-8ab9-a96509508605/Relatorio_Auditoria_Jorge_Beretta.html', html);
console.log('HTML Gerado no Brain do Agent!');
