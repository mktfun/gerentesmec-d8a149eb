import fs from 'fs';
import path from 'path';

const DIR_PAINEL = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec\\Painel_Auditorias';
const DIR_BASE = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec';

// Mapa universal de Cliente para ID
const nameToIdMap = new Map();

// Varrer todas as pastas de conversas para popular o mapa
const subdirs = fs.readdirSync(DIR_BASE);
for (const sub of subdirs) {
    if (sub.startsWith('conversas_') || sub === '_historico_scripts') {
        const targetDir = sub === '_historico_scripts' ? path.join(DIR_BASE, '_historico_scripts', 'conversas_jorge_beretta_FULL_PERIOD') : path.join(DIR_BASE, sub);
        
        if (fs.existsSync(targetDir)) {
            const files = fs.readdirSync(targetDir);
            for (const f of files) {
                const match = f.match(/Conv_(\d+)_/);
                if (match) {
                    const id = match[1];
                    // Lê o arquivo para pegar o nome exato do cliente do cabeçalho
                    const content = fs.readFileSync(path.join(targetDir, f), 'utf-8');
                    const clienteMatch = content.match(/CLIENTE:\s*(.+)/i);
                    if (clienteMatch) {
                        const rawName = clienteMatch[1].trim();
                        // Remover emojis e normalizar para matching frouxo
                        const normalizedName = rawName.replace(/[\u1000-\uFFFF]/g, '').trim().toLowerCase();
                        nameToIdMap.set(normalizedName, id);
                        nameToIdMap.set(rawName.trim().toLowerCase(), id); // Salva com emoji tb por garantia
                    }
                }
            }
        }
    }
}

// Para encontrar o ID mesmo com pequenas variações (ex: "Michel" vs "Michel Silva")
function findConversationId(clientNameInHtml) {
    let searchName = clientNameInHtml.trim().toLowerCase();
    searchName = searchName.replace(/[\u1000-\uFFFF]/g, '').trim(); // strip emojis
    
    // Exact match
    if (nameToIdMap.has(searchName)) return nameToIdMap.get(searchName);
    
    // Partial match
    for (const [key, id] of nameToIdMap.entries()) {
        if (key.includes(searchName) || searchName.includes(key)) {
            return id;
        }
    }
    return null;
}

const htmlFiles = fs.readdirSync(DIR_PAINEL).filter(f => f.startsWith('Relatorio_Semantico_') && f.endsWith('.html'));

for (const file of htmlFiles) {
    const fullPath = path.join(DIR_PAINEL, file);
    let html = fs.readFileSync(fullPath, 'utf-8');
    
    // 1. Injetar Botão de Link no Card do Cliente
    // A regex pega toda a span do client info, e o nome dentro de "Cliente: NOME"
    html = html.replace(/<span class="client-info"[^>]*>.*?Cliente:\s*([^<]+)<\/span>/gi, (match, nome) => {
        const id = findConversationId(nome);
        const link = id ? `<a href="https://chat.tork.services/app/accounts/6/conversations/${id}" target="_blank" class="btn-link" style="margin-left: 15px; font-size: 0.9rem; font-weight: normal; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; text-decoration: none; border: 1px solid #bae6fd;">🔗 Abrir no Chatwoot</a>` : '';
        // Retorna a span original seguida do novo link
        return `${match}${link}`;
    });

    // Em alguns casos, a classe client-info não tem o texto "Cliente: "
    html = html.replace(/<span class="client-info"[^>]*>([^<]+)<\/span>/gi, (match, textContent) => {
        // Se a regex anterior já atuou, o texto já tem "Cliente: " e não entraremos em loop pq ignoramos os já marcados? 
        // Vamos garantir que só coloque link onde não tem
        if (match.includes('href') || textContent.toLowerCase().includes('dossiê')) return match; 
        
        let nome = textContent.replace(/Cliente:\s*/i, '').trim();
        const id = findConversationId(nome);
        if (id) {
            const link = `<a href="https://chat.tork.services/app/accounts/6/conversations/${id}" target="_blank" class="btn-link" style="margin-left: 15px; font-size: 0.9rem; font-weight: normal; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; text-decoration: none; border: 1px solid #bae6fd;">🔗 Abrir no Chatwoot</a>`;
            return `${match}${link}`;
        }
        return match;
    });

    // 2. Padronizar o Estilo do Dossiê para ser EXATAMENTE igual ao do Erik
    // Verifica se tem "Dossiê Executivo", se tiver, garante a borda
    if (!html.includes('border: 2px solid var(--primary); background: #f8fafc;')) {
        // Trocar <div class="conv-card"> que precede "Dossiê Executivo"
        html = html.replace(/<div class="conv-card">(\s*<div class="card-header">\s*<span class="client-info"[^>]*>.*?Dossiê Executivo)/gi, '<div class="conv-card" style="border: 2px solid var(--primary); background: #f8fafc;">$1');
        // Adicionar estilos nos subtítulos do dossiê (Fortalezas, Fraquezas)
        html = html.replace(/<(h\d|strong|span)[^>]*>\s*Fortalezas[^\n<]*<\/(h\d|strong|span)>/gi, '<h3 class="section-title" style="color: var(--success); margin-top: 15px;">Fortalezas (O que domina)</h3>');
        html = html.replace(/<(h\d|strong|span)[^>]*>\s*Fraquezas[^\n<]*<\/(h\d|strong|span)>/gi, '<h3 class="section-title" style="color: var(--alert); margin-top: 15px;">Fraquezas (Onde falha)</h3>');
    }

    fs.writeFileSync(fullPath, html);
    console.log(`[+] Links e Estilos aplicados com sucesso em: ${file}`);
}
