# Design: Correção Avançada dos Filtros de Relatório em Lote

## 1. Modificações no Frontend (UI / Componentes)

### `src/components/ExportOptionsModal.tsx`
- Adicionar o estado `filterMode` ('OR' | 'AND').
- Adicionar botões tipo "Toggle" ou "Tabs" lado a lado abaixo do título "Checks não marcados", permitindo escolher entre:
  - `[Qualquer falha (OR)]`
  - `[Todas as falhas (AND)]`
- Modificar o `onExport` type para incluir o novo parâmetro:
  `onExport: (filters: { funnel: string; unmarkedChecks: string[]; filterMode: 'OR' | 'AND' }) => void;`

### `src/pages/Relatorios.tsx`
- No método `handleExportPDF`:
  - Remover o hardcode `const sevenDaysAgo = Date.now() - 7 * 86400000;`.
  - Usar os objetos do state `dateRange` atual: `startOfDay(dateRange.from)` e `endOfDay(dateRange.to)` (ajustado para 23:59:59).
  - Receber o `filterMode` do modal.
  - Implementar o parse booleano correto de falhas:
    ```typescript
    const isFailed = (val: any) => val === false || val === 'false' || val === null || val === undefined;
    ```
  - Lógica de Filtro Atualizada:
    ```typescript
    if (filters.unmarkedChecks.length > 0) {
      if (filters.filterMode === 'OR') {
        const hasSelectedFailures = filters.unmarkedChecks.some(id => isFailed((l.audit_checklist as Record<string, any>)?.[id]));
        if (!hasSelectedFailures) return false;
      } else { // AND
        const hasAllSelectedFailures = filters.unmarkedChecks.every(id => isFailed((l.audit_checklist as Record<string, any>)?.[id]));
        if (!hasAllSelectedFailures) return false;
      }
    }
    ```

## 2. Dependências
- `Relatorios.tsx` precisa passar as datas corretas. Atualmente `ExportOptionsModal` não recebe datas, então a lógica fica dentro de `handleExportPDF` que já tem acesso ao state `dateRange` na própria página de Relatórios. Nenhuma mudança de props no Relatorios é necessária além da comunicação com o modal.
