const fs = require('fs');
const path = require('path');

const dir = './Painel_Auditorias';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

const newPrintCss = `@media print { 
    body { background: white; padding: 0; }
    .header-doc { page-break-after: avoid !important; margin-bottom: 20px; }
    .conv-card { 
        box-shadow: none !important; 
        border: 1px solid #ccc !important; 
        margin-bottom: 20px !important; 
        page-break-inside: auto !important; 
    }
    .conv-card ~ .conv-card { 
        page-break-before: always !important; 
    }
    table { page-break-inside: auto !important; } 
    tr { page-break-inside: avoid !important; } 
    .btn-link { display: none; } 
}`;

for (const f of files) {
    const fp = path.join(dir, f);
    let html = fs.readFileSync(fp, 'utf8');
    
    const cssMatch = html.match(/@media print\s*\{[\s\S]*?\}/);
    if(cssMatch) {
        html = html.replace(cssMatch[0], newPrintCss);
        fs.writeFileSync(fp, html);
        console.log('Fixed CSS Print for: ' + f);
    } else {
        console.log('No @media print found in ' + f);
    }
}
