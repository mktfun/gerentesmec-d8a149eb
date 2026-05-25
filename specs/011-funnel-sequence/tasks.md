# Tarefas - Funnel Sequence

- [ ] **Passo 1 (UI - KanbanView):**
  - No arquivo `KanbanView.tsx`, reordenar a constante `COLUMNS` para: `lead_new`, `negotiation`, `quote`, `closed_won`, `closed_lost`.
  - Atualizar as labels: `negotiation` -> 'Em Atendimento' e `quote` -> 'Orçamento Enviado'.

- [ ] **Passo 2 (AI Prompt - Edge Function):**
  - No `ai-autonomous-evaluator/index.ts`, ajustar as instruções para a IA:
    - Explicar que `negotiation` (Em Atendimento) deve ser usado *sempre* que o gerente iniciar a conversa, responder algo, mas **antes** de enviar o preço ou orçamento final.
    - Explicar que `quote` (Orçamento Enviado) deve ser usado *assim que* o gerente cravou o preço ou enviou o PDF/Link e está aguardando a resposta.
  
- [ ] **Passo 3:** 
  - Fazer o Deploy da Edge Function atualizada.
