import fs from 'fs';
import path from 'path';

const DIR = 'C:/Users/admin/.gemini/antigravity/scratch/gerentesmec/Painel_Auditorias';
const facts = JSON.parse(fs.readFileSync(path.join(DIR, 'facts.json'), 'utf8'));

['Relatorio_Semantico_DIADEMA.html', 'Relatorio_Semantico_Jorge_Beretta.html'].forEach(f => { 
    let html = fs.readFileSync(path.join(DIR, f), 'utf8'); 
    let startIdx = html.indexOf('<!-- DOSSIÊ EXECUTIVO -->'); 
    if (startIdx === -1) {
        startIdx = html.indexOf('<div style="display: flex; gap: 20px; margin-bottom: 40px; align-items: flex-start;">');
    }
    let endIdx = html.indexOf('<!-- GRAFICO LATERAL -->'); 

    if (startIdx !== -1 && endIdx !== -1) { 
        const data = facts[f]; 
        const fortesHtml = data.fortalezas.map(x => '<p style="margin-bottom: 8px;"><strong>Regra ' + x.rule + ' (' + x.pct + '%):</strong> ' + x.proof + '</p>').join('') || '<p>Nenhuma fortaleza.</p>'; 
        const fracosHtml = data.fraquezas.map(x => '<p style="margin-bottom: 8px;"><strong>Regra ' + x.rule + ' (' + x.pct + '%):</strong> ' + x.proof + '</p>').join('') || '<p>Nenhuma fraqueza.</p>'; 

        let p = "Extremamente educado e ágil nas resoluções e envio de mídia, porém age puramente transacionalmente. Falhas de aderência a processos de OiAPI e prevenção.";
        if (f.includes('Jorge')) p = "Cordial na abertura e rápido na entrega de orçamentos, mas age predominantemente de forma reativa a problemas, com baixa ou nula insistência técnica na prevenção.";

        const newDossierHtml = `
<div class="conv-card" style="border: 2px solid var(--primary); background: #f8fafc;">
    <h2>Resumo - Unidade ${data.unit.split(' ')[0]}</h2>
    <div class="dossie-grid">
        <div class="dossie-item">
            <h3>Resumo de Postura</h3>
            <p>${p}</p>
        </div>
        <div class="dossie-item">
            <h3 class="section-title" style="color: var(--success); margin-top: 15px;">Fortalezas (O que domina)</h3>
            ${fortesHtml}
        </div>
        <div class="dossie-item" style="grid-column: 1 / -1;">
            <h3 class="section-title" style="color: var(--alert); margin-top: 15px;">Fraquezas (Onde falha)</h3>
            ${fracosHtml}
        </div>
    </div>
</div>`; 
        
        const flexWrapper = '\n    <!-- DOSSIÊ EXECUTIVO -->\n    <div style="display: flex; gap: 20px; margin-bottom: 40px; align-items: flex-start;">\n        <div style="flex: 1; margin-bottom: 0;" class="dossie-wrapper">\n            ' + newDossierHtml + '\n        </div>\n    '; 
        html = html.substring(0, startIdx) + flexWrapper + '\n    ' + html.substring(endIdx); 
        fs.writeFileSync(path.join(DIR, f), html); 
        console.log('[+] Injetado: ' + f); 
    } 
});
