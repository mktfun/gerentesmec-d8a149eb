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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { message_content, lead_id, message_id, media_url, media_type, sender_type } = payload;

    if (!lead_id || !message_content) {
      return new Response(JSON.stringify({ error: 'Missing lead_id or message_content' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
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
      await updateTask({ status: 'ignored', completed_at: new Date().toISOString() });
      return new Response(JSON.stringify({ status: 'ignored_by_deterministic_filter' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Obter AiSettings
    const { data: dbAiSettings } = await supabaseClient.from('ai_settings').select('*').single();
    aiSettings = dbAiSettings;
    if (!aiSettings || !aiSettings.features?.auto_scoring) {
      await updateTask({ status: 'ignored', completed_at: new Date().toISOString(), error_message: 'auto_scoring desabilitado' });
      return new Response(JSON.stringify({ status: 'ai_automation_disabled' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
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

    // 2. Semantic Caching (Simulação da lógica RAG)
    // Em produção, você usaria OpenAI Embeddings ou Gemini Embeddings aqui:
    // const embedding = await generateEmbedding(text);
    // const { data: cacheHit } = await supabaseClient.rpc('match_semantic_cache', { query_embedding: embedding, match_threshold: 0.95 });
    
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
      
      HISTÓRICO DA NEGOCIAÇÃO ATÉ AGORA (Resumido):
      ${compressedHistory || "Nenhum histórico prévio."}
      
      ${sender_type === 'contact' 
        ? `⚠️ ATENÇÃO: Esta mensagem foi enviada pelo CLIENTE (contact), NÃO pelo gerente.
          REGRA DE OURO: Você NÃO DEVE pontuar NENHUM item de auditoria (1a a 4b). 
          Todos os itens do checklist no JSON de saída DEVEM manter o valor atual do histórico (como true ou false). Nunca altere um item de false para true baseado em ação do cliente.
          Você pode APENAS atualizar funnel_stage, customer_vehicle, ticket_value e new_compressed_history.` 
        : `✅ Esta mensagem foi enviada pelo GERENTE. Avalie todos os critérios de auditoria (1a a 4b) normalmente baseando-se nesta ação do gerente.`}
      
      NOVA MENSAGEM:
      "${text}"
      
      Você é um auditor de qualidade de vendas mecânicas automotivas.
      Analise a conversa e preencha os itens da auditoria. Se a informação já foi passada antes (segundo o resumo), mantenha como true.
      
      IMPORTANTE:
      1. Para "ticket_value", NUNCA invente ou extraia valores de chaves PIX, CNPJ, números de telefone ou links de pagamento. Só preencha se o gerente falar EXPLICITAMENTE o valor total do orçamento (ex: "ficou 1650,00", "total de 2700"). Se ele enviou apenas um link de pagamento e não falou o valor, deixe como null.
      2. Considere a tag "[ANEXO ENVIADO: video]" e "[ANEXO ENVIADO: image]" como evidência cabal de envio de mídia.
      
      CRITÉRIOS RÍGIDOS PARA MUDANÇA DE ETAPA (funnel_stage) - INTERPRETE O CONTEXTO COM EXTREMO RIGOR:
      - 'closed_won' (Ganho): USE APENAS SE o cliente pagou OU se ele deu uma confirmação EXPLÍCITA INEQUÍVOCA de que aprovou o serviço (ex: "Pode fazer", "Aprovado") APÓS o gerente já ter enviado o link do orçamento/checklist. Um "sim" antes de receber o orçamento NÃO aprova o serviço.
      - 'closed_lost' (Perdido): USE APENAS SE o cliente disse explicitamente que não vai fazer.
      - 'quote' (Orçamento Enviado): O gerente CRAVOU O PREÇO ou enviou o PDF/link do orçamento e checklist, e agora está aguardando aprovação. Use esta etapa assim que os valores forem enviados.
      - 'negotiation' (Em Atendimento): O gerente respondeu ao cliente e INICIOU o atendimento. Eles estão conversando, diagnosticando ou agendando, mas o orçamento final/preço AINDA NÃO FOI ENVIADO. 
      - 'lead_new' (Novo Lead): O cliente mandou a 1ª mensagem e o gerente AINDA NÃO RESPONDEU. SE O GERENTE ENVIOU MENSAGEM AGORA, É PROIBIDO MANTER EM 'lead_new'. Mude IMEDIATAMENTE para 'negotiation' ou 'quote'.

      [EXEMPLO DE ATENDIMENTO 100% - LOJA CARIJÓS (PADRÃO OURO)]
      Gerente: "Bom dia Sr. João! Segue o link do nosso checklist detalhado com as fotos do vazamento e o orçamento final: [LINK]. Aproveito para recomendar a troca preventiva da correia, enviei um vídeo rápido de 40 seg mostrando o desgaste acima."
      Cliente: "Assustador! Pode aprovar tudo."
      Gerente: "Maravilha. Serviço finalizado. Muito obrigado pela confiança! Pode nos deixar uma avaliação no Google? [LINK]"
      [FIM DO EXEMPLO]

      INSTRUÇÕES CRÍTICAS DE AVALIAÇÃO DO CHECKLIST (Seja Rigoroso - APLICÁVEL APENAS A MENSAGENS DO GERENTE):
      1. AVALIAÇÃO FINAL PARA 1a e 1b: Os dois primeiros itens (1a e 1b) representam a qualidade contínua da conversa. Você SÓ PODE avaliá-los e marcá-los como true NO MOMENTO EM QUE FINALIZAR O ATENDIMENTO (quando o funnel_stage for para 'closed_won' ou 'closed_lost'). Durante o atendimento (em negotiation/quote), MANTENHA-OS COMO false. No final, avalie se o gerente manteve a cordialidade/investigação a conversa inteira e dê os pontos.
      2. Foco na Intenção Real: Os gerentes usam linguagem informal. Se a INTENÇÃO da mensagem for explicar um defeito, marque que ele justificou.
      3. Orçamento (2a): Só marque true se o gerente de fato passar o valor total ou enviar um PDF/link claro do orçamento/checklist.
      4. Upsell (3a): Se o gerente oferecer qualquer serviço ou peça adicional além do pedido, marque como true.
      5. Avaliação Google (4b): Só marque true se o gerente pedir de forma EXPLÍCITA para o cliente avaliar a oficina no Google.
      6. AVALIAÇÃO MULTIMODAL DE VÍDEO/ÁUDIO: Se houver anexo, VOCÊ DEVE TRANSCRVER E ANALISAR O CONTEÚDO. Um vídeo curto (< 2 min) não significa automaticamente que é ruim, mas você deve ser rígido: ele explicou TUDO certinho? Explicou o problema e justificou POR QUE o cliente tem que pagar aquilo? Se a explicação for rasa, silenciosa ou insuficiente, PONTUE ZERO (false) nas etapas 2c e 3c de explicação, não dê a nota máxima!
      7. AVALIAÇÃO DE LINKS: Se houver um conteúdo raspado dos links abaixo, ANALISE O TEXTO. Se o gerente enviou um link de checklist/orçamento, mas o conteúdo dele é pobre, não possui justificativa descrita ou as fotos necessárias não parecem estar detalhadas, VOCÊ DEVE ZERAR os itens correspondentes (como o 2d) e adicionar ao insight "Orçamento/Checklist sem descrições técnicas no link".
      8. PROVA DE TRANSCRIÇÃO: No campo "closing_summary", você DEVE incluir um parágrafo começando com "[ANÁLISE DE MÍDIA]:" descrevendo exatamente o que você ouviu e viu no vídeo/áudio ou no CONTEÚDO DO LINK para provar que você o avaliou e justificar sua nota.
      9. INSTRUÇÕES DE INSIGHT (MENSAGEM INLINE):
         No JSON de saída, você deve preencher o campo "message_insight" apenas quando tomar uma decisão drástica ou houver uma mudança visível no fluxo (ex: alterar funnel_stage, zerar uma nota, validar um anexo).
         Exemplo 1: "Movi para Em Negociação pois o vídeo do orçamento foi enviado."
         Exemplo 2: "Zerei o item 2d pois o link do checklist não possui fotos."
         REGRA DE OURO: Se for apenas uma troca de mensagens comum (ex: bom dia, tirando dúvida simples, enviando áudio sem alterar score), você DEVE retornar o valor primitivo \`null\` (sem aspas) no JSON. NÃO invente insights se nada mudou. Fale de forma técnica e minimalista.
      
      [SISTEMA DE BLINDAGEM DE MEMÓRIA (MANDATÓRIO)]
      Sempre que você receber na variável \`scrapedContent\` o conteúdo lido de um link (Checklist, Orçamento em PDF, Sistema Web, etc):
      Você É OBRIGADO a extrair as informações cruciais (quais peças foram sugeridas, defeitos listados, preço total ou unitário) e SALVÁ-LAS em texto corrido dentro do campo \`new_compressed_history\`.
      Se você apenas avaliar e NÃO GUARDAR na memória comprimida o conteúdo do link, a IA sofrerá de amnésia no próximo turno.
      Exemplo do que adicionar na memória: "O link do orçamento contém: Pastilha freio (200), Discos (150). Total 350. Aguardando cliente."
      ${scrapedContent}
      
      Retorne APENAS um JSON válido com a seguinte estrutura obrigatória:
      {
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
        "audit_reasons": {
           // (Dicionário Opcional) Se você marcou algum item acima como 'false', forneça aqui a justificativa curta. Ex: "2c": "O gerente não explicou o defeito em detalhes."
        },
        "new_compressed_history": (novo histórico resumido somando a mensagem atual),
        "closing_summary": (Resumo descritivo narrando a evolução e histórico geral),
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
        const gcpProject = aiSettings.gcp_project_id;
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
        const vertexUrl = `https://${gcpRegion}-aiplatform.googleapis.com/v1/projects/${gcpProject}/locations/${gcpRegion}/publishers/google/models/${finalModel}:generateContent`;
        
        const res = await fetch(vertexUrl, {
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
        
      } else if (provider === 'Google' || provider === 'Gemini Studio' || (apiKey && !apiKey.startsWith("sk-") && !apiKey.startsWith("nvapi-") && !provider.includes('OpenRouter') && !provider.includes('Anthropic'))) {
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
        // Handle Auto-Routing string explicitly and build fallback loop to bypass rate limits
        if (finalModel === 'Gemini Free-Tier Ensemble (Auto-Routing)' || finalModel.toLowerCase().includes('ensemble')) {
          if (mediaBase64 && actualMime.startsWith('image/')) {
            modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
          } else {
            modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemma-4-31b-it', 'gemini-1.5-pro', 'gemini-1.5-flash'];
          }
        } else {
          // Adiciona fallbacks garantidos para qualquer modelo Google para contornar Rate Limit
          if (finalModel === 'gemini-2.5-flash') modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemma-4-31b-it'];
          else if (finalModel === 'gemini-1.5-flash') modelsToTry = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemma-4-31b-it'];
          else if (finalModel === 'gemma-4-31b-it') modelsToTry = ['gemma-4-31b-it', 'gemma-4-26b-it', 'gemini-2.5-flash'];
          else modelsToTry = [finalModel, 'gemma-4-31b-it', 'gemini-1.5-flash'];
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

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${apiKey}`, {
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
            if (actualMime.startsWith('image/')) {
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
        if (provider === 'NVIDIA NIM') {
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
            res = await fetch(apiUrl, {
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
        input_text: typeof userMessageContent === 'string' ? userMessageContent : JSON.stringify(userMessageContent),
        output_text: llmOutputText
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
        tokens_used: null,
        input_text: typeof userMessageContent === 'string' ? userMessageContent : JSON.stringify(userMessageContent),
        output_text: null
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

    // Limpa possível formatação markdown caso o Gemma tenha cuspido ```json
    if (llmOutputText.startsWith('```')) {
      llmOutputText = llmOutputText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    // Tenta extrair JSON de dentro do texto (proxy local pode retornar texto + JSON misturado)
    let mockOutput: any;
    try {
      mockOutput = JSON.parse(llmOutputText);
    } catch (_parseErr) {
      // Tenta encontrar um bloco JSON {...} dentro do texto
      const jsonMatch = llmOutputText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          mockOutput = JSON.parse(jsonMatch[0]);
          console.log('[AI-EVALUATOR] JSON extraído de dentro do texto bruto do proxy.');
        } catch (_innerErr) {
          throw new Error(`Resposta da IA não é JSON válido. Início: "${llmOutputText.substring(0, 120)}..."`);
        }
      } else {
        throw new Error(`Resposta da IA não contém JSON. Início: "${llmOutputText.substring(0, 120)}..."`);
      }
    }

    // 5. Rastreabilidade de Auditoria: descobrir quais checks viraram true agora
    const { data: leadData } = await supabaseClient.from('leads').select('ticket_value, customer_vehicle, audit_checklist, audit_checklist_messages').eq('id', lead_id).single();
    const currentChecklist = leadData?.audit_checklist || {};
    const newMessagesMap = leadData?.audit_checklist_messages || {};

    const mergedChecklist = { ...currentChecklist };
    if (mockOutput.audit_checklist && sender_type !== 'contact') {
      for (const key of Object.keys(mockOutput.audit_checklist)) {
        const val = mockOutput.audit_checklist[key];
        if (val === true || val === "true") {
          mergedChecklist[key] = true;
          if (!currentChecklist[key]) {
            // Este item do checklist ficou VERDE por conta desta mensagem!
            newMessagesMap[key] = message_id;
          }
        }
      }
    }

    // 5.2 Calcular o Score Determinístico (Idêntico ao AuditPanel)
    const auditStepsConfig = [
      { id: 'step1', weight: 40, items: ['1a', '1b', '2d', '2b'] },
      { id: 'step2', weight: 30, items: ['2a', '2c', '2e'] },
      { id: 'step3', weight: 20, items: ['3a', '3b', '3c'] },
      { id: 'step4', weight: 10, items: ['4a', '4b'] },
    ];
    let calculatedScore = 0;
    auditStepsConfig.forEach(step => {
      const done = step.items.filter(id => mergedChecklist[id]).length;
      calculatedScore += (done / step.items.length) * step.weight;
    });
    calculatedScore = Math.round(calculatedScore);

    const updatePayload: any = {
      score: calculatedScore,
      closing_summary: mockOutput.closing_summary,
      audit_checklist: mergedChecklist,
      audit_checklist_messages: newMessagesMap
    };
    
    // Atualiza ticket apenas se a IA não retornou null
    if (mockOutput.ticket_value !== null && mockOutput.ticket_value !== undefined) {
      updatePayload.ticket_value = mockOutput.ticket_value;
    }
    
    if (mockOutput.customer_vehicle) {
      updatePayload.customer_vehicle = mockOutput.customer_vehicle;
    }

    if (mockOutput.funnel_stage) {
      updatePayload.funnel_stage = mockOutput.funnel_stage;
    }
    
    if (mockOutput.stage_change_reason) {
      updatePayload.funnel_stage_reason = mockOutput.stage_change_reason;
    }
    
    if (mockOutput.audit_reasons && Object.keys(mockOutput.audit_reasons).length > 0) {
      updatePayload.audit_reasons = mockOutput.audit_reasons;
    }
    
    console.log("[AI-EVALUATOR] Resultado final da LLM parseado:", JSON.stringify(mockOutput));
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
      compressed_history: mockOutput.new_compressed_history,
      last_processed_message_id: message_id
    });

    // 7. Salvar o AI Insight inline na mensagem, se existir
    if (mockOutput.message_insight && message_id) {
      const { error: msgErr } = await supabaseClient
        .from('chat_messages')
        .update({ ai_insight: mockOutput.message_insight })
        .eq('chatwoot_message_id', message_id);
      
      if (msgErr) console.error("[AI-EVALUATOR] Erro ao salvar message_insight:", msgErr);
    }

    return new Response(JSON.stringify({ status: 'success', evaluated: updatePayload }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
        latency_ms: 0,
        input_text: null,
        output_text: null
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
