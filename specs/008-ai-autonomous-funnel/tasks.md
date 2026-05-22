# Tasks: AI Autonomous Funnel

- [ ] Remover regra hardcoded do `chatwoot-webhook` (linha que força estágio `quote` se o cliente mandar mensagem).
- [ ] Criar a estrutura física do multi-agente: `supabase/functions/ai-auditor/skills/router.ts` e `funnel.ts`.
- [ ] Implementar `router.ts` usando API da OpenAI com System Prompt restrito para retornar JSON (Structured Outputs ou JSON Mode).
- [ ] Implementar `funnel.ts` para ler o output do Router e atualizar a tabela `leads` de acordo com a etapa detectada.
- [ ] Integrar `router.ts`, `funnel.ts` e `judge.ts` no fluxo principal (`index.ts` do `ai-auditor`), garantindo que rodam em paralelo ou na ordem correta sem gargalos de performance pesados.
- [ ] Testar simulando um payload de webhook do Chatwoot localmente passando pela intent de "desconto".
