/**
 * PIPELINE COMPLETO - AUDITORIA DIADEMA (INBOX_ID: 11)
 * Extração → Auditoria 12 Regras → Relatório HTML
 */

import fs from 'fs';
import path from 'path';

const CHATWOOT_BASE = 'https://chat.tork.services';
const TOKEN = 'VDiCRLWP13ckmasC5QTH3xgF';
const ACCOUNT_ID = 5;
const INBOX_ID = 11;
const INBOX_NAME = 'DIADEMA';
const OUTPUT_DIR = './conversas_DIADEMA';
const HTML_OUTPUT = 'C:/Users/admin/.gemini/antigravity/brain/a1bb7b9f-c0fc-44b5-8ab9-a96509508605/Relatorio_DIADEMA.html';
const CHATWOOT_UI = 'https://chat.tork.services/app/accounts/5/conversations/';

const headers = { 'api_access_token': TOKEN, 'Content-Type': 'application/json' };

// ── BLACKLIST ──────────────────────────────────────────────────
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
  'pode pegar','liberado para retirada','liberamos',
];

// ── REGRAS DE AUDITORIA ─────────────────────────────────────────
const REGRAS = [
  { id: '1a', cat: 'Recebimento e Diagnóstico', desc: 'Atendimento cordial e respeitoso (sem pressão/ameaça)' },
  { id: '1b', cat: 'Recebimento e Diagnóstico', desc: 'Registrou no WhatsApp o que foi acordado presencialmente/telefone' },
  { id: '2d', cat: 'Recebimento e Diagnóstico', desc: 'Enviou link do checklist do veículo (defeitos + fotos)' },
  { id: '2b', cat: 'Recebimento e Diagnóstico', desc: 'Enviou vídeo mostrando o defeito' },
  { id: '2a', cat: 'Orçamento e Aprovação', desc: 'Enviou link do orçamento (PDF formal)' },
  { id: '2c', cat: 'Orçamento e Aprovação', desc: 'Explicou consequências de NÃO fazer o reparo' },
  { id: '2e', cat: 'Orçamento e Aprovação', desc: 'Obteve aprovação explícita do cliente (sim/ok/aprovado)' },
  { id: '3a', cat: 'Checklist Mecânico / Up-sell', desc: 'Enviou checklist complementar do mecânico (inspeção adicional)' },
  { id: '3b', cat: 'Checklist Mecânico / Up-sell', desc: 'Enviou vídeo do que mais precisa ser feito (up-sell visual)' },
  { id: '3c', cat: 'Checklist Mecânico / Up-sell', desc: 'Explicou em texto os serviços extras e sua justificativa' },
  { id: '4a', cat: 'Encerramento + Review', desc: 'Enviou mensagem de agradecimento ou fez follow-up pós-entrega' },
  { id: '4b', cat: 'Encerramento + Review', desc: 'Pediu avaliação no Google Maps com link explícito' },
];

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

