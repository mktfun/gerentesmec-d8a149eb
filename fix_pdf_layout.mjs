import fs from 'fs';
import path from 'path';

const DIR = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html'));

const newPrintMedia = `
        @media print {
            @page { margin: 10mm; size: A4 portrait; }
            body { background: white; padding: 0; font-size: 11px; }
            .header-doc { margin-bottom: 20px; padding-bottom: 10px; }
            h1 { font-size: 1.3rem; margin-bottom: 5px; }
            .subtitle { font-size: 0.95rem; }
            
            /* O dossiê inicial fica na página 1 e quebra */
            .dossie-card, .dossier-card, .conv-card:first-of-type {
                box-shadow: none; border: 1px solid #ccc; margin-bottom: 0;
            }
            
            /* Todos os cards de cliente ganham quebra de página rigorosa */
            .conv-card {
                box-shadow: none;
                border: 1px solid #ccc;
                margin-bottom: 0;
                padding: 15px 20px;
                page-break-after: always; /* Força cada cliente em uma folha inteira */
                page-break-inside: avoid; /* Impede cortar a tabela no meio */
            }
            
            /* Tira o break do último card para não dar página em branco sobrando */
            .conv-card:last-of-type { page-break-after: auto; }
            
            /* Ocultar elementos desnecessários no papel */
            .btn-link { display: none !important; }
            
            /* Ajustes finos na tabela para caber tudo perfeito em 1 A4 */
            table { font-size: 10px; margin-top: 10px; }
            th, td { padding: 6px 8px; }
            .c-just { font-size: 9.5px; }
            tr { page-break-inside: avoid; }
            
            /* Garante que o mini-dashboard não quebre também */
            .chart-box { 
                box-shadow: none !important; 
                border: 1px solid #ccc !important;
                page-break-inside: avoid;
            }
        }
    </style>
`;

for (const f of files) {
    const fullPath = path.join(DIR, f);
    let html = fs.readFileSync(fullPath, 'utf8');

    // Substitui tudo desde @media print até o fechamento do </style>
    const regex = /@media print\s*{[^}]*}(?:\s*.*?})*[\s\S]*?<\/style>/i;
    // O regex acima pode ser perigoso se tiver chaves aninhadas (como o @media tem).
    // O html gerado tem a declaração numa linha ou de forma previsível. 
    // É mais fácil achar onde o "@media print" começa, e cortar até o "</style>".
    
    const startIdx = html.indexOf('@media print');
    const endIdx = html.indexOf('</style>', startIdx);
    
    if (startIdx !== -1 && endIdx !== -1) {
        html = html.substring(0, startIdx) + newPrintMedia.trim() + '\n' + html.substring(endIdx + 8);
        fs.writeFileSync(fullPath, html);
        console.log(`[+] Layout PDF corrigido em ${f}`);
    }
}
