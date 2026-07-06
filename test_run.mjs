import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

const desktopPath = path.join(os.homedir(), 'Desktop');
const auditName = 'Auditoria_Teste_Diadema';
const finalDir = path.join(desktopPath, 'Auditorias_Rede', auditName);

console.log(`\n=== INICIANDO TESTE (1 Conversa de Diadema) ===\n`);

function run(scriptName, args = '') {
    console.log(`\n⏳ [ETAPA] Executando ${scriptName} ${args}...`);
    execSync(`node ${scriptName} ${args}`, { stdio: 'inherit' });
}

run('extract_all_units.mjs', `--from=2026-06-01 --to=2026-06-30 --inbox=DIADEMA --limit=1`);
run('scripts/autonomous_auditor_v2.mjs');
run('scripts/gerar_relatorio_diretoria.mjs');
run('add_links_and_styles.mjs');
run('fix_upsell_and_admins.mjs'); 
run('cleanup_chatwoot_links.mjs');
run('update_charts.mjs'); 
run('extract_facts.mjs'); 
run('inject_dossiers_v2.mjs'); 
run('generate_comparative.mjs'); 
run('add_qrcodes_v2.mjs'); 
run('fix_pdf_layout.mjs'); 

console.log(`\n📦 [ETAPA] Empacotando artefatos finais para a Área de Trabalho...`);

if (!fs.existsSync(path.join(desktopPath, 'Auditorias_Rede'))) {
    fs.mkdirSync(path.join(desktopPath, 'Auditorias_Rede'));
}
if (fs.existsSync(finalDir)) {
    fs.rmSync(finalDir, { recursive: true, force: true });
}
fs.mkdirSync(finalDir);

const dirsToCreate = ['Dossiês_Visuais', 'Históricos_Brutos', 'Análises_JSON'];
dirsToCreate.forEach(d => fs.mkdirSync(path.join(finalDir, d)));

const localRoot = process.cwd();
const localAuditDir = path.join(localRoot, 'Painel_Auditorias');

if (fs.existsSync(path.join(localAuditDir, 'Painel_Comparativo_Rede.html'))) {
    fs.copyFileSync(path.join(localAuditDir, 'Painel_Comparativo_Rede.html'), path.join(finalDir, '1_Painel_Comparativo_Rede.html'));
}
const htmlFiles = fs.readdirSync(localAuditDir).filter(f => f.startsWith('Relatorio_Semantico_'));
for (const f of htmlFiles) fs.copyFileSync(path.join(localAuditDir, f), path.join(finalDir, 'Dossiês_Visuais', f));

const inboxDirs = fs.readdirSync(localRoot).filter(d => d.startsWith('conversas_') && fs.statSync(path.join(localRoot, d)).isDirectory());
for (const d of inboxDirs) {
    const destFolder = path.join(finalDir, 'Históricos_Brutos', d.replace('conversas_', ''));
    fs.mkdirSync(destFolder);
    const txtFiles = fs.readdirSync(path.join(localRoot, d));
    for (const txt of txtFiles) fs.copyFileSync(path.join(localRoot, d, txt), path.join(destFolder, txt));
}
const jsonFiles = fs.readdirSync(localRoot).filter(f => f.endsWith('_scores.json'));
for (const f of jsonFiles) fs.copyFileSync(path.join(localRoot, f), path.join(finalDir, 'Análises_JSON', f));
if (fs.existsSync(path.join(localAuditDir, 'facts.json'))) fs.copyFileSync(path.join(localAuditDir, 'facts.json'), path.join(finalDir, 'Análises_JSON', 'facts_extracao.json'));

console.log(`\n✅ TESTE CONCLUÍDO E PASTA GERADA!`);
