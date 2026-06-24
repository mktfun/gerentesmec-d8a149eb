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
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function getOpenAiKey() {
  const { data: settings } = await supabase.from('ai_settings').select('api_key').single();
  return process.env.OPENAI_API_KEY || (settings && settings.api_key);
}

// Extrair IDs Ouro e Ruins do Log
function parseLogFile() {
   const logPath = 'C:/Users/admin/.gemini/antigravity/brain/a1bb7b9f-c0fc-44b5-8ab9-a96509508605/.system_generated/tasks/task-4366.log';
   const txt = fs.readFileSync(logPath, 'utf8');
   const lines = txt.split('\n');
   
   const ruins = [];
   const ouros = []; // { id, score }
   
   for(let i=0; i<lines.length; i++){
      const l = lines[i];
      if (l.includes('Morreu no funil') && i>0) {
         const m = lines[i-1].match(/Ticket #(\d+)/);
         if(m) ruins.push(m[1]);
      } else if (l.includes('✅ Ouro!') && i>0) {
         const m = lines[i-1].match(/Ticket #(\d+)/);
         const s = l.match(/Score: (\d+)%/);
         if(m && s) ouros.push({ id: m[1], score: parseInt(s[1], 10) });
      }
   }
   return { ruins, ouros };
}

async function fetchConversation(id) {
   const r = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${id}`, { headers: { 'api_access_token': CHATWOOT_API_TOKEN } });
   return r.json();
}

async function fetchMessages(id) {
   const r = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${id}/messages`, { headers: { 'api_access_token': CHATWOOT_API_TOKEN } });
   const d = await r.json();
   const dialog = (d.payload || []).filter(m => m.message_type === 0 || m.message_type === 1).reverse();
   return dialog.map(m => `[${m.message_type === 0 ? "Cliente" : "Oficina"}]: ${m.content || '(Audio/Imagem)'}`).join('\n');
}

async function evaluateCagada(transcript, apiKey) {
  const isOpenRouter = apiKey.startsWith('sk-or-');
  const endpoint = isOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const model = isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini';

  const prompt = `Auditor de Qualidade de Oficina Mecânica B2C.
Este atendimento DEU ERRADO, o cliente abandonou no funil, ou o vendedor ofendeu, esqueceu de responder, ou foi estúpido.
Sua missão:
1. Dê um Score de 0 a 40. Sendo 0 para vácuos brutais e grosserias, e 40 para apenas desinteresse comercial.
2. Na deep_analysis, escreva um parágrafo denso detonando onde o vendedor "cagou", ou se faltou follow-up grave. O gerente vai ler isso na reunião e expor o erro.

Histórico:
${transcript}

Responda SOMENTE JSON: { "score": number, "deep_analysis": "string" }`;

  try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, ...(isOpenRouter && { 'HTTP-Referer': 'https://tork.services', 'X-Title': 'Tork' }) },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } })
      });
      const data = await resp.json();
      return JSON.parse(data.choices[0].message.content);
  } catch (e) { return null; }
}

async function evaluateOuro(transcript, apiKey) {
  const isOpenRouter = apiKey.startsWith('sk-or-');
  const endpoint = isOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const model = isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini';

  const prompt = `Auditor de Qualidade.
Este atendimento foi um SUCESSO DE VENDAS OU ATENDIMENTO (Score > 80).
Sua missão:
Na deep_analysis, escreva um parágrafo justificando a genialidade ou profissionalismo impecável do vendedor. Elogie a postura.
Histórico:
${transcript}
Responda JSON: { "deep_analysis": "string" }`;

  try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, ...(isOpenRouter && { 'HTTP-Referer': 'https://tork.services', 'X-Title': 'Tork' }) },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } })
      });
      const data = await resp.json();
      return JSON.parse(data.choices[0].message.content);
  } catch (e) { return null; }
}

