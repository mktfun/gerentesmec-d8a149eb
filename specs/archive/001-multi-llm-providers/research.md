# Research: Multi-LLM Providers (NVIDIA NIM & Vertex AI)

## Contexto
O usuário atingiu o limite de requisições de APIs pagas em outros projetos e deseja incorporar suporte para os tiers gratuitos e enterprise que ele possui:
1. **NVIDIA NIM (Free Tier):** Oferece endpoints compatíveis com a API da OpenAI (`https://integrate.api.nvidia.com/v1`). Requer apenas alterar a `api_url` base e passar a API Key da NVIDIA (que começa com `nvapi-`).
2. **Google Vertex AI (Service Account):** Para uso enterprise/gratuito via GCP. Diferente do Gemini Studio (que usa uma chave simples no cabeçalho ou URL), a API Vertex requer autenticação OAuth 2.0 (GCP Service Account JSON) e uma URL baseada na região e no ID do projeto.

## Descobertas no Código
1. **Tabela `ai_settings`:**
   - Atualmente tem os campos: `provider`, `model`, `api_key`, `api_url` (não explícito no init, mas usado no código), `features`, `system_prompt`, `evaluation_criteria`, `embedding_provider`.
   - Vamos precisar adicionar uma coluna `gcp_service_account` (tipo `jsonb`) para armazenar as credenciais da Vertex AI.
2. **UI (`Config.tsx`):**
   - O painel atual provavelmente possui um dropdown para Provider ("openai" ou "gemini") e campos para "API Key" e "Model".
   - Precisaremos estender isso para: "NVIDIA NIM" e "Google Vertex AI".
   - Ao selecionar Vertex AI, a UI deve esconder o campo "API Key" tradicional e exibir um `<textarea>` para colar o JSON da Service Account (ou ler de arquivo), além de um campo para `gcp_region` (ex: `us-central1`) se não estiver incluso no JSON, e o ID do projeto GCP.
3. **Edge Function (`ai-autonomous-evaluator`):**
   - Atualmente possui a lógica dividida em:
     - `if (apiKey.startsWith("sk-"))`: assume OpenAI/OpenRouter e chama via fetch padrão.
     - `else`: assume Gemini via `generativelanguage.googleapis.com` (AI Studio).
   - NVIDIA NIM vai se encaixar no bloco do OpenAI, pois a API é compatível. Precisaremos ajustar a lógica para verificar `provider === 'nvidia'` ou simplesmente garantir que o `api_url` seja passado corretamente (`https://integrate.api.nvidia.com/v1/chat/completions`) e a chave seja lida.
   - Vertex AI exigirá a biblioteca `google-auth-library` ou JWT manual em Edge Functions Deno para gerar o token Bearer a partir do JSON da Service Account, e então fazer fetch para a URL da Vertex AI (`https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`).

## Estratégia de Adaptação
- **Banco de Dados (Supabase Migration):** Adicionar campos `gcp_credentials` (jsonb), `gcp_project_id` (text), `gcp_region` (text) em `ai_settings`.
- **Backend (Deno Edge Function):**
  - Refatorar a estrutura do router de chamadas.
  - Adicionar suporte a geração de JWT do GCP (via Service Account RS256).
- **Frontend (`Config.tsx`):**
  - Novo Select para o Provider (`openai`, `gemini_studio`, `nvidia_nim`, `vertex_ai`).
  - Inputs dinâmicos baseados no provedor selecionado.
