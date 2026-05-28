# Tasks: Audit Reasoning and Scraping (011)

- [ ] **1. Banco de Dados**
  - Executar comando SQL para adicionar `funnel_stage_reason` (text) e `audit_reasons` (jsonb) na tabela `leads`.

- [ ] **2. Atualizar Tipos no Frontend**
  - Atualizar `src/integrations/supabase/types.ts` para refletir as novas colunas da tabela `leads`.

- [ ] **3. Atualizar Edge Function (`ai-autonomous-evaluator`)**
  - Alterar regex de URL para capturar links sem protocolo (ex: `oficinadomario.com.br`).
  - Tratamento da URL capturada: fazer `.startsWith('http') ? url : 'https://' + url` antes de passar pro Jina.
  - Atualizar a string JSON no `system_prompt` para adicionar as propriedades `stage_change_reason` e `audit_reasons`.
  - Atualizar instruções do `system_prompt` para forçar que a IA justifique detalhadamente (curto e óbvio com exemplos) todas as falhas ou pontuações e transições de estágio.
  - No código, pegar `mockOutput.stage_change_reason` e `mockOutput.audit_reasons` e mapeá-los para o `updatePayload`.

- [ ] **4. Atualizar UI (`AuditPanel` e/ou `ManagerAuditInspector`)**
  - Se um lead for Perda/Ganho e existir `funnel_stage_reason`, exibir um banner superior descrevendo a justificativa da IA.
  - Na lista de checkboxes, renderizar um texto de feedback em vermelho abaixo de itens não pontuados (onde `audit_reasons[item.id]` for fornecido).

- [ ] **5. Validação**
  - Fazer deploy da Edge Function atualizada (`npx supabase functions deploy`).
  - Confirmar se o build compila sem erros TypeScript.
