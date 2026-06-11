# Design: Melhorias no Relatório PDF (V2)

## Tailwind & UI (Stitch MCP context)
O design atual foi implementado puramente com utilitários Tailwind aplicados apenas durante a impressão (`print:X`).
Faremos as seguintes refatorações visuais:

1. **Fundos mais limpos (Backgrounds):**
   - Substituir `bg-indigo-50` e `bg-gray-100` nas bolhas de mensagens por fundos ainda mais minimalistas (ex: `bg-transparent border-l-4 border-gray-300` para o cliente e `bg-transparent border-l-4 border-indigo-400` para o gerente, removendo cores chapadas no fundo do papel).
   - Alternativamente, aplicar backgrounds em tons de cinza super claros (`bg-zinc-50`), garantindo alto contraste no papel branco sem desperdiçar tinta ou prejudicar a legibilidade.
2. **Prevenção de Quebra (Pagination):**
   - Garantir que cada lead seja um bloco inquebrável sempre que possível (`break-inside-avoid`).
   - Adicionar `break-inside-avoid` EM CADA mensagem da transcrição (o div iterado no `messagesByLead.map()`).
   - Adicionar agrupadores `<div class="mb-12 page-break-before-auto">` para separar as unidades com títulos limpos (`h2` com um sublinhado elegante).
3. **Typography:**
   - Adicionar a identificação `Gerente: Nome do Gerente` (pesquisado no array `managers` em contexto ou usando o `manager_id`).

## Estrutura de Dados (Data Modeling)
Não são necessárias novas migrações Supabase. O array `leads`, `units` e `managers` já vêm do `useAppData()` em `Relatorios.tsx`.
No bloco de renderização do PDF:
```javascript
const groupedLeads = reportTargetLeads.reduce((acc, lead) => {
  const unitId = lead.unit_id || 'sem_unidade';
  if (!acc[unitId]) acc[unitId] = [];
  acc[unitId].push(lead);
  return acc;
}, {});
```
A UI irá iterar `Object.keys(groupedLeads)` para gerar os blocos separados por unidade.
