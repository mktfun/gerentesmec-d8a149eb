import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

// Recuperar argumentos passados via CLI
const fromArg = process.argv.find(a => a.startsWith('--from='));
const toArg = process.argv.find(a => a.startsWith('--to='));
const nameArg = process.argv.find(a => a.startsWith('--name='));

const fromDate = fromArg ? fromArg.split('=')[1] : null;
const toDate = toArg ? toArg.split('=')[1] : null;
const auditName = nameArg ? nameArg.split('=')[1] : `Auditoria_${new Date().toISOString().split('T')[0]}`;

if (!fromDate || !toDate) {
    console.error("❌ ERRO: Você deve fornecer o período. Ex: node run_pipeline.mjs --from=2026-06-01 --to=2026-06-30 --name=Junho");
    process.exit(1);
}

const desktopPath = path.join(os.homedir(), 'Desktop');
const finalDir = path.join(desktopPath, 'Auditorias_Rede', auditName);

console.log(`\n======================================================`);
console.log(`🚀 INICIANDO MEGA-PIPELINE DE AUDITORIA: ${auditName}`);
console.log(`📅 Período Alvo: ${fromDate} até ${toDate}`);
console.log(`======================================================\n`);

function run(scriptName, args = '') {
    console.log(`\n⏳ [ETAPA] Executando ${scriptName} ${args}...`);
    try {
        execSync(`node ${scriptName} ${args}`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`\n🚨 FALHA CRÍTICA NA ETAPA ${scriptName}. Abortando pipeline.`);
        process.exit(1);
    }
}

// ==========================================
// FASE 1: Extração e Inteligência Artificial
// ==========================================
run('extract_all_units.mjs', `--from=${fromDate} --to=${toDate}`);
run('build_manual.mjs'); // Roda nas pastas extraídas para auditar localmente

// ==========================================
// FASE 2: Geração e Transformação Estética (HTML)
// ==========================================
run('add_links_and_styles.mjs');
run('fix_upsell_and_admins.mjs'); 
run('cleanup_chatwoot_links.mjs');
run('update_charts.mjs'); // Calcula e injeta as barras coloridas
run('extract_facts.mjs'); // Gera material base para os dossiês (fatos)
run('inject_dossiers_v2.mjs'); // Dossiê de Fortalezas e Fraquezas
run('generate_comparative.mjs'); // Monta o Quadro Geral (Rankeamento)
run('add_qrcodes_v2.mjs'); // QR Codes de Impressão Estáticos
run('fix_pdf_layout.mjs'); // Proteção CSS de impressão PDF/A4

// ==========================================
// FASE 3: Empacotamento e Entrega na Área de Trabalho
// ==========================================
console.log(`\n📦 [ETAPA] Empacotando artefatos finais para a Área de Trabalho...`);

// Garantir Estrutura Principal no Desktop
if (!fs.existsSync(path.join(desktopPath, 'Auditorias_Rede'))) {
    fs.mkdirSync(path.join(desktopPath, 'Auditorias_Rede'));
}
if (fs.existsSync(finalDir)) {
    fs.rmSync(finalDir, { recursive: true, force: true });
}
fs.mkdirSync(finalDir);

const dirsToCreate = [
    'Dossiês_Visuais',
    'Históricos_Brutos',
    'Análises_JSON'
];
dirsToCreate.forEach(d => fs.mkdirSync(path.join(finalDir, d)));

const localRoot = process.cwd();
const localAuditDir = path.join(localRoot, 'Painel_Auditorias');

// 1. Mover Painel Comparativo para a Raiz Final
if (fs.existsSync(path.join(localAuditDir, 'Painel_Comparativo_Rede.html'))) {
    fs.copyFileSync(
        path.join(localAuditDir, 'Painel_Comparativo_Rede.html'),
        path.join(finalDir, '1_Painel_Comparativo_Rede.html') // Prefixo "1_" para ficar sempre no topo da pasta
    );
}

// 2. Mover Relatórios Semânticos e de Auditoria (Dossiês Visuais)
const htmlFiles = fs.readdirSync(localAuditDir).filter(f => f.startsWith('Relatorio_Semantico_') || f.startsWith('Relatorio_Auditoria_'));
for (const f of htmlFiles) {
    fs.copyFileSync(path.join(localAuditDir, f), path.join(finalDir, 'Dossiês_Visuais', f));
}

// 3. Mover Históricos Brutos (Pastas das Inboxes)
const inboxDirs = fs.readdirSync(localRoot).filter(d => d.startsWith('conversas_') && fs.statSync(path.join(localRoot, d)).isDirectory());
for (const d of inboxDirs) {
    const destFolder = path.join(finalDir, 'Históricos_Brutos', d.replace('conversas_', ''));
    fs.mkdirSync(destFolder);
    const txtFiles = fs.readdirSync(path.join(localRoot, d));
    for (const txt of txtFiles) {
        fs.copyFileSync(path.join(localRoot, d, txt), path.join(destFolder, txt));
    }
}

// 4. Mover Análises JSON (Os cerebros brutos)
const jsonFiles = fs.readdirSync(localRoot).filter(f => f.endsWith('_scores.json'));
for (const f of jsonFiles) {
    fs.copyFileSync(path.join(localRoot, f), path.join(finalDir, 'Análises_JSON', f));
}
if (fs.existsSync(path.join(localAuditDir, 'facts.json'))) {
    fs.copyFileSync(path.join(localAuditDir, 'facts.json'), path.join(finalDir, 'Análises_JSON', 'facts_extracao.json'));
}

// ==========================================
// FASE 4: Limpeza do Rascunho (Garbage Collection)
// ==========================================
console.log(`\n🧹 [ETAPA] Limpando diretórios de trabalho locais...`);
fs.rmSync(localAuditDir, { recursive: true, force: true });
for (const d of inboxDirs) fs.rmSync(path.join(localRoot, d), { recursive: true, force: true });
for (const f of jsonFiles) fs.rmSync(path.join(localRoot, f), { force: true });

console.log(`\n✅ OBRAS FINALIZADAS E ENTREGUES COM SUCESSO!`);
console.log(`📂 Todos os documentos estão incrivelmente organizados e disponíveis na sua Área de Trabalho em:`);
console.log(`➡️  ${finalDir}`);
