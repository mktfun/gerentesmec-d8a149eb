import fs from 'fs';

const TOKEN = 'VDiCRLWP13ckmasC5QTH3xgF';
const BASE_URL = 'https://chat.tork.services/api/v1/accounts/5';

// Filtrando APENAS Jorge Beretta, como o usuário pediu
const inboxes = [
  { id: 21, name: 'JORGE BERETTA' }
];

// O Filtro de Entropia (Garante que só conversas densas sejam extraídas)
const REGRAS_ENTROPIA = {
  minClienteMsgs: 5,   
  minOficinaMsgs: 5,   
  minTotalMsgs: 15     
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
  while (true) { // BUSCA ABSOLUTA SEM LIMITE DE PÁGINA (Puxa tudo até o banco esgotar)
    try {
      const data = await fetchWithRetry(`${BASE_URL}/conversations?inbox_id=${inboxId}&status=all&page=${page}`, {
        headers: { 'api_access_token': TOKEN }
      });
      const payload = data.data && data.data.payload ? data.data.payload : data.payload;
      
      if (payload && payload.length > 0) {
        convs.push(...payload);
        console.log(`Buscando Página ${page}... (${payload.length} conversas detectadas)`);
      } else {
        console.log(`Fim dos registros atingido na página ${page}.`);
        break;
      }
      page++;
    } catch (e) {
      console.log(`Erro de fetch na página ${page}:`, e.message);
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
    console.log(`\n--- Extraindo TODO O PERÍODO de ${inbox.name} ---`);
    const convs = await getConversations(inbox.id);
    console.log(`[INFO] Extração bruta localizou ${convs.length} conversas. Aplicando filtro de entropia...`);
    
    let processed = [];
    
    // Sem limite artificial de "processed.length >= 25". Varre todos os milhares.
    for (const c of convs) {
      const senderName = (c.meta && c.meta.sender && c.meta.sender.name) ? c.meta.sender.name : 'Desconhecido';
      
      // CAMADA 1: Tag Ignorar
      const labels = c.labels || [];
      const isIgnored = labels.map(l => l.toLowerCase()).includes('ignorar');
      
      if (isIgnored) continue; 
      
      const msgs = await getMessages(c.id);
      
      const realMsgs = msgs.filter(m => m.message_type === 0 || m.message_type === 1);
      const cleanMsgs = realMsgs.filter(m => !(m.content && m.content.includes("Connection successfully established")));
      
      const clienteMsgs = cleanMsgs.filter(m => m.message_type === 0);
      const oficinaMsgs = cleanMsgs.filter(m => m.message_type === 1);
      
      // CAMADA 2: Entropia 
      if (
        clienteMsgs.length >= REGRAS_ENTROPIA.minClienteMsgs && 
        oficinaMsgs.length >= REGRAS_ENTROPIA.minOficinaMsgs && 
        cleanMsgs.length >= REGRAS_ENTROPIA.minTotalMsgs
      ) {
          const transcript = cleanMsgs.reverse().map(m => {
             const sender = m.message_type === 0 ? `Cliente (${senderName})` : 'Oficina (Gerente)';
             const content = m.content ? m.content : (m.attachments && m.attachments.length > 0 ? '(Arquivo/Mídia anexado)' : '(Mensagem vazia)');
             return `[${sender}]: ${content}`;
          }).join('\n');
          
          processed.push({
            id: c.id,
            senderName,
            length: cleanMsgs.length,
            transcript
          });
      } 
    }
    
    result[inbox.name] = processed;
    console.log(`\n[SUCESSO] ${inbox.name}: Restaram ${processed.length} conversas densas e com clientes, desconsiderando "ignorar".`);
  }
  
  fs.writeFileSync('chatwoot_full_history.json', JSON.stringify(result, null, 2));
  console.log('\n[!] Extração Massiva Finalizada. Salvo em chatwoot_full_history.json');
}

run();
