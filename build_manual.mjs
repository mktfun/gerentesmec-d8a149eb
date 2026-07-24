import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// ── GET API KEY ──────────────────────────────────────────────────
const envData = JSON.parse(fs.readFileSync('env.json', 'utf16le').replace(/^\uFEFF/, ''));
const apiKey = envData.find(x => x.Key === 'GEMINI_API_KEY')?.Value;
if (!apiKey) {
    console.error("GEMINI_API_KEY not found!");
    process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

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

function auditarConversa(transcript, convId, cliente, dateStart, dateEnd) {
  const lower = transcript.toLowerCase();
  const lines = transcript.split('\n');
  const resultados = {};

  const saudacoes = ['bom dia','boa tarde','boa noite','olá','oi ','tudo bem','como posso','em que posso','seja bem','obrigado','obrigada','agradeço'];
  const pressao = ['vai perder','urgente agora','última chance','se não fizer','problema sério se não'];
  const temSaudacao = saudacoes.some(s => lower.includes(s));
  const temPressao = pressao.some(p => lower.includes(p));
  resultados['1a'] = { ok: temSaudacao && !temPressao, prova: (temSaudacao && !temPressao) ? (lines.find(l => saudacoes.some(s => l.toLowerCase().includes(s)))?.trim() || 'Saudação identificada') : temPressao ? 'Linguagem de pressão detectada' : 'Sem saudação' };

  const registro = ['conforme combinamos','como combinado','conforme conversamos','como conversamos','conforme acordado','como acordado','conforme falamos','como falamos','de acordo com o que','confirmo o que','registrando aqui','para registrar','por escrito','protocolo'];
  const ok1b = registro.some(r => lower.includes(r));
  resultados['1b'] = { ok: ok1b, prova: ok1b ? (lines.find(l => registro.some(r => l.toLowerCase().includes(r)))?.trim() || 'Registro identificado') : 'Nenhum registro de combinado' };

  const checklist = ['checklist','check list','check-list','inspeção do veículo','vistoria','laudo do veículo','laudo técnico','fotos do veículo','fotos do carro','link','tork.','app.'];
  const ok2d = checklist.some(c => lower.includes(c));
  resultados['2d'] = { ok: ok2d, prova: ok2d ? (lines.find(l => checklist.some(c => l.toLowerCase().includes(c)))?.trim() || 'Checklist/link identificado') : 'Nenhum checklist' };

  const videoDefeito = ['vídeo','video','filmamos','gravamos','segue o vídeo','veja o vídeo','filmed','mídia','[mídia'];
  const ok2b = videoDefeito.some(v => lower.includes(v));
  resultados['2b'] = { ok: ok2b, prova: ok2b ? (lines.find(l => videoDefeito.some(v => l.toLowerCase().includes(v)))?.trim() || 'Vídeo identificado') : 'Nenhum vídeo' };

  const orcamento = ['orçamento','orcamento','proposta','valor total','link do orçamento','segue o orçamento','pdf','tork.','aprovação','aprovacao'];
  const ok2a = orcamento.some(o => lower.includes(o));
  resultados['2a'] = { ok: ok2a, prova: ok2a ? (lines.find(l => orcamento.some(o => l.toLowerCase().includes(o)))?.trim() || 'Orçamento identificado') : 'Nenhum orçamento' };

  const consequencia = ['caso não faça','se não fizer','risco de','pode piorar','dano maior','comprometer','deixar sem fazer','adiar','postergar','problema maior','estrago maior','pode afetar','segurança','perigoso','recomendo fortemente'];
  const ok2c = consequencia.some(c => lower.includes(c));
  resultados['2c'] = { ok: ok2c, prova: ok2c ? (lines.find(l => consequencia.some(c => l.toLowerCase().includes(c)))?.trim() || 'Alerta de consequência') : 'Nenhuma consequência' };

  const aprovacao = ['sim, pode fazer','pode fazer','autorizo','autorizo o serviço','aprovo','aprovado','confirmo','ok, pode','pode seguir','pode continuar','faça','vai em frente','pode executar'];
  const ok2e = aprovacao.some(a => lower.includes(a));
  resultados['2e'] = { ok: ok2e, prova: ok2e ? (lines.find(l => aprovacao.some(a => l.toLowerCase().includes(a)))?.trim() || 'Aprovação identificada') : 'Nenhuma aprovação explícita' };

  const checkMec = ['inspeção completa','revisão geral','checklist do mecânico','itens adicionais','encontramos mais','verificamos também','além do serviço principal','inspecionamos','outros pontos encontrados'];
  const ok3a = checkMec.some(c => lower.includes(c));
  resultados['3a'] = { ok: ok3a, prova: ok3a ? (lines.find(l => checkMec.some(c => l.toLowerCase().includes(c)))?.trim() || 'Checklist mecânico') : 'Nenhum checklist complementar' };

  const upsellContext = ['além','também precisa','recomendamos','verificamos que','encontramos','outros serviços','precisa trocar','precisa substituir'];
  const ok3b = ok2b && upsellContext.some(u => lower.includes(u));
  resultados['3b'] = { ok: ok3b, prova: ok3b ? 'Vídeo de up-sell identificado' : 'Nenhum vídeo de up-sell' };

  const extras = ['também recomendamos','além disso','verificamos que','encontramos também','outros itens','itens adicionais','sugerimos também','precisaria trocar','precisaria substituir','recomendo também','precisa de atenção também'];
  const ok3c = extras.some(e => lower.includes(e));
  resultados['3c'] = { ok: ok3c, prova: ok3c ? (lines.find(l => extras.some(e => l.toLowerCase().includes(e)))?.trim() || 'Serviços extras identificados') : 'Nenhuma oferta em texto' };

  const agradecimento = ['obrigado pela preferência','obrigado por nos escolher','foi um prazer','conte conosco','até a próxima','qualquer dúvida','fico à disposição','estamos à disposição','agradecemos a confiança','bom proveito','boas direções','boa viagem'];
  const ok4a = agradecimento.some(a => lower.includes(a));
  resultados['4a'] = { ok: ok4a, prova: ok4a ? (lines.find(l => agradecimento.some(a => l.toLowerCase().includes(a)))?.trim() || 'Agradecimento identificado') : 'Sem agradecimento' };

  const google = ['google','maps','avali','avalie','estrela','nota','comentário','goo.gl','maps.app','avaliação'];
  const ok4b = google.some(g => lower.includes(g));
  resultados['4b'] = { ok: ok4b, prova: ok4b ? (lines.find(l => google.some(g => l.toLowerCase().includes(g)))?.trim() || 'Pedido de avaliação') : 'Nenhum pedido de avaliação' };

  const acertos = Object.values(resultados).filter(r => r.ok).length;
  const score = Math.round((acertos / 12) * 100);

  return { convId, cliente, dateStart, dateEnd, resultados, acertos, score };
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

function gerarHTMLFull(auditorias, inboxName, oldArg, resumosDasConversas, analiseGeral) {
  const total = auditorias.length;
  const scoresMedio = total > 0 ? Math.round(auditorias.reduce((s, a) => s + a.score, 0) / total) : 0;
  const CHATWOOT_UI = 'https://chat.tork.services/app/accounts/6/conversations/';

  // Acertos por regra
  const acertosPorRegra = {};
  REGRAS.forEach(r => {
    const acertos = auditorias.filter(a => a.resultados[r.id]?.ok).length;
    acertosPorRegra[r.id] = { acertos, pct: total > 0 ? Math.round((acertos / total) * 100) : 0 };
  });

  const sorted = [...auditorias].sort((a, b) => b.score - a.score);
  const melhor = sorted[0];
  const pior = sorted[sorted.length - 1];

  const regrasOrdenadas = REGRAS.map(r => ({ ...r, pct: acertosPorRegra[r.id].pct })).sort((a, b) => b.pct - a.pct);
  const pontosFortes = regrasOrdenadas.slice(0, 3);
  const pontosFracos = regrasOrdenadas.slice(-3).reverse();

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
  
  .header { background: #1e293b; color: white; padding: 28px 32px; border-radius: 10px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
  .header .subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }
  .header .meta { display: flex; gap: 24px; margin-top: 16px; flex-wrap: wrap; }
  .header .meta-item { color: #cbd5e1; font-size: 12px; }
  .header .meta-item span { color: white; font-weight: 600; }

  .score-badge { display: inline-flex; align-items: center; justify-content: center; width: 72px; height: 72px; border-radius: 50%; font-size: 22px; font-weight: 800; }
  
  .card { background: white; border-radius: 10px; border: 1px solid #e2e8f0; padding: 20px 24px; margin-bottom: 16px; }
  .card h2 { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
  
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .summary-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
  .summary-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
  .summary-card .value { font-size: 28px; font-weight: 800; }

  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { background: #f8fafc; padding: 8px 10px; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-transform: uppercase; }
  tbody td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  
  .progress-bar { background: #f1f5f9; border-radius: 4px; height: 6px; width: 100%; }
  .progress-fill { height: 6px; border-radius: 4px; }

  .audit-card { background: white; border-radius: 10px; border: 1px solid #e2e8f0; padding: 20px 24px; margin-bottom: 20px; page-break-inside: avoid; }
  .audit-card.worst-pick { border-left: 5px solid #dc2626; box-shadow: 0 4px 6px -1px rgba(220,38,38,0.2); }
  .audit-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
  .audit-name { font-size: 15px; font-weight: 700; color: #0f172a; }
  .audit-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
  .audit-link { font-size: 11px; color: #3b82f6; text-decoration: none; display:inline-block; margin-top:5px; background: #eff6ff; padding: 4px 8px; border-radius: 4px; }
  .audit-link:hover { text-decoration: underline; background: #dbeafe; }
  
  .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 700; }
  .check-ok { color: #16a34a; font-weight: 700; font-size: 14px; }
  .check-fail { color: #dc2626; font-weight: 700; font-size: 14px; }
  .prova-text { background: #f8fafc; border-left: 2px solid #e2e8f0; padding: 4px 8px; border-radius: 0 4px 4px 0; font-size: 11px; color: #475569; font-style: italic; max-width: 500px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cat-label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #94a3b8; padding: 6px 10px; background: #f8fafc; }

  .page-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 28px 0 16px; display: flex; align-items: center; gap: 8px; }
  .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
  
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  
  .resumo-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin-top: 20px; border-radius: 4px; color: #991b1b; font-size: 13px; line-height: 1.5; }
  .resumo-box-normal { background: #f8fafc; border-left: 4px solid #94a3b8; padding: 16px; margin-top: 20px; border-radius: 4px; color: #334155; font-size: 13px; line-height: 1.5; }
  .highlight-label { background: #dc2626; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-bottom: 8px; display: inline-block; }

  @media print {
    body { background: white; }
    .container { padding: 0; }
    .audit-card, .card { page-break-inside: avoid; }
    .hide-on-print { display: none !important; }
    @page { size: A4; margin: 15mm; }
  }
  
  .print-btn { background: #3b82f6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; }
  .print-btn:hover { background: #2563eb; }
  .reset-print-btn { background: #64748b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; display: none; }
  .print-mode .reset-print-btn { display: inline-flex; }
  .print-mode .print-btn { display: none; }
</style>
</head>
<body>
<div class="container">

<!-- HEADER -->
<div class="header">
  <h1>📋 Auditoria ${inboxName}</h1>
  <div class="subtitle">Gerado em ${dataRelatorio}</div>
  <div class="meta">
    <div class="meta-item">Conversas auditadas: <span>${total}</span></div>
    <div class="meta-item">Score médio: <span style="color: ${scoreColor(scoresMedio)}">${scoresMedio}%</span></div>
  </div>
</div>

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

<div class="page-title">📊 Visão Gerencial</div>

<!-- ANÁLISE GERAL DA IA -->
<div class="card" style="background: #fff8f1; border-color: #fdba74;">
  <h2 style="color: #c2410c; border-bottom: 2px solid #ffedd5; padding-bottom: 12px;">🧠 Parecer Executivo da Unidade</h2>
  <div style="font-size: 14px; line-height: 1.6; color: #7c2d12;">
    ${analiseGeral.replace(/\n/g, '<br>')}
  </div>
</div>

<!-- ACERTOS POR REGRA -->
<div class="card">
  <h2>Desempenho por Regra (${total} conversas)</h2>
  <table>
    <thead><tr><th style="width:60px">Regra</th><th>Descrição</th><th style="width:80px">Acertos</th><th style="width:120px">Aderência</th><th style="width:60px">%</th></tr></thead>
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

<div class="divider"></div>

<div class="page-title">📁 Histórico por Cliente</div>
`;

  const sortedAudits = [...auditorias].sort((a, b) => {
      return b.score - a.score;
  });

  sortedAudits.forEach((audit) => {
    const { convId, cliente, dateStart, dateEnd, resultados, acertos, score } = audit;
    const isWorst = pior && String(convId) === String(pior.convId);
    let catAtual = null;
    
    html += `
<div class="audit-card ${isWorst ? 'worst-pick' : ''}">
  <div class="audit-header">
    <div>
      <div class="audit-name">${cliente}</div>
      <div class="audit-meta">📅 ${dateStart.slice(0,5)} → ${dateEnd.slice(0,5)} &nbsp;·&nbsp; OS #${convId}</div>
      <div style="margin-top: 8px;">
          <a href="${CHATWOOT_UI}${convId}" target="_blank" class="audit-link">🔗 Ver no Chatwoot</a>
          <button class="print-btn" onclick="selectForPrint(this)" style="margin-left: 8px;">🖨️ Imprimir Apenas Esta OS</button>
          <button class="reset-print-btn" onclick="resetPrint()" style="margin-left: 8px;">❌ Cancelar Impressão Única</button>
      </div>
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
      if (catAtual !== r.cat) {
        catAtual = r.cat;
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
  
  ${isWorst ? `
  <div class="resumo-box">
    <strong>📌 Falha Comercial / Processual Crítica (Análise IA):</strong><br>
    ${resumosDasConversas[convId] || 'Resumo indisponível'}
  </div>` : `
  <div class="resumo-box-normal">
    <strong>💬 Síntese do Atendimento:</strong><br>
    ${resumosDasConversas[convId] || 'Resumo indisponível'}
  </div>
  `}
</div>
`;
  });

  html += `
</div>
<script>
function selectForPrint(btn) {
    document.querySelectorAll('.audit-card').forEach(card => {
        card.classList.add('hide-on-print');
        card.style.opacity = '0.3';
    });
    const target = btn.closest('.audit-card');
    target.classList.remove('hide-on-print');
    target.style.opacity = '1';
    document.body.classList.add('print-mode');
    setTimeout(() => window.print(), 300);
}
function resetPrint() {
    document.querySelectorAll('.audit-card').forEach(card => {
        card.classList.remove('hide-on-print');
        card.style.opacity = '1';
    });
    document.body.classList.remove('print-mode');
}
</script>
</body>
</html>`;

  return html;
}

// ── MAIN LOOP ───────────────────────────────────────────────────
async function processAll() {
  const DIR_BASE = 'C:\\Users\\admin\\.gemini\\antigravity\\scratch\\gerentesmec';
  const DIR_PAINEL = path.join(DIR_BASE, 'Painel_Auditorias');
  if (!fs.existsSync(DIR_PAINEL)) fs.mkdirSync(DIR_PAINEL);

  const subdirs = fs.readdirSync(DIR_BASE).filter(d => d.startsWith('conversas_'));

  for (const subdir of subdirs) {
    const unitName = subdir.replace('conversas_', '').replace(/_/g, ' ');
    const dirPath = path.join(DIR_BASE, subdir);
    if (!fs.existsSync(dirPath)) continue;
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.txt'));
    
    if (files.length === 0) continue;

    console.log(`\n\n--- Processando unidade: ${unitName} ---`);
    
    let convsData = [];

    for (const f of files) {
      const content = fs.readFileSync(path.join(dirPath, f), 'utf-8');
      const convIdMatch = content.match(/CONVERSA ID:\s*(\d+)/i);
      const clienteMatch = content.match(/CLIENTE:\s*(.+)/i);
      const perMatch = content.match(/PERÍODO:\s*(.+)/i);
      
      if (!convIdMatch) continue;
      const convId = convIdMatch[1];
      const cliente = clienteMatch ? clienteMatch[1].trim() : 'Cliente';
      const per = perMatch ? perMatch[1].split(' → ') : ['',''];
      
      convsData.push({ convId, cliente, content, dateStart: per[0] || '', dateEnd: per[1] || '' });
    }

    // Processa auditorias ANTES para extrair os pontos fortes e fracos
    const todasAuditorias = convsData.map(c => auditarConversa(c.content, c.convId, c.cliente, c.dateStart, c.dateEnd));
    const total = todasAuditorias.length;
    const scoresMedio = total > 0 ? Math.round(todasAuditorias.reduce((s, a) => s + a.score, 0) / total) : 0;
    
    const acertosPorRegra = {};
    REGRAS.forEach(r => {
      const acertos = todasAuditorias.filter(a => a.resultados[r.id]?.ok).length;
      acertosPorRegra[r.id] = { acertos, pct: total > 0 ? Math.round((acertos / total) * 100) : 0 };
    });
    const regrasOrdenadas = REGRAS.map(r => ({ ...r, pct: acertosPorRegra[r.id].pct })).sort((a, b) => b.pct - a.pct);
    const pontosFortes = regrasOrdenadas.slice(0, 3).map(r => `${r.id}: ${r.desc} (${r.pct}%)`).join(', ');
    const pontosFracos = regrasOrdenadas.slice(-3).reverse().map(r => `${r.id}: ${r.desc} (${r.pct}%)`).join(', ');

    let promptPayload = `Você é um Analista de Qualidade Executivo avaliando a Central de Atendimento da oficina mecânica (Unidade: ${unitName}).
Foram analisadas ${total} conversas, resultando em um score médio de ${scoresMedio}%.
Pontos Fortes da unidade: ${pontosFortes}
Pontos Fracos Críticos: ${pontosFracos}

Abaixo estão as transcrições das ${total} conversas auditadas.

Seu objetivo é:
1. Faça uma "analiseGeral" (1 a 2 parágrafos) em tom EXECUTIVO DIRETAMENTE PARA OS DONOS. A análise NÃO PODE SER GENÉRICA. Ela deve ser um "puxão de orelha" no gerente da unidade e DEVE usar a PIOR CONVERSA como EXEMPLO PRÁTICO para cobrar a equipe (Exemplo: "Esse atendimento foi péssimo porque aconteceu a situação X com o cliente Y..."). Mostre exatamente o porquê a unidade tirou essa nota citando os fatos concretos que aconteceram na conversa, para que o dono use esse texto para enquadrar o gerente.
2. Escreva um resumo analítico para CADA UMA das conversas (propriedade "resumosDasConversas", mapeada pelo ID da OS). Para ABSOLUTAMENTE TODAS as OS, o resumo deve ter de 4 a 5 frases super afiadas detalhando a qualidade do atendimento: cite falha comercial, perda de dinheiro, problema gerencial ou amadorismo, ou elogie fortemente se foi impecável. Você DEVE ler cada conversa de ponta a ponta e escrever um "textão" detalhado para usar de munição ao cobrar o gerente sobre aquele atendimento específico.

`;
    
    convsData.forEach(c => {
        promptPayload += `\n=== INÍCIO DA CONVERSA ID: ${c.convId} (CLIENTE: ${c.cliente}) ===\n${c.content}\n=== FIM DA CONVERSA ID: ${c.convId} ===\n`;
    });

    promptPayload += `
Retorne APENAS um JSON válido.
Formato:
{
  "analiseGeral": "Texto da análise executiva da unidade inteira...",
  "null": "ID",
  "resumosDasConversas": {
    "1234": "Resumo da conversa 1234...",
    "5678": "Resumo da conversa 5678..."
  }
}
`;

    console.log(`Consultando Gemini para análise profunda da unidade e resumos de todas as conversas (${convsData.length} conversas)...`);
    
    try {
        const schema = {
        type: "object",
        properties: {
            analiseGeral: { type: "string" },
            resumosDasConversas: {
                type: "object",
                additionalProperties: { type: "string" }
            }
        },
        required: ["analiseGeral", "resumosDasConversas"]
    };
    
    // Espera 15s antes de cada chamada para não estourar o Free Tier Rate Limit
    if (subdir !== subdirs[0]) {
        console.log('Esperando 15s para respeitar a cota da API...');
        await new Promise(r => setTimeout(r, 15000));
    }
    
    let response;
    let retries = 5;
    let delay = 10000;
    while (retries > 0) {
        try {
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptPayload,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });
            break;
        } catch (apiErr) {
            retries--;
            if (retries === 0) throw apiErr;
            console.warn(`[⚠️] Erro na API do Gemini para a unidade ${unitName}: ${apiErr.message || apiErr}. Tentando novamente em ${delay/1000} segundos... (${retries} tentativas restantes)`);
            await new Promise(r => setTimeout(r, delay));
            delay *= 1.5;
        }
    }
        
        const resText = response.text;
        const result = JSON.parse(resText);
        
        const worstId = result.null;
        const analise = result.analiseGeral;
        const resumos = result.resumosDasConversas || {};
        
        console.log(`[!] Pior escolhida: ${worstId}`);
        
        const html = gerarHTMLFull(todasAuditorias, unitName, worstId, resumos, analise);
        
        const htmlName = `Relatorio_Semantico_${subdir.replace('conversas_','')}.html`;
        if (!fs.existsSync(DIR_PAINEL)) fs.mkdirSync(DIR_PAINEL, { recursive: true });
        fs.writeFileSync(path.join(DIR_PAINEL, htmlName), html);
        console.log(`[+] Salvo ${htmlName} com Análise Executiva e Resumos Individuais.`);
        
    } catch (e) {
        console.error(`Erro na unidade ${unitName}:`, e);
    }
  }
}

processAll();
