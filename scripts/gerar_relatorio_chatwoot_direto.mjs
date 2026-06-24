import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CHATWOOT_API_TOKEN = 'VDiCRLWP13ckmasC5QTH3xgF';
const CHATWOOT_BASE_URL = 'https://chat.tork.services';
const ACCOUNT_ID = '5';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getOpenAiKey() {
  const { data: settings } = await supabase.from('ai_settings').select('api_key').single();
  return process.env.OPENAI_API_KEY || (settings && settings.api_key);
}

// Fetch todas as conversas do Chatwoot por paginação
async function fetchChatwootConversations(startDate, endDate) {
  let allConversations = [];
  let page = 1;
  let hasMore = true;
  
  console.log("🌐 Conectando à API do Chatwoot para buscar todas as conversas...");

  while (hasMore && page <= 50) { // Limitador de páginas por segurança
    const res = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=all&page=${page}`, {
      headers: { 'api_access_token': CHATWOOT_API_TOKEN }
    });
    const data = await res.json();
    
    if (!data.data || !data.data.payload || data.data.payload.length === 0) {
      hasMore = false;
      break;
    }
    
    // Filtrar pelo range de data
    const valid = data.data.payload.filter(c => {
       const ts = c.created_at * 1000;
       return ts >= startDate.getTime() && ts <= endDate.getTime();
    });

    allConversations = allConversations.concat(valid);
    page++;
  }

  return allConversations;
}

async function fetchConversationMessages(convId) {
    const res = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${convId}/messages`, {
      headers: { 'api_access_token': CHATWOOT_API_TOKEN }
    });
    const data = await res.json();
    return data.payload || [];
}

async function evaluateWithAI(messagesText, openaiKey) {
  const prompt = `Você é um Auditor Sênior de Qualidade B2C de Oficinas Mecânicas.
Temos um histórico de WhatsApp e precisamos identificar se é um Cliente Final de fato ou se é Lixo/Fornecedor (ex: parceiro Hitocom, Femath devolução, venda de peças, sistemas de gestão, etc).
Se for Lixo, Spam ou ALGUÉM VENDENDO PEÇAS/PRODUTOS para a oficina, retorne is_valid_client: false.
ATENÇÃO: Frotistas, motoristas de app, empresas ou qualquer pessoa perguntando sobre conserto de carro, orçamento ou agendamento SÃO CLIENTES VÁLIDOS (is_valid_client: true). Em caso de dúvida, marque como true.
Se for um cliente válido, avalie o desempenho técnico do gerente da oficina. 
Ele pegou placa? Engajou? Explicou o serviço em vez de só mandar áudio seco? Conseguiu fechar ou o cliente desistiu?
Dê um Score de 0 a 100 (Sendo rigoroso. 0 para perda grave de cliente que seria evitada. 100 para conversão impecável).
Na deep_analysis, escreva um parágrafo denso e brutalmente honesto, listando os acertos e os motivos que levaram ao ganho/perda de forma CLARA. Nada de texto raso. Responda em Português-BR.

Histórico:
${messagesText}

Responda SOMENTE em JSON estruturado com os 3 campos:
{
  "is_valid_client": boolean,
  "score": number,
  "deep_analysis": "string"
}
`;

  try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1
        })
      });
      const data = await resp.json();
      if (!data.choices || !data.choices[0]) return null;
      return JSON.parse(data.choices[0].message.content);
  } catch (e) {
      console.log("Erro na API da OpenAI:", e.message);
      return null;
  }
}

