# Tarefas de Implementação

- [ ] 1. Modificar lógica de URL extraction no `ai-autonomous-evaluator/index.ts`.
- [ ] 2. Substituir `fetch(url)` por `fetch("https://r.jina.ai/" + url)` para garantir Markdown formatado via Reader API.
- [ ] 3. Ajustar prompt de avaliação para adicionar um bloco **MEMÓRIA** que torne a inclusão dos dados raspados obrigatória no `new_compressed_history`.
- [ ] 4. Re-fazer o deploy da Edge Function para o Supabase.
