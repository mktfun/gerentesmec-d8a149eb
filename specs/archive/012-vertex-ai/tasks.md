# Tasks: Vertex AI Config Streamlining (012-vertex-ai)

- [x] 1. Alterar a constante `availableModels` no `AiRouterConfig.tsx` para incluir os modelos corporativos de última geração sob o rótulo `Google Vertex AI` (incluindo `gemini-3.5-flash`, `gemini-2.0-flash-exp`, etc).
- [x] 2. Modificar o componente `AiRouterConfig.tsx` para tratar a UI de `Google Vertex AI`:
  - [x] Ao invés de exibir "GCP Project ID", ocultá-lo da interface inicial.
  - [x] Envolver "GCP Region" num menu expansível (Advanced Options).
  - [x] Implementar análise silenciosa em `gcpCredentials`: ao colar o JSON da Service Account, tentar `JSON.parse()`. Se der sucesso e tiver `project_id`, atualizar a UI exibindo um painel "Apple Liquid Glass" dizendo "Projeto Reconhecido: `[project_id]`".
  - [x] Salvar `gcp_project_id` implicitamente usando o valor do JSON no payload do update para o banco.
- [x] 3. Ajustar `supabase/functions/ai-autonomous-evaluator/index.ts`.
  - [x] Adicionar fallback na extração: `const gcpProject = aiSettings.gcp_project_id || (gcpCreds && gcpCreds.project_id);`
  - [x] Testar/validar que não quebrou os caminhos de chamada existentes para Vertex.
- [x] 4. Atualizar o Supabase Edge Function e enviar as alterações para os repositórios Git.
