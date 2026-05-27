# Tasks de Implementação (Feature 002)

- [ ] Abrir `supabase/functions/ai-autonomous-evaluator/index.ts`.
- [ ] Localizar bloco `// EXTRAÇÃO E RASPAGEM DE LINKS` (Aproximadamente linha 81).
- [ ] Envolver a lógica num condicional `if (sender_type !== 'contact') { ... }` para barrar a raspagem em links enviados pelo cliente.
- [ ] Alterar o `AbortSignal.timeout(5000)` para `AbortSignal.timeout(12000)`.
- [ ] Revisar log de console para clareza (ex: `[AI-EVALUATOR] Extraindo link enviado pelo gerente...`).
- [ ] Deploy Edge Function via Supabase CLI.
