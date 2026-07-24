const fs = require('fs');
const path = require('path');

const dir = './Painel_Auditorias';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

const newPrintCss = `@media print { 
    @page { margin: 1cm; size: A4 portrait; }
    body { background: white; padding: 0 !important; font-size: 10px !important; max-width: 100% !important; margin: 0 !important; }
    
    .header-doc { margin-bottom: 10px !important; padding-bottom: 5px !important; page-break-after: avoid !important; }
    h1 { font-size: 1.3rem !important; margin-bottom: 2px !important; }
    .subtitle { font-size: 0.85rem !important; }
    
    .conv-card { 
        box-shadow: none !important; 
        border: 1px solid #ccc !important; 
        margin-bottom: 15px !important; 
        padding: 10px 15px !important; 
        page-break-inside: auto !important; 
    }
    
    .conv-card:first-of-type { 
        page-break-inside: avoid !important; /* Como encolhemos tudo, ele deve caber em 1 página sem quebrar a tabela ao meio */
    }
    
    .conv-card ~ .conv-card { 
        page-break-before: always !important; 
    }
    
    table { width: 100% !important; page-break-inside: auto !important; font-size: 9px !important; }
    tr { page-break-inside: avoid !important; }
    th, td { padding: 4px !important; font-size: 9px !important; }
    .c-cat { font-size: 9px !important; padding: 4px !important; }
    
    .client-info { font-size: 1.1rem !important; }
    .score-badge { font-size: 0.9rem !important; padding: 4px 8px !important; }
    
    /* Diagnostico rapido menores */
    ul { margin: 4px 0 0 0 !important; font-size: 9px !important; line-height: 1.3 !important; }
    strong { font-size: 10px !important; }
    
    .btn-link { display: none; } 
}`;

for (const f of files) {
    const fp = path.join(dir, f);
    let html = fs.readFileSync(fp, 'utf8');
    
    const cssMatch = html.match(/@media print\s*\{[\s\S]*?\}/);
    if(cssMatch) {
        html = html.replace(cssMatch[0], newPrintCss);
        fs.writeFileSync(fp, html);
        console.log('Fixed Print Responsive for: ' + f);
    }
}
