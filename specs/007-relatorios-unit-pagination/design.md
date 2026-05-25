# Design e Arquitetura

## UI / UX (Tendência 2026)

### Paginação do Histórico
- Adicionar controles elegantes de paginação usando ícones da `lucide-react` (ChevronLeft, ChevronRight).
- Mostrar contadores de página "Página X de Y".
- Aplicar botões com `hover:bg-black/10 dark:hover:bg-white/10` e disabled states elegantes (`opacity-50 cursor-not-allowed`).
- O container da tabela deve manter uma altura mínima para evitar pulos no layout quando a última página tiver menos itens.

### Cálculo das Unidades (Lógica Interna)
- Não impacta o visual, mas as pontuações na tabela expandida dos gerentes mostrarão valores precisos (ex: 33%, 50%, 66%) no lugar dos atuais 100% (causados pelo bug da string `"false"` avaliada como true).

## Estrutura de Componentes

### Modificações no `src/pages/Relatorios.tsx`
1. **Helper Function `isTrue`**:
   Criar internamente ou importar lógica para checar: `const isTrue = (val: any) => val === true || val === 'true';`
2. **State de Paginação**:
   Adicionar `currentPage` no state.
   Criar variáveis `ITEMS_PER_PAGE = 10`.
   Calcular `paginatedLeads` derivado do array original de leads auditados já ordenado.
3. **Controles Renderizados**:
   Logo abaixo do encerramento da tabela `<tbody>`, renderizar os botões de navegação.