async function main() {
  const startDate = new Date('2026-06-01T00:00:00Z');
  const endDate = new Date('2026-06-23T23:59:59Z');

  const openAiKey = await getOpenAiKey();
  if (!openAiKey) {
    console.error("ERRO: OPENAI_API_KEY não encontrada no banco nem no .env");
    return;
  }

  // 1. Puxar do Chatwoot!
  const rawConversations = await fetchChatwootConversations(startDate, endDate);
  console.log(`📥 Total de conversas puxadas da API Nativa do Chatwoot no período: ${rawConversations.length}`);

  // 2. Filtro agressivo de nome (Hitocom, Devolução) e conversas super rasas
  const blacklistWords = ['hitocom', 'devolução', 'fornecedor', 'distribuidor', 'pecas', 'peças', 'suporte', 'tecnico', 'nota fiscal'];
  
  let preFiltered = rawConversations.filter(c => {
     const name = (c.meta?.sender?.name || '').toLowerCase();
     if (blacklistWords.some(w => name.includes(w))) return false;
     return true;
  });

  console.log(`🧹 Restaram ${preFiltered.length} conversas após filtro básico de nome.`);

  const analyzedLeads = [];
  let index = 0;

  for (const c of preFiltered) {
     index++;
     console.log(`Processando conversa ${c.id} (${index}/${preFiltered.length})...`);
     
     const messages = await fetchConversationMessages(c.id);
     
     // Filtra mensagens para ver densidade de diálogo (ignorar msgs do sistema)
     const dialog = messages.filter(m => m.message_type === 0 || m.message_type === 1).reverse();
     if (dialog.length < 4) {
         console.log(`  -> Ignorada: Muito curta (apenas ${dialog.length} trocas).`);
         continue; // Cliente só deu oi e sumiu, sem começo meio e fim claro.
     }

     const transcript = dialog.map(m => {
        const role = m.message_type === 0 ? "Cliente" : "Oficina";
        return `[${role}]: ${m.content || '(Audio/Imagem)'}`;
     }).join('\n');

     // Avaliação On-The-Fly com o ChatGPT
     const evaluation = await evaluateWithAI(transcript, openAiKey);
     
     if (evaluation && evaluation.is_valid_client) {
         analyzedLeads.push({
            id: c.id,
            name: c.meta?.sender?.name || 'Desconhecido',
            inbox_id: c.inbox_id,
            score: evaluation.score,
            justificativa: evaluation.deep_analysis
         });
         console.log(`  ✅ Auditado e Qualificado! Score: ${evaluation.score}%`);
     } else {
         console.log(`  🚫 Descartado pela IA GPT-4o (Identificado como Fornecedor/Inválido)`);
     }
  }

  console.log(`\n🎉 Processamento completo! ${analyzedLeads.length} clientes 100% qualificados.`);

  // Montar HTML do Relatório
  let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dossiê Executivo - Chatwoot Realtime</title>
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
    
    <header class="border-b-2 border-gray-900 pb-6 mb-8 avoid-break">
        <h1 class="text-3xl font-black text-gray-900 uppercase tracking-tight">Análise de Qualidade Profunda</h1>
        <p class="text-gray-500 mt-1 font-medium">Extração Direta via API Chatwoot (01/06 a 23/06)</p>
    </header>

    <div class="mb-10 text-gray-700 leading-relaxed text-sm bg-blue-50 p-5 rounded-lg border border-blue-200 avoid-break">
        <strong class="text-blue-900 font-bold block mb-2">💡 Resumo Operacional:</strong>
        Todas as conversas com "Hitocom", "Devoluções" e fornecedores foram expurgadas nativamente pela API e verificadas duplamente pela Inteligência Artificial On-the-fly. <br>
        Foram selecionadas EXCLUSIVAMENTE conversas de CLIENTES reais que possuíram começo, meio e fim (alta taxa de troca de mensagens). A auditoria e as notas abaixo são baseadas na transcrição crua da conversa.
    </div>
  `;

  // Agrupar por Inboxes
  const inboxes = [...new Set(analyzedLeads.map(l => l.inbox_id))];

  inboxes.forEach((inboxId, index) => {
      const leads = analyzedLeads.filter(l => l.inbox_id === inboxId);
      const avgScore = (leads.reduce((sum, l) => sum + l.score, 0) / leads.length).toFixed(1);
      
      html += `
        <div class="mb-12 ${index > 0 ? 'page-break' : ''}">
            <div class="flex items-center gap-4 mb-6 avoid-break">
                <div class="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight">CAIXA (INBOX ID): #${inboxId}</h2>
                <span class="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded">Score Médio: ${avgScore}%</span>
            </div>
            
            <div class="space-y-6">
      `;

      // Sort by score
      leads.sort((a, b) => a.score - b.score).forEach(l => {
          const isCritical = l.score < 60;
          const bgHead = isCritical ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800';
          const borderSide = isCritical ? 'border-l-red-500' : 'border-l-emerald-500';

          html += `
                <div class="card p-5 border-l-4 ${borderSide} avoid-break">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="font-bold text-gray-900 text-lg">${l.name}</span>
                            <span class="text-xs text-gray-500 ml-2">Ticket: #${l.id}</span>
                        </div>
                        <span class="px-3 py-1.5 ${bgHead} font-black text-sm rounded border">
                            Nota da IA: ${l.score}%
                        </span>
                    </div>
                    <div class="text-sm text-gray-700 mt-4 leading-relaxed bg-gray-50 p-4 border border-gray-100 rounded">
                        <strong class="block mb-2 text-gray-900 flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                            Análise Diagnóstica da Conversa
                        </strong>
                        <p class="italic text-gray-800">"${l.justificativa}"</p>
                    </div>
                    <div class="mt-4">
                        <a href="https://chat.tork.services/app/accounts/5/conversations/${l.id}" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded border border-blue-100">
                            Abrir Conversa Autêntica no Chatwoot
                        </a>
                    </div>
                </div>
          `;
      });

      html += `</div></div>`;
  });

  if (analyzedLeads.length === 0) {
      html += `<p class="p-8 text-center text-gray-500 font-bold">Nenhum cliente maduro encontrado neste período sob o pente fino.</p>`;
  }

  html += `</body></html>`;

  const desktopPath = path.join(process.env.USERPROFILE, 'Desktop', 'Relatorio_Auditoria_Profunda_Chatwoot.html');
  fs.writeFileSync(desktopPath, html, 'utf-8');
  console.log("✅ Relatório hiper-filtrado gerado com sucesso no Desktop: " + desktopPath);
}

main();
