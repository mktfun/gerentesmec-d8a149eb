import fs from 'fs';
import path from 'path';

const TOKEN = 'VDiCRLWP13ckmasC5QTH3xgF';
const BASE_URL = 'https://chat.tork.services/api/v1/accounts/5';

const DIR = 'conversas_jorge_beretta_FULL_PERIOD';

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

async function getFullMessages(convId) {
    let allMsgs = [];
    let url = `${BASE_URL}/conversations/${convId}/messages`;
    
    while(true) {
        const data = await fetchWithRetry(url, { headers: { 'api_access_token': TOKEN } });
        const payload = data.payload || [];
        
        if (payload.length === 0) break;
        
        allMsgs = payload.concat(allMsgs);
        if (payload.length < 20) break; 
        
        const oldestId = payload[0].id;
        url = `${BASE_URL}/conversations/${convId}/messages?before=${oldestId}`;
    }
    return allMsgs;
}

async function run() {
    const files = fs.readdirSync(DIR).filter(f => f.endsWith('.txt'));
    
    for (const file of files) {
        const match = file.match(/Conv_(\d+)_/);
        if (!match) continue;
        const convId = match[1];
        
        console.log(`\nResgatando Histórico Completo COM DATA da Conversa #${convId}...`);
        
        const rawTxt = fs.readFileSync(path.join(DIR, file), 'utf-8');
        const clienteMatch = rawTxt.match(/Cliente: (.*)/);
        const senderName = clienteMatch ? clienteMatch[1] : 'Desconhecido';
        
        const fullMsgs = await getFullMessages(convId);
        
        const realMsgs = fullMsgs.filter(m => m.message_type === 0 || m.message_type === 1);
        const cleanMsgs = realMsgs.filter(m => !(m.content && m.content.includes("Connection successfully established")));
        
        const transcript = cleanMsgs.reverse().map(m => {
            const sender = m.message_type === 0 ? `Cliente (${senderName})` : 'Oficina (Gerente)';
            const content = m.content ? m.content : (m.attachments && m.attachments.length > 0 ? '(Arquivo/Mídia anexado)' : '(Mensagem vazia)');
            
            let dateStr = '';
            if (m.created_at) {
                // Tenta UNIX Timestamp (segundos), ou String
                let d;
                if (typeof m.created_at === 'number') {
                    d = new Date(m.created_at * 1000);
                } else {
                    d = new Date(m.created_at);
                }
                const day = String(d.getDate()).padStart(2, '0');
                const mon = String(d.getMonth()+1).padStart(2, '0');
                const yr = d.getFullYear();
                const hh = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                dateStr = `[${day}/${mon}/${yr} ${hh}:${min}] `;
            }

            return `${dateStr}[${sender}]: ${content}`;
        }).join('\n');
        
        let header = `==============================================\n`;
        header += `Cliente: ${senderName}\n`;
        header += `ID Conversa: ${convId}\n`;
        header += `Total de Mensagens: ${cleanMsgs.length}\n`;
        header += `Status de Triagem: APROVADO\n`;
        header += `==============================================\n\n`;
        
        fs.writeFileSync(path.join(DIR, file), header + transcript);
    }
    console.log('\n[!] Extração Finalizada com Datas Injetadas nas 8 OSs.');
}

run();
