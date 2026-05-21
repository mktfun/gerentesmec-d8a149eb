# Tasks: Audit Persistence Fix (024)

- [ ] 1. **Migration do Banco de Dados**
  - Criar migration `20260521_rpc_save_audit.sql`.
  - Definir a function `public.save_lead_audit`.
  - Garantir que a function receba `p_lead_id`, `p_score`, `p_closing_summary` e `p_audit_checklist`.
  - Executar o UPDATE na tabela `leads` dentro da function.

- [ ] 2. **Refatorar Frontend**
  - No `AuditPanel.tsx`, em vez de chamar `updateLead(..., as any)`, criar uma função `saveAudit` no context.
  - No `AppDataContext.tsx`, criar a função `saveLeadAudit(id, score, summary, checklist)` que chama o `supabase.rpc('save_lead_audit', {...})`.
  - Adicionar logs de erro caso o RPC falhe.

- [ ] 3. **Validação**
  - Fornecer o script SQL gerado diretamente para o usuário colar no SQL Editor (já que ele não usa a CLI).
  - Comitar e enviar as mudanças para o GitHub.
