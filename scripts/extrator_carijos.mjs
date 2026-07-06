/**
 * EXTRATOR ESPECÍFICO - CARIJOS (INBOX_ID: 28)
 * Extrai todas as conversas e salva transcripts individuais
 */

import fs from 'fs';
import path from 'path';

const CHATWOOT_BASE = 'https://chat.tork.services';
const TOKEN = 'VDiCRLWP13ckmasC5QTH3xgF';
const ACCOUNT_ID = 5;
const INBOX_ID = 28;
const INBOX_NAME = 'CARIJOS';
const OUTPUT_DIR = './conversas_CARIJOS';

const BLACKLIST_TERMS = [
  'boleto','nota fiscal','nfe','fornecedor','retifica','recondicionado',
  'distribuidora','peças','peça nova','atacado','revenda','cnpj',
  'representante','atacadista','tabela de preços','catálogo',
  'RH','recursos humanos','departamento pessoal','admissão',
  'ponto eletrônico','férias','holerite','folha de pagamento',
  'trabalham com','vocês trabalham','vocês vendem','tem disponível',
  'você fornece','estoque disponível','preço de custo',
  'consultor de vendas','representação comercial',
];

const CLOSING_TERMS = [
  'pode buscar','pronto para buscar','carro liberado','veículo liberado',
  'pode retirar','está pronto','serviço concluído','serviço finalizado',
  'nota emitida','pagamento confirmado','pagamento efetuado',
  'obrigado pela preferência','até a próxima','aguardamos seu retorno',
  'carro entregue','entregamos','entrega realizada','chave entregue',
  'ja pode vim','pode vim buscar','ta pronto','tá pronto',
  'pode pegar','liberado para retirada','liberamos','pronto','entregue',
  'buscar o carro','buscar o veículo','retirar o carro','retirar o veículo',
];

const headers = { 'api_access_token': TOKEN, 'Content-Type': 'application/json' };

function formatDate(unixTs) {
  if (!unixTs) return '';
  const d = new Date(unixTs * 1000);
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,'0');
  const min = String(d.getMinutes()).padStart(2,'0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

async function fetchAllMessages(convId) {
  let allMessages = [];
  let beforeId = null;
  let page = 0;

  while (true) {
    page++;
    let url = `${CHATWOOT_BASE}/api/v1/accounts/${ACCOUNT_ID}/conversations/${convId}/messages`;
    if (beforeId) url += `?before=${beforeId}`;

    const res = await fetch(url, { headers });
    if (!res.ok) break;

    const data = await res.json();
    const msgs = data.payload?.messages || data.payload || [];
    if (!msgs || msgs.length === 0) break;

    allMessages = [...msgs, ...allMessages];

    const oldest = msgs.reduce((min, m) => m.id < min ? m.id : min, msgs[0].id);
    if (msgs.length < 20) break;
    beforeId = oldest;
    if (page > 50) break;
    await new Promise(r => setTimeout(r, 150));
  }

  return allMessages.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
}

async function fetchConversations() {
  let all = [];
  let page = 1;

  while (true) {
    const url = `${CHATWOOT_BASE}/api/v1/accounts/${ACCOUNT_ID}/conversations?inbox_id=${INBOX_ID}&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) { console.error('Erro ao buscar conversas:', res.status); break; }

    const data = await res.json();
    const convs = data.data?.payload || [];
    if (!convs || convs.length === 0) break;

    all = [...all, ...convs];
    console.log(`   Página ${page}: ${convs.length} conversas (total: ${all.length})`);
    if (convs.length < 25) break;
    page++;
    await new Promise(r => setTimeout(r, 200));
  }

  return all;
}

function hasBlacklist(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BLACKLIST_TERMS.some(t => lower.includes(t.toLowerCase()));
}

function hasClosingProof(transcript) {
  const lower = transcript.toLowerCase();
  return CLOSING_TERMS.some(t => lower.includes(t.toLowerCase()));
}

function buildTranscript(messages, contactName) {
  return messages.map(m => {
    const ts = formatDate(m.created_at);
    const role = m.message_type === 0 ? `Cliente (${contactName})` : 'Gerente';
    const content = m.content || '[Mídia/Arquivo]';
    return `[${ts}] ${role}: ${content}`;
  }).join('\n');
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n🔍 Extraindo conversas do Inbox ${INBOX_ID} (${INBOX_NAME})...`);
  const conversations = await fetchConversations();
  console.log(`   Total bruto: ${conversations.length} conversas`);

  const results = [];
  let descartadas = 0;
  let semContexto = 0;
  let abertas = 0;

  for (const conv of conversations) {
    const contactName = conv.meta?.sender?.name || 'Cliente';
    const convId = conv.id;

    const messages = await fetchAllMessages(convId);

    if (messages.length < 3) {
      semContexto++;
      continue;
    }

    const transcript = buildTranscript(messages, contactName);

    if (hasBlacklist(transcript)) {
      descartadas++;
      continue;
    }

    if (!hasClosingProof(transcript)) {
      abertas++;
      continue;
    }

    const firstMsg = messages[0];
    const lastMsg  = messages[messages.length - 1];
    const dateStart = formatDate(firstMsg?.created_at);
    const dateEnd   = formatDate(lastMsg?.created_at);

    const filename = `Conv_${convId}_${contactName.replace(/[^a-zA-Z0-9]/g,'_')}.txt`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    const header = [
      `======================================`,
      `CONVERSA ID: ${convId}`,
      `CLIENTE: ${contactName}`,
      `PERÍODO: ${dateStart} → ${dateEnd}`,
      `TOTAL DE MENSAGENS: ${messages.length}`,
      `======================================`,
      '',
    ].join('\n');

    fs.writeFileSync(filepath, header + transcript, 'utf-8');

    results.push({
      id: convId,
      cliente: contactName,
      dateStart,
      dateEnd,
      totalMsgs: messages.length,
      filename,
      transcript
    });

    console.log(`   ✅ Salva: ${filename} (${messages.length} msgs | ${dateStart} → ${dateEnd})`);
    await new Promise(r => setTimeout(r, 100));
  }

  const indexPath = path.join(OUTPUT_DIR, '_INDEX.json');
  fs.writeFileSync(indexPath, JSON.stringify({
    inbox: INBOX_NAME,
    inboxId: INBOX_ID,
    conversas: results.map(r => ({
      id: r.id, cliente: r.cliente, dateStart: r.dateStart,
      dateEnd: r.dateEnd, totalMsgs: r.totalMsgs, filename: r.filename
    }))
  }, null, 2));

  console.log(`\n📊 RESUMO:`);
  console.log(`   ✅ Salvas para auditoria: ${results.length}`);
  console.log(`   ⏭  Sem contexto (<3 msgs): ${semContexto}`);
  console.log(`   🚫 Blacklist: ${descartadas}`);
  console.log(`   🔄 Ainda abertas: ${abertas}`);
  console.log(`   📁 Diretório: ${OUTPUT_DIR}`);
}

run().catch(console.error);
