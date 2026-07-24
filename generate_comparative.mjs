import fs from 'fs';
import path from 'path';

const DIR = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const factsFile = path.join(DIR, 'facts.json');
const factsData = fs.existsSync(factsFile) ? JSON.parse(fs.readFileSync(factsFile, 'utf8')) : {};

const files = fs.readdirSync(DIR).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

const shops = [];

for (const f of files) {
    const html = fs.readFileSync(path.join(DIR, f), 'utf8');
    let name = f.replace('Relatorio_Semantico_', '').replace('.html', '').replace(/_/g, ' ');
    const titleMatch = html.match(/<title>.*?-\s*([^<]+)<\/title>/i);
    if (titleMatch) name = titleMatch[1].trim();
    
    const scoreMatch = html.match(/Score\s+m.dio[^\d]*(\d+)%/i);
    let score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
    
    let granularHtml = '';
    const startIdx = html.indexOf('<!-- GRAFICO LATERAL -->');
    const endIdx = html.indexOf('<!-- FIM GRAFICO LATERAL -->');
    if (startIdx !== -1 && endIdx !== -1) {
        granularHtml = html.substring(startIdx + '<!-- GRAFICO LATERAL -->'.length, endIdx).trim();
        granularHtml = granularHtml.replace(/width:\s*360px;?/gi, 'width: 100%; max-width: 100%; box-sizing: border-box;');
        granularHtml = granularHtml.replace(/border:\s*1px solid #cbd5e1;?/gi, 'border: none;');
        granularHtml = granularHtml.replace(/box-shadow:[^;]+;?/gi, 'box-shadow: none;');
        granularHtml = granularHtml.replace(/background:\s*white;?/gi, 'background: transparent;');
        granularHtml = granularHtml.replace(/<h3[^>]*>.*?<\/h3>/i, ''); 
        
        // Remove tamanhos fixos pra nao estourar a impressao
        granularHtml = granularHtml.replace(/font-size:\s*0\.75rem;/gi, 'font-size: 11px;');
        granularHtml = granularHtml.replace(/font-size:\s*0\.9rem;/gi, 'font-size: 13px;');
    }

    shops.push({ name, file: f, score, key: f, granularHtml });
}

shops.sort((a, b) => b.score - a.score);

let cardsHtml = '';
shops.forEach((s, i) => {
    let colorClass = '#dc2626'; 
    if (s.score >= 80) colorClass = '#16a34a'; 
    else if (s.score >= 50) colorClass = '#ca8a04'; 

    let rankMedal = `${i + 1}º`;
    if (i === 0) rankMedal = '🥇 1º';
    if (i === 1) rankMedal = '🥈 2º';
    if (i === 2) rankMedal = '🥉 3º';

    const data = factsData[s.key] || { fortalezas: [], fraquezas: [] };
    const fortes = data.fortalezas.slice(0, 3).map(x => `
        <li style="margin-bottom:8px; line-height:1.3; font-size: 13px;">
            <strong style="color:#065f46">Regra ${x.rule} (${x.pct}%):</strong> 
            <span style="color:#475569; font-style:italic;">"${x.proof}"</span>
        </li>
    `).join('');
    
    const fracos = data.fraquezas.slice(0, 3).map(x => `
        <li style="margin-bottom:8px; line-height:1.3; font-size: 13px;">
            <strong style="color:#991b1b">Regra ${x.rule} (${x.pct}%):</strong> 
            <span style="color:#475569; font-style:italic;">"${x.proof}"</span>
        </li>
    `).join('');

    cardsHtml += `
    <div class="card-container" style="background: white; border: 1px solid #e2e8f0; border-left: 6px solid ${colorClass}; border-radius: 8px; padding: 25px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); box-sizing: border-box;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 15px;">
            <div>
                <div style="font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Posição Ranking: ${rankMedal}</div>
                <h2 style="margin: 5px 0 0 0; color: #0f172a; font-size: 24px;">${s.name}</h2>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 32px; font-weight: bold; color: ${colorClass}; line-height: 1;">${s.score}%</div>
                <div style="color: #64748b; font-size: 12px; margin-top: 5px;">Score Global</div>
            </div>
        </div>

        <div class="grid-wrapper">
            <!-- Lado Esquerdo: Visão Granular do HTML original -->
            <div class="left-col" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; box-sizing: border-box; overflow: hidden;">
                <h4 style="margin: 0 0 15px 0; color: #334155; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Detalhamento Granular por Regra</h4>
                ${s.granularHtml}
                <div class="no-print" style="margin-top: 20px; text-align: center;">
                    <a href="./${s.file}" target="_blank" style="display: inline-block; background: #1e293b; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500; transition: background 0.2s;">📄 Abrir Históricos Completos no Dossiê</a>
                </div>
            </div>

            <!-- Lado Direito: Provas e Fatos -->
            <div class="right-col" style="box-sizing: border-box; padding-top: 10px;">
                <div style="margin-bottom: 25px;">
                    <h4 style="margin: 0 0 10px 0; color: #065f46; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Destaques Operacionais (Evidências)</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${fortes || '<li style="color:#64748b;font-style:italic;">Dados de evidência insuficientes na amostragem.</li>'}
                    </ul>
                </div>
                <div>
                    <h4 style="margin: 0 0 10px 0; color: #991b1b; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Gargalos Críticos (Evidências)</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${fracos || '<li style="color:#64748b;font-style:italic;">Nenhuma quebra crítica de processo constante.</li>'}
                    </ul>
                </div>
            </div>
        </div>

    </div>
    `;
});

const dashboardHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Ranking Comparativo - Rede</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', 'Segoe UI', sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px; }
        .container { max-width: 1100px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 50px; }
        .header h1 { font-size: 2.5rem; color: #0f172a; margin-bottom: 10px; }
        .header p { color: #64748b; font-size: 1.1rem; }
        
        /* Flexbox Responsivo e Protetor no Tela Inteira */
        .grid-wrapper { display: flex; gap: 30px; align-items: stretch; }
        .left-col { flex: 1; min-width: 0; }
        .right-col { flex: 1; min-width: 0; }
        
        /* Modificadores de Impressão PDF Rigorosos */
        @media print {
            body { 
                background: white; 
                padding: 0 !important; 
                margin: 0;
            }
            .header { margin-bottom: 20px; }
            .header h1 { font-size: 24px; }
            .header p { font-size: 14px; }
            
            /* Impede que o PDF corte os cards pela metade */
            .card-container { 
                page-break-inside: avoid !important;
                margin-bottom: 20px !important;
                border: 1px solid #ccc !important;
                box-shadow: none !important;
                padding: 15px !important;
            }
            
            /* No papel, a leitura fica melhor em bloco se estiver estourando */
            .grid-wrapper {
                display: block !important;
            }
            .left-col { 
                margin-bottom: 20px;
                border: none !important;
                padding: 0 !important;
            }
            .right-col { margin-bottom: 0; }
            
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Ranking Comparativo</h1>
            <p>Relatório Consolidado de Qualidade de Atendimento. Painel gerencial e detalhamento de etapas de retenção.</p>
        </div>
        <div class="ranking-list">
            ${cardsHtml}
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync(path.join(DIR, 'Painel_Comparativo_Rede.html'), dashboardHtml);
console.log('[+] Painel Comparativo Reconstruído com CSS de Print Arrumado!');
