import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERRO: Credenciais do Supabase não encontradas no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("📊 Iniciando Extração de Dados: 01/06 a 23/06...");

  // Fetch Units
  const { data: units, error: unitsErr } = await supabase.from('units').select('*');
  if (unitsErr) {
    console.error("Erro ao buscar unidades:", unitsErr);
    return;
  }
  
  const unitMap = {};
  units.forEach(u => unitMap[u.id] = u.name);

  // Fetch Leads
  const { data: leads, error: leadsErr } = await supabase
    .from('leads')
    .select('id, customer_name, customer_phone, unit_id, score, closing_summary, ai_feedback, audit_checklist, audit_reasons, chatwoot_conversation_id, created_at, funnel_stage, response_count')
    .gte('created_at', '2026-06-01T00:00:00.000Z')
    .lte('created_at', '2026-06-23T23:59:59.999Z')
    .in('funnel_stage', ['closed_won', 'closed_lost']) // Filtra apenas conversas completas (começo, meio e fim)
    .not('score', 'is', null); // Apenas os que foram auditados
  if (leadsErr) {
    console.error("Erro ao buscar leads:", leadsErr);
    return;
  }

  console.log(`✅ Sucesso: ${leads.length} conversas auditadas encontradas.`);

  // Processamento por Unidade
  const reportData = {};

  // Filtro de Qualidade de Conversa (Começo, Meio e Fim claros)
  // Requisito mínimo: O cliente e o agente precisam ter trocado pelo menos 5 mensagens.
  const filteredLeads = leads.filter(l => (l.response_count || 0) > 4);

  console.log(`🧹 Filtro de Densidade aplicou-se: De ${leads.length} leads maduros, ${filteredLeads.length} tiveram conversa substancial.`);

  filteredLeads.forEach(lead => {
    const uId = lead.unit_id;
    if (!uId) return;

    if (!reportData[uId]) {
      reportData[uId] = {
        name: unitMap[uId] || 'Unidade Desconhecida',
        totalLeads: 0,
        approvedLeads: 0,
        criticalLeads: 0,
        scoreSum: 0,
        leadsList: []
      };
    }

    reportData[uId].totalLeads++;
    reportData[uId].scoreSum += lead.score;
    if (lead.score >= 75) reportData[uId].approvedLeads++;
    if (lead.score <= 50) reportData[uId].criticalLeads++;

    reportData[uId].leadsList.push(lead);
  });

  // Gerar HTML
  let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Executivo - Atendimentos por Unidade</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; }
        .page-break { page-break-after: always; }
        .avoid-break { page-break-inside: avoid; }
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    </style>
</head>
<body class="p-8 max-w-[210mm] mx-auto bg-white shadow-xl min-h-screen">
    
    <!-- HEADER -->
    <header class="border-b-2 border-gray-900 pb-6 mb-8 avoid-break">
        <div class="flex justify-between items-end">
            <div>
                <h1 class="text-3xl font-black text-gray-900 uppercase tracking-tight">Análise de Atendimento e Vendas</h1>
                <p class="text-gray-500 mt-1 font-medium">Período de Análise: 01/06/2026 até 23/06/2026</p>
            </div>
            <div class="text-right">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gerado por</p>
                <div class="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                    <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span class="text-xs font-bold text-gray-700">AuditAI Engine</span>
                </div>
            </div>
        </div>
    </header>

    <div class="mb-10 text-gray-700 leading-relaxed text-sm bg-gray-50 p-5 rounded-lg border border-gray-200 avoid-break">
        <strong class="text-gray-900 font-bold block mb-2">💡 Resumo Executivo:</strong>
        Este relatório consolida a auditoria autônoma de todas as conversas maduras (que atingiram finalização Ganha ou Perdida). 
        Conversas vazias, curiosos ou abandonos no primeiro contato foram removidos (Filtro Qualitativo).
        O Parecer Especialista da IA consolida os motivos exatos para o ganho ou perda da negociação.
    </div>
  `;

  // Iterar pelas unidades
  const sortedUnits = Object.values(reportData).sort((a, b) => b.totalLeads - a.totalLeads);

  sortedUnits.forEach((unit, index) => {
    const avgScore = (unit.scoreSum / unit.totalLeads).toFixed(1);
    const approvedPct = Math.round((unit.approvedLeads / unit.totalLeads) * 100) || 0;
    const criticalPct = Math.round((unit.criticalLeads / unit.totalLeads) * 100) || 0;

    // Sort leads to get 3 worst and 3 best
    const sortedLeads = [...unit.leadsList].sort((a, b) => a.score - b.score);
    const worstLeads = sortedLeads.slice(0, 3).filter(l => l.score <= 70); // só pega se for ruim mesmo
    const bestLeads = sortedLeads.reverse().slice(0, 3).filter(l => l.score >= 80);

    html += `
    <!-- UNIT SECTION -->
    <div class="mb-12 ${index > 0 ? 'page-break' : ''}">
        <div class="flex items-center gap-4 mb-6 avoid-break">
            <div class="w-1.5 h-8 bg-blue-600 rounded-full"></div>
            <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight">${unit.name}</h2>
        </div>

        <!-- KPIs GRID -->
        <div class="grid grid-cols-4 gap-4 mb-8 avoid-break">
            <div class="card p-4">
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Volumetria</span>
                <span class="text-2xl font-black text-gray-900">${unit.totalLeads}</span>
                <span class="text-xs text-gray-500 font-medium block">leads auditados</span>
            </div>
            <div class="card p-4">
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Média de Qualidade</span>
                <span class="text-2xl font-black text-blue-600">${avgScore}%</span>
                <span class="text-xs text-gray-500 font-medium block">score geral</span>
            </div>
            <div class="card p-4 bg-emerald-50 border-emerald-100">
                <span class="text-[10px] font-bold uppercase tracking-widest text-emerald-600 block mb-1">Conversas de Excelência</span>
                <span class="text-2xl font-black text-emerald-600">${approvedPct}%</span>
                <span class="text-xs text-emerald-600/70 font-medium block">Aprovadas (>75pts)</span>
            </div>
            <div class="card p-4 bg-red-50 border-red-100">
                <span class="text-[10px] font-bold uppercase tracking-widest text-red-600 block mb-1">Vacilos Críticos</span>
                <span class="text-2xl font-black text-red-600">${criticalPct}%</span>
                <span class="text-xs text-red-600/70 font-medium block">Risco de Perda (<50pts)</span>
            </div>
        </div>
    `;

    // WORST LEADS (Exemplos Críticos)
    if (worstLeads.length > 0) {
      html += `
        <div class="mb-8 avoid-break">
            <h3 class="text-xs font-bold uppercase tracking-widest text-red-600 mb-4 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Oportunidades Perdidas (Dossiê de Vacilos)
            </h3>
            <div class="space-y-4">
      `;
      
      worstLeads.forEach(l => {
        const link = "https://chat.tork.services/app/accounts/5/conversations/" + l.chatwoot_conversation_id;
        // Aprofundar Dossiê do Pior Caso usando o dicionário real 'audit_reasons'
        let piorJustificativa = '';
        if (l.ai_feedback) {
             piorJustificativa = l.ai_feedback;
        let falhas = l.manager_failures || l.closing_summary || "A negociação não atingiu os gatilhos mínimos de engajamento do funil.";
        let resumo = l.conversation_summary || "Sem resumo disponível.";

        html += `
                <div class="card p-5 border-l-4 border-l-red-500 avoid-break mb-4">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="font-bold text-gray-900">${l.customer_name}</span>
                            <span class="text-xs text-gray-500 ml-2">ID: #${l.chatwoot_conversation_id}</span>
                        </div>
                        <span class="px-2.5 py-1 bg-red-100 text-red-700 font-black text-xs rounded border border-red-200">
                            Nota: ${l.score}%
                        </span>
                    </div>
                    <p class="text-sm text-gray-700 italic border-l-2 border-gray-200 pl-3 py-2 mb-2 bg-gray-50">
                        <strong>📝 Resumo da Conversa:</strong><br>${resumo}
                    </p>
                    <p class="text-sm text-red-800 border-l-2 border-red-400 pl-3 py-2 mb-4 bg-red-50 font-medium">
                        <strong>⚠️ O que o Gerente Vacilou:</strong><br>${falhas}
                    </p>
                    <a href="${link}" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded border border-blue-100">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        Abrir Conversa Real no Chatwoot
                    </a>
                </div>
        `;
      });
      html += `</div></div>`;
    }

    // BEST LEADS (Destaques Positivos)
    if (bestLeads.length > 0) {
      html += `
        <div class="mb-4 avoid-break">
            <h3 class="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                Atendimentos de Excelência (Casos de Sucesso)
            </h3>
            <div class="space-y-4">
      `;
      
      bestLeads.forEach(l => {
        const link = "https://chat.tork.services/app/accounts/5/conversations/" + l.chatwoot_conversation_id;
        let analise = l.manager_failures || l.closing_summary || "Atendimento de excelência sem falhas detectadas.";
        let resumo = l.conversation_summary || "Sem resumo disponível.";
        
        html += `
                <div class="card p-5 border-l-4 border-l-emerald-500 avoid-break mb-4">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="font-bold text-gray-900">${l.customer_name}</span>
                            <span class="text-xs text-gray-500 ml-2">ID: #${l.chatwoot_conversation_id}</span>
                        </div>
                        <span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-black text-xs rounded border border-emerald-200">
                            Nota: ${l.score}%
                        </span>
                    </div>
                    <p class="text-sm text-gray-700 italic border-l-2 border-gray-200 pl-3 py-2 mb-2 bg-gray-50">
                        <strong>📝 Resumo da Conversa:</strong><br>${resumo}
                    </p>
                    <p class="text-sm text-emerald-800 border-l-2 border-emerald-400 pl-3 py-2 mb-4 bg-emerald-50 font-medium">
                        <strong>✅ Análise de Postura:</strong><br>${analise}
                    </p>
                    <a href="${link}" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded border border-blue-100">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        Abrir Conversa Real no Chatwoot
                    </a>
                </div>
        `;
      });
      html += `</div></div>`;
    }

    html += `</div>`; // Close unit section
  });

  html += `
    <footer class="mt-12 border-t pt-6 text-center text-xs text-gray-400 font-medium">
        Relatório gerado automaticamente através da auditoria inteligente (Antigravity Engine). 
        Os links são válidos e dependem de autenticação no seu portal Tork Services.
    </footer>
</body>
</html>
  `;

  // Write file to project root
  const outputPath = path.resolve(__dirname, '../Relatorio_Atendimento_01_a_23_Junho.html');
  fs.writeFileSync(outputPath, html, 'utf-8');

  // Also write to Desktop just in case!
  try {
     const desktopPath = path.join(process.env.USERPROFILE, 'Desktop', 'Relatorio_Atendimento_01_a_23_Junho.html');
     fs.writeFileSync(desktopPath, html, 'utf-8');
     console.log("✅ Salvo no Desktop também! " + desktopPath);
  } catch(e) {
     console.log("Não foi possível salvar no desktop diretamente.", e.message);
  }

  console.log("✅ Relatório gerado com sucesso em: " + outputPath);
  console.log("Abra este arquivo no Google Chrome e aperte Ctrl+P para Imprimir / Salvar como PDF.");
}

main();
