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
        
        if (block.includes('<!-- DOSSIÊ EXECUTIVO -->') || block.includes('Resumo - Unidade')) {
            newParts.push(block);
            continue;
        }

        const headerMatch = block.match(/<div class="card-header">([\s\S]*?)<\/div>\s*<table/i);
        if (headerMatch) {
            let header = headerMatch[1];
            
            // Busca a URL do Chatwoot no botão atual
            const urlMatch = header.match(/href="(https:\/\/chat\.tork\.services\/app\/accounts\/5\/conversations\/\d+)"/i);
            
            if (urlMatch) {
                const url = urlMatch[1];
                
                // Força a inserção, garantindo que o regex acha a âncora inteira do botão
                if (!header.includes('api.qrserver.com')) {
                    const qrImg = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}" alt="QR Code" title="Acesse no Chatwoot" class="qr-chatwoot no-print" style="width: 50px; height: 50px; margin-left: 15px; border-radius: 4px; vertical-align: middle; border: 1px solid #cbd5e1;" />`;
                    const qrImgPrint = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}" alt="QR Code" class="qr-chatwoot-print" style="width: 50px; height: 50px; margin-left: 15px; border-radius: 4px; vertical-align: middle; border: 1px solid #cbd5e1; display: none;" />`;
                    
                    // Colar o QR code imediatamente APÓS a âncora inteira:
                    header = header.replace(/(<a href="https:\/\/chat\.tork\.services[^>]*>.*?<\/a>)/i, `$1\n${qrImg}\n${qrImgPrint}`);
                }
            }

            block = block.replace(headerMatch[1], header);
        }
        
        newParts.push(block);
    }
    
    let finalHtml = newParts.join('');
    // Força a regra CSS
    if (!finalHtml.includes('qr-chatwoot-print')) {
         finalHtml = finalHtml.replace('</style>', `
            @media print {
                .qr-chatwoot-print { display: inline-block !important; }
                .qr-chatwoot { display: none !important; }
            }
        </style>`);
    }

    fs.writeFileSync(p, finalHtml);
    console.log(`[+] QR Codes corrigidos e inseridos em ${f}`);
}
