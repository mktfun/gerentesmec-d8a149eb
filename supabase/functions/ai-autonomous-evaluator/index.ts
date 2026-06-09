import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.2.3";

async function getGoogleAccessToken(credentials: any): Promise<string> {
  const { client_email, private_key, token_uri } = credentials;
  if (!client_email || !private_key) {
    throw new Error('Credenciais GCP inválidas. Faltam client_email ou private_key.');
  }

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const alg = 'RS256';
  const pkcs8 = private_key.replace(/\\n/g, '\n');
  const privateKey = await importPKCS8(pkcs8, alg);

  const jwt = await new SignJWT({
    iss: client_email,
    sub: client_email,
    aud: token_uri || 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  })
    .setProtectedHeader({ alg, typ: 'JWT' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(privateKey);

  const response = await fetch(token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Falha ao obter access token do Google: ${err}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getEmbedding(text: string, aiSettings: any): Promise<number[] | null> {
  try {
    const provider = aiSettings.provider || 'openai';
    if (provider === 'Google Vertex AI') {
      const gcpCreds = aiSettings.gcp_credentials;
      const gcpProject = aiSettings.gcp_project_id || (gcpCreds && gcpCreds.project_id);
      const gcpRegion = aiSettings.gcp_region || 'us-central1';
      if (!gcpCreds || !gcpProject) return null;
      
      const accessToken = await getGoogleAccessToken(gcpCreds);
      const host = gcpRegion === 'global' ? 'aiplatform.googleapis.com' : `${gcpRegion}-aiplatform.googleapis.com`;
      const vertexUrl = `https://${host}/v1/projects/${gcpProject}/locations/${gcpRegion}/publishers/google/models/text-embedding-004:predict`;

      const response = await fetch(vertexUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ instances: [{ content: text }] })
      });
      if (!response.ok) return null;
      const result = await response.json();
      return result.predictions?.[0]?.embeddings?.values || null;
    } else {
       const openAiToken = Deno.env.get('OPENAI_API_KEY') || aiSettings.api_key;
       if (!openAiToken) return null;
       const response = await fetch("https://api.openai.com/v1/embeddings", {
         method: "POST",
         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openAiToken}` },
         body: JSON.stringify({ input: text, model: "text-embedding-3-small" })
       });
       if (!response.ok) return null;
       const result = await response.json();
       return result.data?.[0]?.embedding || null;
    }
  } catch (e) {
    console.error('[AI-EVALUATOR] Erro ao gerar embedding:', e);
    return null;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── RETRY COM BACKOFF EXPONENCIAL ──────────────────────────────────────────
const RETRYABLE_CODES = [429, 500, 502, 503, 529];

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.ok || !RETRYABLE_CODES.includes(res.status)) {
      return res;
    }
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[RETRY] Tentativa ${attempt + 1}/${maxRetries} falhou (HTTP ${res.status}). Aguardando ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    } else {
      return res;
    }
  }
  throw new Error('fetchWithRetry: unreachable');
}

// ─── PARSER JSON MULTI-ESTRATÉGIA ───────────────────────────────────────────
function extractJSON(raw: string): any {
  // Estratégia 1: Parse direto
  try { return JSON.parse(raw); } catch {}

  // Estratégia 2: Limpar markdown wrappers
  let cleaned = raw
    .replace(/^[\s\S]*?```(?:json)?\s*\n?/i, '')
    .replace(/\n?\s*```[\s\S]*$/i, '')
    .trim();
  try { return JSON.parse(cleaned); } catch {}

  // Estratégia 3: Contagem de chaves balanceada (encontra o primeiro JSON completo)
  const start = raw.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < raw.length; i++) {
      const ch = raw[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(raw.substring(start, i + 1)); } catch { break; }
        }
      }
    }
  }

  // Estratégia 4: Regex gananciosa (fallback final)
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  throw new Error(`Resposta da IA não contém JSON válido. Início: "${raw.substring(0, 120)}..."`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Declara variáveis essenciais fora do bloco try para garantir que o bloco catch as acesse sem ReferenceError
  let aiSettings: any = null;
  let provider = 'openai';
  let finalModel = '';
  let userMessageContent: any = '';
  let taskId: string | null = null;
  let supabaseClient: any = null;

  // Helper silencioso para atualizar a fila — nunca quebra a função principal
  const updateTask = async (patch: Record<string, any>) => {
    if (!taskId || !supabaseClient) return;
    try {
      await supabaseClient.from('ai_task_queue').update(patch).eq('id', taskId);
    } catch (e) {
      console.error('[AI-EVALUATOR] Falha ao atualizar task na fila:', e);
    }
  };

  try {
    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    console.log("[AI-EVALUATOR] Iniciando avaliação para payload:", JSON.stringify(payload));
    let { message_content, lead_id, message_id, message_ids, media_url, media_type, sender_type } = payload;

    if (!lead_id) {
      return new Response(JSON.stringify({ error: 'Missing lead_id' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    if (!message_id && !message_content && !message_ids) {
      // 🚨 Chamada de Lote pelo CRON 🚨
      const { data: pendingMsgs, error: msgsErr } = await supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('lead_id', lead_id)
        .eq('ai_audited', false)
        .order('created_at', { ascending: true });

      if (msgsErr) throw new Error("Erro ao buscar mensagens: " + msgsErr.message);
      
      if (!pendingMsgs || pendingMsgs.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "Nothing to audit" }), { headers: corsHeaders });
      }

      message_ids = pendingMsgs.map((m: any) => m.id);
      message_id = pendingMsgs[pendingMsgs.length - 1].id;
      
      const senders = new Set(pendingMsgs.map((m: any) => m.sender_type));
      if (senders.has('user') && senders.has('contact')) {
        sender_type = 'mixed';
      } else {
        sender_type = pendingMsgs[pendingMsgs.length - 1].sender_type;
      }

      // Constrói o texto aglomerado
      message_content = pendingMsgs.map((m: any) => {
        const text = m.content || (m.media_url ? `[MEDIA ENVIADA: ${m.media_type || 'desconhecida'}]` : "[VAZIA]");
        const senderLabel = m.sender_type === 'contact' ? 'CLIENTE' : 'GERENTE';
        return `[${senderLabel}]: ${text}`;
      }).join('\n\n');
    }

    // Garante que message_content sempre tenha um valor (para áudios/imagens sem texto isoladas via webhook legado)
    if (!message_content) {
      message_content = media_url ? `[MEDIA ENVIADA: ${media_type || 'desconhecida'}]` : "[MENSAGEM VAZIA/SISTEMA]";
    }

    let retryCount = 0;
    // Usa a task_id se foi enviada (retry), senão cria uma nova
    if (payload.task_id) {
      taskId = payload.task_id;
      try {
        const { data: existingTask } = await supabaseClient
          .from('ai_task_queue')
          .select('retry_count')
          .eq('id', taskId)
          .single();
        if (existingTask) retryCount = existingTask.retry_count || 0;
        
        await supabaseClient.from('ai_task_queue').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', taskId);
      } catch (e) {
        console.error('[AI-EVALUATOR] Erro ao recuperar task de retry:', e);
      }
    } else {
      try {
        const previewText = typeof message_content === 'string'
          ? message_content.substring(0, 140)
          : JSON.stringify(message_content).substring(0, 140);
        const { data: taskRow } = await supabaseClient
          .from('ai_task_queue')
          .insert({
            lead_id: String(lead_id),
            message_id: message_id ? String(message_id) : null,
            content_preview: previewText,
            sender_type: sender_type || null,
            status: 'pending'
          })
          .select('id')
          .single();
        if (taskRow) taskId = taskRow.id;
      } catch (e) {
        console.error('[AI-EVALUATOR] Falha ao criar task na fila:', e);
      }
    }

    // 1. Pré-processamento Determinístico (Filtro Anti-Gasto)
    const text = message_content.trim();
    if (text.length < 10 && !text.match(/[?]/)) {
      console.log(`[Cost-Efficiency] Mensagem ignorada por ser muito curta e sem pergunta: "${text}"`);
      const ignoreIds = (message_ids && Array.isArray(message_ids) && message_ids.length > 0) ? message_ids : (message_id ? [message_id] : []);
      if (ignoreIds.length > 0) {
        await supabaseClient.from('chat_messages').update({ ai_audited: true }).in('id', ignoreIds);
      }
      await updateTask({ status: 'ignored', completed_at: new Date().toISOString() });
      return new Response(JSON.stringify({ status: 'ignored_by_deterministic_filter' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Obter AiSettings
    const { data: dbAiSettings } = await supabaseClient.from('ai_settings').select('*').single();
    aiSettings = dbAiSettings;
    if (!aiSettings || !aiSettings.features?.auto_scoring) {
      await updateTask({ status: 'ignored', completed_at: new Date().toISOString(), error_message: 'auto_scoring desabilitado' });
      return new Response(JSON.stringify({ error: 'ai_automation_disabled' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
    }

    // EXTRAÇÃO E RASPAGEM DE LINKS (Regex aprimorado)
    // Captura URLs com ou sem protocolo, ex: google.com, www.oficina.com.br/orcamento
    const urlRegex = /\b(?:https?:\/\/)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
    const urls = text.match(urlRegex) || [];
    let scrapedContent = '';

    if (urls.length > 0 && sender_type !== 'contact') {
      console.log(`[AI-EVALUATOR] Encontradas ${urls.length} URLs no chat enviadas pelo Gerente. Iniciando scraping avançado via Jina Reader...`);
      const fetchPromises = urls.map(async (url) => {
        try {
          // Utilizar Jina Reader para lidar com SPAs e transformar em Markdown puro
          let normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
          const jinaUrl = `https://r.jina.ai/${normalizedUrl}`;
          const res = await fetch(jinaUrl, { 
            headers: {
              'X-Return-Format': 'markdown'
            },
            signal: AbortSignal.timeout(12000) // Timeout aumentado para 12s para suportar sistemas de orçamento pesados
          });
          if (!res.ok) return null;
          
          const markdownContent = await res.text();
          // Limita o conteúdo a 4000 caracteres para não estourar o contexto da API
          return `[CONTEÚDO DO LINK ${url}]:\n${markdownContent.substring(0, 4000)}\n[FIM DO LINK]`;
        } catch (e) {
          console.error(`[AI-EVALUATOR] Erro ao raspar via Jina Reader ${url}:`, e);
          return null;
        }
      });
      const results = await Promise.allSettled(fetchPromises);
      const validContents = results
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => (r as PromiseFulfilledResult<string>).value);
      
      if (validContents.length > 0) {
        scrapedContent = `\n\nCONTEÚDO RASPADO DOS LINKS ENVIADOS NESTA MENSAGEM (USE PARA AVALIAR QUALIDADE DOS ORÇAMENTOS/CHECKLISTS E SALVAR EM MEMÓRIA):\n` + validContents.join('\n\n');
      }
    } else if (urls.length > 0 && sender_type === 'contact') {
      console.log(`[AI-EVALUATOR] Links encontrados na mensagem do Cliente. Scraping ignorado para economizar tokens/tempo.`);
    }

    // 2. Semantic Memory Fetch (RAG)
    let auditMemories = '';
    let leadData: any = null;
    let currentChecklist: Record<string, boolean> = {};
    try {
      const { data: _leadData } = await supabaseClient.from('leads').select('unit_id, ticket_value, customer_vehicle, audit_checklist, audit_checklist_messages, funnel_stage, score, audit_reasons').eq('id', lead_id).single();
      leadData = _leadData;
      currentChecklist = leadData?.audit_checklist || {};
      const unitId = leadData?.unit_id;
      if (unitId) {
        // Gera o embedding da mensagem atual para buscar memórias semelhantes
        const queryEmbedding = await getEmbedding(text, aiSettings);
        if (queryEmbedding) {
          const { data: memories, error } = await supabaseClient.rpc('match_ai_memories', {
            query_embedding: queryEmbedding,
            match_threshold: 0.7, // threshold de similaridade (ajustável)
            match_count: 5,
            p_unit_id: unitId
          });
          
          if (memories && memories.length > 0) {
            auditMemories = `\n[MEMÓRIA DE AUDITORIAS ANTERIORES DO GESTOR]\nATENÇÃO MÁXIMA: O gestor fez as seguintes correções/feedbacks sobre as auditorias que são semanticamente similares ao contexto atual. Você DEVE usar isso para ajustar seu raciocínio e NÃO REPETIR O ERRO:\n`;
            auditMemories += memories.map((m: any) => `- ${m.context}`).join('\n') + '\n';
          }
        }
      }
    } catch (e) {
      console.log('[AI-EVALUATOR] Erro ao buscar memórias via RAG:', e);
    }
    
    // 3. Prompt Compression & Memoization
    // Busca o histórico resumido para poupar tokens do histórico raw enorme.
    let compressedHistory = '';
    const { data: memory } = await supabaseClient.from('lead_memories').select('*').eq('lead_id', lead_id).single();
    if (memory) {
      compressedHistory = memory.compressed_history;
    }

    // 4. LLM Routing e Chamada
    provider = aiSettings.provider || 'openai';
    const apiKey = aiSettings.api_key;
    if (provider !== 'Google Vertex AI' && !apiKey) throw new Error("API Key não configurada");

    const prompt = `
      ${aiSettings.system_prompt}
      
      CRITÉRIOS ATUAIS:
      ${JSON.stringify(aiSettings.evaluation_criteria)}
      ${auditMemories}
      HISTÓRICO DA NEGOCIAÇÃO ATÉ AGORA (Resumido):
      ${compressedHistory || "Nenhum histórico prévio."}
      
      ⚠️ REGRA DE IDENTIDADE: VOCÊ ESTÁ PROIBIDO DE USAR PALAVRAS COMO "IA", "Inteligência Artificial", "Robô" ou "Sistema". Aja como a "Auditoria". Nunca diga "A IA notou", diga "A Auditoria notou" ou vá direto ao ponto.
      
      ${sender_type === 'contact' 
        ? `⚠️ ATENÇÃO: Esta mensagem foi enviada pelo CLIENTE (contact), NÃO pelo gerente.
          REGRA DE OURO: Você NÃO DEVE pontuar itens de ação do gerente. O ÚNICO item que pode ser pontuado aqui é o '2e' (Aprovação do Cliente).
          Se o cliente confirmou/aprovou o serviço nesta mensagem, marque 2e como true. Para todos os outros itens, mantenha o valor atual.
          Você também pode atualizar funnel_stage, customer_vehicle, ticket_value e new_compressed_history.` 
        : sender_type === 'mixed'
        ? `⚠️ ATENÇÃO: Este lote contém mensagens TANTO do gerente QUANTO do cliente.
          Avalie as ações do gerente (itens 1a a 2d, 3a a 4b) com base no que ele falou.
          E avalie a resposta do cliente para verificar se houve a aprovação explícita (item 2e).
          ⚠️ REGRA PARA LOTES MISTOS: Se houver mensagem do cliente no meio do lote dizendo "aprovado/pode fazer", VOCÊ DEVE OBRIGATORIAMENTE marcar o item "2e" como true na chave audit_checklist, independentemente do que o gerente disse depois.`
        : `✅ Esta mensagem foi enviada pelo GERENTE. Avalie os critérios de auditoria (exceto 2e que é aprovação do cliente) normalmente baseando-se nesta ação do gerente.`}
      
      NOVA MENSAGEM:
      "${text}"
      
      Você é um auditor de qualidade de vendas mecânicas automotivas.
      Analise a conversa e identifique A ETAPA atual do funil.
      
      ⚠️ ATENÇÃO - REDUÇÃO DE CUSTOS E OTIMIZAÇÃO:
      Se a nova etapa que você vai sugerir NÃO FOR 'closed_won' nem 'closed_lost', ENTÃO você está PROIBIDO de processar e avaliar o checklist de auditoria. Você deve retornar o dicionário "audit_checklist" e "audit_justifications" VAZIOS {}, e o "score" como null. Foque todo seu processamento apenas na mudança de "funnel_stage", preenchimento OBRIGATÓRIO de "media_summaries" (transcrição de vídeos/áudios) e "message_insight" (nota/resumo da ação), além da extração de "ticket_value", "customer_vehicle", e "new_compressed_history".
      
      APENAS se a conversa for ENCERRADA e a nova etapa for OBRIGATORIAMENTE 'closed_won' ou 'closed_lost', ENTÃO você DEVE avaliar e retornar todos os 12 itens do "audit_checklist", suas "audit_justifications", o "score" (0 a 100), e o "closing_summary".
      
      O gerente já pontuou os itens ${Object.keys(currentChecklist).filter(k => currentChecklist[k]).join(', ') || 'nenhum'} (Apenas mantenha esses como TRUE no checklist final se for etapa de fechamento).
      
      IMPORTANTE:
      1. Para "ticket_value", NUNCA invente ou extraia valores de chaves PIX, CNPJ, números de telefone ou links de pagamento. Só preencha se o gerente falar EXPLICITAMENTE o valor total do orçamento (ex: "ficou 1650,00", "total de 2700"). Se ele enviou apenas um link de pagamento e não falou o valor, deixe como null.
      2. Considere a tag "[ANEXO ENVIADO: video]" e "[ANEXO ENVIADO: image]" como mídias reais. Se o checklist exige vídeo e há essa tag, considere como true.

      GUIA DETALHADO PARA AVALIAÇÃO DOS ITENS CRÍTICOS:

      Item 2c (Consequências explicadas): Marque TRUE se o gerente explicou o que acontece se o cliente NÃO fizer o reparo. Exemplos que contam como TRUE:
      - "Se não trocar agora, pode travar o motor"
      - "Esse vazamento vai piorar e pode dar problema na estrada"
      - "Se deixar assim, vai gastar o dobro depois"
      Exemplos que NÃO contam: Apenas dizer o preço sem contexto.

      Item 2d (Checklist do veículo enviado): Marque TRUE se o gerente enviou um link, PDF, ou documento com a lista detalhada dos defeitos/serviços E fotos. Uma simples foto avulsa NÃO é checklist. Precisa ser um documento organizado ou link do sistema.

      Item 2e (Aprovação do cliente): Marque TRUE se o cliente deu qualquer confirmação APÓS receber o orçamento/valor. Exemplos:
      - "pode fazer", "aprovado", "manda bala", "pode marchar", "blz", "ok faz"
      - "ta sussa", "bora", "fechado", "sim", "pode meter marcha"
      Atenção: O "sim" ou "ok" DEVE vir DEPOIS do preço/orçamento ter sido apresentado.
      
      CRITÉRIOS RÍGIDOS PARA MUDANÇA DE ETAPA (funnel_stage) - INTERPRETE O CONTEXTO COM EXTREMO RIGOR:
      - 'closed_lost' (Perdido): USE APENAS SE o cliente disse explicitamente que não vai fazer ou achou muito caro e encerrou.
      - 'closed_won' (Ganho / Finalizado): USE **EXCLUSIVAMENTE** NO FIM DO FIM DA OFICINA. Apenas quando o carro já foi entregue, o serviço está concluído/pago, e o gerente se despede (ex: enviando o link de avaliação do Google ou Termo de Garantia). NÃO use esta etapa se o cliente apenas aprovar o orçamento!
      - 'quote' (Orçamento Enviado): O gerente CRAVOU O PREÇO ou enviou o PDF/link do orçamento e checklist, e agora está aguardando a aprovação do cliente.
      - 'negotiation' (Em Atendimento / Em Execução): Use esta etapa para as seguintes situações:
          1. O gerente respondeu ao cliente e está diagnosticando ou agendando (antes do orçamento).
          2. O cliente **APROVOU** o serviço (ex: "Pode fazer", "Aprovado"). Neste momento, o carro vai começar a ser consertado na oficina. Portanto, se o cliente aprovar ou o gerente estiver mandando fotos da peça em execução, a etapa correta é ESTA (negotiation).
      - 'lead_new' (Novo Lead): O cliente mandou a 1ª mensagem e o gerente AINDA NÃO RESPONDEU. SE O GERENTE ENVIOU MENSAGEM AGORA, É PROIBIDO MANTER EM 'lead_new'. Mude IMEDIATAMENTE para 'negotiation' ou 'quote'.

      [EXEMPLO DE ATENDIMENTO 100% - LOJA CARIJÓS (PADRÃO OURO)]
      Gerente: "Bom dia Sr. João! Segue o link do nosso checklist detalhado com as fotos do vazamento e o orçamento final: [LINK]. Aproveito para recomendar a troca preventiva da correia, enviei um vídeo rápido de 40 seg mostrando o desgaste acima."
      Cliente: "Assustador! Pode aprovar tudo."
      Gerente: "Maravilha. Serviço finalizado. Muito obrigado pela confiança! Pode nos deixar uma avaliação no Google? [LINK]"
      [FIM DO EXEMPLO]

      INSTRUÇÕES CRÍTICAS DE AVALIAÇÃO DO CHECKLIST E JUSTIFICATIVAS:
      1. AVALIAÇÃO FINAL PARA 1a, 1b, 4a e 4b: Estes itens SÓ PODEM SER MARCADOS COMO TRUE NO MOMENTO EM QUE FINALIZAR O ATENDIMENTO (quando o funnel_stage mudar para 'closed_won' ou 'closed_lost'). Durante o atendimento, MANTENHA-OS COMO false.
      2. MENSAGEM DE AGRADECIMENTO E AVALIAÇÃO (4a, 4b): NEGATIVE CONSTRAINT: Um simples "Valeu" ou "Obrigado" do gerente NO MEIO do atendimento NÃO é mensagem de finalização. Só pontue se a conversa realmente chegou ao fim e o serviço foi aprovado/recusado.
      3. CHAIN-OF-THOUGHT (OBRIGATÓRIO): A PRIMEIRA CHAVE do seu JSON de resposta DEVE ser "internal_monologue". Você deve pensar alto e justificar como interpretou gírias e intenções cruzando com o histórico ANTES de preencher o checklist e a etapa do funil. Se houver anexo de imagem, áudio, vídeo ou link, descreva com o MÁXIMO DE DETALHES possível o que é visto e/ou ouvido na mídia nesta etapa.

      [SISTEMA DE BLINDAGEM DE MEMÓRIA (MANDATÓRIO)]
      Sempre que houver conteúdo lido de um link (Checklist/Orçamento), você É OBRIGADO a extrair peças e valores e SALVÁ-LAS em texto corrido no campo \`new_compressed_history\`.
      ${scrapedContent}
      
      Retorne APENAS um JSON válido com a seguinte estrutura obrigatória:
      {
        "internal_monologue": "String descrevendo passo a passo o raciocínio da sua avaliação, interpretando gírias e o histórico",
        "audit_checklist": {
          "1a": true ou false,
          "1b": true ou false,
          "2a": true ou false,
          "2b": true ou false,
          "2c": true ou false,
          "2d": true ou false,
          "2e": true ou false,
          "3a": true ou false,
          "3b": true ou false,
          "3c": true ou false,
          "4a": true ou false,
          "4b": true ou false
        },
        "score": (número de 0 a 100),
        "funnel_stage": (sugestão de nova etapa),
        "stage_change_reason": (string ou null. OBRIGATÓRIO preencher se mudar para closed_lost ou closed_won. Motivo claro, curto e objetivo da transição),
        "audit_justifications": {
           // (Dicionário) APENAS para itens que ficaram FALSE e que faziam sentido ter sido cumpridos nesta etapa do funil.
           // NÃO justifique itens TRUE (esses já foram cumpridos).
           // NÃO justifique TODOS os itens false — só aqueles que o gerente DEVERIA ter feito mas PULOU ou ESQUECEU dado o contexto da conversa.
           // A justificativa DEVE ser contextual e específica da conversa, citando o que aconteceu de fato.
           // EXEMPLO BOM: "3a": "Gerente pulou direto pro orçamento sem enviar foto/vídeo do defeito. Cliente perguntou o preço e ele já mandou o valor."
           // EXEMPLO BOM: "2e": "Não enviou vídeo educativo. Atendimento foi rápido, cliente já sabia o problema e pediu só o preço."
           // EXEMPLO RUIM (NÃO FAÇA): "3a": "Não foi marcado pois o gerente não enviou." (isso é genérico e inútil)
           // Se o item ainda não faz sentido na etapa atual (ex: 4a/4b durante negotiation), NÃO inclua.
        },
        "media_summaries": {
           // (Dicionário) OBRIGATÓRIO se houver mídia anexa (áudio/vídeo/imagem). Insira o ID da mensagem como chave e um Resumo Descritivo detalhado do conteúdo visual e auditivo como valor. O ID atual é: ${message_id}.
           // Ex: "${message_id}": "Vídeo: O mecânico filma a parte inferior do veículo, apontando para um vazamento escuro próximo ao cárter. A suspensão aparece íntegra."
        },
        "new_compressed_history": (novo histórico resumido somando a mensagem atual),
        "closing_summary": (Resumo descritivo narrando a evolução e histórico geral, OBRIGATÓRIO se a etapa for closed_won ou closed_lost, senão pode ser null),
        "message_insight": (String curta justificando uma ação crítica ou null se foi uma mensagem comum. Ver regra 9),
        "ticket_value": (número decimal ou null),
        "customer_vehicle": (string ou null)
      }
    `;

    let llmOutputText = "";
    finalModel = aiSettings.model || "";
    let tokensUsed: number | null = null;
    
    // Preparar payload de mensagem
    userMessageContent = prompt;
    
    console.log("[AI-EVALUATOR] Chamando LLM...");
    
    // Processamento de Mídia: Fetch e Base64
    let mediaBase64 = null;
    let actualMime = media_type || 'application/octet-stream';
    if (media_url) {
      try {
        console.log(`[AI-EVALUATOR] Baixando mídia de ${media_url} ...`);
        const mediaRes = await fetch(media_url);
        if (mediaRes.ok) {
          const arrayBuffer = await mediaRes.arrayBuffer();
          // Limite de segurança de 15MB para não estourar a memória da Edge Function
          if (arrayBuffer.byteLength < 15 * 1024 * 1024) {
            mediaBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            actualMime = mediaRes.headers.get('content-type') || actualMime;
            console.log(`[AI-EVALUATOR] Mídia baixada com sucesso. Tamanho: ${arrayBuffer.byteLength} bytes. Tipo: ${actualMime}`);
          } else {
            console.log("[AI-EVALUATOR] Mídia ignorada por exceder o limite de 15MB.");
          }
        }
      } catch (err) {
        console.error("[AI-EVALUATOR] Erro ao baixar mídia:", err);
      }
    }

    const startTime = performance.now();

    // Marca task como 'running' agora que a chamada LLM começa
    await updateTask({
      status: 'running',
      provider,
      model: aiSettings.model || null,
      started_at: new Date().toISOString()
    });

    try {
      if (provider === 'Google Vertex AI') {
        const gcpCreds = aiSettings.gcp_credentials;
        const gcpProject = aiSettings.gcp_project_id || (gcpCreds && gcpCreds.project_id);
        const gcpRegion = aiSettings.gcp_region || 'us-central1';
        
        if (!gcpCreds || !gcpProject) throw new Error("Vertex AI: Credenciais ou Project ID faltando na configuração.");
        
        const accessToken = await getGoogleAccessToken(gcpCreds);
        
        let parts: any[] = [{ text: prompt }];
        if (mediaBase64) {
          parts.push({
            inlineData: {
              mimeType: actualMime,
              data: mediaBase64
            }
          });
        } else if (media_url) {
          parts[0].text += `\n\n[SISTEMA]: O usuário anexou uma mídia, mas não pôde ser baixada. Assuma que há um anexo.`;
        }

        finalModel = aiSettings.model || 'gemini-2.5-flash';
        if (finalModel === 'Gemini Free-Tier Ensemble (Auto-Routing)' || finalModel.includes('ensemble')) {
          finalModel = 'gemini-2.5-flash';
        }
        
        const host = gcpRegion === 'global' ? 'aiplatform.googleapis.com' : `${gcpRegion}-aiplatform.googleapis.com`;
        const vertexUrl = `https://${host}/v1/projects/${gcpProject}/locations/${gcpRegion}/publishers/google/models/${finalModel}:generateContent`;
        
        const res = await fetchWithRetry(vertexUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: parts }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          let parsedError;
          try {
            parsedError = JSON.parse(errorText);
          } catch (_) {
            parsedError = null;
          }
          throw new Error(parsedError?.error?.message || `Vertex AI Error (${res.status}): ${errorText}`);
        }
        
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        llmOutputText = data.candidates[0].content.parts[0].text;
        tokensUsed = data.usageMetadata?.totalTokenCount || null;
        
      } else if (provider === 'Google' || provider === 'Gemini Studio' || (provider !== 'Local AI Proxy (CLI Tunnel)' && apiKey && !apiKey.startsWith("sk-") && !apiKey.startsWith("nvapi-") && !provider.includes('OpenRouter') && !provider.includes('Anthropic'))) {
        // Gemini (Direct Google API via AI Studio)
        let parts: any[] = [{ text: prompt }];
        userMessageContent = prompt; // FIX: Ensure input_text is populated for Gemini
        if (mediaBase64) {
          parts.push({
            inlineData: {
              mimeType: actualMime,
              data: mediaBase64
            }
          });
        } else if (media_url) {
          parts[0].text += `\n\n[SISTEMA]: O usuário anexou uma mídia, mas não pôde ser baixada. Assuma que há um anexo.`;
        }
        
        // Force gemma-4-31b-it as requested to bypass Gemini quotas
        finalModel = aiSettings.model && aiSettings.model !== 'gemini-2.5-flash' ? aiSettings.model : 'gemma-4-31b-it';
        
        // Gemma often returns markdown blocks for JSON, ensure prompt is strict
        if (finalModel.includes('gemma')) {
          parts[0].text += `\n\nCRITICAL INSTRUCTION: Return ONLY pure JSON text. Do not wrap in markdown \`\`\`json blocks. Do not add any conversational text.`;
        }
        
        let modelsToTry = [finalModel];
        // Handle Auto-Routing string explicitly
        if (finalModel === 'Gemini Free-Tier Ensemble (Auto-Routing)' || finalModel.toLowerCase().includes('ensemble')) {
          if (mediaBase64 && actualMime.startsWith('image/')) {
            modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-lite-preview-02-05'];
          } else {
            modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemma-4-31b-it', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-lite-preview-02-05'];
          }
        }
        
        for (let i = 0; i < modelsToTry.length; i++) {
          finalModel = modelsToTry[i];
          console.log(`[AI-EVALUATOR] Tentando modelo Google: ${finalModel} (Tentativa ${i+1}/${modelsToTry.length})`);
          
          const bodyPayload: any = {
            contents: [{ parts: parts }]
          };
          
          if (finalModel.includes('gemini')) {
            bodyPayload.generationConfig = { responseMimeType: "application/json" };
          }

          const res = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            
            if (i < modelsToTry.length - 1) {
              console.log(`[AI-EVALUATOR] Fallback Google Acionado! ${finalModel} falhou (${res.status}). Indo para o próximo modelo. Erro: ${errorText.substring(0, 100)}`);
              continue;
            }
            
            let parsedError;
            try { parsedError = JSON.parse(errorText); } catch (_) { parsedError = null; }
            throw new Error(parsedError?.error?.message || `Google AI Error (${res.status}): ${errorText}`);
          }
          
          const data = await res.json();
          if (data.error) {
            if (i < modelsToTry.length - 1) {
              console.log(`[AI-EVALUATOR] Fallback Google Acionado (Erro de corpo)! ${finalModel} falhou.`);
              continue;
            }
            throw new Error(data.error.message);
          }
          
          llmOutputText = data.candidates[0].content.parts[0].text;
          tokensUsed = data.usageMetadata?.totalTokenCount || null;
          break; // Success!
        }
      } else {
        // OpenAI / OpenRouter / NVIDIA NIM / Anthropic via OpenRouter etc
        // --- Smart Routing (Ensemble de Modelos) ---
        if (provider === 'NVIDIA NIM') {
          // Quando o usuário seleciona NVIDIA NIM, forçamos o uso do melhor modelo (Ensemble automático)
          if (mediaBase64 && actualMime.startsWith('image/')) {
            finalModel = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';
            console.log(`[AI-EVALUATOR] NVIDIA Auto-Ensemble: Imagem detectada. Usando ${finalModel}.`);
            userMessageContent = [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${actualMime};base64,${mediaBase64}` } }
            ];
          } else if (mediaBase64 && actualMime.startsWith('audio/')) {
            console.log(`[AI-EVALUATOR] NVIDIA Auto-Ensemble: Áudio ignorado (não suportado na API de chat atual).`);
            finalModel = 'deepseek-ai/deepseek-v4-pro'; // Fallback para texto da transcrição (se houvesse) ou só texto
            userMessageContent = prompt;
          } else {
            finalModel = 'deepseek-ai/deepseek-v4-pro'; // Melhor modelo lógico para texto
            console.log(`[AI-EVALUATOR] NVIDIA Auto-Ensemble: Apenas texto detectado. Usando ${finalModel}.`);
            userMessageContent = prompt;
          }
        } else {
          // Outros provedores
          finalModel = aiSettings.model || 'gpt-4o';
          if (mediaBase64) {
            if (actualMime.startsWith('image/') || provider === 'Local AI Proxy (CLI Tunnel)') {
              // Para o Local AI Proxy, vamos injetar áudios e vídeos como data URIs também, 
              // para que o roteador local possa converter e enviar para a CLI do Gemini
              userMessageContent = [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${actualMime};base64,${mediaBase64}` } }
              ];
            } else {
              console.log(`[AI-EVALUATOR] Smart Routing: Mídia tipo ${actualMime} ignorada pois a API não suporta na chave image_url.`);
              userMessageContent = prompt;
            }
          } else {
            userMessageContent = prompt;
          }
        }
        
        let apiUrl = aiSettings.api_url || 'https://api.openai.com/v1/chat/completions';
        if (provider === 'OpenRouter') apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        if (provider === 'NVIDIA NIM') apiUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
        if (provider === 'Local AI Proxy (CLI Tunnel)') {
          const baseUrl = (aiSettings.api_url || '').replace(/\/+$/, '');
          apiUrl = baseUrl.endsWith('/v1/chat/completions') ? baseUrl : `${baseUrl}/v1/chat/completions`;
        }
        
        let modelsToTry = [finalModel];
        // Para o Local AI Proxy, usa o modelo escolhido pelo usuário — sem fallbacks
        if (provider === 'Local AI Proxy (CLI Tunnel)') {
          const proxyModel = aiSettings.model || 'gemini-2.5-flash';
          modelsToTry = [proxyModel];
          finalModel = proxyModel;
        } else if (provider === 'NVIDIA NIM') {
          if (finalModel === 'deepseek-ai/deepseek-v4-pro') {
            modelsToTry = ['deepseek-ai/deepseek-v4-pro', 'meta/llama-3.1-405b-instruct', 'meta/llama-3.3-70b-instruct'];
          } else if (finalModel === 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning') {
            modelsToTry = ['nvidia/nemotron-3-nano-omni-30b-a3b-reasoning', 'meta/llama-3.2-90b-vision-instruct'];
          }
        }
        
        for (let i = 0; i < modelsToTry.length; i++) {
          finalModel = modelsToTry[i];
          console.log(`[AI-EVALUATOR] Tentando modelo: ${finalModel} (Tentativa ${i+1}/${modelsToTry.length})`);
          
          let res;
          try {
            res = await fetchWithRetry(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider === 'Local AI Proxy (CLI Tunnel)' ? (Deno.env.get('CLIPROXY_KEY') || apiKey) : apiKey}`
              },
              body: JSON.stringify({
                model: finalModel,
                ...(provider !== 'NVIDIA NIM' ? { response_format: { type: "json_object" } } : {}),
                messages: [{ role: 'user', content: userMessageContent }]
              })
            });
          } catch (fetchErr: any) {
            if (provider === 'Local AI Proxy (CLI Tunnel)') {
              throw new Error(`Túnel Offline ou Inalcançável: Não foi possível conectar ao proxy local em ${apiUrl}. Certifique-se que o cloudflared tunnel está rodando no PC.`);
            }
            throw fetchErr;
          }
          
          if (!res.ok) {
            if (provider === 'Local AI Proxy (CLI Tunnel)' && (res.status === 502 || res.status === 530)) {
              throw new Error(`Túnel Offline (Cloudflare Error ${res.status}): O túnel está configurado mas o processo local não está respondendo.`);
            }

            const errorText = await res.text();
            let parsedError;
            try {
              parsedError = JSON.parse(errorText);
            } catch (_) {
              parsedError = null;
            }
            
            // Se houver qualquer erro (rate limit 429, modelo não encontrado 404, servidor 5xx) e ainda tivermos modelos de fallback...
            if (i < modelsToTry.length - 1) {
              console.log(`[AI-EVALUATOR] Fallback Acionado! ${finalModel} falhou (${res.status}). Indo para o próximo modelo.`);
              continue; // Vai para a próxima iteração do loop
            }
            
            const errMsg = parsedError?.error?.message || parsedError?.detail || `LLM API Error (${res.status}): ${errorText}`;
            throw new Error(errMsg);
          }
          
          const responseText = await res.text();
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (_) {
            // Se o proxy retornou 200 OK mas não é JSON, assumimos que ele retornou
            // o próprio texto bruto da IA direto no corpo da resposta (comportamento de alguns proxies simples)
            data = {
              choices: [{ message: { content: responseText } }]
            };
          }

          if (data.error) {
            if (i < modelsToTry.length - 1) {
              console.log(`[AI-EVALUATOR] Fallback Acionado (Erro no corpo)! ${finalModel} falhou. Indo para o próximo modelo.`);
              continue;
            }
            throw new Error(data.error.message || JSON.stringify(data.error));
          }
          
          llmOutputText = data.choices[0].message.content;
          tokensUsed = data.usage?.total_tokens || null;
          break; // Sucesso absoluto! Sai do loop.
        }
      }

      const latencyMs = Math.round(performance.now() - startTime);
      
      const loggedModel = aiSettings.model || finalModel;
      
      console.log(`[AI-EVALUATOR] Log de sucesso: Provider=${provider}, Model=${loggedModel} (Real: ${finalModel}), Latency=${latencyMs}ms, Tokens=${tokensUsed}`);
      const { error: logSuccessErr } = await supabaseClient.from('llm_usage_logs').insert({
        provider,
        model: loggedModel,
        status: 'success',
        latency_ms: latencyMs,
        tokens_used: tokensUsed,
        error_message: llmOutputText // Hack: save raw JSON output in error_message column so telemetry can display it
      });
      if (logSuccessErr) console.error('[AI-EVALUATOR] Failed to insert success log:', logSuccessErr);

      // Atualiza task na fila como sucesso
      await updateTask({
        status: 'success',
        provider,
        model: loggedModel,
        latency_ms: latencyMs,
        tokens_used: tokensUsed,
        completed_at: new Date().toISOString()
      });

    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      const loggedModel = aiSettings.model || finalModel;
      console.error(`[AI-EVALUATOR] Log de erro: Provider=${provider}, Model=${loggedModel} (Real: ${finalModel}), Latency=${latencyMs}ms, Error=${err.message}`);
      
      const { error: logErrErr } = await supabaseClient.from('llm_usage_logs').insert({
        provider,
        model: loggedModel,
        status: 'error',
        error_message: err.message || JSON.stringify(err),
        latency_ms: latencyMs,
        tokens_used: null
      });
      if (logErrErr) console.error('[AI-EVALUATOR] Failed to insert error log:', logErrErr);

      // Atualiza task na fila como erro
      await updateTask({
        status: 'error',
        provider,
        model: loggedModel,
        latency_ms: latencyMs,
        error_message: err.message || JSON.stringify(err),
        retry_count: payload.task_id ? retryCount + 1 : 0,
        completed_at: new Date().toISOString()
      });

      throw err;
    }

    console.log("=== LLM OUTPUT ===");
    console.log(llmOutputText);

    let parsedData: any;
    try {
      parsedData = extractJSON(llmOutputText);
    } catch (err) {
      throw err;
    }

    // ─── TRAVA ANTIRREGRESSÃO DO FUNIL ──────────────────────────────────────────
    const currentStage = leadData?.funnel_stage || 'lead_new';
    let suggestedStage = parsedData.funnel_stage;
    
    if (suggestedStage) {
      const stageRank: Record<string, number> = {
        'lead_new': 1,
        'quote': 2,
        'negotiation': 3,
        'closed_lost': 4,
        'closed_won': 4
      };

      const currentRank = stageRank[currentStage] || 1;
      const suggestedRank = stageRank[suggestedStage] || 0;

      // Se a IA sugerir uma etapa de rank INFERIOR à atual, negamos a regressão e forçamos a etapa atual
      if (suggestedRank < currentRank) {
        console.log(`[AI-EVALUATOR] ⚠️ Bloqueando Regressão de Funil: IA tentou mover de ${currentStage} (rank ${currentRank}) para ${suggestedStage} (rank ${suggestedRank}). Mantendo em ${currentStage}.`);
        suggestedStage = currentStage;
        parsedData.funnel_stage = currentStage; // Atualiza o JSON parseado para refletir a correção
      }
    }
    // ────────────────────────────────────────────────────────────────────────────

    // Mesclar checklists e lidar com preenchimento parcial
    const existingChecklist = currentChecklist || {};
    const newMessagesMap = leadData?.audit_checklist_messages || {};
    
    const mergedChecklist = { ...existingChecklist };
    if (parsedData.audit_checklist) {
      for (const key of Object.keys(parsedData.audit_checklist)) {
        const val = parsedData.audit_checklist[key];
        if (val === true || val === "true") {
          // Bloqueio de Segurança: contato só pode marcar o 2e
          if (sender_type === 'contact' && key !== '2e') continue;
          
          mergedChecklist[key] = true;
          if (!existingChecklist[key]) {
            // Este item do checklist ficou VERDE por conta desta mensagem!
            newMessagesMap[key] = message_id;
          }
        }
      }
    }

    let newFunnelStage = parsedData.funnel_stage || currentStage;

    // 5.2 Calcular o Score Determinístico (Inteligente com Cutoff)
    const auditStepsConfig = [
      { id: 'step1', weight: 40, items: ['1a', '1b', '2d', '2b'] },
      { id: 'step2', weight: 30, items: ['2a', '2c', '2e'] },
      { id: 'step3', weight: 20, items: ['3a', '3b', '3c'] },
      { id: 'step4', weight: 10, items: ['4a', '4b'] },
    ];
    
    let calculatedScore: number | null = null;
    
    // Calcula o score somente se a etapa for final e a IA sugeriu o score
    if (newFunnelStage === 'closed_won' || newFunnelStage === 'closed_lost') {
      if (parsedData.score !== null && parsedData.score !== undefined) {
        calculatedScore = parsedData.score;
      } else {
        // Fallback para cálculo hardcoded se a IA esqueceu
        if (newFunnelStage === 'closed_lost') {
          const ITEM_SEQUENCE = [
            '1a', '1b', '2d', '2b',
            '2a', '2c', '2e',
            '3a', '3b', '3c',
            '4a', '4b'
          ];
          let lastCheckedIndex = -1;
          for (let i = ITEM_SEQUENCE.length - 1; i >= 0; i--) {
            if (mergedChecklist[ITEM_SEQUENCE[i]]) {
              lastCheckedIndex = i;
              break;
            }
          }
          if (lastCheckedIndex !== -1) {
            const universe = ITEM_SEQUENCE.slice(0, lastCheckedIndex + 1);
            const checkedCount = universe.filter(id => mergedChecklist[id]).length;
            calculatedScore = Math.round((checkedCount / universe.length) * 100);
          } else {
            calculatedScore = 0;
          }
        } else {
          let scoreAcc = 0;
          auditStepsConfig.forEach(step => {
            const done = step.items.filter(id => mergedChecklist[id]).length;
            scoreAcc += (done / step.items.length) * step.weight;
          });
          calculatedScore = Math.round(scoreAcc);
        }
      }
    }

    // UPDATE DO LEAD
    const updatePayload: any = {
      audit_checklist: mergedChecklist,
      score: calculatedScore || leadData?.score || 0,
      funnel_stage: newFunnelStage,
      audit_checklist_messages: newMessagesMap,
      customer_vehicle: parsedData.customer_vehicle || leadData?.customer_vehicle,
      ticket_value: parsedData.ticket_value || leadData?.ticket_value,
      audit_reasons: { ...(leadData?.audit_reasons || {}), ...(parsedData.audit_justifications || {}) }
    };

    console.log("[AI-EVALUATOR] Resultado final da LLM parseado:", JSON.stringify(parsedData));
    console.log("[AI-EVALUATOR] Salvando no banco de dados (leads). Payload:", JSON.stringify(updatePayload));

    const { error: updateError } = await supabaseClient.from('leads').update(updatePayload).eq('id', lead_id);
    if (updateError) {
      console.error("[AI-EVALUATOR] ERRO CRÍTICO no banco de dados [leads]:", updateError);
      throw new Error("Failed to update lead: " + updateError.message);
    }
    console.log("[AI-EVALUATOR] Update na tabela 'leads' com sucesso!");

    // 6. Atualiza a Memoization (Lead Memories)
    await supabaseClient.from('lead_memories').upsert({
      lead_id: lead_id,
      compressed_history: parsedData.new_compressed_history,
      last_processed_message_id: message_id
    });

    // 7. Salvar o AI Insight e marcar a mensagem (ou mensagens) como auditada
    const targetIds = (message_ids && Array.isArray(message_ids) && message_ids.length > 0) ? message_ids : (message_id ? [message_id] : []);
    
    if (targetIds.length > 0) {
      // Marcar TODAS como auditadas
      const { error: msgErr1 } = await supabaseClient
        .from('chat_messages')
        .update({ ai_audited: true })
        .in('id', targetIds); 
      
      // Aplicar o insight APENAS na última mensagem do lote (a que causou a decisão)
      if (parsedData.message_insight) {
        const lastMsgId = targetIds[targetIds.length - 1];
        await supabaseClient
          .from('chat_messages')
          .update({ ai_insight: parsedData.message_insight })
          .eq('id', lastMsgId);
      }
      if (msgErr1) console.error("[AI-EVALUATOR] Erro ao marcar mensagens como auditadas:", msgErr1);
    }
    console.log(`[AI-EVALUATOR] Lead ${lead_id} auditado com sucesso. Novo Score: ${updatePayload.score}`);

    // SALVAR ai_transcription NO CHAT_MESSAGES SE HOUVER MÍDIA ANALISADA
    if (parsedData.media_summaries && parsedData.media_summaries[message_id]) {
       const aiTranscription = parsedData.media_summaries[message_id];
       await supabaseClient.from('chat_messages').update({ ai_transcription: aiTranscription }).eq('id', message_id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      insight: parsedData.message_insight || parsedData.reasoning_step_by_step,
      score: updatePayload.score
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error: any) {
    console.error(error);
    // Tenta salvar o erro fatal na tabela de logs para o usuário poder ver no frontend
    try {
      const sClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await sClient.from('llm_usage_logs').insert({
        provider: 'System Error',
        model: 'edge-function',
        status: 'error',
        error_message: 'FATAL: ' + (error.message || JSON.stringify(error)),
        latency_ms: 0
      });
    } catch (e2) { 
      console.error("Erro ao salvar log fatal:", e2);
    }

    // Garante que a task na fila reflita o erro fatal (se ainda não foi marcada)
    await updateTask({
      status: 'error',
      error_message: 'FATAL: ' + (error.message || JSON.stringify(error)),
      completed_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
