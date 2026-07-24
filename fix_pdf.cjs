const fs = require('fs');
const path = require('path');

const dir = './Painel_Auditorias';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

for (const f of files) {
    const fp = path.join(dir, f);
    let c = fs.readFileSync(fp, 'utf8');
    
    // Check if we already applied the fix
    if (!c.includes('page-break-inside: auto !important;')) {
        c = c.replace(/@media print\s*\{/, `@media print { .conv-card { page-break-inside: auto !important; } table { page-break-inside: auto !important; } tr { page-break-inside: avoid !important; } `);
        fs.writeFileSync(fp, c);
        console.log('Fixed ' + f);
    } else {
        console.log('Already fixed ' + f);
    }
}
