# Tasks: 004-webhook-diag-and-ui-stealth

## 1. Webhook (Backend)
- [x] Implementar script ou usar Supabase CLI local com `--project-ref` e `--project-token` (ou variável equivalente) para efetuar o `deploy` das funções `chatwoot-webhook` e `ai-autonomous-evaluator` na nuvem do Supabase, garantindo que o código em TypeScript enviado para lá está atualizado com o parseamento de mídias (`mediaUrl`, `mediaType`).

## 2. Camuflagem (UI Frontend)
- [x] Atualizar o arquivo `src/components/Crm/AuditPanel.tsx`.
- [x] Alterar `Motivo do Score (IA)` para `Parecer da Auditoria`.
- [x] Remover o ícone `Sparkles` do feedback.
- [x] Alterar o esquema de cores de `indigo` (muito tech) para `amber` ou `zinc` sutil.
- [x] Remover a tag flutuante `✨ Gerenciado por IA` de cima do checklist. Opcionalmente deixá-la como apenas um cadeado informando que o checklist foi `Finalizado`.

## 3. Teste de Ponta a Ponta
- [x] Criar ou adaptar o script de simulação para forçar envios HTTP contra a Edge Function (`chatwoot-webhook`) no Supabase, garantindo que o webhook de fato enxerga os dados, os injeta na tabela de histórico, aciona a IA (ou processo) e que nada trava na interface, validando a ausência total de "UI do Robô" na tela.
