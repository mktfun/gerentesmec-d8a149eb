import fs from 'fs';
import path from 'path';

const DIR = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';

const htmlFiles = fs.readdirSync(DIR).filter(f => f.endsWith('.html'));

for (const file of htmlFiles) {
    const p = path.join(DIR, file);
    let html = fs.readFileSync(p, 'utf-8');
    
    // Expressão regular brutal para remover tags de link consecutivas iguais e manter só uma.
    // Primeiro removemos as duplicatas do exato botão
    const linkTagPattern = '<a href="https://chat.tork.services/app/accounts/6/conversations/\\d+" target="_blank" class="btn-link" style="margin-left: 15px; font-size: 0.9rem; font-weight: normal; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; text-decoration: none; border: 1px solid #bae6fd;">🔗 Abrir no Chatwoot</a>';
    
    // gambiarra pragmática:
    let prev = "";
    while(html !== prev) {
        prev = html;
        html = html.replace(/(<a href="https:\/\/chat\.tork\.services\/app\/accounts\/6\/conversations\/\d+" target="_blank" class="btn-link" style="[^"]+">🔗 Abrir no Chatwoot<\/a>)\1/g, '$1');
    }
    
    fs.writeFileSync(p, html);
}
