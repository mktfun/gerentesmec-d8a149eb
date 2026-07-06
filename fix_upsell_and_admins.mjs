import fs from 'fs';
import path from 'path';

const DIR = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const files = fs.readdirSync(DIR).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

// Palavras-chave para blacklist de administrativos
const blacklist = ['financeiro', 'marcos vinycius', 'admin', 'teste', 'gerência', 'gerencia'];

for (const f of files) {
    const fullPath = path.join(DIR, f);
    let html = fs.readFileSync(fullPath, 'utf8');

    // 1. Regex para pegar os blocos inteiros de clientes (<div class="conv-card">...</div>)
    // Precisamos ser cuidadosos pois divs se aninham, mas conv-card não aninha outro conv-card.
    // E cada cliente é um bloco <div class="conv-card"> até a proxima ou final.
    
    // Padrão que começa em <div class="conv-card"> e vai até o próximo <div class="conv-card"> ou o <!-- DOSSIÊ --> se tiver.
    // Vamos usar split/join pra ser mais seguro.
    
    const parts = html.split('<div class="conv-card"');
    
    // O parts[0] é o cabeçalho e o Dossiê (se o dossiê já tiver conv-card, isso complica, 
    // mas nosso Dossiê Resumo v2 tem <div class="conv-card" style="border: 2px solid var(--primary)...)
    
    let newParts = [parts[0]];
    
    for (let i = 1; i < parts.length; i++) {
        let block = '<div class="conv-card"' + parts[i];
        
        // 1. Verifica Blacklist Administrativa
        const clientMatch = block.match(/<span class="client-info"[^>]*>Cliente:\s*([^<]+)<\/span>/i);
        if (clientMatch) {
            const clientName = clientMatch[1].toLowerCase();
            const isBlacklisted = blacklist.some(b => clientName.includes(b));
            if (isBlacklisted) {
                console.log(`[!] Removendo administrativo detectado: ${clientMatch[1].trim()} em ${f}`);
                continue; // Pula este bloco inteiramente!
            }
        }
        
        // Se for o card do Dossiê, a gente ignora a parte do Up-sell
        if (block.includes('<h3>Resumo de Postura</h3>') || block.includes('<!-- DOSSIÊ EXECUTIVO -->')) {
            newParts.push(block);
            continue;
        }

        // 2. Correção da "Cegueira de Mídia" (Pilar 3)
        // Precisamos saber se o cara usou mídia forte.
        // Extrai status e justificativas das regras 2a, 2b e 2d
        const temMedia = (block.match(/<td class="c-regra"[^>]*>2b:.*?<\/td>\s*<td class="c-status yes"/i) ||
                          block.match(/<td class="c-regra"[^>]*>2d:.*?<\/td>\s*<td class="c-status yes"/i) ||
                          block.includes('www.oiapi.com.br') ||
                          block.includes('Arquivo/Mídia anexado'));

        if (temMedia) {
            // Checa se o cara mandou bem na 3a, 3b ou 3c
            // Se ele reprovou em alguma, e nós achamos a mídia, nós APROVAMOS!
            const rules3 = ['3a', '3b', '3c'];
            for (const r of rules3) {
                const regexRegra = new RegExp(`(<td class="c-regra"[^>]*>${r}:.*?<\/td>\\s*)<td class="c-status no">❌ NÃO<\/td>\\s*<td class="c-just">([\\s\\S]*?)<\/td>`, 'gi');
                block = block.replace(regexRegra, (match, prefix, justOriginal) => {
                    return `${prefix}<td class="c-status yes">✅ SIM</td><td class="c-just"><i>✅ Aprovado (Regra Cegueira de Mídia): Up-sell contextualizado via áudio/vídeo. (Just. Original ignorada: ${justOriginal.substring(0,25)}...)</i></td>`;
                });
            }
        }
        
        newParts.push(block);
    }
    
    let finalHtml = newParts.join('');

    // Como cortamos algumas tabelas, a tag total de OS pode estar errada, mas deixaremos isso para o `update_charts.mjs` que recalcula o número dinamicamente.
    
    fs.writeFileSync(fullPath, finalHtml);
    console.log(`[+] Fixed Up-sells e Administrativos em ${f}`);
}
