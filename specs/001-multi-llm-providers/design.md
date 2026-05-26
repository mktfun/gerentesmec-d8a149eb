# Design: Multi-LLM Providers (NVIDIA NIM & Vertex AI)

## UX / UI Design (Stitch MCP)
Baseado nos requisitos 2026 (Liquid Glass, Maximalismo Funcional e WCAG 2.2):
- **O Componente de Seleção de Provedor:** Não será um Select nativo sem graça. Utilizaremos um grupo de **Cards Interativos (Radio Group visual)** onde o usuário clica no logo/nome do Provedor (ex: logo da NVIDIA verde neon, logo do Google Cloud colorido) para selecioná-lo.
- **Micro-interações:** Ao selecionar Vertex AI, o campo de API Key tradicional deve sumir com uma animação suave (`AnimatePresence` do Framer Motion) e revelar a área de upload/colagem da GCP Service Account.
- **Acessibilidade:** Garantiremos `aria-labels` claros para o JSON da conta de serviço e validação de JSON no front-end para evitar salvar strings inválidas.
- **Segurança Visual:** Campos de API Keys manterão suporte a `type="password"` com botão de "reveal" (olho). A exibição do JSON mascarará chaves privadas (`private_key`).

## Modelagem de Dados (Supabase MCP)
Alterações na tabela `ai_settings` no PostgreSQL:
```sql
ALTER TABLE public.ai_settings 
-- Se a versão do Postgres permitir ENUM seria o ideal, mas para MVP manteremos TEXT
-- ADD COLUMN provider text default 'openai', -- (já existe)
ADD COLUMN gcp_credentials jsonb DEFAULT NULL,
ADD COLUMN gcp_project_id text DEFAULT NULL,
ADD COLUMN gcp_region text DEFAULT 'us-central1';
```
*(Nota: criaremos uma migration específica para isso `20260526XXXXXX_add_multi_llm_fields.sql`).*

## Arquitetura Edge Function (Backend)
- A Edge Function `ai-autonomous-evaluator` não usa `npm` no package.json, ela importa bibliotecas via URL (`https://esm.sh` ou similar do Deno).
- Para a autenticação GCP, não queremos adicionar pacotes pesados como o `google-auth-library` que pode quebrar no edge. Ao invés disso, implementaremos a geração de um **JWT Bearer Token RS256** utilizando a Web Crypto API (`crypto.subtle`) disponível no Deno, assinando o header com a `private_key` presente no JSON da Service Account. 
- O token será enviado no Header: `Authorization: Bearer <signed_jwt>`.
- A URL final de requisição do Vertex AI será montada dinamicamente:
  `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`
- Para a NVIDIA NIM, o bloco base será o mesmo do OpenAI. Apenas garantimos que o `api_url` base no banco pode ser sobreescrito ou que forçamos `https://integrate.api.nvidia.com/v1` quando `provider = 'nvidia_nim'`.
