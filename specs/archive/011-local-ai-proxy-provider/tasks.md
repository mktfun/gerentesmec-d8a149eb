# Tasks: Local AI Proxy Provider

- [ ] Modificar `ai-autonomous-evaluator/index.ts`
  - Incluir suporte ao Provider `Local AI Proxy (CLI Tunnel)` na cláusula if/else do LLM Routing.
  - Implementar requisição via `fetch` para `aiSettings.api_url + '/v1/chat/completions'`.
  - Injetar o header `Authorization: Bearer <aiSettings.api_key>`.
  - Tratamento de erro 502/530 especificamente reportando "Túnel Offline ou Inalcançável".
  - Fazer o parse JSON do response `choices[0].message.content` usando o padrão nativo da API OpenAI.

- [ ] Modificar `src/pages/Configuracoes.tsx` (ou componente responsável pela tela de Inteligência Artificial)
  - Adicionar a option "Local AI Proxy (CLI Tunnel)" no dropdown de Provedor.
  - Habilitar campo de `API URL` caso esse provider seja escolhido.
  - Atualizar os disclaimers (dicas/textos) visuais explicando que o túnel (cloudflare/ngrok) precisa estar rodando no PC.
  - Adaptar a gravação no Supabase para garantir que a `api_url` digitada pelo usuário salve na tabela `ai_settings`.

- [ ] Verificação e Implantação
  - Compilar as Edge Functions localmente para checar lint/erros `supabase functions build`.
  - Executar os testes visuais e garantir que a nova opção no Frontend seja salva e resgatada corretamente no banco.
  - Certificar que outros Providers nativos (Google Vertex, OpenAI) não foram quebrados na Edge Function.