async function fetchConversations(inboxId) {
  let all = [];
  let page = 1;

  while (true) {
    const url = `${CHATWOOT_BASE}/api/v1/accounts/${ACCOUNT_ID}/conversations?inbox_id=${inboxId}&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) break;

    const data = await res.json();
    const convs = data.data?.payload || [];
    if (!convs || convs.length === 0) break;

    all = [...all, ...convs];
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

// ── AUDITORIA 12 REGRAS ─────────────────────────────────────────
function auditarConversa(transcript, convId, cliente, dateStart, dateEnd) {
  const lower = transcript.toLowerCase();
  const lines = transcript.split('\n');
  
  const resultados = {};

  // ── REGRA 1a: Cordialidade ─────────────────────────────────
  const saudacoes = ['bom dia','boa tarde','boa noite','olá','oi ','tudo bem','como posso','em que posso','seja bem','obrigado','obrigada','agradeço'];
  const pressao = ['vai perder','urgente agora','última chance','se não fizer','problema sério se não'];
  const temSaudacao = saudacoes.some(s => lower.includes(s));
  const temPressao = pressao.some(p => lower.includes(p));
  const ok1a = temSaudacao && !temPressao;
  const prova1a = ok1a
    ? lines.find(l => saudacoes.some(s => l.toLowerCase().includes(s)))?.trim() || 'Saudação identificada'
    : temPressao ? 'Linguagem de pressão detectada' : 'Sem saudação/cordialidade identificada';

  // ── REGRA 1b: Registrou acordado presencialmente ───────────
  const registro = ['conforme combinamos','como combinado','conforme conversamos','como conversamos','conforme acordado','como acordado','conforme falamos','como falamos','de acordo com o que','confirmo o que','registrando aqui','para registrar','por escrito','protocolo'];
  const ok1b = registro.some(r => lower.includes(r));
  const prova1b = ok1b
    ? lines.find(l => registro.some(r => l.toLowerCase().includes(r)))?.trim() || 'Registro identificado'
    : 'Nenhum registro de combinado presencial/telefônico encontrado';

  // ── REGRA 2d: Link checklist veículo ──────────────────────
  const checklist = ['checklist','check list','check-list','inspeção do veículo','vistoria','laudo do veículo','laudo técnico','fotos do veículo','fotos do carro','link','tork.','app.'];
  const ok2d = checklist.some(c => lower.includes(c));
  const prova2d = ok2d
    ? lines.find(l => checklist.some(c => l.toLowerCase().includes(c)))?.trim() || 'Checklist/link identificado'
    : 'Nenhum envio de checklist ou link de inspeção encontrado';

  // ── REGRA 2b: Vídeo do defeito ────────────────────────────
  const videoDefeito = ['vídeo','video','filmamos','gravamos','segue o vídeo','veja o vídeo','filmed','mídia','[mídia'];
  const ok2b = videoDefeito.some(v => lower.includes(v));
  const prova2b = ok2b
    ? lines.find(l => videoDefeito.some(v => l.toLowerCase().includes(v)))?.trim() || 'Vídeo/mídia identificado'
    : 'Nenhum vídeo de defeito encontrado';

  // ── REGRA 2a: Link orçamento PDF ─────────────────────────
  const orcamento = ['orçamento','orcamento','proposta','valor total','link do orçamento','segue o orçamento','pdf','tork.','aprovação','aprovacao'];
  const ok2a = orcamento.some(o => lower.includes(o));
  const prova2a = ok2a
    ? lines.find(l => orcamento.some(o => l.toLowerCase().includes(o)))?.trim() || 'Orçamento identificado'
    : 'Nenhum envio de orçamento formal encontrado';

  // ── REGRA 2c: Consequências de não fazer ─────────────────
  const consequencia = ['caso não faça','se não fizer','risco de','pode piorar','dano maior','comprometer','deixar sem fazer','adiar','postergar','problema maior','estrago maior','pode afetar','segurança','perigoso','recomendo fortemente'];
  const ok2c = consequencia.some(c => lower.includes(c));
  const prova2c = ok2c
    ? lines.find(l => consequencia.some(c => l.toLowerCase().includes(c)))?.trim() || 'Alerta de consequência identificado'
    : 'Nenhuma explicação de consequência de não fazer o reparo encontrada';

  // ── REGRA 2e: Aprovação explícita ────────────────────────
  const aprovacao = ['sim, pode fazer','pode fazer','autorizo','autorizo o serviço','aprovo','aprovado','confirmo','ok, pode','pode seguir','pode continuar','faça','vai em frente','pode executar'];
  const ok2e = aprovacao.some(a => lower.includes(a));
  const prova2e = ok2e
    ? lines.find(l => aprovacao.some(a => l.toLowerCase().includes(a)))?.trim() || 'Aprovação identificada'
    : 'Nenhuma aprovação explícita do cliente encontrada';

  // ── REGRA 3a: Checklist complementar mecânico ─────────────
  const checkMec = ['inspeção completa','revisão geral','checklist do mecânico','itens adicionais','encontramos mais','verificamos também','além do serviço principal','inspecionamos','outros pontos encontrados'];
  const ok3a = checkMec.some(c => lower.includes(c));
  const prova3a = ok3a
    ? lines.find(l => checkMec.some(c => l.toLowerCase().includes(c)))?.trim() || 'Checklist mecânico identificado'
    : 'Nenhum checklist complementar do mecânico encontrado';

  // ── REGRA 3b: Vídeo up-sell ──────────────────────────────
  const videoUpsell = ['vídeo','video','mídia','[mídia'];
  const upsellContext = ['além','também precisa','recomendamos','verificamos que','encontramos','outros serviços','precisa trocar','precisa substituir'];
  const hasVideo = videoUpsell.some(v => lower.includes(v));
  const hasUpsell = upsellContext.some(u => lower.includes(u));
  const ok3b = hasVideo && hasUpsell;
  const prova3b = ok3b
    ? lines.find(l => videoUpsell.some(v => l.toLowerCase().includes(v)) && upsellContext.some(u => l.toLowerCase().includes(u)))?.trim()
      || lines.find(l => videoUpsell.some(v => l.toLowerCase().includes(v)))?.trim()
      || 'Vídeo de up-sell identificado'
    : 'Nenhum vídeo de up-sell identificado';

  // ── REGRA 3c: Serviços extras em texto ───────────────────
  const extras = ['também recomendamos','além disso','verificamos que','encontramos também','outros itens','itens adicionais','sugerimos também','precisaria trocar','precisaria substituir','recomendo também','precisa de atenção também'];
  const ok3c = extras.some(e => lower.includes(e));
  const prova3c = ok3c
    ? lines.find(l => extras.some(e => l.toLowerCase().includes(e)))?.trim() || 'Serviços extras identificados'
    : 'Nenhuma oferta de serviços extras em texto encontrada';

  // ── REGRA 4a: Agradecimento pós-entrega ──────────────────
  const agradecimento = ['obrigado pela preferência','obrigado por nos escolher','foi um prazer','conte conosco','até a próxima','qualquer dúvida','fico à disposição','estamos à disposição','agradecemos a confiança','bom proveito','boas direções','boa viagem'];
  const ok4a = agradecimento.some(a => lower.includes(a));
  const prova4a = ok4a
    ? lines.find(l => agradecimento.some(a => l.toLowerCase().includes(a)))?.trim() || 'Agradecimento identificado'
    : 'Nenhuma mensagem de agradecimento ou follow-up pós-entrega encontrada';

  // ── REGRA 4b: Google Maps ─────────────────────────────────
  const google = ['google','maps','avali','avalie','estrela','nota','comentário','goo.gl','maps.app','avaliação'];
  const ok4b = google.some(g => lower.includes(g));
  const prova4b = ok4b
    ? lines.find(l => google.some(g => l.toLowerCase().includes(g)))?.trim() || 'Pedido de avaliação Google identificado'
    : 'Nenhum pedido de avaliação no Google Maps encontrado';

  resultados['1a'] = { ok: ok1a, prova: prova1a };
  resultados['1b'] = { ok: ok1b, prova: prova1b };
  resultados['2d'] = { ok: ok2d, prova: prova2d };
  resultados['2b'] = { ok: ok2b, prova: prova2b };
  resultados['2a'] = { ok: ok2a, prova: prova2a };
  resultados['2c'] = { ok: ok2c, prova: prova2c };
  resultados['2e'] = { ok: ok2e, prova: prova2e };
  resultados['3a'] = { ok: ok3a, prova: prova3a };
  resultados['3b'] = { ok: ok3b, prova: prova3b };
  resultados['3c'] = { ok: ok3c, prova: prova3c };
  resultados['4a'] = { ok: ok4a, prova: prova4a };
  resultados['4b'] = { ok: ok4b, prova: prova4b };

  const acertos = Object.values(resultados).filter(r => r.ok).length;
  const score = Math.round((acertos / 12) * 100);

  return { convId, cliente, dateStart, dateEnd, resultados, acertos, score };
}

// ── GERAÇÃO DO HTML ─────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 75) return '#16a34a';
  if (score >= 50) return '#d97706';
  return '#dc2626';
}

function scoreBg(score) {
  if (score >= 75) return '#dcfce7';
  if (score >= 50) return '#fef3c7';
  return '#fee2e2';
}

function gerarHTML(auditorias, inboxName) {
  const total = auditorias.length;
  const scoresMedio = total > 0 ? Math.round(auditorias.reduce((s, a) => s + a.score, 0) / total) : 0;

  // Acertos por regra
  const acertosPorRegra = {};
  REGRAS.forEach(r => {
    const acertos = auditorias.filter(a => a.resultados[r.id]?.ok).length;
    acertosPorRegra[r.id] = { acertos, pct: total > 0 ? Math.round((acertos / total) * 100) : 0 };
  });

  // Melhor e pior
  const sorted = [...auditorias].sort((a, b) => b.score - a.score);
  const melhor = sorted[0];
  const pior = sorted[sorted.length - 1];

  // Pontos fortes e fracos
  const regrasOrdenadas = REGRAS.map(r => ({ ...r, pct: acertosPorRegra[r.id].pct })).sort((a, b) => b.pct - a.pct);
  const pontosFortes = regrasOrdenadas.slice(0, 3);
  const pontosFracos = regrasOrdenadas.slice(-3).reverse();

  // Top falhas
  const falhas = REGRAS.map(r => ({ ...r, pct: acertosPorRegra[r.id].pct, falhas: total - acertosPorRegra[r.id].acertos }))
    .sort((a, b) => b.falhas - a.falhas);

  const today = new Date();
  const dataRelatorio = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;

  let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório de Auditoria — ${inboxName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f1f5f9; color: #1e293b; font-size: 13px; }
  .container { max-width: 1100px; margin: 0 auto; padding: 24px 16px; }
  
  /* HEADER */
  .header { background: #1e293b; color: white; padding: 28px 32px; border-radius: 10px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
  .header .subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }
  .header .meta { display: flex; gap: 24px; margin-top: 16px; flex-wrap: wrap; }
  .header .meta-item { color: #cbd5e1; font-size: 12px; }
  .header .meta-item span { color: white; font-weight: 600; }

  /* SCORE BADGE */
  .score-badge { display: inline-flex; align-items: center; justify-content: center; width: 72px; height: 72px; border-radius: 50%; font-size: 22px; font-weight: 800; }
  .score-big { font-size: 48px; font-weight: 800; }

  /* CARDS */
  .card { background: white; border-radius: 10px; border: 1px solid #e2e8f0; padding: 20px 24px; margin-bottom: 16px; }
  .card h2 { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
  .card h3 { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }

  /* SUMMARY GRID */
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .summary-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
  .summary-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .summary-card .value { font-size: 28px; font-weight: 800; }

  /* TABLES */
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { background: #f8fafc; padding: 8px 10px; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
  tbody td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: #f8fafc; }

  /* PROGRESS BAR */
  .progress-bar { background: #f1f5f9; border-radius: 4px; height: 6px; width: 100%; }
  .progress-fill { height: 6px; border-radius: 4px; }

  /* AUDIT CARD */
  .audit-card { background: white; border-radius: 10px; border: 1px solid #e2e8f0; padding: 20px 24px; margin-bottom: 20px; page-break-inside: avoid; }
  .audit-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
  .audit-name { font-size: 15px; font-weight: 700; color: #0f172a; }
  .audit-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
  .audit-link { font-size: 11px; color: #3b82f6; text-decoration: none; }
  .audit-link:hover { text-decoration: underline; }
  
  .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 700; }

  .check-ok { color: #16a34a; font-weight: 700; font-size: 14px; }
  .check-fail { color: #dc2626; font-weight: 700; font-size: 14px; }
  .prova { font-size: 11px; color: #64748b; font-style: italic; margin-top: 2px; }
  .prova-text { background: #f8fafc; border-left: 2px solid #e2e8f0; padding: 4px 8px; border-radius: 0 4px 4px 0; font-size: 11px; color: #475569; font-style: italic; max-width: 500px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* CATEGORIES */
  .cat-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; padding: 6px 10px; background: #f8fafc; }

  /* ALERT BOX */
  .alert { border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; font-size: 12px; }
  .alert-red { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; }
  .alert-green { background: #dcfce7; border: 1px solid #86efac; color: #166534; }
  .alert-yellow { background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; }

  /* PAGE BREAK */
  .page-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 28px 0 16px; display: flex; align-items: center; gap: 8px; }
  .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }

  /* FOOTER */
  .footer { text-align: center; font-size: 11px; color: #94a3b8; padding: 20px; margin-top: 24px; }

  /* PRINT */
  @media print {
    body { background: white; }
    .container { padding: 0; }
    .audit-card, .card { page-break-inside: avoid; }
    @page { size: A4; margin: 15mm; }
  }

  /* COLS */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 700px) { .two-col { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="container">

<!-- HEADER -->
<div class="header">
  <h1>📋 Relatório de Auditoria de Atendimento</h1>
  <div class="subtitle">Unidade ${inboxName} &nbsp;·&nbsp; Gerado em ${dataRelatorio}</div>
  <div class="meta">
    <div class="meta-item">Conversas auditadas: <span>${total}</span></div>
    <div class="meta-item">Score médio: <span style="color: ${scoreColor(scoresMedio)}">${scoresMedio}%</span></div>
    <div class="meta-item">Período: <span>${auditorias.length > 0 ? auditorias[0].dateStart.slice(0,5) : '—'} → ${auditorias.length > 0 ? auditorias[auditorias.length-1].dateEnd.slice(0,5) : '—'}</span></div>
    <div class="meta-item">Critério: <span>12 Regras Zero Trust</span></div>
  </div>
</div>

<!-- SUMMARY GRID -->
<div class="summary-grid">
  <div class="summary-card">
    <div class="label">Score Médio</div>
    <div class="value" style="color: ${scoreColor(scoresMedio)}">${scoresMedio}%</div>
  </div>
  <div class="summary-card">
    <div class="label">Conversas</div>
    <div class="value" style="color: #3b82f6">${total}</div>
  </div>
  <div class="summary-card">
    <div class="label">Melhor Score</div>
    <div class="value" style="color: #16a34a">${melhor ? melhor.score : 0}%</div>
  </div>
  <div class="summary-card">
    <div class="label">Pior Score</div>
    <div class="value" style="color: #dc2626">${pior ? pior.score : 0}%</div>
  </div>
</div>

${scoresMedio < 70 ? `<div class="alert alert-red">⚠️ <strong>Ação Corretiva Necessária:</strong> Score médio abaixo de 70%. Recomenda-se treinamento imediato focado nas regras com menor desempenho e implementação de protocolo de checklist obrigatório.</div>` : ''}
${scoresMedio >= 75 ? `<div class="alert alert-green">✅ <strong>Desempenho Satisfatório:</strong> Score médio acima de 75%. Manter as boas práticas e focar nos pontos de melhoria identificados.</div>` : ''}

<!-- PÁGINA 1: VISÃO GERENCIAL -->
<div class="page-title">📊 Página 1 — Visão Gerencial</div>

<!-- ACERTOS POR REGRA -->
<div class="card">
  <h2>Desempenho por Regra (${total} conversas)</h2>
  <table>
    <thead>
      <tr>
        <th style="width:60px">Regra</th>
        <th>Descrição</th>
        <th style="width:80px">Acertos</th>
        <th style="width:120px">Aderência</th>
        <th style="width:60px">%</th>
      </tr>
    </thead>
    <tbody>
`;

  REGRAS.forEach(r => {
    const { acertos, pct } = acertosPorRegra[r.id];
    const barColor = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
    html += `      <tr>
        <td><strong>${r.id}</strong></td>
        <td>${r.desc}</td>
        <td style="text-align:center">${acertos}/${total}</td>
        <td>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${barColor}"></div></div>
        </td>
        <td style="color:${barColor};font-weight:700;text-align:right">${pct}%</td>
      </tr>\n`;
  });

  html += `    </tbody>
  </table>
</div>

<!-- PONTOS FORTES E FRACOS -->
<div class="two-col">
  <div class="card">
    <h2>✅ Pontos Fortes</h2>
`;
  pontosFortes.forEach(r => {
    html += `    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:600">${r.id}: ${r.desc}</span>
        <span style="color:#16a34a;font-weight:700">${r.pct}%</span>
      </div>
      <div class="progress-bar" style="margin-top:4px"><div class="progress-fill" style="width:${r.pct}%;background:#16a34a"></div></div>
    </div>\n`;
  });
  html += `  </div>
  <div class="card">
    <h2>❌ Pontos Fracos Sistemáticos</h2>
`;
  pontosFracos.forEach(r => {
    html += `    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:600">${r.id}: ${r.desc}</span>
        <span style="color:#dc2626;font-weight:700">${r.pct}%</span>
      </div>
      <div class="progress-bar" style="margin-top:4px"><div class="progress-fill" style="width:${r.pct}%;background:#dc2626"></div></div>
    </div>\n`;
  });
  html += `  </div>
</div>

<!-- MELHOR E PIOR -->
<div class="two-col">
  <div class="card">
    <h2>🏆 Melhor Atendimento</h2>
    ${melhor ? `
    <div style="font-size:16px;font-weight:700;color:#0f172a">${melhor.cliente}</div>
    <div style="font-size:11px;color:#64748b;margin-bottom:10px">OS #${melhor.convId} &nbsp;·&nbsp; ${melhor.dateStart.slice(0,5)} → ${melhor.dateEnd.slice(0,5)}</div>
    <div class="badge" style="background:${scoreBg(melhor.score)};color:${scoreColor(melhor.score)}">${melhor.score}% — ${melhor.acertos}/12 regras</div>
    <div style="font-size:11px;color:#475569;margin-top:10px">Destaque: ${REGRAS.filter(r => melhor.resultados[r.id]?.ok).map(r => r.id).join(', ')}</div>
    ` : '<div style="color:#94a3b8">Sem dados</div>'}
  </div>
  <div class="card">
    <h2>⚠️ Atendimento Mais Crítico</h2>
    ${pior ? `
    <div style="font-size:16px;font-weight:700;color:#0f172a">${pior.cliente}</div>
    <div style="font-size:11px;color:#64748b;margin-bottom:10px">OS #${pior.convId} &nbsp;·&nbsp; ${pior.dateStart.slice(0,5)} → ${pior.dateEnd.slice(0,5)}</div>
    <div class="badge" style="background:${scoreBg(pior.score)};color:${scoreColor(pior.score)}">${pior.score}% — ${pior.acertos}/12 regras</div>
    <div style="font-size:11px;color:#475569;margin-top:10px">Falhas: ${REGRAS.filter(r => !pior.resultados[r.id]?.ok).map(r => r.id).join(', ')}</div>
    ` : '<div style="color:#94a3b8">Sem dados</div>'}
  </div>
</div>

<!-- TOP FALHAS -->
<div class="card">
  <h2>🔴 Top 5 Falhas Mais Recorrentes</h2>
  <table>
    <thead>
      <tr><th>#</th><th>Regra</th><th>Categoria</th><th>Falhas</th><th>Aderência</th></tr>
    </thead>
    <tbody>
`;
  falhas.slice(0, 5).forEach((r, i) => {
    html += `      <tr>
        <td style="font-weight:700;color:#dc2626">${i+1}º</td>
        <td><strong>${r.id}</strong>: ${r.desc}</td>
        <td><span style="font-size:10px;color:#64748b">${r.cat}</span></td>
        <td style="text-align:center;color:#dc2626;font-weight:700">${r.falhas}/${total}</td>
        <td style="color:${scoreColor(r.pct)};font-weight:700">${r.pct}%</td>
      </tr>\n`;
  });

  html += `    </tbody>
  </table>
</div>

<div class="divider"></div>

<!-- PÁGINA 2+: CARDS POR CLIENTE -->
<div class="page-title">📁 Página 2+ — Histórico por Cliente</div>
`;

  // Cards individuais
  auditorias.forEach((audit, idx) => {
    const { convId, cliente, dateStart, dateEnd, resultados, acertos, score } = audit;
    const catAtual = { cat: null };
    
    html += `
<div class="audit-card">
  <div class="audit-header">
    <div>
      <div class="audit-name">${cliente}</div>
      <div class="audit-meta">📅 ${dateStart.slice(0,5)} → ${dateEnd.slice(0,5)} &nbsp;·&nbsp; OS #${convId}</div>
      <div style="margin-top:4px"><a href="${CHATWOOT_UI}${convId}" target="_blank" class="audit-link">🔗 Ver histórico no Chatwoot →</a></div>
    </div>
    <div style="text-align:center">
      <div class="score-badge" style="background:${scoreBg(score)};color:${scoreColor(score)}">${score}%</div>
      <div style="font-size:10px;color:#64748b;margin-top:4px">${acertos}/12 regras</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr><th style="width:55px">Regra</th><th>Critério</th><th style="width:40px">Status</th><th>Evidência</th></tr>
    </thead>
    <tbody>
`;

    REGRAS.forEach(r => {
      const res = resultados[r.id];
      if (catAtual.cat !== r.cat) {
        catAtual.cat = r.cat;
        html += `      <tr><td colspan="4" class="cat-label">${r.cat}</td></tr>\n`;
      }
      html += `      <tr>
        <td><strong>${r.id}</strong></td>
        <td>${r.desc}</td>
        <td style="text-align:center">${res.ok ? '<span class="check-ok">✅</span>' : '<span class="check-fail">❌</span>'}</td>
        <td><div class="prova-text" title="${(res.prova || '').replace(/"/g, '&quot;')}">${(res.prova || '—').substring(0, 120)}</div></td>
      </tr>\n`;
    });

    html += `    </tbody>
  </table>
</div>
`;
  });

  html += `
<div class="footer">
  Relatório de Auditoria de Atendimento — Unidade ${inboxName} — ${dataRelatorio}<br>
  Sistema de Gestão de Qualidade | ${total} conversas auditadas | Metodologia Zero Trust
</div>

</div>
</body>
</html>`;

  return html;
}

// ── MAIN ────────────────────────────────────────────────────────
async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n🚀 PIPELINE COMPLETO — AUDITORIA ${INBOX_NAME}`);
  console.log(`   INBOX_ID: ${INBOX_ID}`);
  console.log(`   Output: ${OUTPUT_DIR}`);
  console.log(`   HTML: ${HTML_OUTPUT}\n`);

  // FASE 1: Extração
  console.log(`📡 FASE 1 — Extração de conversas...`);
  const conversations = await fetchConversations(INBOX_ID);
  console.log(`   Total bruto: ${conversations.length} conversas`);

  const conversasParaAuditoria = [];
  let descartadas = 0, semContexto = 0, abertas = 0;

  for (const conv of conversations) {
    const contactName = conv.meta?.sender?.name || 'Cliente';
    const convId = conv.id;

    const messages = await fetchAllMessages(convId);

    if (messages.length < 8) { semContexto++; continue; }

    const transcript = buildTranscript(messages, contactName);

    if (hasBlacklist(transcript)) { descartadas++; continue; }
    if (!hasClosingProof(transcript)) { abertas++; continue; }

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

    conversasParaAuditoria.push({ convId, cliente: contactName, dateStart, dateEnd, messages, transcript, filename });
    console.log(`   ✅ ${filename} (${messages.length} msgs | ${dateStart} → ${dateEnd})`);

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n📊 FASE 1 RESUMO:`);
  console.log(`   ✅ Para auditoria: ${conversasParaAuditoria.length}`);
  console.log(`   ⏭  Sem contexto (<8 msgs): ${semContexto}`);
  console.log(`   🚫 Blacklist: ${descartadas}`);
  console.log(`   🔄 Ainda abertas: ${abertas}`);

  if (conversasParaAuditoria.length === 0) {
    console.log('\n⚠️  Nenhuma conversa elegível para auditoria encontrada.');
    console.log('   Possíveis causas: todas as conversas estão abertas, muito curtas ou blacklistadas.');
    
    // Tenta novamente sem filtro de closing
    console.log('\n🔄 Tentando sem filtro de encerramento...');
    for (const conv of conversations) {
      const contactName = conv.meta?.sender?.name || 'Cliente';
      const convId = conv.id;
      const messages = await fetchAllMessages(convId);
      if (messages.length < 4) continue;
      const transcript = buildTranscript(messages, contactName);
      if (hasBlacklist(transcript)) continue;
      
      const firstMsg = messages[0];
      const lastMsg  = messages[messages.length - 1];
      const dateStart = formatDate(firstMsg?.created_at);
      const dateEnd   = formatDate(lastMsg?.created_at);
      
      conversasParaAuditoria.push({ convId, cliente: contactName, dateStart, dateEnd, messages, transcript });
      if (conversasParaAuditoria.length >= 15) break;
    }
    console.log(`   🔄 Encontradas ${conversasParaAuditoria.length} conversas no modo relaxado`);
  }

  // FASE 2+3: Auditoria
  console.log(`\n🔍 FASE 2+3 — Auditoria das 12 Regras...`);
  const auditorias = [];

  for (const conv of conversasParaAuditoria) {
    const resultado = auditarConversa(conv.transcript, conv.convId, conv.cliente, conv.dateStart, conv.dateEnd);
    auditorias.push(resultado);
    const scoreStr = resultado.score >= 75 ? '🟢' : resultado.score >= 50 ? '🟡' : '🔴';
    console.log(`   ${scoreStr} ${conv.cliente} — Score: ${resultado.score}% (${resultado.acertos}/12)`);
  }

  // FASE 4: Análise gerencial
  const scoreTotal = auditorias.length > 0 ? Math.round(auditorias.reduce((s, a) => s + a.score, 0) / auditorias.length) : 0;
  console.log(`\n📈 FASE 4 — Análise Gerencial:`);
  console.log(`   Score médio: ${scoreTotal}%`);
  
  // Top falhas
  const falhasPorRegra = REGRAS.map(r => ({
    id: r.id,
    desc: r.desc,
    falhas: auditorias.filter(a => !a.resultados[r.id]?.ok).length
  })).sort((a, b) => b.falhas - a.falhas);
  
  console.log(`   Top 3 falhas:`);
  falhasPorRegra.slice(0, 3).forEach((f, i) => {
    console.log(`   ${i+1}. Regra ${f.id}: ${f.desc} — ${f.falhas}/${auditorias.length} conversas com falha`);
  });

  // FASE 5: HTML
  console.log(`\n📄 FASE 5 — Gerando relatório HTML...`);
  const html = gerarHTML(auditorias, INBOX_NAME);
  
  // Garante que o diretório existe
  const htmlDir = path.dirname(HTML_OUTPUT);
  if (!fs.existsSync(htmlDir)) fs.mkdirSync(htmlDir, { recursive: true });
  
  fs.writeFileSync(HTML_OUTPUT, html, 'utf-8');
  console.log(`   ✅ HTML salvo: ${HTML_OUTPUT}`);

  // Salva índice JSON
  const indexPath = path.join(OUTPUT_DIR, '_INDEX.json');
  fs.writeFileSync(indexPath, JSON.stringify({
    inbox: INBOX_NAME,
    inboxId: INBOX_ID,
    scoresMedio: scoreTotal,
    totalAuditadas: auditorias.length,
    geradoEm: new Date().toISOString(),
    conversas: auditorias.map(a => ({
      id: a.convId,
      cliente: a.cliente,
      score: a.score,
      acertos: a.acertos,
      dateStart: a.dateStart,
      dateEnd: a.dateEnd
    }))
  }, null, 2));

  console.log(`\n✅ PIPELINE COMPLETO!`);
  console.log(`   📊 Conversas auditadas: ${auditorias.length}`);
  console.log(`   📈 Score médio: ${scoreTotal}%`);
  console.log(`   📄 HTML: ${HTML_OUTPUT}`);
  console.log(`   📋 Índice: ${indexPath}`);
  console.log(`\n   TOP 3 FALHAS:`);
  falhasPorRegra.slice(0, 3).forEach((f, i) => {
    console.log(`   ${i+1}. Regra ${f.id}: ${f.desc}`);
  });
}

run().catch(err => {
  console.error('ERRO FATAL:', err);
  process.exit(1);
});
