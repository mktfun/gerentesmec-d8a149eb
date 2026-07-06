import fs from 'fs';
import path from 'path';
import { transcribeAudioUrl } from './scripts/local_whisper.mjs';

const TOKEN = 'VDiCRLWP13ckmasC5QTH3xgF';
const BASE_URL = 'https://chat.tork.services/api/v1/accounts/6';

const fromArg = process.argv.find(a => a.startsWith('--from='));
const toArg = process.argv.find(a => a.startsWith('--to='));

let startTs = 0;
let endTs = 0;

if (fromArg && toArg) {
    startTs = Math.floor(new Date(fromArg.split('=')[1] + 'T00:00:00Z').getTime() / 1000);
    endTs = Math.floor(new Date(toArg.split('=')[1] + 'T23:59:59Z').getTime() / 1000);
    console.log(`[*] Modo Varredura Estrita de Data: ${new Date(startTs*1000).toLocaleDateString()} a ${new Date(endTs*1000).toLocaleDateString()}`);
} else {
    // Backwards compatibility
    const periodArg = process.argv.find(a => a.startsWith('--period='));
    const period = periodArg ? periodArg.split('=')[1] : 'all';
    const now = Math.floor(Date.now() / 1000);
    if (period === 'week') startTs = now - (7 * 24 * 60 * 60);
    if (period === 'month') startTs = now - (30 * 24 * 60 * 60);
    if (startTs > 0) {
        endTs = now;
        console.log(`[*] Modo Temporizado Ativo: Após ${new Date(startTs * 1000).toLocaleString()}`);
    }
}

const REGRAS_ENTROPIA = {
  minTotalMsgs: 15
};

const BLACKLIST = ['rh', 'boleto', 'nota fiscal', 'retífica', 'gerson', 'ignorar', 'fornecedor'];

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

