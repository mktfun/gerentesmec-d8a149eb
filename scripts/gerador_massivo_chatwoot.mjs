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

// Fetch TODAS as conversas (Paginação Massiva)
async function fetchChatwootConversations(startDate, endDate) {
  let allConversations = [];
  let page = 1;
  let hasMore = true;
  
  console.log("🌐 Conectando à API do Chatwoot para buscar o mês de Junho (Paginação Absoluta)...");

  while (hasMore) {
    console.log(`Buscando Página ${page}...`);
    const res = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=all&page=${page}`, {
      headers: { 'api_access_token': CHATWOOT_API_TOKEN }
    });
    
    if(!res.ok) {
       console.log("Erro na API Chatwoot:", res.statusText);
       break;
    }
    
    const data = await res.json();
    
    if (!data.data || !data.data.payload || data.data.payload.length === 0) {
      hasMore = false;
      break;
    }
    
    const payload = data.data.payload;
    
    // Filtrar pelo range de data
    const valid = payload.filter(c => {
       const ts = c.created_at * 1000;
       return ts >= startDate.getTime() && ts <= endDate.getTime();
    });

    allConversations = allConversations.concat(valid);

    // Como as conversas ordenam por atividade recente, não podemos parar facilmente usando apenas created_at,
    // Mas se a última atividade da página já for de meses muito antes do nosso range (ex: Maio), podemos parar a paginação.
    const lastActivity = payload[payload.length - 1].last_activity_at * 1000;
    if (lastActivity < startDate.getTime() - (10 * 86400000)) { // Margem de segurança de 10 dias antes do inicio
        console.log("Chegamos ao fim da zona segura de atividades antigas.");
        hasMore = false;
    } else {
        page++;
    }
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

async function evaluateWithAI(messagesText, apiKey) {
  const isOpenRouter = apiKey.startsWith('sk-or-');
  const endpoint = isOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const model = isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini';

  const prompt = `Você é um Auditor Sênior de Qualidade B2C de Oficinas Mecânicas.
Temos um histórico de WhatsApp.
Passo 1: Identificar se é Fornecedor/Lixo (is_valid_client: false).
Passo 2: Identificar se a conversa FINALIZOU (is_finalized). SÓ marque true se a tratativa concluiu! Ex: Vendeu o serviço, cliente marcou agenda, ou cliente disse "agora não, não vou fazer". SE o gerente orçou e o cliente deu vácuo, ou a negociação ficou aberta e morreu ("vou ver"), is_finalized DEVE ser false.

Se is_valid_client e is_finalized forem true:
Avalie o desempenho do gerente. 
Ele pegou placa? Explicou o serviço? Conseguiu fechar com clareza?
Dê um Score de 0 a 100 e na deep_analysis, escreva um parágrafo denso e brutalmente honesto listando os motivos técnicos do fechamento (ou recusa) do serviço. O chefe dele vai ler.

Histórico:
${messagesText}

Responda SOMENTE em JSON:
{
  "is_valid_client": boolean,
  "is_finalized": boolean,
  "score": number,
  "deep_analysis": "string"
}
`;

  try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...(isOpenRouter && { 'HTTP-Referer': 'https://tork.services', 'X-Title': 'Tork CRM' })
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1
        })
      });
      const data = await resp.json();
      if (!data.choices || !data.choices[0]) return null;
      return JSON.parse(data.choices[0].message.content);
  } catch (e) {
      console.log("Erro na API LLM:", e.message);
      return null;
  }
}

async function main() {
  const startDate = new Date('2026-06-01T00:00:00Z');
  const endDate = new Date('2026-06-23T23:59:59Z');

  const openAiKey = await getOpenAiKey();
  if (!openAiKey) {
    console.error("ERRO: OPENAI_API_KEY não encontrada.");
    return;
  }

  const rawConversations = await fetchChatwootConversations(startDate, endDate);
  console.log(`\n📥 Total de conversas puxadas: ${rawConversations.length}`);

  const blacklistWords = ['hitocom', 'devolução', 'fornecedor', 'distribuidor', 'pecas', 'peças', 'suporte', 'tecnico', 'nota fiscal', 'evolutionapi'];
  
  let preFiltered = rawConversations.filter(c => {
     const name = (c.meta?.sender?.name || '').toLowerCase();
     if (blacklistWords.some(w => name.includes(w))) return false;
     return true;
  });

  console.log(`🧹 Restaram ${preFiltered.length} conversas após filtro básico do painel.`);

  const analyzedLeads = [];
  let index = 0;

  for (const c of preFiltered) {
     index++;
     console.log(`Avaliando Ticket #${c.id} (${index}/${preFiltered.length})...`);
     
     const messages = await fetchConversationMessages(c.id);
     
     // Ignora sistema e inverte pro mais velho vir primeiro
     const dialog = messages.filter(m => m.message_type === 0 || m.message_type === 1).reverse();
     
     if (dialog.length < 10) {
         console.log(`  -> Ignorada: Sem volume (apenas ${dialog.length} mensagens trocadas).`);
         continue; 
     }

     const transcript = dialog.map(m => {
        const role = m.message_type === 0 ? "Cliente" : "Oficina";
        return `[${role}]: ${m.content || '(Audio/Imagem)'}`;
     }).join('\n');

     const evaluation = await evaluateWithAI(transcript, openAiKey);
     
     if (evaluation) {
         if(!evaluation.is_valid_client) {
             console.log(`  🚫 Descartado: Fornecedor ou Spam.`);
         } else if(!evaluation.is_finalized) {
             console.log(`  🚫 Descartado: A tratativa não foi finalizada (Morreu no funil).`);
         } else {
             analyzedLeads.push({
                id: c.id,
                name: c.meta?.sender?.name || 'Desconhecido',
                inbox_id: c.inbox_id,
                score: evaluation.score,
                justificativa: evaluation.deep_analysis
             });
             console.log(`  ✅ Ouro! Classificada e auditada com Score: ${evaluation.score}%`);
         }
     }
  }

  console.log(`\n🎉 Processamento completo! Foram encontradas ${analyzedLeads.length} vendas/serviços finalizados de verdade.`);

  if (analyzedLeads.length === 0) {
      console.log("Nenhuma tratativa finalizada atendeu aos critérios severos do chefe.");
      return;
  }

  // Montar HTML
  let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dossiê Final - Tratativas Fechadas</title>
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
        <h1 class="text-3xl font-black text-gray-900 uppercase tracking-tight">Dossiê Executivo de Vendas</h1>
        <p class="text-gray-500 mt-1 font-medium">Extração Definitiva via Chatwoot API (01 a 23 de Junho)</p>
    </header>

    <div class="mb-10 text-gray-700 leading-relaxed text-sm bg-blue-50 p-5 rounded-lg border border-blue-200 avoid-break">
        <strong class="text-blue-900 font-bold block mb-2">💡 Crivo Operacional Ativo:</strong>
        Todas as conversas inconclusivas (em que o cliente não deu retorno ou o gerente não finalizou formalmente), vácuos curtos e inboxes de fornecedores foram expurgados automaticamente por nossa camada de Inteligência Artificial.<br>
        O relatório abaixo exibe <b>EXCLUSIVAMENTE clientes reais cujo funil foi fechado com resolução clara (Sim ou Não)</b>.
    </div>
  `;

  const inboxes = [...new Set(analyzedLeads.map(l => l.inbox_id))];

  inboxes.forEach((inboxId, index) => {
      const leads = analyzedLeads.filter(l => l.inbox_id === inboxId);
      const avgScore = (leads.reduce((sum, l) => sum + l.score, 0) / leads.length).toFixed(1);
      
      html += `
        <div class="mb-12 ${index > 0 ? 'page-break' : ''}">
            <div class="flex items-center gap-4 mb-6 avoid-break">
                <div class="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight">CAIXA DE ATENDIMENTO: #${inboxId}</h2>
                <span class="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded">Média Operacional: ${avgScore}%</span>
            </div>
            
            <div class="space-y-6">
      `;

      leads.sort((a, b) => b.score - a.score).forEach(l => {
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
                            Nota Final: ${l.score}%
                        </span>
                    </div>
                    <div class="text-sm text-gray-700 mt-4 leading-relaxed bg-gray-50 p-4 border border-gray-100 rounded">
                        <strong class="block mb-2 text-gray-900 flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                            Decodificação do Atendimento
                        </strong>
                        <p class="italic text-gray-800 text-[15px] leading-relaxed">"${l.justificativa}"</p>
                    </div>
                    <div class="mt-4">
                        <a href="https://chat.tork.services/app/accounts/5/conversations/${l.id}" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded border border-blue-100">
                            Abrir Transcrição Autêntica no CRM
                        </a>
                    </div>
                </div>
          `;
      });

      html += `</div></div>`;
  });

  html += `</body></html>`;

  const desktopPath = path.join(process.env.USERPROFILE, 'Desktop', 'Relatorio_Auditoria_Definitivo_Chatwoot.html');
  fs.writeFileSync(desktopPath, html, 'utf-8');
  console.log("✅ Dossiê massivo gravado com sucesso no Desktop!");
}

main();
