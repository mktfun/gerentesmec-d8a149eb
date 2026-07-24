const fs = require('fs');
const path = require('path');

const dir = './Painel_Auditorias';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

const rules = [
    { id: '1a', cat: '1. Recebimento e Diagnóstico', desc: 'Atendimento foi cordial e respeitoso?' },
    { id: '1b', cat: '1. Recebimento e Diagnóstico', desc: 'Registrou no WhatsApp acordos?' },
    { id: '2d', cat: '1. Recebimento e Diagnóstico', desc: 'Enviou link do checklist c/ defeitos?' },
    { id: '2b', cat: '1. Recebimento e Diagnóstico', desc: 'Enviou vídeo mostrando o defeito?' },
    { id: '2a', cat: '2. Orçamento e Aprovação', desc: 'Enviou o link do orçamento?' },
    { id: '2c', cat: '2. Orçamento e Aprovação', desc: 'Explicou consequências de não reparar?' },
    { id: '2e', cat: '2. Orçamento e Aprovação', desc: 'Obteve resposta de aprovação?' },
    { id: '3a', cat: '3. Checklist Mecânico / Up-sell', desc: 'Enviou checklist complementar?' },
    { id: '3b', cat: '3. Checklist Mecânico / Up-sell', desc: 'Enviou vídeo de serviços extras?' },
    { id: '3c', cat: '3. Checklist Mecânico / Up-sell', desc: 'Justificou serviços extras no texto?' },
    { id: '4a', cat: '4. Encerramento + Review', desc: 'Mensagem de agradecimento padrão?' },
    { id: '4b', cat: '4. Encerramento + Review', desc: 'Pediu avaliação no Google?' },
];