async function getAllInboxes() {
    const data = await fetchWithRetry(`${BASE_URL}/inboxes`, {
        headers: { 'api_access_token': TOKEN }
    });
    return data.payload || [];
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
    console.log("[*] Buscando Inboxes ativas...");
    const inboxesRaw = await getAllInboxes();
    const inboxes = inboxesRaw.map(i => ({ id: i.id, name: i.name.toUpperCase() }));
    console.log(`[+] Encontradas ${inboxes.length} inboxes:`, inboxes.map(i => i.name).join(', '));
    
    const inboxArg = process.argv.find(a => a.startsWith('--inbox='));
    const targetInbox = inboxArg ? inboxArg.split('=')[1].toUpperCase() : null;
    const limitArg = process.argv.find(a => a.startsWith('--limit='));
    const MAX_CONVS = limitArg ? parseInt(limitArg.split('=')[1], 10) : 15;

    for (const inbox of inboxes) {
        if (inbox.name === 'JORGE BERETTA' || inbox.name === 'TEMPARIO API') continue;
        if (targetInbox && !inbox.name.includes(targetInbox)) continue;
        
        console.log(`\n--- Varrendo Inbox: ${inbox.name} ---`);
        const dirName = `conversas_${inbox.name.replace(/[^A-Z0-9]/g, '_')}`;
        
        if (fs.existsSync(dirName)) {
            fs.rmSync(dirName, { recursive: true, force: true });
        }
        fs.mkdirSync(dirName);
        
        let validosCount = 0;
        let page = 1;
        
        while (page <= 50 && validosCount < MAX_CONVS) {
            process.stdout.write(`Buscando Página ${page}... `);
            let data;
            try {
                data = await fetchWithRetry(`${BASE_URL}/conversations?inbox_id=${inbox.id}&status=all&page=${page}`, {
                    headers: { 'api_access_token': TOKEN }
                });
            } catch(e) { 
                console.log("Fim das páginas.");
                break; 
            }
            
            const payload = (data.data && data.data.payload) ? data.data.payload : data.payload;
            if (!payload || payload.length === 0) {
                console.log("Vazia/Fim.");
                break;
            }
            
            console.log(`(${payload.length} convs)`);
            
            let skipPage = false;

            for (const c of payload) {
                if (validosCount >= MAX_CONVS) break;

                // Time-travel break ajustado para os novos filtros
                if (startTs > 0 && c.timestamp < startTs) {
                    console.log(`\n    [!] Atingimos conversas de ${new Date(c.timestamp * 1000).toLocaleDateString()} (fora do limite mínimo). Cortando a paginação desta unidade!`);
                    skipPage = true;
                    break;
                }
                if (endTs > 0 && c.timestamp > endTs) {
                    // Ignora conversas futuras do endTs, mas não quebra a página (pq chatwoot ordena por updated_at descendente)
                    continue;
                }
                
                const labels = (c.labels || []).map(l => l.toLowerCase());
                if (labels.includes('ignorar')) continue;
                
                const senderName = (c.meta && c.meta.sender && c.meta.sender.name) ? c.meta.sender.name : 'Desconhecido';
                let fullMsgsRaw;
                try {
                    fullMsgsRaw = await getFullMessages(c.id);
                } catch (e) {
                    console.log(`\n    [⚠️] Erro ao buscar mensagens para conversa ID ${c.id}: ${e.message}. Pulando conversa.`);
                    continue;
                }
                const realMsgs = fullMsgsRaw.filter(m => m.message_type === 0 || m.message_type === 1);
                
                // === NOVIDADE: Módulo Whisper para processar Attachments de Áudio e Vídeo ===
                for (let m of realMsgs) {
                    if (m.attachments && m.attachments.length > 0) {
                        for (let att of m.attachments) {
                            if (att.data_url) {
                                const ext = (att.data_url.split('.').pop() || '').substring(0, 3).toLowerCase();
                                const isMedia = att.file_type === 'audio' || att.file_type === 'video' || ['ogg', 'oga', 'mp3', 'wav', 'mp4'].includes(ext);
                                
                                if (isMedia) {
                                    console.log(`\n      🎙️ Mídia detectada na msg de ${m.message_type===1?'Mecânico':'Cliente'}...`);
                                    if (process.argv.includes('--no-ai')) {
                                        console.log(`      ⚠️ Bypass: Whisper desativado por flag. Usando mock.`);
                                        m.content = (m.content || '') + `\n\n[MÍDIA TRANSCRITA PELO SISTEMA]: "Veículo aprovado, liberado pro cliente."`;
                                    } else {
                                        console.log(`      Whisper está analisando...`);
                                        const transcript = await transcribeAudioUrl(att.data_url, TOKEN);
                                        if (transcript) {
                                            console.log(`      ✅ Whisper: "${transcript.substring(0,60)}..."`);
                                            m.content = (m.content || '') + `\n\n[MÍDIA TRANSCRITA PELO SISTEMA]: "${transcript}"`;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                const cleanMsgs = realMsgs.filter(m => !(m.content && m.content.includes("Connection successfully established")));
                
                if (cleanMsgs.length < REGRAS_ENTROPIA.minTotalMsgs) continue;
                
                const transcriptFull = cleanMsgs.map(m => m.content || '').join(' ').toLowerCase();
                
                let hasBlacklist = false;
                for (const bl of BLACKLIST) {
                    if (transcriptFull.includes(bl)) { hasBlacklist = true; break; }
                }
                if (transcriptFull.includes("vocês trabalham com")) hasBlacklist = true;
                
                if (hasBlacklist) continue;
                
                if (!transcriptFull.includes('aprovado') && !transcriptFull.includes('liberado') && !transcriptFull.includes('pix') && !transcriptFull.includes('pronto') && !transcriptFull.includes('nota') && !transcriptFull.includes('fechou')) {
                    continue; 
                }
                
                const msgsOrdenadas = cleanMsgs.reverse();
                
                function formatD(ts) {
                    let d = (typeof ts === 'number') ? new Date(ts*1000) : new Date(ts);
                    const day = String(d.getDate()).padStart(2, '0');
                    const mon = String(d.getMonth()+1).padStart(2, '0');
                    const yr = d.getFullYear();
                    const hh = String(d.getHours()).padStart(2, '0');
                    const min = String(d.getMinutes()).padStart(2, '0');
                    return `${day}/${mon}/${yr} ${hh}:${min}`;
                }
                
                let startStr = msgsOrdenadas[0].created_at;
                let endStr = msgsOrdenadas[msgsOrdenadas.length-1].created_at;
                
                let fullText = `--- METADADOS ---\nUnidade: ${inbox.name}\nCliente: ${senderName}\nID da Conversa: ${c.id}\nPeríodo: ${formatD(startStr)} até ${formatD(endStr)}\n------------------\n\n`;
                
                msgsOrdenadas.forEach(m => {
                    const type = m.message_type === 1 ? 'Mecânico (Gerente)' : 'Cliente';
                    const dataFormatada = formatD(m.created_at);
                    fullText += `[${dataFormatada}] ${type}:\n${m.content || '(Sem Mensagem/Midia não transcrita)'}\n\n`;
                });
                
                const fPath = path.join(dirName, `ID${c.id}_${senderName.replace(/[^A-Za-z0-9_]/g, '')}.txt`);
                fs.writeFileSync(fPath, fullText);
                validosCount++;
                console.log(`    [+] Exportado (${validosCount}/15): ${senderName} (ID: ${c.id}) - Entropia OK`);
            }
            
            if (skipPage) break;
            page++;
        }
    }
}

run();
