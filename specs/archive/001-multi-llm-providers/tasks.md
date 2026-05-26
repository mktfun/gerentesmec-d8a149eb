# Tasks: Multi-LLM Providers

## 1. Banco de Dados (Supabase)
- [x] Criar arquivo de migração `supabase/migrations/20260526XXXXXX_multi_llm_fields.sql`.
- [x] Adicionar os campos `gcp_credentials` (jsonb), `gcp_project_id` (text), `gcp_region` (text) na tabela `ai_settings`.
- [x] Atualizar os tipos gerados (se houver um script de codegen) ou forçar no frontend.

## 2. Frontend (React / Vite)
- [x] Modificar `src/pages/Config.tsx` para apresentar um grupo de Cards/Rádios para selecionar a IA (`openai`, `gemini_studio`, `nvidia_nim`, `vertex_ai`).
- [x] Implementar a lógica de exibição condicional de campos na UI (exibir "Chave JSON da Service Account", "ID do Projeto" e "Região" caso seja `vertex_ai`).
- [x] Ajustar as validações e a lógica de Save para mandar os novos campos para a tabela `ai_settings`.

## 3. Backend (Edge Function - AI Evaluator)
- [x] Na `supabase/functions/ai-autonomous-evaluator/index.ts`, adicionar import ou implementação de assinatura de JWT RS256 usando Web Crypto API.
- [x] Criar o fluxo de roteamento principal (ex: `if (provider === 'vertex_ai') { ... } else if (provider === 'nvidia_nim') { ... }`).
- [x] Implementar o fetch para NVIDIA NIM apontando para `https://integrate.api.nvidia.com/v1/chat/completions` (no padrão OpenAI).
- [x] Implementar o payload builder compatível com o formato Vertex AI (que é o mesmo payload do Gemini mas embalado em um JSON ligeiramente diferente, ou idêntico se usar as bibliotecas certas de `generativelanguage` vs `aiplatform`). Na Vertex, usa-se o endpoint Rest.

## 4. Validação
- [x] Testar a Edge Function configurando o NVIDIA NIM e verificar se o LLM responde.
- [x] Testar o Google Vertex AI assinando o payload de teste.
