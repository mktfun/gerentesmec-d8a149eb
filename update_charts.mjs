import fs from 'fs';
import path from 'path';

const DIR = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const files = fs.readdirSync(DIR).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

for (const f of files) {
    const fullPath = path.join(DIR, f);
    let html = fs.readFileSync(fullPath, 'utf8');

    const cats = [
        { name: "Recebimento e Diagnóstico", rx: /1\.\s*Recebimento/i, total: 0, yes: 0, rules: {} },
        { name: "Orçamento e Aprovação", rx: /2\.\s*Orçamento/i, total: 0, yes: 0, rules: {} },
        { name: "Checklist / Up-sell", rx: /3\.\s*Checklist/i, total: 0, yes: 0, rules: {} },
        { name: "Encerramento + Review", rx: /4\.\s*Encerramento/i, total: 0, yes: 0, rules: {} }
    ];

    let currentCat = -1;
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    while ((match = trRegex.exec(html)) !== null) {
        const trContent = match[1];
        const catMatch = trContent.match(/class="c-cat"[^>]*>([^<]+)</);
        
        if (catMatch) {
            const text = catMatch[1];
            currentCat = cats.findIndex(c => c.rx.test(text));
        } else if (currentCat !== -1) {
            const statusMatch = trContent.match(/class="c-status([^"]*)"/);
            const ruleMatch = trContent.match(/class="c-regra"[^>]*>([^:]+):([^<]+)/);
            
            if (statusMatch && ruleMatch) {
                const ruleId = ruleMatch[1].trim(); 
                const ruleText = ruleMatch[2].trim();
                const isYes = statusMatch[1].includes('yes');
                
                cats[currentCat].total++;
                if (isYes) cats[currentCat].yes++;
                
                if (!cats[currentCat].rules[ruleId]) {
                    cats[currentCat].rules[ruleId] = { text: ruleText, total: 0, yes: 0 };
                }
                cats[currentCat].rules[ruleId].total++;
                if (isYes) cats[currentCat].rules[ruleId].yes++;
            }
        }
    }

    let chartHtml = `
    <!-- GRAFICO LATERAL -->
    <div class="chart-box" style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); width: 360px; flex-shrink: 0; align-self: stretch;">
        <h3 style="margin-top: 0; color: #1e293b; font-size: 1.05rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 20px;">Média por Pilar e Regras</h3>`;
    
    cats.forEach((cat) => {
        const pct = cat.total > 0 ? Math.round((cat.yes / cat.total) * 100) : 0;
        const color = pct < 40 ? '#ef4444' : (pct < 70 ? '#f59e0b' : '#10b981'); 
        
        chartHtml += `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px; font-weight: 700; color: #334155;">
                <span>${cat.name}</span>
                <span style="color: ${color};">${pct}%</span>
            </div>
            <div style="background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 8px;">
                <div style="background: ${color}; width: ${pct}%; height: 100%;"></div>
            </div>
            <div style="font-size: 0.75rem; color: #64748b; background: #f8fafc; padding: 6px 10px; border-radius: 4px; border: 1px dashed #cbd5e1;">`;
            
        for (const [ruleId, r] of Object.entries(cat.rules)) {
            const rPct = r.total > 0 ? Math.round((r.yes / r.total) * 100) : 0;
            const rIcon = rPct >= 70 ? '🟢' : (rPct >= 40 ? '🟡' : '🔴');
            const truncatedText = r.text.length > 25 ? r.text.substring(0, 25) + '...' : r.text;
            chartHtml += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span>${rIcon} <strong>${ruleId}</strong>: <span title="${r.text}">${truncatedText}</span></span>
                    <strong style="color: #475569;">${rPct}%</strong>
                </div>`;
        }
        chartHtml += `</div></div>`;
    });
    chartHtml += `</div>\n<!-- FIM GRAFICO LATERAL -->`;

    // Substituir o gráfico antigo pelo novo
    // A Regex vai encontrar a tag do GRAFICO LATERAL que adicionei antes, até o fechamento dela.
    // Como a anterior terminava sem FIM GRAFICO LATERAL, pego até a </div> que antecede o final do flexbox.
    
    // Expressão regular complexa para pegar tudo de <!-- GRAFICO LATERAL --> até a </div> correspondente.
    // Usamos lookahead positivo para parar antes de fechar a main flex ou bater num comentario
    const regex = /<!-- GRAFICO LATERAL -->[\s\S]*?(?=<\/div>\s*<\/div>\s*(?:<!--|<h2|<div class="conv-card"))/i;
    
    // Se o regex falhar, significa q o HTML tá um pouco diferente em alguma quebra de linha. 
    // Vamos procurar puramente com a substituição do conteúdo de <div class="chart-box"...
    const replaceRegex = /<!-- GRAFICO LATERAL -->[\s\S]*?class="chart-box"[\s\S]*?<\/div>(\s*<\/div>\s*<!--)?/i;
    // Pior caso: como eu sei que a div chart-box n tem filhas grandes alem do loop... wait, it has inner divs! 
    
    // O ideal é pegar tudo de <!-- GRAFICO LATERAL --> até o FINAL do arquivo, e achar a ultima div do chart
    // Vou usar indexOf para cortar certinho
    
    const startIdx = html.indexOf('<!-- GRAFICO LATERAL -->');
    if (startIdx !== -1) {
        // Encontra o proximo <div class="conv-card"> ou <!-- Cliente 
        let endMatch1 = html.indexOf('<!-- Cliente', startIdx);
        let endMatch2 = html.indexOf('<div class="conv-card">', startIdx + 50); // Pular o primeiro se for muito perto? Não
        let endMatch3 = html.indexOf('<h2', startIdx + 50); // em caso de Dossiê no meio (Painel Comparativo - n vai ter GRAFICO LATERAL la)
        
        // Pega o menor index válido
        const valids = [endMatch1, endMatch2, endMatch3].filter(i => i > startIdx);
        const endIdxRaw = Math.min(...valids);
        
        if (endIdxRaw > startIdx) {
            // O fechamento do flex container </div> fica antes do <!-- Cliente.
            // Precisamos cortar desde startIdx até antes do </div> final do flex (que é uns 10 chars pra tras de endIdxRaw).
            // Para não quebrar a estrutura, achamos a tag </div> imediatamente antes do endIdxRaw
            let endIdx = html.lastIndexOf('</div>', endIdxRaw - 1);
            if (endIdx > startIdx) {
                html = html.substring(0, startIdx) + chartHtml + '\n' + html.substring(endIdx); // O script anterior não tinha a div final englobada
                fs.writeFileSync(fullPath, html);
                console.log(`[+] Chart Detalhado Atualizado em ${f}`);
            }
        }
    }
}
