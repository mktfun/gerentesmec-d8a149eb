import fs from 'fs';
import path from 'path';

const DIR = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const factsFile = path.join(DIR, 'facts.json');
if (!fs.existsSync(factsFile)) process.exit(1);

const factsData = JSON.parse(fs.readFileSync(factsFile, 'utf8'));

const posturas = {
  "CARIJOS": "Postura altamente solícita e cordial na abertura. Domina o envio de orçamentos e links, porém possui uma quebra de tração forte na entrega do veículo. Finaliza de forma seca e não solicita avaliações.",
  "DIADEMA": "Tratamento amigável e flexível que fideliza na largada. Contudo, seu foco é restrito ao problema principal (visão de túnel). Ignora aberturas para novos serviços e tem encerramentos sem calor comercial.",
  "DOM PEDRO": "Atua no estilo 'Caixa Registradora': é direto, educado, resolve problemas mecânicos rapidamente, mas não constrói relacionamento de longo prazo. Omissão crítica nos protocolos de OiAPI.",
  "JABAQUARA": "Postura firme no acompanhamento técnico e diagnóstico presencial. Contudo, pula protocolos obrigatórios da OiAPI nas aberturas e não traciona em vendas de manutenções preditivas.",
  "KENNEDY": "Perfil pragmático e técnico. No entanto, é muito reativo e perde massivamente o potencial de Up-sell visual da rede. O calcanhar de aquiles é a finalização do funil e captura de Google Reviews.",
  "MAUA": "Comunicação respeitosa, mas excessivamente transacional. Envia orçamentos de forma correta, mas peca pela total omissão em educar o cliente tecnicamente e em gerar o encerramento esperado.",
  "PLANALTO": "Extremamente ágil e claro nas explicações técnicas. Contudo, encerra o funil de atendimento assim que a queixa crítica é sanada, descartando as inspeções paralelas (Up-sell).",
  "RUDGE": "Acolhimento empático e excelente conversão de orçamentos diretos. O gargalo grave encontra-se na ausência de engajamento para checklists paralelos e na falta de incentivo no momento da despedida.",
  "Jorge Beretta": "Cordial na abertura e veloz na entrega de propostas, mas atua predominantemente de forma reativa aos problemas do carro, com baixíssima insistência técnica na prevenção futura."
};

// Dicionário de Textos Comportamentais Globais
const ruleTexts = {
    "1a": {
        bom: "Atendimento Cordial: Alto nível de empatia, respeito e acompanhamento imersivo na recepção dos clientes.",
        ruim: "Falta de Cordialidade: Recepção engessada ou que falha em acolher o cliente de forma empática no início do funil."
    },
    "1b": {
        bom: "Sistematização: Consistente no registro de placas e abertura formal dos casos dentro do WhatsApp.",
        ruim: "Fuga de Registro: Falhas no registro formal inicial do veículo na plataforma de chat."
    },
    "2a": {
        bom: "Agilidade de Orçamento: Propostas comerciais são geradas e enviadas no padrão PDF exigido com ótima constância.",
        ruim: "Orçamentos Informais: Falha gravíssima ao passar precificação apenas em texto corrido, ignorando o envio formal."
    },
    "2b": {
        bom: "Vídeos de Constatação: Alta taxa de envio de vídeos e mídias ricas provando o desgaste mecânico ao cliente.",
        ruim: "Omissão Visual: Transmite diagnósticos mecânicos sem o acompanhamento de evidências em foto ou vídeo."
    },
    "2c": {
        bom: "Poder de Argumentação: Domina a educação do cliente, explicando detalhadamente os riscos da falha em cadeia.",
        ruim: "Explicação Rasa: Limita-se a passar valores a pagar sem contextualizar tecnicamente os porquês das peças."
    },
    "2d": {
        bom: "Adesão ao OiAPI: Uso consistente do sistema oficial, enviando o link web do checklist de entrada frequentemente.",
        ruim: "Abandono do OiAPI: Taxa crítica de não-envio do link oficial do checklist nas aberturas (quebra de padronização)."
    },
    "2e": {
        bom: "Aprovação Segura: Sempre formaliza ou garante a aprovação gravada do cliente antes de colocar a mão na graxa.",
        ruim: "Aprovação Tácita: Risco alto de iniciar o serviço baseando-se em avaliações ambíguas sem a formalização do 'Ok'."
    },
    "3a": {
        bom: "Faro para Up-Sells: Identifica e fomenta ativamente a venda de serviços periféricos ao longo do atendimento primário.",
        ruim: "Up-Sells Perdidos: Resolve a queixa principal, mas tem omissão grave em realizar check-lists complementares."
    },
    "3b": {
        bom: "Inspeção Completa: Reporta o estado geral do carro mesmo que não tenha sido o alvo da reclamação original.",
        ruim: "Visão de Túnel (Foco Restrito): Vistoria apenas a peça danificada, descartando as oportunidades secundárias."
    },
    "3c": {
        bom: "Persuasão Preditiva: Insiste de forma técnica e consultiva, dobrando o ticket médio das conversas.",
        ruim: "Desistência Fácil: O cliente sinaliza abertura para trocar peças extras, mas o gerente não traciona e perde a venda."
    },
    "4a": {
        bom: "Despedida Humanizada: Finaliza a entrega com excelência e laço de afinidade, agradecendo ativamente a preferência.",
        ruim: "Encerramento Utilitário: Despedida fria e puramente transacional ('o carro já está lá fora'). Não cultiva a marca."
    },
    "4b": {
        bom: "Captura de Reviews: Consistência louvável na solicitação proativa de avaliação do Google Maps.",
        ruim: "Ciclo Quebrado (Zero Avaliações): Nenhuma captura estruturada de nota no Google Maps na devolução das chaves."
    },
    "4c": {
        bom: "Controle Operacional: Confirma a efetivação formal do pagamento antes da baixa.",
        ruim: "Fechamento Rápido: Deixa a conversa cair no esquecimento sem firmar o recibo final do pagamento formalizado."
    }
};

