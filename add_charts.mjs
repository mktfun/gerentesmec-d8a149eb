import fs from 'fs';
import path from 'path';

const DIR = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const files = fs.readdirSync(DIR).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

for (const f of files) {
    const fullPath = path.join(DIR, f);
    let html = fs.readFileSync(fullPath, 'utf8');

    // Prevenir injeção dupla
    if (html.includes('Média por Pilar (Local)')) continue;

    const cats = [
        { name: "Recebimento e Diagnóstico", rx: /1\.\s*Recebimento/i, total: 0, yes: 0 },
        { name: "Orçamento e Aprovação", rx: /2\.\s*Orçamento/i, total: 0, yes: 0 },
        { name: "Checklist / Up-sell", rx: /3\.\s*Checklist/i, total: 0, yes: 0 },
        { name: "Encerramento + Review", rx: /4\.\s*Encerramento/i, total: 0, yes: 0 }
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
            if (statusMatch) {
                cats[currentCat].total++;
                if (statusMatch[1].includes('yes')) {
                    cats[currentCat].yes++;
                }
            }
        }
    }

    let chartHtml = `
    <!-- GRAFICO LATERAL -->
    <div class="chart-box" style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); width: 320px; flex-shrink: 0; align-self: stretch;">
        <h3 style="margin-top: 0; color: #1e293b; font-size: 1.05rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 20px;">Média por Pilar (Desta Unidade)</h3>`;
    
    cats.forEach((cat) => {
        const pct = cat.total > 0 ? Math.round((cat.yes / cat.total) * 100) : 0;
        const color = pct < 40 ? '#ef4444' : (pct < 70 ? '#f59e0b' : '#10b981'); 
        
        chartHtml += `
        <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; font-weight: 600; color: #475569;">
                <span>${cat.name}</span>
                <span style="color: ${color};">${pct}%</span>
            </div>
            <div style="background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden;">
                <div style="background: ${color}; width: ${pct}%; height: 100%;"></div>
            </div>
        </div>`;
    });
    chartHtml += `</div>\n`;

    // Vamos injetar o gráfico HTML usando Flexbox.
    // Primeiro, procuramos onde a tag do Dossiê começa (é o primeiro <div class="conv-card" ou dossie-card após o header).
    
    const headerSplit = html.split(/<\/div>\s*<!--/);
    // Mas pera, e se não tiver comentário? 
    // É mais seguro fazer um replace que pegue o Dossiê (que contém "Dossiê Executivo" ou "Nota Geral") e o envolva.
    
    // Vamos adicionar um estilo global temporário se não existir, mas inline já funciona.
    
    html = html.replace(/(<div class="(?:conv-card|dossie-card)"[^>]*>[\s\S]*?Dossiê Executivo[\s\S]*?)(?=\s*<div class="conv-card">|\s*<!-- Cliente|\s*<h2)/i, (dossieBlock) => {
        // Envolve o bloco do dossiê em um flex container e adiciona o gráfico
        // Mas temos que ter cuidado para não quebrar a div do dossiê. O dossiêBlock pega tudo até o próximo conv-card.
        // O dossiêBlock é a div inteira do Dossiê.
        return `<div style="display: flex; gap: 20px; margin-bottom: 40px; align-items: flex-start;">\n<div style="flex: 1; margin-bottom: 0;" class="dossie-wrapper">\n${dossieBlock.replace(/margin-bottom:\s*40px;?/g, 'margin-bottom: 0;')}\n</div>\n${chartHtml}</div>\n`;
    });

    fs.writeFileSync(fullPath, html);
    console.log(`[+] Chart adicionado em ${f}`);
}
