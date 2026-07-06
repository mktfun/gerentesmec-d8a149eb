import fs from 'fs';
import path from 'path';

const DIR = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const files = fs.readdirSync(DIR).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

for (const f of files) {
    const p = path.join(DIR, f);
    let html = fs.readFileSync(p, 'utf8');

    const parts = html.split('<div class="conv-card"');
    let newParts = [parts[0]];

    for (let i = 1; i < parts.length; i++) {
        let block = '<div class="conv-card"' + parts[i];
        
        if (block.includes('<!-- DOSSIÊ EXECUTIVO -->') || block.includes('Resumo de Postura')) {
            newParts.push(block);
            continue;
        }

        // Isola o cabeçalho do card para nao mexer no resto
        const headerMatch = block.match(/<div class="card-header">([\s\S]*?)<\/div>\s*<table/i);
        if (headerMatch) {
            let header = headerMatch[1];
            
            // Exterminar todos os botoes a tag e seus duplicados implacavelmente
            header = header.replace(/<a href="https:\/\/chat\.tork\.services[^>]*>.*?<\/a>/gi, '');

            // Pegar o ID do nome
            const idMatch = header.match(/\(ID:\s*(\d+)\)/i);
            
            if (idMatch) {
                const id = idMatch[1];
                const btn = `<a href="https://chat.tork.services/app/accounts/6/conversations/${id}" target="_blank" class="btn-link no-print" style="margin-left: 15px; font-size: 0.9rem; font-weight: normal; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; text-decoration: none; border: 1px solid #bae6fd;">🔗 Abrir no Chatwoot</a>`;
                
                // Reinjetar APENAS UM logo após o span
                header = header.replace(/(<span class="client-info"[^>]*>.*?<\/span>)/i, `$1${btn}`);
            }

            block = block.replace(headerMatch[1], header);
        }
        
        newParts.push(block);
    }
    
    fs.writeFileSync(p, newParts.join(''));
    console.log(`[+] Múltiplos botões do Chatwoot exterminados e recriados em ${f}`);
}
