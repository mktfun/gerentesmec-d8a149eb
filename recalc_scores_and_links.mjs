import fs from 'fs';
import path from 'path';

const DIR_PAINEL = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const DIR_BASE = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec';

// Mapa de Nomes para ID
const nameToIdMap = new Map();
const subdirs = fs.readdirSync(DIR_BASE);
for (const sub of subdirs) {
    if (sub.startsWith('conversas_') || sub === '_historico_scripts') {
        const targetDir = sub === '_historico_scripts' ? path.join(DIR_BASE, '_historico_scripts', 'conversas_jorge_beretta_FULL_PERIOD') : path.join(DIR_BASE, sub);
        if (fs.existsSync(targetDir)) {
            const files = fs.readdirSync(targetDir);
            for (const f of files) {
                const match = f.match(/Conv_(\d+)_/);
                if (match) {
                    const content = fs.readFileSync(path.join(targetDir, f), 'utf-8');
                    const cMatch = content.match(/CLIENTE:\s*(.+)/i);
                    if (cMatch) {
                        const rName = cMatch[1].trim();
                        const nName = rName.replace(/[\u1000-\uFFFF]/g, '').trim().toLowerCase();
                        if (nName.length >= 3) nameToIdMap.set(nName, match[1]);
                        if (rName.length >= 3) nameToIdMap.set(rName.trim().toLowerCase(), match[1]);
                    }
                }
            }
        }
    }
}

function findId(htmlName) {
    let s = htmlName.replace(/Cliente:\s*/i, '').trim().toLowerCase();
    const idM = s.match(/\(id:\s*(\d+)\)/i);
    if (idM) return idM[1];
    s = s.replace(/[\u1000-\uFFFF]/g, '').trim().replace(/\(id:\s*\d+\)/i, '').trim();
    if (nameToIdMap.has(s)) return nameToIdMap.get(s);
    for (const [k, id] of nameToIdMap.entries()) {
        if (k.length >= 3 && s.length >= 3 && (k.includes(s) || s.includes(k))) return id;
    }
    return null;
}

const files = fs.readdirSync(DIR_PAINEL).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

for (const f of files) {
    const p = path.join(DIR_PAINEL, f);
    let html = fs.readFileSync(p, 'utf8');

    // 1. Quebra por blocos conv-card
    const parts = html.split('<div class="conv-card"');
    let newParts = [parts[0]];

    for (let i = 1; i < parts.length; i++) {
        let block = '<div class="conv-card"' + parts[i];
        
        if (block.includes('<!-- DOSSIÊ EXECUTIVO -->') || block.includes('Resumo de Postura')) {
            newParts.push(block);
            continue;
        }

        // Recalcular Score
        const matchYes = block.match(/<td class="c-status yes">✅ SIM<\/td>/gi);
        const matchNo = block.match(/<td class="c-status no">❌ NÃO<\/td>/gi);
        const totalYes = matchYes ? matchYes.length : 0;
        const totalNo = matchNo ? matchNo.length : 0;
        const total = totalYes + totalNo;

        if (total > 0) {
            const pct = Math.round((totalYes / total) * 100);
            let sClass = 's-red';
            if (pct >= 80) sClass = 's-green';
            else if (pct >= 50) sClass = 's-yellow';

            const newBadge = `<span class="score-badge ${sClass}">Score: ${pct}% (${totalYes} de ${total} Acertos)</span>`;
            block = block.replace(/<span class="score-badge[^>]*>Score:.*?<\/span>/i, newBadge);
        }

        // Corrigir Botão Chatwoot
        const clientMatch = block.match(/<span class="client-info"[^>]*>([^<]+)<\/span>/i);
        if (clientMatch) {
            const nomeStr = clientMatch[1];
            const foundId = findId(nomeStr);
            
            // Garantir que a tag do ID também apareça na string (se não existir)
            if (foundId && !nomeStr.includes(`(ID: ${foundId})`)) {
                block = block.replace(clientMatch[0], `<span class="client-info">${nomeStr} (ID: ${foundId})</span>`);
            }

            // Tem a âncora a seguir?
            const aMatch = block.match(/<a href="https:\/\/chat.tork.services[^>]*>🔗 Abrir no Chatwoot<\/a>/i);
            
            if (!aMatch && foundId) {
                // Inserir ao lado da span
                const newSpan = `<span class="client-info">${nomeStr}${nomeStr.includes(`ID:`) ? '' : ` (ID: ${foundId})`}</span>`;
                const btn = `<a href="https://chat.tork.services/app/accounts/6/conversations/${foundId}" target="_blank" class="btn-link" style="margin-left: 15px; font-size: 0.9rem; font-weight: normal; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; text-decoration: none; border: 1px solid #bae6fd;">🔗 Abrir no Chatwoot</a>`;
                
                // Cuidado se o nomeStr já foi substituído na linha acima, buscar regex genérico
                block = block.replace(/<span class="client-info"[^>]*>([^<]+)<\/span>/i, `${newSpan}${btn}`);
            }
        }
        
        newParts.push(block);
    }
    
    fs.writeFileSync(p, newParts.join(''));
    console.log(`[+] Score recalculado e Chatwoot linkado em ${f}`);
}
