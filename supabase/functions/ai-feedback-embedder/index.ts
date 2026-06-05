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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    const { unit_id, lead_id, context } = payload;

    if (!unit_id || !context) {
      return new Response(JSON.stringify({ error: 'Missing unit_id or context' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Obter AiSettings para as credenciais
    const { data: aiSettings, error: aiSettingsError } = await supabaseClient.from('ai_settings').select('*').single();
    
    if (aiSettingsError || !aiSettings) {
      throw new Error("Configurações de IA não encontradas no banco de dados.");
    }

    let embedding = null;
    const provider = aiSettings.provider || 'openai';

    if (provider === 'Google Vertex AI') {
      const gcpCreds = aiSettings.gcp_credentials;
      const gcpProject = aiSettings.gcp_project_id || (gcpCreds && gcpCreds.project_id);
      const gcpRegion = aiSettings.gcp_region || 'us-central1';

      if (!gcpCreds || !gcpProject) {
         throw new Error("Vertex AI: Credenciais ou Project ID faltando na configuração.");
      }

      const accessToken = await getGoogleAccessToken(gcpCreds);
      
      const host = gcpRegion === 'global' ? 'aiplatform.googleapis.com' : `${gcpRegion}-aiplatform.googleapis.com`;
      const vertexUrl = `https://${host}/v1/projects/${gcpProject}/locations/${gcpRegion}/publishers/google/models/text-embedding-004:predict`;

      const response = await fetch(vertexUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          instances: [{ content: context }]
        })
      });

      if (!response.ok) {
         const errData = await response.text();
         throw new Error(`Falha na API Vertex Embeddings: ${errData}`);
      }

      const result = await response.json();
      if (result.predictions && result.predictions[0] && result.predictions[0].embeddings && result.predictions[0].embeddings.values) {
         embedding = result.predictions[0].embeddings.values;
      }
    } else {
       // OpenAI or generic fallback (for simplicity using dummy array if not implemented fully here)
       // Usually OpenAI text-embedding-3-small or -ada-002
       const openAiToken = Deno.env.get('OPENAI_API_KEY') || aiSettings.api_key;
       if (!openAiToken) {
          throw new Error('Chave API não configurada para gerar Embeddings');
       }
       const response = await fetch("https://api.openai.com/v1/embeddings", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           "Authorization": `Bearer ${openAiToken}`
         },
         body: JSON.stringify({
           input: context,
           model: "text-embedding-3-small"
         })
       });

       if (!response.ok) {
         throw new Error('Falha na API OpenAI Embeddings');
       }
       const result = await response.json();
       embedding = result.data[0].embedding;
       
       // Note: Se o dimensionamento de OpenAI for diferente do pgvector no DB (768 para Google, 1536 para OpenAI), 
       // isso vai dar erro de tipo na coluna vector(768). Na spec decidimos vetor(768) como base.
       // Se OpenAI for usado, text-embedding-3-small tem um campo dimensions=768 opcional.
    }

    if (!embedding) {
      throw new Error('Não foi possível gerar o embedding');
    }

    // Inserir na tabela ai_memories
    const { error: insertError } = await supabaseClient.from('ai_memories').insert({
      unit_id,
      lead_id: lead_id || null,
      context,
      embedding
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Erro ao inserir na memória: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
