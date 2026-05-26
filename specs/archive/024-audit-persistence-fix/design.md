# Design: Audit Persistence Fix (024)

## Architecture
Para resolver o problema crônico de falhas silenciosas do PostgREST/Supabase-JS ao atualizar colunas JSONB recém-criadas, vamos encapsular a lógica de salvamento da auditoria em uma **Stored Procedure (RPC)** no PostgreSQL.

### Vantagens do RPC (`save_lead_audit`):
1. **Bypass de Tipagem no Client:** O cliente `supabase-js` não fará "strip" do objeto `audit_checklist` caso o arquivo local `types.ts` esteja desatualizado.
2. **Atomicidade:** A nota (score), as anotações e o checklist são salvos em uma única transação garantida pelo banco.
3. **À prova de Cache do PostgREST:** Chamadas RPC lidam diretamente com o banco, evitando o bloqueio de colunas ausentes no cache do PostgREST.

## Schema Changes
Criaremos uma migration contendo a function:

```sql
CREATE OR REPLACE FUNCTION public.save_lead_audit(
  p_lead_id uuid,
  p_score integer,
  p_closing_summary text,
  p_audit_checklist jsonb
) RETURNS void AS $$
BEGIN
  UPDATE public.leads
  SET 
    score = p_score,
    closing_summary = p_closing_summary,
    audit_checklist = p_audit_checklist
  WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Stitch UI & Frontend (AppDataContext)
No `AppDataContext.tsx`, substituiremos o `.update()` padrão na tabela `leads` (que estava falhando) por uma chamada direta ao `.rpc()`:

```typescript
await supabase.rpc('save_lead_audit', {
  p_lead_id: lead.id,
  p_score: rounded,
  p_closing_summary: notes,
  p_audit_checklist: checked
});
```
