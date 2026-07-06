import fs from 'fs';
import path from 'path';

const DIR_PAINEL = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const DIR_BASE = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec';

// Mapa universal de Cliente para ID
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
                    const id = match[1];
                    const content = fs.readFileSync(path.join(targetDir, f), 'utf-8');
                    const clienteMatch = content.match(/CLIENTE:\s*(.+)/i);
                    if (clienteMatch) {
                        const rawName = clienteMatch[1].trim();
                        const normalizedName = rawName.replace(/[\u1000-\uFFFF]/g, '').trim().toLowerCase();
                        if (normalizedName.length >= 3) nameToIdMap.set(normalizedName, id);
                        if (rawName.trim().length >= 3) nameToIdMap.set(rawName.trim().toLowerCase(), id); 
                    }
                }
            }
        }
    }
}

function findConversationId(clientNameInHtml) {
    let searchName = clientNameInHtml.replace(/Cliente:\s*/i, '').trim().toLowerCase();
    searchName = searchName.replace(/[\u1000-\uFFFF]/g, '').trim(); // strip emojis
    
    // Se o ID já estiver na string do nome (Ex: "Joel Menezes (ID: 1453)")
    const idMatch = searchName.match(/\(id:\s*(\d+)\)/i);
    if (idMatch) return idMatch[1];
    
    // Remover o (ID: XXXX) da string de busca para não atrapalhar
    searchName = searchName.replace(/\(id:\s*\d+\)/i, '').trim();

    if (nameToIdMap.has(searchName)) return nameToIdMap.get(searchName);
    
    // Partial match seguro
    for (const [key, id] of nameToIdMap.entries()) {
        if (key.length >= 3 && searchName.length >= 3) {
            if (key.includes(searchName) || searchName.includes(key)) {
                return id;
            }
        }
    }
    return null;
}

const htmlFiles = fs.readdirSync(DIR_PAINEL).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

for (const file of htmlFiles) {
    const fullPath = path.join(DIR_PAINEL, file);
    let html = fs.readFileSync(fullPath, 'utf-8');
    
    // O link foi injetado logo após o span. 
    // Vamos usar replace na tag <a ... btn-link ...> buscando o span que a precede para pegar o nome
    
    // Regex para pegar span + a
    const regex = /<span class="client-info"[^>]*>([^<]+)<\/span>\s*<a href="https:\/\/chat\.tork\.services\/app\/accounts\/6\/conversations\/\d+"([^>]+)>/gi;
    
    html = html.replace(regex, (match, textContent, aTagsRest) => {
        const id = findConversationId(textContent);
        if (id) {
            return `<span class="client-info">${textContent}</span><a href="https://chat.tork.services/app/accounts/6/conversations/${id}"${aTagsRest}>`;
        }
        return match; 
    });

    // Tem também links que podem ter espaçamentos ou estar sem span antes. Vamos iterar
    
    fs.writeFileSync(fullPath, html);
    console.log(`[+] Links corrigidos em: ${file}`);
}
