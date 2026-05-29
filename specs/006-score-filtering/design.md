# Design: Regras de Filtro para Score

## Lógica de Abstração (Utils)
O arquivo `src/utils/scoreUtils.ts` vai definir uma tipagem para os filtros:
```typescript
interface ScoreFilterOptions {
  onlyGanho?: boolean;
  onlyCurrentMonth?: boolean;
}

const defaultOptions: ScoreFilterOptions = {
  onlyGanho: true,
  onlyCurrentMonth: true
};
```

A função `avgScore` será refatorada da seguinte forma:
```typescript
export const avgScore = (leads: Lead[], options: ScoreFilterOptions = defaultOptions): number | null => {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
  
  const scored = leads.filter(l => {
    // 1. Tem que ter score preenchido
    if (l.score === null || l.score === undefined) return false;
    
    // 2. Filtro de Ganho
    if (options.onlyGanho && l.stage !== 'Ganho') return false;
    
    // 3. Filtro de Mês Vigente (assumindo que created_at ou equivalente guarda a data do lead)
    if (options.onlyCurrentMonth && l.created_at) {
      // Ex: '2026-05-29T...'.startsWith('2026-05')
      if (!l.created_at.startsWith(currentMonthStr)) {
        return false;
      }
    }
    
    return true;
  });

  if (scored.length === 0) return null;
  const sum = scored.reduce((acc, l) => acc + Number(l.score), 0);
  return Math.round((sum / scored.length) * 10) / 10;
};
```

## Propagação pela Interface (Componentes de Tempo Real)
Componentes que puxam a média (geralmente localizados no Navbar ou Dashboard principal) não precisarão mudar o código, pois `defaultOptions` assume o comportamento desejado pelo usuário de imediato.
Exceções: `UnitSwitcher.tsx` e o componente de `KanbanCard` individual. (Espera, KanbanCard não tira média, ele mostra o score daquele lead específico. Mas a regra do usuário pediu "contabilize... e estao em ganho...". Isso se aplica às MÉDIAS GLOBAIS e não deve esconder o score já feito de um lead no card individual).

## Tela de Relatórios / Admin
Nas telas onde houver dropdown de filtros avançados, o componente injetará:
```typescript
const scoreOptions = {
  onlyGanho: applyGanhoFilter,
  onlyCurrentMonth: applyMonthFilter
};
const consolidatedScore = avgScore(allLeads, scoreOptions);
```
Onde as variáveis vêm do State (filtros do relatório).