async function main() {
   const { ruins, ouros } = parseLogFile();
   console.log(`Log parsed: ${ruins.length} Ruins, ${ouros.length} Ouros.`);
   
   const openAiKey = await getOpenAiKey();
   if(!openAiKey) return console.log("Key faltante.");

   // Agrupar ouros por inbox pra pegar só os melhores de cada
   const bestByInbox = {};
   for(const o of ouros) {
       const convData = await fetchConversation(o.id);
       const inbox = convData.inbox_id;
       if (!bestByInbox[inbox] || o.score > bestByInbox[inbox].score) {
           bestByInbox[inbox] = { id: o.id, score: o.score, name: convData.meta?.sender?.name };
       }
   }
   
   const finalData = []; // { inbox, type: 'ouro'|'lixo', name, id, score, analysis }

   for (const [inboxId, topConv] of Object.entries(bestByInbox)) {
       console.log(`✨ Inbox ${inboxId}: Processando A Melhor (Ticket ${topConv.id})`);
       const msgs = await fetchMessages(topConv.id);
       const evalOuro = await evaluateOuro(msgs, openAiKey);
       finalData.push({ inbox: inboxId, type: 'ouro', name: topConv.name, id: topConv.id, score: topConv.score, analysis: evalOuro?.deep_analysis || "Bom atendimento" });
   }

   // Agora piores por Inbox! Precisamos bater na API pra descobrir os inboxes dos ruins e fazer uma pool.
   console.log("Mapeando Inbox das piores...");
   const ruinPoolByInbox = {};
   // Pra não demorar, limitamos a checar 50 piores aleatorias.
   const sampleRuins = ruins.sort(() => 0.5 - Math.random()).slice(0, 50);
   
   for(const rid of sampleRuins) {
       const conv = await fetchConversation(rid);
       const inbox = conv.inbox_id;
       if(!ruinPoolByInbox[inbox]) ruinPoolByInbox[inbox] = [];
       ruinPoolByInbox[inbox].push({ id: rid, name: conv.meta?.sender?.name });
   }

   for (const [inboxId, candidates] of Object.entries(ruinPoolByInbox)) {
       console.log(`💩 Inbox ${inboxId}: Analisando Lixos...`);
       let foundRuins = [];
       for(const cand of candidates) {
           if(foundRuins.length >= 3) break;
           const msgs = await fetchMessages(cand.id);
           const cagada = await evaluateCagada(msgs, openAiKey);
           if(cagada && cagada.score !== undefined) {
               foundRuins.push({ inbox: inboxId, type: 'lixo', name: cand.name, id: cand.id, score: cagada.score, analysis: cagada.deep_analysis });
               console.log(`  -> CAGADA achada. Score: ${cagada.score}`);
           }
       }
       finalData.push(...foundRuins);
   }

   // Geração do HTML VIP
   let html = `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório Diretoria VIP - Extremos do Atendimento</title>
<script src="https://cdn.tailwindcss.com"></script><style>@page { size: A4 portrait; margin: 15mm; } body { font-family: 'Inter', system-ui, sans-serif; background: #fafafa; color: #111; } .page-break { page-break-after: always; } .avoid-break { page-break-inside: avoid; } .card { background: white; border: 1px solid #e5e7eb; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }</style></head>
<body class="p-8 max-w-[210mm] mx-auto bg-white shadow-xl min-h-screen">
<header class="border-b-2 border-gray-900 pb-6 mb-8"><h1 class="text-3xl font-black text-gray-900 uppercase">A Vitrine da Vergonha & Glória</h1><p class="text-gray-500 mt-1 font-medium">Relatório Diretivo (3 Erros Graves e 1 Sucesso por Unidade)</p></header>
   `;

   const inboxes = [...new Set(finalData.map(d => d.inbox))];
   
   inboxes.forEach((inbox, idx) => {
       const ouros = finalData.filter(d => d.inbox === inbox && d.type === 'ouro');
       const lixos = finalData.filter(d => d.inbox === inbox && d.type === 'lixo').sort((a,b) => a.score - b.score);
       const items = [...ouros, ...lixos];

       html += `<div class="mb-12 ${idx > 0 ? 'page-break' : ''}"><div class="flex items-center gap-4 mb-6"><div class="w-1.5 h-8 bg-blue-600 rounded-full"></div><h2 class="text-2xl font-black uppercase">UNIDADE (INBOX #${inbox})</h2></div><div class="space-y-6">`;
       
       items.forEach(d => {
          const bgHead = d.type === 'ouro' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-900';
          const borderColor = d.type === 'ouro' ? 'border-l-emerald-500' : 'border-l-red-600';
          const titleTag = d.type === 'ouro' ? '⭐⭐⭐ ATENDIMENTO ESTRELA' : '❌ ERRO GRAVE / VÁCUO';
          
          html += `
             <div class="card p-5 border-l-4 ${borderColor} avoid-break">
                 <div class="flex justify-between items-start mb-3">
                    <div>
                        <span class="font-bold text-gray-900 text-lg">${d.name} <span class="text-xs ml-2 text-gray-500">Ticket #${d.id}</span></span>
                        <div class="text-xs font-bold text-gray-500 uppercase mt-1">${titleTag}</div>
                    </div>
                    <span class="px-3 py-1.5 ${bgHead} font-black text-sm rounded border">Score: ${d.score}%</span>
                 </div>
                 <div class="text-sm text-gray-700 mt-4 leading-relaxed bg-gray-50 p-4 border border-gray-100 rounded">
                     <p class="italic text-[15px] leading-relaxed">"${d.analysis}"</p>
                 </div>
                 <div class="mt-4">
                     <a href="https://chat.tork.services/app/accounts/5/conversations/${d.id}" target="_blank" class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded border border-blue-100">Abrir no CRM para Auditagem</a>
                 </div>
             </div>
          `;
       });
       html += `</div></div>`;
   });

   html += `</body></html>`;
   fs.writeFileSync(path.join(process.env.USERPROFILE, 'Desktop', 'Relatorio_Vitrine_VIP.html'), html, 'utf8');
   console.log("VIP DONE!");
}
main();
