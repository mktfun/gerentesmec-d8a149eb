/**
 * EXTRATOR RAPIDO PLANALTO - Processamento paralelo
 */

import fs from 'fs';
import path from 'path';

const CHATWOOT_BASE = 'https://chat.tork.services';
const TOKEN = 'VDiCRLWP13ckmasC5QTH3xgF';
const ACCOUNT_ID = 5;
const INBOX_ID = 26;
const INBOX_NAME = 'PLANALTO';
const OUTPUT_DIR = './conversas_PLANALTO';
const CONCURRENCY = 8;

const BLACKLIST_TERMS = [
  'boleto','nota fiscal','nfe','fornecedor','retifica','recondicionado',
  'distribuidora','atacado','revenda','cnpj','representante',
  'RH','recursos humanos','departamento pessoal','admissao',
  'ponto eletronico','ferias','holerite','folha de pagamento',
  'trabalham com','voces trabalham','voces vendem',
  'voce fornece','estoque disponivel','preco de custo',
  'consultor de vendas','representacao comercial',
];

const CLOSING_TERMS = [
  'pode buscar','pronto para buscar','carro liberado','veiculo liberado',
  'pode retirar','esta pronto','servico concluido','servico finalizado',
  'nota emitida','pagamento confirmado','pagamento efetuado',
  'obrigado pela preferencia','ate a proxima','aguardamos seu retorno',
  'carro entregue','entregamos','entrega realizada','chave entregue',
  'ja pode vim','pode vim buscar','ta pronto','carro pronto',
  'pode pegar','liberado para retirada','liberamos','veiculo pronto',
  'esta pronto','tá pronto','está pronto','ja ta pronto','já ta pronto',
  'boa noite pode vir','pode vir buscar',
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

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) return res;
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
    } catch (e) {
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

async function fetchAllMessages(convId) {
  let allMessages = [];
  let beforeId = null;
  let page = 0;

  while (true) {
    page++;
    let url = `${CHATWOOT_BASE}/api/v1/accounts/${ACCOUNT_ID}/conversations/${convId}/messages`;
    if (beforeId) url += `?before=${beforeId}`;

    const res = await fetchWithRetry(url);
    if (!res) break;

    const data = await res.json();
    const msgs = data.payload?.messages || data.payload || [];
    if (!msgs || msgs.length === 0) break;

    allMessages = [...msgs, ...allMessages];
    const oldest = msgs.reduce((min, m) => m.id < min ? m.id : min, msgs[0].id);
    if (msgs.length < 20) break;
    beforeId = oldest;
    if (page > 30) break;
    await new Promise(r => setTimeout(r, 50));
  }

  return allMessages.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
}

async function fetchConversations() {
  let all = [];
  let page = 1;
  while (true) {
    const url = `${CHATWOOT_BASE}/api/v1/accounts/${ACCOUNT_ID}/conversations?inbox_id=${INBOX_ID}&page=${page}`;
    const res = await fetchWithRetry(url);
    if (!res) break;
    const data = await res.json();
    const convs = data.data?.payload || [];
    if (!convs || convs.length === 0) break;
    all = [...all, ...convs];
    console.log(`  Pagina ${page}: ${convs.length} convs (total: ${all.length})`);
    if (convs.length < 25) break;
    page++;
    await new Promise(r => setTimeout(r, 100));
  }
  return all;
}

function hasBlacklist(text) {
  if (!text) return false;
  const lower = text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return BLACKLIST_TERMS.some(t => lower.includes(t.toLowerCase()));
}

function hasClosingProof(transcript) {
  const lower = transcript.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CLOSING_TERMS.some(t => lower.includes(t.toLowerCase()));
}

function buildTranscript(messages, contactName) {
  return messages.map(m => {
    const ts = formatDate(m.created_at);
    const role = m.message_type === 0 ? `Cliente (${contactName})` : 'Gerente';
    const content = m.content || '[Midia/Arquivo]';
    return `[${ts}] ${role}: ${content}`;
  }).join('\n');
}

async function processConversation(conv, index, total) {
  const contactName = conv.meta?.sender?.name || 'Cliente';
  const convId = conv.id;

  try {
    const messages = await fetchAllMessages(convId);

    if (messages.length < 6) {
      return { status: 'sem_contexto', convId };
    }

    const transcript = buildTranscript(messages, contactName);

    if (hasBlacklist(transcript)) {
      return { status: 'blacklist', convId };
    }

    if (!hasClosingProof(transcript)) {
      return { status: 'aberta', convId };
    }

    const firstMsg = messages[0];
    const lastMsg = messages[messages.length - 1];
    const dateStart = formatDate(firstMsg?.created_at);
    const dateEnd = formatDate(lastMsg?.created_at);

    const filename = `Conv_${convId}_${contactName.replace(/[^a-zA-Z0-9]/g,'_')}.txt`;
    const filepath = path.join(OUTPUT_DIR, filename);

    const header = [
      `======================================`,
      `CONVERSA ID: ${convId}`,
      `CLIENTE: ${contactName}`,
      `PERIODO: ${dateStart} -> ${dateEnd}`,
      `TOTAL DE MENSAGENS: ${messages.length}`,
      `======================================`,
      '',
    ].join('\n');

    fs.writeFileSync(filepath, header + transcript, 'utf-8');
    console.log(`[${String(index).padStart(3)}/${total}] OK: ${filename} (${messages.length} msgs)`);

    return {
      status: 'ok',
      id: convId,
      cliente: contactName,
      dateStart,
      dateEnd,
      totalMsgs: messages.length,
      filename,
      transcript
    };
  } catch (e) {
    console.log(`[${index}/${total}] ERRO conv ${convId}: ${e.message}`);
    return { status: 'erro', convId };
  }
}

async function runBatch(items, fn, concurrency) {
  const results = [];
  let i = 0;
  const total = items.length;

  async function worker() {
    while (i < total) {
      const idx = i++;
      const result = await fn(items[idx], idx + 1, total);
      results.push(result);
    }
  }

  const workers = Array.from({ length: concurrency }, worker);
  await Promise.all(workers);
  return results;
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\nExtraindo conversas do Inbox ${INBOX_ID} (${INBOX_NAME})...`);
  const conversations = await fetchConversations();
  console.log(`Total bruto: ${conversations.length} conversas`);
  console.log(`Processando com ${CONCURRENCY} workers paralelos...\n`);

  const allResults = await runBatch(conversations, processConversation, CONCURRENCY);

  const saved = allResults.filter(r => r.status === 'ok');
  const semContexto = allResults.filter(r => r.status === 'sem_contexto').length;
  const blacklist = allResults.filter(r => r.status === 'blacklist').length;
  const abertas = allResults.filter(r => r.status === 'aberta').length;
  const erros = allResults.filter(r => r.status === 'erro').length;

  const indexPath = path.join(OUTPUT_DIR, '_INDEX.json');
  fs.writeFileSync(indexPath, JSON.stringify({
    inbox: INBOX_NAME,
    inboxId: INBOX_ID,
    conversas: saved.map(r => ({
      id: r.id, cliente: r.cliente, dateStart: r.dateStart,
      dateEnd: r.dateEnd, totalMsgs: r.totalMsgs, filename: r.filename
    }))
  }, null, 2));

  console.log(`\nRESUMO FINAL:`);
  console.log(`  Salvas para auditoria: ${saved.length}`);
  console.log(`  Sem contexto (<6 msgs): ${semContexto}`);
  console.log(`  Blacklist: ${blacklist}`);
  console.log(`  Abertas (sem entrega): ${abertas}`);
  console.log(`  Erros de rede: ${erros}`);
  console.log(`  Diretorio: ${OUTPUT_DIR}`);
  console.log(`EXTRACAO_CONCLUIDA`);
}

run().catch(e => {
  console.error(`ERRO FATAL: ${e.message}`);
  process.exit(1);
});
