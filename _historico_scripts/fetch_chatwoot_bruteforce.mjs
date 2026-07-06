import fs from 'fs';

const TOKEN = 'VDiCRLWP13ckmasC5QTH3xgF';
const BASE_URL = 'https://chat.tork.services/api/v1/accounts/5';

const inboxes = [
  { id: 25, name: 'JABAQUARA' },
  { id: 26, name: 'PLANALTO' },
  { id: 27, name: 'RUDGE' },
  { id: 28, name: 'CARIJOS' },
  { id: 29, name: 'DOM PEDRO' },
  { id: 30, name: 'MAUÁ' },
  { id: 11, name: 'DIADEMA' },
  { id: 10, name: 'KENNEDY' },
  { id: 21, name: 'JORGE BERETTA' }
];

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function getConversations(inboxId) {
  const convs = [];
  let page = 1;
  while (page <= 5) { 
    try {
      const data = await fetchWithRetry(`${BASE_URL}/conversations?inbox_id=${inboxId}&status=all&page=${page}`, {
        headers: { 'api_access_token': TOKEN }
      });
      const payload = data.data && data.data.payload ? data.data.payload : data.payload;
      if (payload && payload.length > 0) {
        convs.push(...payload);
      } else {
        break;
      }
      page++;
    } catch (e) {
      break;
    }
  }
  return convs;
}

async function getMessages(convId) {
  try {
    const data = await fetchWithRetry(`${BASE_URL}/conversations/${convId}/messages`, {
      headers: { 'api_access_token': TOKEN }
    });
    return data.payload || [];
  } catch(e) {
    return [];
  }
}

async function run() {
  const result = {};
  
  for (const inbox of inboxes) {
    console.log(`\n--- Processando ${inbox.name} ---`);
    const convs = await getConversations(inbox.id);
    
    let processed = [];
    
    for (const c of convs) {
      if (processed.length >= 10) break; // Pega as 10 maiores conversas para a IA auditar
      
      const msgs = await getMessages(c.id);
      
      const realMsgs = msgs.filter(m => m.message_type === 0 || m.message_type === 1);
      const cleanMsgs = realMsgs.filter(m => !(m.content && m.content.includes("Connection successfully established")));
      
      const clienteMsgs = cleanMsgs.filter(m => m.message_type === 0);
      const oficinaMsgs = cleanMsgs.filter(m => m.message_type === 1);
      
      // Filtro heurístico básico: Tem que ter pelo menos um ping-pong longo
      if (clienteMsgs.length >= 4 && oficinaMsgs.length >= 4) {
        const transcript = cleanMsgs.reverse().map(m => {
           const sender = m.message_type === 0 ? 'Cliente' : 'Oficina';
           const content = m.content ? m.content : (m.attachments && m.attachments.length > 0 ? '(Arquivo/Mídia anexado)' : '(Mensagem vazia)');
           return `[${sender}]: ${content}`;
        }).join('\n');
        
        processed.push({
          id: c.id,
          messages_count: cleanMsgs.length,
          transcript
        });
        console.log(`Achei conversa candidata. ID: ${c.id} (${cleanMsgs.length} mensagens)`);
      }
    }
    
    result[inbox.name] = processed;
  }
  
  fs.writeFileSync('chatwoot_june_dump_bruteforce.json', JSON.stringify(result, null, 2));
  console.log('Done! Saved to chatwoot_june_dump_bruteforce.json');
}

run();
