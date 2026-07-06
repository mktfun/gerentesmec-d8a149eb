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

// O Novo Cão de Guarda (Mais Forte e Exigente)
const REGRAS_ENTROPIA = {
  minClienteMsgs: 5,   // Exige mais ping-pong
  minOficinaMsgs: 5,   // Exige que o gerente fale bastante
  minTotalMsgs: 15     // Conversas robustas apenas
};

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
  while (page <= 25) { // Busca profunda de conversas
    try {
      // Removemos o status=resolved, pois gerentes não usam chatwoot. A IA avaliará o término.
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
    // Para puxar TODO o histórico, sem cortar o que o gerente mandou semana passada
    const data = await fetchWithRetry(`${BASE_URL}/conversations/${convId}/messages`, {
      headers: { 'api_access_token': TOKEN }
    });
    // Se a API retornar payload com mais páginas, deveríamos iterar, mas o payload raiz traz tudo do ticket.
    return data.payload || [];
  } catch(e) {
    return [];
  }
}

async function run() {
  const result = {};
  
  for (const inbox of inboxes) {
    console.log(`\n--- Varrendo ${inbox.name} ---`);
    const convs = await getConversations(inbox.id);
    
    let processed = [];
    
    for (const c of convs) {
      if (processed.length >= 25) break; 
      
      const senderName = (c.meta && c.meta.sender && c.meta.sender.name) ? c.meta.sender.name : 'Desconhecido';
      
      // === CAMADA 1: Tag Ignorar ===
      const labels = c.labels || [];
      const isIgnored = labels.map(l => l.toLowerCase()).includes('ignorar');
      
      if (isIgnored) {
         continue; 
      }
      
      const msgs = await getMessages(c.id);
      
      const realMsgs = msgs.filter(m => m.message_type === 0 || m.message_type === 1);
      const cleanMsgs = realMsgs.filter(m => !(m.content && m.content.includes("Connection successfully established")));
      
      const clienteMsgs = cleanMsgs.filter(m => m.message_type === 0);
      const oficinaMsgs = cleanMsgs.filter(m => m.message_type === 1);
      
      // === CAMADA 2: O Filtro de Arco Narrativo Severo (Entropia V2) ===
      if (
        clienteMsgs.length >= REGRAS_ENTROPIA.minClienteMsgs && 
        oficinaMsgs.length >= REGRAS_ENTROPIA.minOficinaMsgs && 
        cleanMsgs.length >= REGRAS_ENTROPIA.minTotalMsgs
      ) {
          // Inverter pra manter ordem cronológica correta (a API envia do mais novo pro mais velho)
          const transcript = cleanMsgs.reverse().map(m => {
             const sender = m.message_type === 0 ? `Cliente (${senderName})` : 'Oficina (Gerente)';
             // Garantimos que a URL e os links do gerente não sejam perdidos:
             const content = m.content ? m.content : (m.attachments && m.attachments.length > 0 ? '(Arquivo/Mídia anexado)' : '(Mensagem vazia)');
             return `[${sender}]: ${content}`;
          }).join('\n');
          
          processed.push({
            id: c.id,
            senderName,
            length: cleanMsgs.length,
            transcript
          });
          console.log(`[PASSOU P/ IA] #${c.id} - ${senderName} (Total Msgs: ${cleanMsgs.length})`);
      } 
    }
    
    result[inbox.name] = processed;
  }
  
  fs.writeFileSync('chatwoot_june_v5_full.json', JSON.stringify(result, null, 2));
  console.log('\n[!] Extração Finalizada. Salvo em chatwoot_june_v5_full.json');
}

run();
