/**
 * Extrator dedicado MAUÁ — Inbox 30
 * Extrai todas as conversas, filtra e salva transcripts
 */
import fs from 'fs';
import path from 'path';

const TOKEN = 'VDiCRLWP13ckmasC5QTH3xgF';
const BASE = 'https://chat.tork.services';
const ACCOUNT_ID = 5;
const INBOX_ID = 30;
const INBOX_NAME = 'MAUÁ';
const OUTPUT_DIR = './conversas_MAUA';

const BLACKLIST_TERMS = [
  'boleto','nota fiscal','nfe','fornecedor','retifica','recondicionado',
  'distribuidora','peças nova','atacado','revenda','cnpj',
  'representante','atacadista','tabela de preços','catálogo',
  'recursos humanos','departamento pessoal','admissão',
  'ponto eletrônico','férias','holerite','folha de pagamento',
  'trabalham com','vocês vendem','você fornece','preço de custo',
  'consultor de vendas','representação comercial',
];

const CLOSING_TERMS = [
  'pode buscar','pronto para buscar','carro liberado','veículo liberado',
  'pode retirar','está pronto','serviço concluído','serviço finalizado',
  'nota emitida','pagamento confirmado','pagamento efetuado',
  'obrigado pela preferência','até a próxima',
  'carro entregue','entregamos','entrega realizada','chave entregue',
  'ja pode vim','pode vim buscar','ta pronto','tá pronto',
  'pode pegar','liberado para retirada','liberamos',
  'pronto pra buscar','carro ta pronto','veiculo pronto',
];

const hdrs = { 'api_access_token': TOKEN, 'Content-Type': 'application/json' };

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const pad = n => String(n).padStart(2,'0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function fetchConversations() {
  let all = [];
  let page = 1;
  while (true) {
    const url = BASE + '/api/v1/accounts/' + ACCOUNT_ID + '/conversations?inbox_id=' + INBOX_ID + '&page=' + page;
    const res = await fetch(url, { headers: hdrs });
    if (!res.ok) { console.error('Erro na página', page, res.status); break; }
    const data = await res.json();
    const convs = data.data?.payload || [];
    console.log('  Página', page, ':', convs.length, 'conversas');
    if (!convs.length) break;
    all = [...all, ...convs];
    if (convs.length < 25) break;
    page++;
    await new Promise(r => setTimeout(r, 200));
  }
  return all;
}

async function fetchMessages(convId) {
  let all = [];
  let beforeId = null;
  let page = 0;
  while (true) {
    page++;
    let url = BASE + '/api/v1/accounts/' + ACCOUNT_ID + '/conversations/' + convId + '/messages';
    if (beforeId) url += '?before=' + beforeId;
    const res = await fetch(url, { headers: hdrs });
    if (!res.ok) break;
    const data = await res.json();
    const msgs = data.payload?.messages || data.payload || [];
    if (!msgs || msgs.length === 0) break;
    all = [...msgs, ...all];
    const oldest = msgs.reduce((min, m) => m.id < min ? m.id : min, msgs[0].id);
    if (msgs.length < 20) break;
    beforeId = oldest;
    if (page > 50) break;
    await new Promise(r => setTimeout(r, 150));
  }
  return all.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
}

function buildTranscript(msgs, name) {
  return msgs.map(m => {
    const ts = formatDate(m.created_at);
    const role = m.message_type === 0 ? ('Cliente (' + name + ')') : 'Gerente';
    const content = m.content || '[Mídia/Arquivo]';
    return '[' + ts + '] ' + role + ': ' + content;
  }).join('\n');
}

function hasBlacklist(text) {
  const lower = (text || '').toLowerCase();
  return BLACKLIST_TERMS.some(t => lower.includes(t.toLowerCase()));
}

function hasClosing(text) {
  const lower = (text || '').toLowerCase();
  return CLOSING_TERMS.some(t => lower.includes(t.toLowerCase()));
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('\n🔍 Extraindo MAUÁ (Inbox 30)...');
  const conversations = await fetchConversations();
  console.log('\n  Total bruto:', conversations.length, 'conversas\n');

  const saved = [];
  let semCtx = 0, blacklisted = 0, abertas = 0;

  for (const conv of conversations) {
    const contactName = conv.meta?.sender?.name || 'Cliente';
    const convId = conv.id;
    const msgs = await fetchMessages(convId);

    if (msgs.length < 8) { semCtx++; continue; }

    const transcript = buildTranscript(msgs, contactName);

    if (hasBlacklist(transcript)) { blacklisted++; continue; }
    if (!hasClosing(transcript)) { abertas++; continue; }

    const dateStart = formatDate(msgs[0]?.created_at);
    const dateEnd   = formatDate(msgs[msgs.length-1]?.created_at);
    const filename  = 'Conv_' + convId + '_' + contactName.replace(/[^a-zA-Z0-9]/g,'_') + '.txt';
    const filepath  = path.join(OUTPUT_DIR, filename);

    const header = [
      '======================================',
      'CONVERSA ID: ' + convId,
      'CLIENTE: ' + contactName,
      'PERÍODO: ' + dateStart + ' → ' + dateEnd,
      'TOTAL DE MENSAGENS: ' + msgs.length,
      '======================================',
      '',
    ].join('\n');

    fs.writeFileSync(filepath, header + transcript, 'utf-8');
    console.log('  ✅ Salva:', filename, '(' + msgs.length + ' msgs | ' + dateStart + ' → ' + dateEnd + ')');

    saved.push({ id: convId, cliente: contactName, dateStart, dateEnd, totalMsgs: msgs.length, filename, transcript });
    await new Promise(r => setTimeout(r, 100));
  }

  const indexPath = path.join(OUTPUT_DIR, '_INDEX.json');
  fs.writeFileSync(indexPath, JSON.stringify({
    inbox: INBOX_NAME, inboxId: INBOX_ID,
    conversas: saved.map(r => ({ id: r.id, cliente: r.cliente, dateStart: r.dateStart, dateEnd: r.dateEnd, totalMsgs: r.totalMsgs, filename: r.filename }))
  }, null, 2));

  console.log('\n📊 RESUMO:');
  console.log('  ✅ Salvas para auditoria:', saved.length);
  console.log('  ⏭  Sem contexto (<8 msgs):', semCtx);
  console.log('  🚫 Blacklist:', blacklisted);
  console.log('  🔄 Ainda abertas:', abertas);
  console.log('  📁 Diretório:', OUTPUT_DIR);

  // Output JSON para leitura posterior
  const summaryPath = path.join(OUTPUT_DIR, '_SUMMARY.json');
  fs.writeFileSync(summaryPath, JSON.stringify({ saved: saved.length, semCtx, blacklisted, abertas, conversas: saved.map(r => ({ id: r.id, cliente: r.cliente, dateStart: r.dateStart, dateEnd: r.dateEnd, totalMsgs: r.totalMsgs, filename: r.filename })) }, null, 2));
}

run().catch(console.error);
