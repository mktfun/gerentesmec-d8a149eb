import fs from 'fs';
import path from 'path';

const DIR = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const files = fs.readdirSync(DIR).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

const allData = {};

for (const f of files) {
    const fullPath = path.join(DIR, f);
    let html = fs.readFileSync(fullPath, 'utf8');

    // Nome da unidade
    const unitMatch = html.match(/<div class="subtitle">Unidade:\s*([^|]+)/i);
    const unitName = unitMatch ? unitMatch[1].trim() : f.replace('Relatorio_Semantico_', '').replace('.html', '');
    
    // Antigo dossiê para referência do tom
    const dossieMatch = html.match(/<div class="dossie-item">[\s\S]*?<h3>Postura[\s\S]*?<p>([\s\S]*?)<\/p>/i);
    const posturaAtual = dossieMatch ? dossieMatch[1].trim() : "Sem info";

    const rulesData = {};

    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    while ((match = trRegex.exec(html)) !== null) {
        const trContent = match[1];
        const ruleMatch = trContent.match(/class="c-regra"[^>]*>([^:]+):([^<]+)/);
        const statusMatch = trContent.match(/class="c-status([^"]*)"/);
        const justMatch = trContent.match(/class="c-just"[^>]*>([\s\S]*?)<\/td>/);
        
        if (ruleMatch && statusMatch) {
            const ruleId = ruleMatch[1].trim(); 
            const isYes = statusMatch[1].includes('yes');
            const just = justMatch ? justMatch[1].trim().replace(/<[^>]+>/g, '').replace(/\n/g, ' ') : '';
            
            if (!rulesData[ruleId]) {
                rulesData[ruleId] = { ruleId, total: 0, yes: 0, sampleYes: '', sampleNo: '' };
            }
            
            rulesData[ruleId].total++;
            if (isYes) {
                rulesData[ruleId].yes++;
                if (!rulesData[ruleId].sampleYes || just.length > rulesData[ruleId].sampleYes.length) {
                    rulesData[ruleId].sampleYes = just; // Pega a justificativa mais detalhada
                }
            } else {
                if (!rulesData[ruleId].sampleNo || just.length > rulesData[ruleId].sampleNo.length) {
                    rulesData[ruleId].sampleNo = just;
                }
            }
        }
    }

    // Calcula % de cada regra
    const rulesArray = Object.values(rulesData).map(r => ({
        ...r,
        pct: Math.round((r.yes / r.total) * 100)
    }));

    // Ordena por pior e por melhor
    rulesArray.sort((a, b) => a.pct - b.pct);
    
    // Pega as piores (as 3 piores que tenham total > 0)
    const fraquezas = rulesArray.filter(r => r.total > 0 && r.pct < 50).slice(0, 3);
    
    // Pega as melhores (as 3 melhores que tenham total > 0)
    const fortalezas = [...rulesArray].filter(r => r.total > 0 && r.pct >= 50).sort((a, b) => b.pct - a.pct).slice(0, 3);

    allData[f] = {
        unit: unitName,
        posturaAntiga: posturaAtual,
        fraquezas: fraquezas.map(f => ({ rule: f.ruleId, pct: f.pct, proof: f.sampleNo })),
        fortalezas: fortalezas.map(f => ({ rule: f.ruleId, pct: f.pct, proof: f.sampleYes }))
    };
}

fs.writeFileSync(path.join(DIR, 'facts.json'), JSON.stringify(allData, null, 2));
console.log('[+] facts.json gerado com sucesso.');
