import fs from 'fs';
import path from 'path';

const file = 'C:/Users/admin/.gemini/antigravity/scratch/gerentesmec/Painel_Auditorias/Relatorio_Semantico_CARIJOS.html';
let html = fs.readFileSync(file, 'utf8');

// 1. Converter cabeçalhos de clientes para o padrão conv-card
html = html.replace(/<div class="page">\s*<h2>Cliente:\s*(.+?)\s*\(Conv\s*(\d+)\)<\/h2>\s*<p><strong>Score:<\/strong>[^<]*<span[^>]*>([^<]+)<\/span><\/p>\s*<p><strong>Período:<\/strong>([^<]+)<\/p>/gi, 
`<!-- Cliente $1 -->
<div class="conv-card">
    <div class="card-header">
        <div>
            <span class="client-info">Cliente: $1 (ID: $2)</span>
            <div class="date-range">📅 $4</div>
        </div>
        <div class="score-badge s-green">Score: $3</div>
    </div>`);

// 2. Corrigir as tags de fechamento (</div></div>)
// A cada "<!-- Cliente", exceto no primeiro, devemos fechar a .conv-card anterior.
// O "page" era fechado por </div>. Então a quantidade de divs no final está certa.

// 3. Adicionar o comentário DOSSIÊ EXECUTIVO
html = html.replace(/<div class="summary-card">/, '<!-- DOSSIÊ EXECUTIVO -->\n<div class="summary-card">');

// 4. Padronizar as tabelas 
html = html.replace(/<tr><th>Regra<\/th><th>Descrição<\/th><th>Acertos[^<]*<\/th><th>%<\/th><\/tr>/g, ''); // Remove a tabela de resumo inicial se atrapalhar o chart

// 5. Transformar classes c-just para as tabelas dos clientes
html = html.replace(/<td>(✅ SIM|❌ NÃO)<\/td>\s*<td>(.*?)<\/td>/gi, '<td class="c-status $1">$1</td><td class="c-just">$2</td>');
html = html.replace(/<td class="c-status ✅ SIM">✅ SIM<\/td>/gi, '<td class="c-status yes">✅ SIM</td>');
html = html.replace(/<td class="c-status ❌ NÃO">❌ NÃO<\/td>/gi, '<td class="c-status no">❌ NÃO</td>');

html = html.replace(/<tr><td>([^<]+)<\/td><td>([^<]+)<\/td><td class="c-status/gi, '<tr><td class="c-regra">$1: $2</td><td class="c-status');

// Remove classes c-cat problemáticas se não houver
html = html.replace(/<h3>(\d\.\s*[^<]+)<\/h3>/gi, '<table><tr><td colspan="3" class="c-cat">$1</td></tr></table>');

fs.writeFileSync(file, html);
