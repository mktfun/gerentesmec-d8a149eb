import fs from 'fs';
import path from 'path';

const AUDIT_DIR = 'C:\\Users\\admin\\Desktop\\Auditorias_Rede\\Auditoria_Semanal_2026-07-03';
const JSON_DIR = path.join(AUDIT_DIR, 'Análises_JSON_V2');
const HTML_DIR = path.join(AUDIT_DIR, 'Dossiês_Visuais');

if (!fs.existsSync(HTML_DIR)) fs.mkdirSync(HTML_DIR, { recursive: true });

const files = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('_scores.json'));

for (const file of files) {
    const unitName = file.replace('_scores.json', '').toUpperCase().replace(/_/g, ' ');
    const data = JSON.parse(fs.readFileSync(path.join(JSON_DIR, file), 'utf8'));
    
    const leadsList = [];
    let scoreSum = 0;
    let scoredLeads = 0;
    let criticalLeads = 0;
    let approvedLeads = 0;

    for (const convId of Object.keys(data)) {
        const d = data[convId];
        
        // No formato V2, a nota (d.score) já foi processada pelo Agente In-House.
        // Se estiver em andamento (null) ou for ignorável (fornecedor), não entra no somatório.
        if (typeof d.score === 'number') {
            scoreSum += d.score;
            scoredLeads++;
            if (d.score < 60) criticalLeads++;
            if (d.score > 80) approvedLeads++;
        }
        
        // Filtrar 'null' no HTML forçando conversão.
        const theScore = typeof d.score === 'number' ? d.score : 0;

        leadsList.push({
            chatwoot_conversation_id: convId,
            customer_name: d.customer_name || 'Cliente',
            score: theScore,
            funnel_stage: d.funnel_stage || 'lead_new',
            manager_failures: d.manager_failures || 'Falhas não detalhadas.',
            conversation_summary: d.conversation_summary || 'Resumo ausente.'
        });
    }

    const avgScore = scoredLeads > 0 ? (scoreSum / scoredLeads).toFixed(1) : 0;
    const totalLeads = leadsList.length;

    // Pega os 5 piores (apenas fechados)
    const sortedLeads = leadsList.filter(l => l.score > 0 || l.funnel_stage === 'closed_lost').sort((a, b) => a.score - b.score);
    const worstLeads = sortedLeads.slice(0, 5).filter(l => l.score <= 70);
    const bestLeads = sortedLeads.reverse().slice(0, 5).filter(l => l.score >= 80);

    let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auditoria | ${unitName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #faf9f6; } /* Fundo creme oficial */
        @media print {
            .avoid-break { break-inside: avoid; }
            body { background-color: white !important; }
        }
    </style>
</head>
<body class="text-gray-800 font-sans p-8 max-w-5xl mx-auto">
    <header class="mb-10 border-b-2 border-gray-200 pb-6 avoid-break flex justify-between items-end">
        <div>
            <h1 class="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Auditoria Oficial - ${unitName}
            </h1>
            <p class="text-gray-500 mt-2 text-sm font-medium">Reconstrução Definitiva de Junho</p>
        </div>
        <div class="flex gap-4">
            <div class="bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm text-center min-w-[120px]">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Score da Loja</p>
                <p class="text-3xl font-black ${avgScore >= 80 ? 'text-emerald-600' : (avgScore >= 60 ? 'text-yellow-500' : 'text-red-600')}">${avgScore}%</p>
            </div>
            <div class="bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm text-center min-w-[120px]">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Conversas Fechadas</p>
                <p class="text-3xl font-black text-gray-800">${scoredLeads}/${totalLeads}</p>
            </div>
        </div>
    </header>

    <div class="mb-10 text-gray-700 leading-relaxed text-sm bg-white p-5 rounded-lg border border-gray-200 shadow-sm avoid-break">
        <strong class="text-gray-900 font-bold block mb-2">💡 Inteligência Analítica:</strong>
        Conversas sem orçamento ou ainda em andamento não recebem notas para não derrubarem a média da loja. Abaixo encontram-se apenas os leads consolidados. O sistema exibe com clareza total as falhas gerenciais identificadas.
    </div>
    `;

    if (worstLeads.length > 0) {
        html += `
        <div class="mb-10 avoid-break">
            <h3 class="text-sm font-bold uppercase tracking-widest text-red-600 mb-4 flex items-center gap-2 border-b border-red-200 pb-2">
                🔴 Dossiê de Vacilos (Oportunidades Perdidas)
            </h3>
            <div class="space-y-4">
        `;
        worstLeads.forEach(l => {
            const link = "https://chat.tork.services/app/accounts/5/conversations/" + l.chatwoot_conversation_id;
            html += `
                <div class="bg-white p-5 border-l-4 border-l-red-500 rounded-r-lg shadow-sm avoid-break">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="font-bold text-gray-900 text-lg">${l.customer_name}</span>
                            <span class="text-xs text-gray-400 ml-2">ID: #${l.chatwoot_conversation_id}</span>
                        </div>
                        <span class="px-3 py-1 bg-red-100 text-red-800 font-black text-sm rounded border border-red-200">
                            Nota: ${l.score}%
                        </span>
                    </div>
                    <p class="text-sm text-gray-700 italic border-l-2 border-gray-300 pl-3 py-2 mb-3 bg-gray-50 rounded-r">
                        <strong>📝 Resumo da Negociação:</strong><br>${l.conversation_summary || 'Nenhum contexto válido'}
                    </p>
                    <p class="text-sm text-red-900 border-l-2 border-red-400 pl-3 py-3 mb-4 bg-red-50 rounded-r font-medium">
                        <strong>⚠️ Crítica Gerencial:</strong><br>${l.manager_failures || 'Negociação vazia ou não tracionou.'}
                    </p>
                    <a href="${link}" target="_blank" class="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-4 py-2 rounded border border-blue-200 transition-colors">
                        Abrir Chatwoot
                    </a>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    if (bestLeads.length > 0) {
        html += `
        <div class="mb-10 avoid-break">
            <h3 class="text-sm font-bold uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2">
                ✅ Destaques Positivos (Excelência)
            </h3>
            <div class="space-y-4">
        `;
        bestLeads.forEach(l => {
            const link = "https://chat.tork.services/app/accounts/5/conversations/" + l.chatwoot_conversation_id;
            html += `
                <div class="bg-white p-5 border-l-4 border-l-emerald-500 rounded-r-lg shadow-sm avoid-break">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="font-bold text-gray-900 text-lg">${l.customer_name}</span>
                            <span class="text-xs text-gray-400 ml-2">ID: #${l.chatwoot_conversation_id}</span>
                        </div>
                        <span class="px-3 py-1 bg-emerald-100 text-emerald-800 font-black text-sm rounded border border-emerald-200">
                            Nota: ${l.score}%
                        </span>
                    </div>
                    <p class="text-sm text-gray-700 italic border-l-2 border-gray-300 pl-3 py-2 mb-3 bg-gray-50 rounded-r">
                        <strong>📝 Resumo:</strong><br>${l.conversation_summary}
                    </p>
                    <a href="${link}" target="_blank" class="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-4 py-2 rounded border border-blue-200 transition-colors">
                        Abrir Chatwoot
                    </a>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    html += `
    <footer class="mt-12 border-t border-gray-200 pt-6 text-center text-xs text-gray-400 font-medium">
        Relatório gerado através do Pipeline Unificado de Auditoria.
    </footer>
</body>
</html>`;

    const outputPath = path.join(HTML_DIR, `Relatorio_Unificado_${unitName.replace(/ /g, '_')}.html`);
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`Gerado: ${outputPath} (Nota: ${avgScore}%)`);
}
console.log('CONCLUÍDO!');