for (const [filename, data] of Object.entries(factsData)) {
    const fullPath = path.join(DIR, filename);
    if (!fs.existsSync(fullPath)) continue;
    let html = fs.readFileSync(fullPath, 'utf8');

    let p = "Extremamente educado e ágil nas resoluções, porém age puramente de forma transacional. Falhas de aderência aos processos de OiAPI e prevenção.";
    for (const k of Object.keys(posturas)) {
        if (data.unit.toUpperCase().includes(k.toUpperCase())) {
            p = posturas[k];
            break;
        }
    }

    const fortesHtml = data.fortalezas.map(f => {
        const desc = ruleTexts[f.rule] ? ruleTexts[f.rule].bom : `Domínio da competência estabelecida pela regra ${f.rule}.`;
        return `<p style="margin-bottom: 12px; line-height: 1.4;"><strong>Regra ${f.rule} (${f.pct}%):</strong> ${desc}</p>`;
    }).join('') || '<p>Nenhuma fortaleza destacada no volume auditado.</p>';

    const fracosHtml = data.fraquezas.map(f => {
        const desc = ruleTexts[f.rule] ? ruleTexts[f.rule].ruim : `Falha persistente na adequação à diretriz ${f.rule}.`;
        return `<p style="margin-bottom: 12px; line-height: 1.4;"><strong>Regra ${f.rule} (${f.pct}%):</strong> ${desc}</p>`;
    }).join('') || '<p>Nenhuma fraqueza crítica detectada.</p>';

    const newDossierHtml = `
<div class="conv-card" style="border: 2px solid var(--primary); background: #f8fafc;">
    <h2>Resumo - Unidade ${data.unit.split(' ')[0]}</h2>
    <div class="dossie-grid">
        <div class="dossie-item">
            <h3>Resumo de Postura</h3>
            <p style="line-height: 1.5; color: #334155;">${p}</p>
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
</div>`; 

    const startIdx = html.indexOf('<!-- DOSSIÊ EXECUTIVO -->');
    const endIdx = html.indexOf('<!-- GRAFICO LATERAL -->');

    if (startIdx !== -1 && endIdx !== -1) { 
        const flexWrapper = '\n    <!-- DOSSIÊ EXECUTIVO -->\n    <div style="display: flex; gap: 20px; margin-bottom: 40px; align-items: flex-start;">\n        <div style="flex: 1; margin-bottom: 0;" class="dossie-wrapper">\n            ' + newDossierHtml + '\n        </div>\n    '; 
        html = html.substring(0, startIdx) + flexWrapper + '\n    ' + html.substring(endIdx); 
        fs.writeFileSync(fullPath, html); 
        console.log('[+] Resumos Reescritos em ' + filename); 
    }
}
