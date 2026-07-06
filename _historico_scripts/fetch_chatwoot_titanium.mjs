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

const BLACKLIST_NAMES = [
  'mecânic', 'mecanic', 'gerent', 'gerênc', 'gerenc', 'peça', 'peca', 'fornecedor', 
  'auto', 'oficina', 'group', 'financeiro', 'venda', 'rede', 'retifica', 'service', 
  'limpeza', 'sos', 's.o.s', 'logistica', 'freio', 'bomba', 'distribuidor', 'comercial', 'comércio',
  'baterias', 'centro', 'eletric', 'escapamento', 'guincho', 'rh', 'tork', 'popular', 'femath'
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
  while (page <= 25) { // Vamos mais fundo (até 25 páginas)
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
      if (processed.length >= 3) break;
      
      const senderName = (c.meta && c.meta.sender && c.meta.sender.name) ? c.meta.sender.name : 'Desconhecido';
      
      const isBlacklisted = BLACKLIST_NAMES.some(word => senderName.toLowerCase().includes(word));
      if (isBlacklisted) continue;
      
      const msgs = await getMessages(c.id);
      
      const realMsgs = msgs.filter(m => m.message_type === 0 || m.message_type === 1);
      const cleanMsgs = realMsgs.filter(m => !(m.content && m.content.includes("Connection successfully established")));
      
      const clienteMsgs = cleanMsgs.filter(m => m.message_type === 0);
      const oficinaMsgs = cleanMsgs.filter(m => m.message_type === 1);
      
      // EXIGÊNCIA ABSOLUTA: Começo, meio e fim (muitas mensagens de ambos os lados)
      if (clienteMsgs.length >= 6 && oficinaMsgs.length >= 6 && cleanMsgs.length >= 15) {
        
        const fullText = cleanMsgs.map(m => m.content || '').join(' ').toLowerCase();
        
        // Regras de ouro para confirmar que é cliente consertando carro
        const hasCarIndicators = fullText.includes("placa") || fullText.includes("veículo") || fullText.includes("carro") || fullText.includes("orçamento");
        
        // Rejeitar papo de fornecedor
        const isSupplierTalk = fullText.includes("faturar para") || fullText.includes("base de troca") || fullText.includes("comercial") || fullText.includes("cnpj");
        
        if (hasCarIndicators && !isSupplierTalk) {
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
            console.log(`TITANIUM: ${c.id} - ${senderName} (Tamanho: ${cleanMsgs.length})`);
        }
      }
    }
    
    result[inbox.name] = processed;
  }
  
  fs.writeFileSync('chatwoot_june_titanium.json', JSON.stringify(result, null, 2));
  console.log('Done! Saved to chatwoot_june_titanium.json');
}

run();
