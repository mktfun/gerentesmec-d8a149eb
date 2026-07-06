/**
 * PIPELINE COMPLETO DE AUDITORIA — DOM_PEDRO
 * Extração → Auditoria 12 Regras → Relatório HTML
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHATWOOT_BASE = 'https://chat.tork.services';
const TOKEN = 'VDiCRLWP13ckmasC5QTH3xgF';
const ACCOUNT_ID = 5;
const INBOX_ID = 29;
const INBOX_NAME = 'DOM_PEDRO';
const OUTPUT_DIR = path.join(__dirname, '..', 'conversas_DOM_PEDRO');
const REPORT_PATH = 'C:\\Users\\admin\\.gemini\\antigravity\\brain\\a1bb7b9f-c0fc-44b5-8ab9-a96509508605\\Relatorio_DOM_PEDRO.html';
const CHATWOOT_UI = 'https://chat.tork.services/app/accounts/5/conversations/';

const headers = { 'api_access_token': TOKEN, 'Content-Type': 'application/json' };

// ── BLACKLIST ──
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

// ── 12 REGRAS DE AUDITORIA ──
function auditarConversa(transcript, convId, contactName) {
  const lower = transcript.toLowerCase();
  const lines = transcript.split('\n');

  const findProof = (terms) => {
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      for (const t of terms) {
        if (lineLower.includes(t.toLowerCase())) {
          return line.substring(0, 200);
        }
      }
    }
    return null;
  };

  // 1a — Cordialidade
  const cordialTerms = ['obrigado','obrigada','boa tarde','bom dia','boa noite','olá','oi ','seja bem','bem-vindo','por favor','às ordens','gentileza'];
  const pressaoTerms = ['urgente!','não posso esperar','precisa decidir agora','última oportunidade'];
  const proof1a = findProof(cordialTerms);
  const hasPressao = pressaoTerms.some(t => lower.includes(t));
  const r1a = proof1a && !hasPressao;

  // 1b — Registrou acordo por escrito
  const acordoTerms = ['conforme combinamos','como combinado','conforme conversamos','conforme acordado','como acordado','registrando aqui','resumindo o que foi combinado','conforme falamos'];
  const proof1b = findProof(acordoTerms);
  const r1b = !!proof1b;

  // 2d — Checklist do veículo / link checklist
  const checklistTerms = ['checklist','check-list','link do checklist','vistoria','laudo de entrada','diagnóstico completo','relatório de entrada'];
  const proof2d = findProof(checklistTerms);
  const r2d = !!proof2d;

  // 2b — Vídeo do defeito
  const videoDefeitoTerms = ['vídeo do defeito','video do problema','gravamos o defeito','filmamos','veja o vídeo','assista o vídeo','segue o vídeo'];
  const proof2b = findProof(videoDefeitoTerms);
  const r2b = !!proof2b;

  // 2a — Link do orçamento
  const orcamentoTerms = ['link do orçamento','pdf do orçamento','orçamento.pdf','segue o orçamento','enviando o orçamento','orçamento aprovado','valor total:','valor do serviço','orcamento'];
  const proof2a = findProof(orcamentoTerms);
  const r2a = !!proof2a;

  // 2c — Consequências de não fazer o reparo
  const consequenciaTerms = ['se não fizer','caso não realize','risco de','pode piorar','comprometer','dano maior','problema maior','evitar dano','consequência','não fazer'];
  const proof2c = findProof(consequenciaTerms);
  const r2c = !!proof2c;

  // 2e — Aprovação explícita do cliente
  const aprovacaoTerms = ['aprovado','pode fazer','autorizo','autorizado','pode executar','faça o serviço','ok, pode fazer','sim, pode fazer','sim pode','tô de acordo','estou de acordo','concordo'];
  const proof2e = findProof(aprovacaoTerms);
  const r2e = !!proof2e;

  // 3a — Checklist mecânico complementar
  const checkMecTerms = ['checklist do mecânico','inspeção adicional','verificação adicional','relatório do mecânico','laudo do mecânico','revisão completa identificou','pontos extras','itens adicionais identificados'];
  const proof3a = findProof(checkMecTerms);
  const r3a = !!proof3a;

  // 3b — Vídeo up-sell
  const videoUpsellTerms = ['vídeo mostrando','video do que precisa','veja o que mais','filmamos também','segue vídeo adicional','gravamos também'];
  const proof3b = findProof(videoUpsellTerms);
  const r3b = !!proof3b;

  // 3c — Explicação textual dos extras
  const extrasTerms = ['além disso','identificamos também','também verificamos','serviço adicional','recomendamos também','sugerimos','outro item','itens extras','serviços extras'];
  const proof3c = findProof(extrasTerms);
  const r3c = !!proof3c;

  // 4a — Agradecimento / follow-up
  const agradTerms = ['obrigado pela preferência','obrigada pela preferência','até a próxima','foi um prazer','qualquer dúvida estamos','boa viagem','cuide bem','boa estrada','conte conosco'];
  const proof4a = findProof(agradTerms);
  const r4a = !!proof4a;

  // 4b — Avaliação Google Maps
  const googleTerms = ['google','avaliação','avalie','avalie nos','estrelas','maps','g.page','maps.app','deixe sua avaliação','nos avalie'];
  const proof4b = findProof(googleTerms);
  const r4b = !!proof4b;

  const regras = {
    r1a: { ok: r1a, label: '1a — Cordialidade e respeito', proof: proof1a || (hasPressao ? '⚠️ Tom de pressão detectado' : '❌ Sem cumprimento ou cordialidade registrada') },
    r1b: { ok: r1b, label: '1b — Registrou acordo por escrito', proof: proof1b || '❌ Nenhum registro explícito de combinado anterior' },
    r2d: { ok: r2d, label: '2d — Enviou checklist/laudo de entrada', proof: proof2d || '❌ Sem menção a checklist ou laudo de vistoria' },
    r2b: { ok: r2b, label: '2b — Enviou vídeo do defeito', proof: proof2b || '❌ Sem envio de vídeo do defeito' },
    r2a: { ok: r2a, label: '2a — Enviou orçamento formal (PDF/link)', proof: proof2a || '❌ Sem envio de link ou PDF de orçamento' },
    r2c: { ok: r2c, label: '2c — Explicou consequências de não reparar', proof: proof2c || '❌ Sem explicação de consequências' },
    r2e: { ok: r2e, label: '2e — Obteve aprovação explícita do cliente', proof: proof2e || '❌ Sem aprovação explícita registrada' },
    r3a: { ok: r3a, label: '3a — Enviou checklist mecânico complementar', proof: proof3a || '❌ Sem checklist complementar do mecânico' },
    r3b: { ok: r3b, label: '3b — Enviou vídeo de up-sell', proof: proof3b || '❌ Sem vídeo de itens adicionais' },
    r3c: { ok: r3c, label: '3c — Explicou serviços extras em texto', proof: proof3c || '❌ Sem descrição textual de serviços extras' },
    r4a: { ok: r4a, label: '4a — Agradecimento / follow-up pós-entrega', proof: proof4a || '❌ Sem mensagem de agradecimento registrada' },
    r4b: { ok: r4b, label: '4b — Pediu avaliação no Google Maps', proof: proof4b || '❌ Sem pedido de avaliação no Google' },
  };

  const acertos = Object.values(regras).filter(r => r.ok).length;
  const score = Math.round((acertos / 12) * 100);

  return { regras, acertos, score };
}

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

function scoreBorder(score) {
  if (score >= 75) return '#86efac';
  if (score >= 50) return '#fcd34d';
  return '#fca5a5';
}

// ── GERADOR DE HTML ──
function gerarHTML(conversas, indexData) {
  const agora = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const totalConversas = conversas.length;
  const scoreTotal = conversas.reduce((s, c) => s + c.audit.score, 0);
  const scoreMedio = totalConversas > 0 ? Math.round(scoreTotal / totalConversas) : 0;

  // Calcular acertos por regra
  const regraKeys = ['r1a','r1b','r2d','r2b','r2a','r2c','r2e','r3a','r3b','r3c','r4a','r4b'];
  const regraLabels = {
    r1a:'1a — Cordialidade', r1b:'1b — Registro de acordo', r2d:'2d — Checklist/laudo de entrada',
    r2b:'2b — Vídeo do defeito', r2a:'2a — Orçamento formal', r2c:'2c — Consequências do não reparo',
    r2e:'2e — Aprovação explícita', r3a:'3a — Checklist mecânico', r3b:'3b — Vídeo up-sell',
    r3c:'3c — Serviços extras em texto', r4a:'4a — Agradecimento/follow-up', r4b:'4b — Avaliação Google'
  };

  const acertosPorRegra = {};
  regraKeys.forEach(k => {
    acertosPorRegra[k] = conversas.filter(c => c.audit.regras[k]?.ok).length;
  });

  const melhorRegra = regraKeys.reduce((a,b) => acertosPorRegra[a] >= acertosPorRegra[b] ? a : b);
  const piorRegra = regraKeys.reduce((a,b) => acertosPorRegra[a] <= acertosPorRegra[b] ? a : b);

  const melhorOS = conversas.reduce((a,b) => a.audit.score >= b.audit.score ? a : b, conversas[0]);
  const piorOS = conversas.reduce((a,b) => a.audit.score <= b.audit.score ? a : b, conversas[0]);

  // Cards por conversa
  let cardsHTML = '';
  for (const conv of conversas) {
    const { audit, id, cliente, dateStart, dateEnd } = conv;
    const cor = scoreColor(audit.score);
    const bg = scoreBg(audit.score);
    const brd = scoreBorder(audit.score);
    const link = `${CHATWOOT_UI}${id}`;
    const emoji = audit.score >= 75 ? '🟢' : audit.score >= 50 ? '🟡' : '🔴';

    let regrasRows = '';
    for (const k of regraKeys) {
      const r = audit.regras[k];
      const icon = r.ok ? '✅' : '❌';
      const proofDisplay = (r.proof || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      regrasRows += `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px 12px;font-size:13px;color:#374151;white-space:nowrap;">${icon} ${r.label}</td>
          <td style="padding:8px 12px;font-size:12px;color:#6b7280;font-style:italic;">${proofDisplay}</td>
        </tr>`;
    }

    cardsHTML += `
    <div style="background:#fff;border:1px solid ${brd};border-radius:10px;padding:24px;margin-bottom:28px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h2 style="margin:0;font-size:18px;color:#1e293b;">${emoji} ${cliente}</h2>
          <p style="margin:4px 0 0;font-size:13px;color:#64748b;">OS #${id} &nbsp;|&nbsp; 📅 ${dateStart} → ${dateEnd}</p>
        </div>
        <div style="background:${bg};border:1px solid ${brd};border-radius:8px;padding:10px 20px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:${cor};">${audit.score}%</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">${audit.acertos}/12 regras</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;width:35%;">REGRA</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">EVIDÊNCIA / CITAÇÃO</th>
          </tr>
        </thead>
        <tbody>${regrasRows}</tbody>
      </table>
      <div style="margin-top:14px;text-align:right;">
        <a href="${link}" style="font-size:12px;color:#3b82f6;text-decoration:none;">🔗 Ver histórico no Chatwoot →</a>
      </div>
    </div>`;
  }

  // Tabela gerencial por regra
  let tabelaRegrasHTML = '';
  for (const k of regraKeys) {
    const acertos = acertosPorRegra[k];
    const pct = totalConversas > 0 ? Math.round((acertos/totalConversas)*100) : 0;
    const cor = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
    const barW = Math.max(pct, 2);
    tabelaRegrasHTML += `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 14px;font-size:13px;color:#374151;">${regraLabels[k]}</td>
        <td style="padding:10px 14px;text-align:center;font-size:13px;font-weight:600;color:${cor};">${acertos}/${totalConversas}</td>
        <td style="padding:10px 14px;">
          <div style="background:#e2e8f0;border-radius:4px;height:8px;width:100%;">
            <div style="background:${cor};border-radius:4px;height:8px;width:${barW}%;"></div>
          </div>
        </td>
        <td style="padding:10px 14px;text-align:center;font-size:13px;font-weight:700;color:${cor};">${pct}%</td>
      </tr>`;
  }

  const recomendacoes = scoreMedio < 70 ? `
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px 20px;margin-top:16px;">
      <h3 style="margin:0 0 8px;color:#dc2626;font-size:15px;">⚠️ Ação Corretiva Recomendada</h3>
      <p style="margin:0;font-size:13px;color:#7f1d1d;">Score médio abaixo de 70%. Recomenda-se treinamento imediato focado nas regras de menor aderência: <strong>${regraLabels[piorRegra]}</strong>. Implementar checklist de verificação diária com supervisor de turno.</p>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório de Auditoria — ${INBOX_NAME} — ${agora}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
  .container { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 24px; font-weight: 700; margin: 0; }
  h2 { font-size: 18px; }
  @media print {
    body { background: #fff; padding: 0; }
    .container { max-width: 100%; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }
</style>
</head>
<body>
<div class="container">

  <!-- CABEÇALHO -->
  <div style="background:#1e293b;color:#fff;border-radius:12px;padding:28px 32px;margin-bottom:24px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
      <div>
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Relatório de Auditoria de Atendimento</p>
        <h1>Unidade ${INBOX_NAME}</h1>
        <p style="margin:8px 0 0;font-size:13px;color:#cbd5e1;">Gerado em ${agora} &nbsp;|&nbsp; ${totalConversas} conversas auditadas</p>
      </div>
      <div style="background:${scoreBg(scoreMedio)};border:2px solid ${scoreBorder(scoreMedio)};border-radius:12px;padding:16px 28px;text-align:center;">
        <div style="font-size:42px;font-weight:800;color:${scoreColor(scoreMedio)};">${scoreMedio}%</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">SCORE MÉDIO GERAL</div>
      </div>
    </div>
  </div>

  <!-- PÁGINA 1: VISÃO GERENCIAL -->
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:28px;margin-bottom:24px;">
    <h2 style="margin:0 0 20px;color:#1e293b;font-size:20px;">📊 Visão Gerencial — Desempenho por Regra</h2>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:10px 14px;text-align:left;font-size:12px;color:#64748b;font-weight:600;width:40%;">REGRA</th>
          <th style="padding:10px 14px;text-align:center;font-size:12px;color:#64748b;font-weight:600;width:12%;">ACERTOS</th>
          <th style="padding:10px 14px;font-size:12px;color:#64748b;font-weight:600;width:36%;">ADERÊNCIA</th>
          <th style="padding:10px 14px;text-align:center;font-size:12px;color:#64748b;font-weight:600;width:12%;">%</th>
        </tr>
      </thead>
      <tbody>${tabelaRegrasHTML}</tbody>
    </table>
  </div>

  <!-- DESTAQUES -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px;">
      <h3 style="margin:0 0 8px;color:#16a34a;font-size:14px;">💪 Ponto Forte Mais Consistente</h3>
      <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#166534;">${regraLabels[melhorRegra]}</p>
      <p style="margin:0;font-size:13px;color:#15803d;">Aderência: ${acertosPorRegra[melhorRegra]}/${totalConversas} conversas (${totalConversas > 0 ? Math.round(acertosPorRegra[melhorRegra]/totalConversas*100) : 0}%)</p>
    </div>
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:20px;">
      <h3 style="margin:0 0 8px;color:#dc2626;font-size:14px;">⚠️ Ponto Fraco Mais Crítico</h3>
      <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#991b1b;">${regraLabels[piorRegra]}</p>
      <p style="margin:0;font-size:13px;color:#b91c1c;">Aderência: ${acertosPorRegra[piorRegra]}/${totalConversas} conversas (${totalConversas > 0 ? Math.round(acertosPorRegra[piorRegra]/totalConversas*100) : 0}%)</p>
    </div>
  </div>

  <!-- MELHOR E PIOR OS -->
  ${melhorOS && piorOS ? `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
    <div style="background:#fff;border:1px solid #86efac;border-radius:10px;padding:20px;">
      <h3 style="margin:0 0 8px;color:#16a34a;font-size:14px;">🏆 Melhor OS</h3>
      <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#166534;">${melhorOS.cliente}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#15803d;">OS #${melhorOS.id} — Score: ${melhorOS.audit.score}% (${melhorOS.audit.acertos}/12 regras)</p>
      <p style="margin:0;font-size:12px;color:#64748b;">Exemplo positivo de atendimento completo e estruturado.</p>
    </div>
    <div style="background:#fff;border:1px solid #fca5a5;border-radius:10px;padding:20px;">
      <h3 style="margin:0 0 8px;color:#dc2626;font-size:14px;">⚠️ OS com Maior Déficit</h3>
      <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#991b1b;">${piorOS.cliente}</p>
      <p style="margin:0 0 4px;font-size:13px;color:#b91c1c;">OS #${piorOS.id} — Score: ${piorOS.audit.score}% (${piorOS.audit.acertos}/12 regras)</p>
      <p style="margin:0;font-size:12px;color:#64748b;">Necessita atenção imediata e acompanhamento de supervisor.</p>
    </div>
  </div>` : ''}

  ${recomendacoes}

  <!-- PÁGINA 2+: CARDS POR CONVERSA -->
  <div class="page-break" style="margin-top:32px;">
    <h2 style="font-size:20px;color:#1e293b;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #e2e8f0;">📋 Auditoria Individual por Cliente</h2>
    ${cardsHTML || '<p style="color:#64748b;text-align:center;padding:40px;">Nenhuma conversa auditada nesta sessão.</p>'}
  </div>

  <!-- RODAPÉ -->
  <div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;margin-top:16px;border-top:1px solid #e2e8f0;">
    Relatório gerado automaticamente em ${agora} — Auditoria de Qualidade de Atendimento — ${INBOX_NAME}
  </div>

</div>
</body>
</html>`;
}

// ── MAIN ──
async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n🔍 [FASE 1] Extraindo conversas do Inbox ${INBOX_ID} (${INBOX_NAME})...`);
  const conversations = await fetchConversations(INBOX_ID);
  console.log(`   Total bruto: ${conversations.length} conversas`);

  const conversasAuditadas = [];
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

    // Salva transcript
    const filename = `Conv_${convId}_${contactName.replace(/[^a-zA-Z0-9]/g,'_')}.txt`;
    const filepath = path.join(OUTPUT_DIR, filename);
    const header = [
      `======================================`,
      `CONVERSA ID: ${convId}`,
      `CLIENTE: ${contactName}`,
      `PERÍODO: ${dateStart} → ${dateEnd}`,
      `TOTAL DE MENSAGENS: ${messages.length}`,
      `======================================\n`,
    ].join('\n');
    fs.writeFileSync(filepath, header + transcript, 'utf-8');

    // [FASE 2+3] Audita
    const audit = auditarConversa(transcript, convId, contactName);

    console.log(`   ✅ ${filename} | Score: ${audit.score}% (${audit.acertos}/12) | ${messages.length} msgs`);

    conversasAuditadas.push({ id: convId, cliente: contactName, dateStart, dateEnd, totalMsgs: messages.length, filename, audit });
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n📊 [FASE 2-3] Auditoria concluída:`);
  console.log(`   ✅ Auditadas: ${conversasAuditadas.length}`);
  console.log(`   ⏭  Sem contexto (<8 msgs): ${semContexto}`);
  console.log(`   🚫 Blacklist: ${descartadas}`);
  console.log(`   🔄 Abertas (sem entrega): ${abertas}`);

  // Salva índice
  const indexPath = path.join(OUTPUT_DIR, '_INDEX.json');
  fs.writeFileSync(indexPath, JSON.stringify({
    inbox: INBOX_NAME, inboxId: INBOX_ID,
    resumo: { auditadas: conversasAuditadas.length, descartadas, semContexto, abertas },
    conversas: conversasAuditadas.map(c => ({
      id: c.id, cliente: c.cliente, dateStart: c.dateStart, dateEnd: c.dateEnd,
      totalMsgs: c.totalMsgs, filename: c.filename, score: c.audit.score, acertos: c.audit.acertos
    }))
  }, null, 2));

  // [FASE 4+5] Gera HTML
  console.log(`\n📄 [FASE 4-5] Gerando relatório HTML...`);
  if (conversasAuditadas.length === 0) {
    console.log('   ⚠️  Nenhuma conversa auditada. Verifique os filtros.');
  }

  const html = gerarHTML(conversasAuditadas, {});
  fs.writeFileSync(REPORT_PATH, html, 'utf-8');
  console.log(`   ✅ Relatório salvo: ${REPORT_PATH}`);

  // Análise gerencial
  const regraKeys = ['r1a','r1b','r2d','r2b','r2a','r2c','r2e','r3a','r3b','r3c','r4a','r4b'];
  const regraLabels = {
    r1a:'1a-Cordialidade', r1b:'1b-Registro acordo', r2d:'2d-Checklist entrada',
    r2b:'2b-Vídeo defeito', r2a:'2a-Orçamento formal', r2c:'2c-Consequências',
    r2e:'2e-Aprovação explícita', r3a:'3a-Checklist mecânico', r3b:'3b-Vídeo upsell',
    r3c:'3c-Extras em texto', r4a:'4a-Agradecimento', r4b:'4b-Avaliação Google'
  };
  const n = conversasAuditadas.length;
  const acertosPorRegra = {};
  regraKeys.forEach(k => { acertosPorRegra[k] = conversasAuditadas.filter(c => c.audit.regras[k]?.ok).length; });

  const scoreMedio = n > 0 ? Math.round(conversasAuditadas.reduce((s,c) => s+c.audit.score, 0) / n) : 0;
  const melhor = regraKeys.reduce((a,b) => acertosPorRegra[a] >= acertosPorRegra[b] ? a : b);
  const pior = regraKeys.reduce((a,b) => acertosPorRegra[a] <= acertosPorRegra[b] ? a : b);

  console.log(`\n🏁 PIPELINE CONCLUÍDO:`);
  console.log(`   📁 Unidade: ${INBOX_NAME}`);
  console.log(`   📊 Conversas auditadas: ${n}`);
  console.log(`   🎯 Score médio: ${scoreMedio}%`);
  console.log(`   💪 Ponto forte: ${regraLabels[melhor]} (${acertosPorRegra[melhor]}/${n})`);
  console.log(`   ⚠️  Ponto fraco: ${regraLabels[pior]} (${acertosPorRegra[pior]}/${n})`);
  console.log(`   📄 Relatório: ${REPORT_PATH}`);

  // Saída estruturada para o agente pai
  const resultado = {
    unidade: INBOX_NAME,
    conversasAuditadas: n,
    scoreMedio,
    relatorio: REPORT_PATH,
    topFalhas: regraKeys
      .sort((a,b) => acertosPorRegra[a] - acertosPorRegra[b])
      .slice(0,3)
      .map(k => `${regraLabels[k]}: ${acertosPorRegra[k]}/${n} (${n>0?Math.round(acertosPorRegra[k]/n*100):0}%)`),
    melhorOS: n > 0 ? conversasAuditadas.reduce((a,b) => a.audit.score >= b.audit.score ? a : b).cliente : 'N/A',
    piorOS: n > 0 ? conversasAuditadas.reduce((a,b) => a.audit.score <= b.audit.score ? a : b).cliente : 'N/A',
  };
  console.log('\n📤 RESULTADO_JSON_INICIO');
  console.log(JSON.stringify(resultado, null, 2));
  console.log('📤 RESULTADO_JSON_FIM');
}

run().catch(console.error);
