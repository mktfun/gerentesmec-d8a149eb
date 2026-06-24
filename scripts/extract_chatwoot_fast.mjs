import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHATWOOT_API_TOKEN = 'VDiCRLWP13ckmasC5QTH3xgF';
const CHATWOOT_BASE_URL = 'https://chat.tork.services';
const ACCOUNT_ID = '5';

async function fetchChatwootConversations(startDate, endDate) {
  let allConversations = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore && page <= 10) { 
    const res = await fetch(`${CHATWOOT_BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=all&page=${page}`, {
      headers: { 'api_access_token': CHATWOOT_API_TOKEN }
    });
    const data = await res.json();
    if (!data.data || !data.data.payload || data.data.payload.length === 0) break;
    
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

async function main() {
  const startDate = new Date('2026-06-01T00:00:00Z');
  const endDate = new Date('2026-06-23T23:59:59Z');

  const rawConversations = await fetchChatwootConversations(startDate, endDate);

  const blacklistWords = ['hitocom', 'devolução', 'fornecedor', 'distribuidor', 'pecas', 'peças', 'suporte', 'tecnico', 'nota fiscal'];
  
  let preFiltered = rawConversations.filter(c => {
     const name = (c.meta?.sender?.name || '').toLowerCase();
     if (blacklistWords.some(w => name.includes(w))) return false;
     return true;
  });

  const exportData = [];
  let extracted = 0;

  for (const c of preFiltered) {
     if(extracted >= 10) break; // Só precisamos de umas 10 pra mostrar pro chefe

     const messages = await fetchConversationMessages(c.id);
     const dialog = messages.filter(m => m.message_type === 0 || m.message_type === 1).reverse();
     
     if (dialog.length < 5) continue; 

     const transcript = dialog.map(m => {
        const role = m.message_type === 0 ? "Cliente" : "Oficina";
        return `[${role}]: ${m.content || '(Audio/Imagem)'}`;
     }).join('\n');

     exportData.push({
        id: c.id,
        name: c.meta?.sender?.name || 'Desconhecido',
        inbox_id: c.inbox_id,
        transcript: transcript
     });
     extracted++;
  }

  const outputPath = path.join(__dirname, '../transcripts.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log("Feito!");
}

main();
