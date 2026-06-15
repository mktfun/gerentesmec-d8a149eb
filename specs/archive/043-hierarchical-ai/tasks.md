# Tasks: IA Hierárquica e "Zero-Hallucination"

- [ ] Modificar o banco de dados via Supabase CLI
  - [ ] Criar migration para adicionar `ai_scratchpad` (text) na tabela `leads`.
  - [ ] Alterar o `ai_debounce_cron.sql` para apontar para a nova Edge Function `ai-funnel-tracker` em vez de `ai-autonomous-evaluator`.
  - [ ] Criar trigger na tabela `leads` para chamar o `ai-final-auditor` quando `funnel_stage` virar `closed_won` ou `closed_lost`.

- [ ] Edge Function: `ai-funnel-tracker`
  - [ ] Criar a Edge Function baseada na antiga `ai-autonomous-evaluator`.
  - [ ] Remover a dependência do RAG e das avaliações pesadas de checklist.
  - [ ] Implementar prompt focado estritamente em deduzir o funil e resumir a conversa (`ai_scratchpad`).
  - [ ] Implementar regra de ouro: funil só anda para a direita (não pode voltar).

- [ ] Edge Function: `ai-final-auditor`
  - [ ] Refatorar a antiga `ai-autonomous-evaluator` para ser acionada via trigger de fechamento.
  - [ ] Garantir que o prompt tenha acesso ao histórico total do chat, transcrições e ao `ai_scratchpad`.
  - [ ] Ajustar o prompt para ser "O Juiz Implacável" e não deduzir nada (visão zero-hallucination).
  - [ ] **Nova Regra de Evidência:** Ao preencher o JSON do checklist, a IA deve injetar uma propriedade `evidence` com a citação/transcrição exata da mensagem que embasou a marcação do item.
  - [ ] Implementar regra de escape: Se faltar contexto claro, atualizar `funnel_stage` para `needs_context` (Sem Contexto) em vez de chutar o score.

- [ ] Roteamento Dinâmico de Modelos
  - [ ] Atualizar a lógica de seleção de IA (Front e Back-end) para permitir a opção "Otimização Máxima".
  - [ ] Garantir que a Otimização Máxima escolha os modelos mais atuais de cada provedor em vez de versões hardcoded defasadas.

- [ ] CLI Agent Runner (Script Local)
  - [ ] Criar arquivo `scripts/ai-cli-runner.md` contendo a documentação completa, schemas e o System Prompt exato do Auditor.
  - [ ] Incluir comandos de curl/PostgREST no script para o Agy/Gemini CLI conseguir ler o banco e enviar os scores localmente, simulando 100% o Edge Function.

- [ ] Front-end (React)
  - [ ] Atualizar o enum/tipos do Kanban para aceitar a nova coluna `needs_context` (Sem Contexto).
  - [ ] Criar a UI da coluna "Sem Contexto" no `KanbanBoard.tsx`.
  - [ ] No painel de auditoria (`AuditPanel.tsx`), ocultar as notas numéricas se o lead ainda estiver no funil (`lead`, `contacted`, `proposal`, `negotiation`, `needs_context`).
  - [ ] Exibir mensagem: "A IA está acompanhando a conversa. O Checklist Final será gerado quando o lead for Fechado ou Perdido." (Ou pedir intervenção humana se `needs_context`).
  - [ ] Adicionar botão "Forçar Auditoria Imediata" para o gerente que quiser o resultado antes do fim.

- [ ] Remoção de Código Morto
  - [ ] Deletar a função antiga `ai-autonomous-evaluator` e atualizar documentações.
