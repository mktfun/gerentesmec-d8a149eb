const fs = require('fs');
const path = require('path');

const dir = './Painel_Auditorias';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

for (const f of files) {
    const fp = path.join(dir, f);
    let c = fs.readFileSync(fp, 'utf8');
    
    // The previous string we injected
    const oldStr = '@media print { .conv-card { page-break-inside: auto !important; } table { page-break-inside: auto !important; } tr { page-break-inside: avoid !important; }';
    
    // The new string we want to inject
    const newStr = '@media print { .conv-card:first-of-type { page-break-inside: auto !important; } .conv-card:not(:first-of-type) { page-break-before: always !important; page-break-inside: auto !important; } table { page-break-inside: auto !important; } tr { page-break-inside: avoid !important; }';

    if (c.includes(oldStr)) {
        c = c.replace(oldStr, newStr);
        fs.writeFileSync(fp, c);
        console.log('Fixed pagebreaks for ' + f);
    } else {
        // Fallback se não achar a string exata, procurar o bloco @media print padrão e refazer
        // Como o replace passado poderia ter deixado com espaços diferentes:
        const genericStr = '@media print {';
        if (c.includes(genericStr) && !c.includes('.conv-card:first-of-type')) {
           c = c.replace(/@media print\s*\{[^\}]*\}/g, newStr + ' }'); // Isso pode falhar se o media print tiver aninhamentos profundos que não fechem bem num regex simples.
           // A safe way: just replace the exact match we know is there
        }
        console.log('Could not find exact string or already fixed for ' + f);
    }
}
