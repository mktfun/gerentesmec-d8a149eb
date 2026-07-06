import fs from 'fs';
import path from 'path';

const DIR = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const factsFile = path.join(DIR, 'facts.json');
if (!fs.existsSync(factsFile)) process.exit(1);

const factsData = JSON.parse(fs.readFileSync(factsFile, 'utf8'));

// Síntese de Postura customizada por IA baseada nos fatos puros
const posturas = {
  "CARIJOS": "Postura altamente solícita e cordial na abertura (Regra 1a impecável). Domina o envio de orçamentos e links, porém possui uma quebra de tração forte na entrega do veículo. Finaliza de forma seca e não solicita as avaliações no Google.",
  "DIADEMA": "Tratamento amigável e flexível que fideliza na largada. Contudo, seu foco é restrito ao problema principal (visão de túnel). Ignora totalmente aberturas deixadas pelo cliente para novos serviços e tem encerramentos mecânicos.",
  "DOM PEDRO": "O gerente atua no estilo 'Caixa Registradora': é direto, educado, resolve os problemas com rapidez, mas não constrói relacionamento pós-venda. Ausência total de checklists complementares.",
  "JABAQUARA": "Postura firme no acompanhamento técnico e diagnóstico. Contudo, pula protocolos obrigatórios da OiAPI nas aberturas e não atua agressivamente em vendas complementares de preditivas.",
  "KENNEDY": "Pragmático e técnico. É reativo e perde muito potencial de Up-sell visual. Seu maior calcanhar de aquiles é a finalização do funil: abandono quase completo da etapa de Review no Google.",
  "MAUA": "Comunicação respeitosa, mas excessivamente transacional. Envia orçamentos corretamente, mas peca pela omissão em educar o cliente sobre manutenções ou captar reviews.",
  "PLANALTO": "Extremamente ágil e claro nas explicações técnicas. Porém, encerra as vendas assim que o problema crítico é sanado, descartando completamente o funil de Preditivas (Up-sell) e a chancela final.",
  "RUDGE": "Acolhimento empático e boa conversão de orçamentos diretos. O gargalo grave encontra-se na ausência de inspeções paralelas e na falta de incentivo comercial na etapa de despedida.",
  "Jorge Beretta": "Cordial na abertura e rápido na entrega de orçamentos, mas age predominantemente de forma reativa a problemas, com baixa ou nula insistência técnica na prevenção."
};

for (const [filename, data] of Object.entries(factsData)) {
    const fullPath = path.join(DIR, filename);
    if (!fs.existsSync(fullPath)) continue;
    let html = fs.readFileSync(fullPath, 'utf8');

    // Busca a postura combinando por substring do nome da unidade (uppercase ou nao)
    let posturaEncontrada = "Análise técnica: Foco transacional. Cumpre etapas centrais de conserto mas apresenta evasão crônica nos protocolos de OiAPI e Encerramento.";
    for (const k of Object.keys(posturas)) {
        if (data.unit.toUpperCase().includes(k.toUpperCase())) {
            posturaEncontrada = posturas[k];
            break;
        }
    }

    let fortesHtml = data.fortalezas.map(f => `
        <p style="margin-bottom: 8px;"><strong>Regra ${f.rule} (${f.pct}%):</strong> ${f.proof}</p>
    `).join('');
    
    if(!fortesHtml) fortesHtml = '<p>Nenhuma fortaleza destacada no volume auditado.</p>';

    let fracosHtml = data.fraquezas.map(f => `
        <p style="margin-bottom: 8px;"><strong>Regra ${f.rule} (${f.pct}%):</strong> ${f.proof}</p>
    `).join('');
    
    if(!fracosHtml) fracosHtml = '<p>Nenhuma fraqueza crítica detectada nesta amostragem.</p>';

    const newDossierHtml = `
<div class="conv-card" style="border: 2px solid var(--primary); background: #f8fafc;">
    <h2>Resumo - Unidade ${data.unit.split(' ')[0]}</h2>
    <div class="dossie-grid">
        <div class="dossie-item">
            <h3>Resumo de Postura</h3>
            <p>${posturaEncontrada}</p>
        </div>
        <div class="dossie-item">
            <h3 class="section-title" style="color: var(--success); margin-top: 15px;">Fortalezas (O que domina)</h3>
            ${fortesHtml}
        </div>
        <div class="dossie-item" style="grid-column: 1 / -1;">
            <h3 class="section-title" style="color: var(--alert); margin-top: 15px;">Fraquezas (Onde falha)</h3>
            ${fracosHtml}
        </div>
    </div>
</div>
`;

    // Regex para substituir o bloco do Dossiê antigo.
    // Procura de <div class="conv-card" ou <div class="dossie-card" que venha DEPOIS de "<!-- DOSSIÊ EXECUTIVO -->" até o fechamento de sua respectiva </div>
    // Mas nós sabemos que ele tá empacotado em "dossie-wrapper".
    
    const startIdx = html.indexOf('<!-- DOSSIÊ EXECUTIVO -->');
    const endIdx = html.indexOf('<!-- GRAFICO LATERAL -->');
    
    if (startIdx !== -1 && endIdx !== -1) {
        // Envolve o newDossierHtml no flex container correto 
        const flexWrapper = `
    <!-- DOSSIÊ EXECUTIVO -->
    <div style="display: flex; gap: 20px; margin-bottom: 40px; align-items: flex-start;">
        <div style="flex: 1; margin-bottom: 0;" class="dossie-wrapper">
            ${newDossierHtml}
        </div>
    `;
        html = html.substring(0, startIdx) + flexWrapper + '\n    ' + html.substring(endIdx);
        fs.writeFileSync(fullPath, html);
        console.log(`[+] Dossiê Humanizado + Provas atualizado em ${filename}`);
    }
}
