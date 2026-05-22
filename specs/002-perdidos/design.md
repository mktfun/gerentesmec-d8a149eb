# Design System & Modelagem

## Alterações na UI (Stitch MCP / React)
O arquivo alvo será o `src/components/Crm/KanbanView.tsx`.
No momento, a constante `COLUMNS` tem 4 objetos. Iremos adicionar um 5º objeto correspondente a "Perdido":

```typescript
const COLUMNS: { id: FunnelStage; label: string; color: string; dot: string }[] = [
  { id: 'lead_new',    label: 'Novo Lead',     color: 'text-indigo-600 dark:text-indigo-400',   dot: 'bg-indigo-500' },
  { id: 'quote',       label: 'Em Orçamento',  color: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500' },
  { id: 'negotiation', label: 'Em Negociação', color: 'text-orange-600 dark:text-orange-400',   dot: 'bg-orange-500' },
  { id: 'closed_won',  label: 'Ganho',         color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  { id: 'closed_lost', label: 'Perdido',       color: 'text-rose-600 dark:text-rose-400',       dot: 'bg-rose-500' },
];
```

Iremos ajustar o filtro `getColumnLeads`:
Removeremos o agrupamento:
```typescript
    // Antes
    if (stageId === 'closed_won') {
      colLeads = filtered.filter(l => l.funnel_stage === 'closed_won' || l.funnel_stage === 'closed_lost');
    }
    // Depois
    colLeads = filtered.filter(l => l.funnel_stage === stageId);
```

### Visual Guidelines (UX 2026)
- A cor da coluna "Perdido" usará os tokens da paleta `rose` (vermelho mais sofisticado e moderno), que já estão integrados nas variáveis Tailwind do projeto.
- Renomearemos a label da coluna `closed_won` de "Encerrado" para "Ganho" para fazer um contraponto exato semântico com "Perdido".

## Alterações de Database (Supabase MCP)
- O ENUM ou tipo `funnel_stage` no frontend já contempla `'closed_lost'` (definido em `AppDataContext.tsx`).
- O banco de dados PostgreSQL (tabela `leads`, coluna `funnel_stage`) já suporta o valor `'closed_lost'` como `text` ou via trigger. Nenhuma migração pesada de DDL (Data Definition Language) será necessária, a menos que haja um Check Constraint estrito que não tenha `closed_lost` (improvável, visto que o frontend já listava o tipo). 
- O Edge Function `ai-autonomous-evaluator` já recebeu a instrução para designar `closed_lost` no commit recém-adicionado. Não precisa alterar.