for (const f of files) {
    const fp = path.join(dir, f);
    let html = fs.readFileSync(fp, 'utf8');
    
    // Extract clients and their scores
    const clients = [];
    const clientBlocks = html.split('<div class="conv-card">').slice(1);
    
    // Some files might have `<div class="conv-card" `
    let firstCardEndIndex = html.indexOf('<!-- Cliente');
    if(firstCardEndIndex === -1) firstCardEndIndex = html.indexOf('<div class="conv-card">', 500);
    
    const initialCardHeaderStart = html.indexOf('<div class="conv-card"');
    if (initialCardHeaderStart === -1) continue;
    
    // Extract Diagnóstico Rápido
    let diagnostico = '';
    const diagMatch = html.match(/(<div[^>]*>\s*<strong>📌 Diagnóstico Rápido:<\/strong>[\s\S]*?<\/div>\s*)<\/div>/i);
    if(diagMatch) {
        diagnostico = diagMatch[1];
    } else {
        const diagMatch2 = html.match(/(<div[^>]*>\s*<strong>📌 Diagnóstico Rápido:<\/strong>[\s\S]*?<\/div>)/i);
        if(diagMatch2) diagnostico = diagMatch2[1];
    }

    // Parse clients manually
    let clientRegex = /<div class="conv-card">[\s\S]*?<span class="client-info">Cliente: (.*?)<\/span>[\s\S]*?<\/table>\s*<\/div>/g;
    let match;
    let totalAcertos = 0;
    
    while ((match = clientRegex.exec(html)) !== null) {
        const clientName = match[1].trim();
        const clientHtml = match[0];
        
        const clientRules = {};
        let acertosCliente = 0;
        
        rules.forEach(rule => {
            const ruleRegex = new RegExp(`<td class="c-regra">${rule.id}:.*?<td class="c-status (yes|no)">`, 'i');
            const ruleMatch = clientHtml.match(ruleRegex);
            if (ruleMatch) {
                const passed = ruleMatch[1] === 'yes';
                clientRules[rule.id] = passed;
                if(passed) acertosCliente++;
            } else {
                clientRules[rule.id] = false;
            }
        });
        
        totalAcertos += acertosCliente;
        clients.push({ name: clientName, rules: clientRules, total: acertosCliente });
    }
    
    if(clients.length === 0) continue; // Skip if no clients found (maybe different format)

    const totalPossivel = clients.length * 12;
    const notaGeralPercent = Math.round((totalAcertos / totalPossivel) * 100);
    let badgeClass = 's-red';
    if(notaGeralPercent >= 75) badgeClass = 's-green';
    else if(notaGeralPercent >= 50) badgeClass = 's-yellow';

    // Build the new Dossiê Executivo
    let newDossie = `
    <!-- DOSSIÊ EXECUTIVO -->
    <div class="conv-card" style="border-left: 4px solid #1e293b;">
        <div class="card-header">
            <span class="client-info">📋 Dossiê Executivo da Unidade: Tabela Analítica de Critérios</span>
            <div style="text-align:right"><span class="score-badge ${badgeClass}">Nota Geral: ${notaGeralPercent}% — ${clients.length} atendimentos auditados</span></div>
        </div>
        <div style="padding: 10px 0; overflow-x: auto;">
            <table style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.85rem; border: 1px solid var(--border); border-radius: 6px; overflow: hidden;">
                <thead>
                    <tr>
                        <th style="background-color: var(--primary); color: white; width: 6%; text-align: center; border-bottom: none; border-right: 1px solid #334155;">Regra</th>
                        <th style="background-color: var(--primary); color: white; width: 34%; text-align: left; border-bottom: none; border-right: 1px solid #334155;">Critério</th>
`;
    // Add client headers
    clients.forEach(c => {
        newDossie += `                        <th style="background-color: #334155; color: white; text-align: center; border-bottom: none; border-right: 1px solid #475569;" title="${c.name}">${c.name.split(' ')[0]}</th>\n`;
    });
    
    newDossie += `                        <th style="background-color: var(--primary); color: white; width: 10%; text-align: center; border-bottom: none;">Desempenho</th>
                    </tr>
                </thead>
                <tbody>
`;

    let currentCat = '';
    rules.forEach(rule => {
        if (rule.cat !== currentCat) {
            newDossie += `                    <tr><td colspan="${clients.length + 3}" style="background:#f1f5f9;color:var(--primary);font-size:.8rem;font-weight:bold;padding:8px 12px;text-transform:uppercase; border-bottom: 1px solid var(--border);">${rule.cat}</td></tr>\n`;
            currentCat = rule.cat;
        }
        
        let simCount = 0;
        let clientCols = '';
        clients.forEach(c => {
            const passed = c.rules[rule.id];
            if (passed) {
                simCount++;
                clientCols += `                        <td style="text-align:center; background:#dcfce7; color:#166534; font-weight:bold; border-bottom: 1px solid var(--border); border-right: 1px solid var(--border);">✅</td>\n`;
            } else {
                clientCols += `                        <td style="text-align:center; background:#fee2e2; color:#991b1b; font-weight:bold; border-bottom: 1px solid var(--border); border-right: 1px solid var(--border);">❌</td>\n`;
            }
        });
        
        const perfPercent = Math.round((simCount / clients.length) * 100);
        let perfColor = '#dc2626';
        if(perfPercent >= 75) perfColor = '#16a34a';
        else if(perfPercent >= 50) perfColor = 'var(--warn)';
        
        newDossie += `                    <tr>
                        <td style="text-align:center; font-weight:bold; color:var(--text-main); border-bottom: 1px solid var(--border); border-right: 1px solid var(--border);">${rule.id}</td>
                        <td style="border-bottom: 1px solid var(--border); border-right: 1px solid var(--border);">${rule.desc}</td>
${clientCols}                        <td style="text-align:center; font-weight:bold; background:#f8fafc; border-bottom: 1px solid var(--border);"><span style="color:${perfColor};">${perfPercent}%</span> (${simCount}/${clients.length})</td>
                    </tr>\n`;
    });

    // Tfoot
    newDossie += `                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="text-align:right; font-weight:bold; background-color: var(--primary); color: white; padding: 12px; border-right: 1px solid #334155;">Total de Acertos por Cliente:</td>\n`;
                        
    clients.forEach(c => {
        newDossie += `                        <td style="text-align:center; font-weight:bold; background-color: #334155; color: white; font-size: 1.1rem; border-right: 1px solid #475569;">${c.total}</td>\n`;
    });
    
    newDossie += `                        <td style="text-align:center; font-weight:bold; background-color: #1e293b; color: white; font-size: 1.1rem;">${notaGeralPercent}%</td>
                    </tr>
                </tfoot>
            </table>\n\n`;

    newDossie += diagnostico;
    newDossie += `\n        </div>\n    </div>`;

    // Replace old Dossie
    const firstClientMarker = html.indexOf('<div class="conv-card">');
    let replacedHtml = html.substring(0, initialCardHeaderStart) + newDossie + '\n    ' + html.substring(firstClientMarker);
    
    // FIX CSS for PDF EXACT 1 page printing
    const cssMatch = replacedHtml.match(/@media print\s*\{[\s\S]*?\}/);
    if(cssMatch) {
        const newPrintCss = `@media print { 
            body { background: white; padding: 0; }
            .conv-card { box-shadow: none; border: 1px solid #ccc; margin-bottom: 30px; }
            .btn-link { display: none; }
            .conv-card:first-of-type { page-break-inside: auto !important; page-break-before: auto !important; } 
            .conv-card:not(:first-of-type) { page-break-before: always !important; page-break-inside: avoid !important; } 
            table { page-break-inside: auto !important; } 
            tr { page-break-inside: avoid !important; } 
        }`;
        replacedHtml = replacedHtml.replace(cssMatch[0], newPrintCss);
    } else {
        // se não houver @media print (improvável), injetar antes de </style>
        replacedHtml = replacedHtml.replace('</style>', `
        @media print { 
            body { background: white; padding: 0; }
            .conv-card { box-shadow: none; border: 1px solid #ccc; margin-bottom: 30px; }
            .btn-link { display: none; }
            .conv-card:first-of-type { page-break-inside: auto !important; page-break-before: auto !important; } 
            .conv-card:not(:first-of-type) { page-break-before: always !important; page-break-inside: avoid !important; } 
            table { page-break-inside: auto !important; } 
            tr { page-break-inside: avoid !important; } 
        }
        </style>`);
    }

    fs.writeFileSync(fp, replacedHtml);
    console.log('Migrated to matrix: ' + f);
}
