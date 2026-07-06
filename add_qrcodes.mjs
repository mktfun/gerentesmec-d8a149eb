import fs from 'fs';
import path from 'path';

const DIR = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const files = fs.readdirSync(DIR).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

for (const f of files) {
    const p = path.join(DIR, f);
    let html = fs.readFileSync(p, 'utf8');

    // Divide pelos cards para modificar cirurgicamente
    const parts = html.split('<div class="conv-card"');
    let newParts = [parts[0]]; // Cabeçalho + CSS + Dossiê Executivo (se não for conv-card, mas como dossiê é conv-card, ele cai na iteração)

    for (let i = 1; i < parts.length; i++) {
        let block = '<div class="conv-card"' + parts[i];
        
        // Ignora Dossiês que têm estrutura de card mas não são conversas reais com link Chatwoot
        if (block.includes('<!-- DOSSIÊ EXECUTIVO -->') || block.includes('Resumo - Unidade')) {
            newParts.push(block);
            continue;
        }

        // Isola o cabeçalho do card
        const headerMatch = block.match(/<div class="card-header">([\s\S]*?)<\/div>\s*<table/i);
        if (headerMatch) {
            let header = headerMatch[1];
            
            // Busca a URL do Chatwoot no botão atual
            const urlMatch = header.match(/href="(https:\/\/chat\.tork\.services\/app\/accounts\/5\/conversations\/\d+)"/i);
            
            if (urlMatch) {
                const url = urlMatch[1];
                
                // Evitar duplicações caso rodemos o script duas vezes
                if (!header.includes('api.qrserver.com')) {
                    const qrImg = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(url)}" alt="QR Code" title="Acesse no Chatwoot" class="qr-chatwoot" style="width: 50px; height: 50px; margin-left: 15px; border-radius: 4px; vertical-align: middle; border: 1px solid #cbd5e1;" />`;
                    
                    // Injeta a imagem logo após a tag </a> do link
                    header = header.replace(/(🔗 Abrir no Chatwoot<\/a>)/i, `$1${qrImg}`);
                }
            }

            // O `card-header` usa flexbox, colocar a imagem ao lado do </a> fará com que fiquem juntos do lado esquerdo.
            block = block.replace(headerMatch[1], header);
        }
        
        newParts.push(block);
    }
    
    // Injetar uma classe no cabeçalho do HTML para garantir que a imagem não bugue na impressão
    // Na verdade com os estilos inline não precisa, mas por via das dúvidas:
    let finalHtml = newParts.join('');
    if (!finalHtml.includes('.qr-chatwoot')) {
         finalHtml = finalHtml.replace('</style>', `
            .qr-chatwoot { display: inline-block; }
            @media print {
                .qr-chatwoot { display: inline-block !important; border-color: #000 !important; }
            }
        </style>`);
    }

    fs.writeFileSync(p, finalHtml);
    console.log(`[+] QR Codes gerados estaticamente para cada conversa em ${f}`);
}
