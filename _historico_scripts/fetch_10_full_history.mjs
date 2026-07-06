import fs from 'fs';
import path from 'path';

const TOKEN = 'VDiCRLWP13ckmasC5QTH3xgF';
const BASE_URL = 'https://chat.tork.services/api/v1/accounts/5';

const DIR = 'conversas_jorge_beretta_FULL_PERIOD';
const mantem = ['2546', '2549', '2559', '2650', '2682', '3073', '3231', '3244', '3248', '3646'];

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
        
        // Adiciona os blocos antigos no inicio do array total
        allMsgs = payload.concat(allMsgs);
        
        if (payload.length < 20) break; // Não tem mais páginas antigas
        
        const oldestId = payload[0].id;
        url = `${BASE_URL}/conversations/${convId}/messages?before=${oldestId}`;
    }
    return allMsgs;
}

async function run() {
    const files = fs.readdirSync(DIR);
    
    for (const file of files) {
        const match = file.match(/Conv_(\d+)_/);
        if (!match) continue;
        const convId = match[1];
        if (!mantem.includes(convId)) continue;
        
        console.log(`\nResgatando Histórico Completo da Conversa #${convId}...`);
        
        // Extrai infos básicas do arquivo atual
        const rawTxt = fs.readFileSync(path.join(DIR, file), 'utf-8');
        const clienteMatch = rawTxt.match(/Cliente: (.*)/);
        const senderName = clienteMatch ? clienteMatch[1] : 'Desconhecido';
        
        // Puxa toda a história cronológica
        const fullMsgs = await getFullMessages(convId);
        
        const realMsgs = fullMsgs.filter(m => m.message_type === 0 || m.message_type === 1);
        const cleanMsgs = realMsgs.filter(m => !(m.content && m.content.includes("Connection successfully established")));
        
        console.log(`Total de Mensagens Encontradas: ${cleanMsgs.length}`);
        
        const transcript = cleanMsgs.reverse().map(m => {
            const sender = m.message_type === 0 ? `Cliente (${senderName})` : 'Oficina (Gerente)';
            const content = m.content ? m.content : (m.attachments && m.attachments.length > 0 ? '(Arquivo/Mídia anexado)' : '(Mensagem vazia)');
            return `[${sender}]: ${content}`;
        }).join('\n');
        
        let header = `==============================================\n`;
        header += `Cliente: ${senderName}\n`;
        header += `ID Conversa: ${convId}\n`;
        header += `Total de Mensagens HISTÓRICO INTEGRAL: ${cleanMsgs.length}\n`;
        header += `Status de Triagem: APROVADO PELO ALGORITMO (FULL HISTORY)\n`;
        header += `==============================================\n\n`;
        
        fs.writeFileSync(path.join(DIR, file), header + transcript);
    }
    console.log('\n[!] Substituição completa. Todas as 10 OS agora possuem o histórico 100% integral.');
}

run();
