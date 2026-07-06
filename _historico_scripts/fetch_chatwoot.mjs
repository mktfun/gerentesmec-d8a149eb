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
  console.log(`Fetching conversations for inbox ${inboxId}...`);
  const convs = [];
  let page = 1;
  
  while (page <= 2) { 
    try {
      const data = await fetchWithRetry(`${BASE_URL}/conversations?inbox_id=${inboxId}&status=all&page=${page}`, {
        headers: { 'api_access_token': TOKEN }
      });
      if (data.data && data.data.payload) {
        convs.push(...data.data.payload);
      } else if (data.payload) {
          convs.push(...data.payload);
      }
      page++;
    } catch (e) {
      console.error(e);
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
    console.log(`Found ${convs.length} convs.`);
    
    let processed = [];
    let count = 0;
    
    for (const c of convs) {
      if (count >= 5) break; // Limit to top 5 suspect per unit to analyze to avoid context length explosion
      
      const msgs = await getMessages(c.id);
      const realMsgs = msgs.filter(m => m.message_type === 0 || m.message_type === 1);
      
      // Look for conversations with more than 10 messages (indicates a real interaction)
      if (realMsgs.length > 10) {
        const transcript = realMsgs.reverse().map(m => {
           const sender = m.message_type === 0 ? 'Cliente' : 'Oficina';
           const content = m.content ? m.content : (m.attachments && m.attachments.length > 0 ? '(Arquivo/Mídia anexado)' : '(Mensagem vazia)');
           return `[${sender}]: ${content}`;
        }).join('\n');
        
        processed.push({
          id: c.id,
          messages_count: realMsgs.length,
          transcript
        });
        count++;
      }
    }
    
    result[inbox.name] = processed;
  }
  
  fs.writeFileSync('chatwoot_june_dump.json', JSON.stringify(result, null, 2));
  console.log('Done! Saved to chatwoot_june_dump.json');
}

run();
