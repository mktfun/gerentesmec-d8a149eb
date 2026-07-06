import fs from 'fs';
import path from 'path';

const DIR_PAINEL = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const files = fs.readdirSync(DIR_PAINEL).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

for (const f of files) {
    const fullPath = path.join(DIR_PAINEL, f);
    let html = fs.readFileSync(fullPath, 'utf8');

    const parts = html.split('<div class="conv-card"');
    let newParts = [parts[0]];

    for (let i = 1; i < parts.length; i++) {
        let block = '<div class="conv-card"' + parts[i];
        
        if (block.includes('<!-- DOSSIÊ EXECUTIVO -->') || block.includes('Resumo de Postura')) {
            newParts.push(block);
            continue;
        }

        const tem2b = block.match(/<td class="c-regra"[^>]*>2b:.*?<\/td>\s*<td class="c-status yes"/i);
        const tem2d = block.match(/<td class="c-regra"[^>]*>2d:.*?<\/td>\s*<td class="c-status yes"/i);
        const tem2a = block.match(/<td class="c-regra"[^>]*>2a:.*?<\/td>\s*<td class="c-status yes"/i);
        
        let insight = "Série de mídias/áudios enviada durante o diagnóstico.";
        if (tem2b && tem2d) {
            insight = "Múltiplos áudios e vídeos suplementares acompanhando o link da vistoria OiAPI.";
        } else if (tem2b && !tem2d) {
            insight = "Trilha de áudios de argumentação enviada na sequência do vídeo do diagnóstico.";
        } else if (tem2d) {
            insight = "Bateria de áudios justificando serviços junto ao envio do checklist OiAPI.";
        } else if (tem2a) {
            insight = "Explicação e negociação em áudio ocorrendo junto com o PDF de orçamento extra.";
        }

        // Troca o texto engessado por esse
        const baseString = "✅ Aprovado (Regra Cegueira de Mídia): Up-sell contextualizado via áudio/vídeo.";
        if (block.includes(baseString)) {
            block = block.split(baseString).join(`✅ Aprovado (Mídia Extra Detectada): ${insight}`);
        }
        
        newParts.push(block);
    }
    
    fs.writeFileSync(fullPath, newParts.join(''));
    console.log(`[+] Textos enriquecidos em ${f}`);
}
