# Design Document: Dashboard CEO v2 + Kanban CRM (011)

## 1. Correção do Sistema de Temas

### Problema Central
O código usa cores hardcoded (`bg-[#111118]`, `bg-[#0d0d14]`, etc.) que não respondem ao toggle dark/light. A solução é:

1. **ThemeProvider** — Criar `src/context/ThemeContext.tsx` que envolve o App inteiro e expõe `isDark` + `toggle` via Context. Eliminar o hook local `useDarkMode` do DashboardLayout.

2. **Classes Semânticas Tailwind** — No `tailwind.config.ts` configurar os tokens CSS como extensão de cores do Tailwind:
```ts
// tailwind.config.ts
colors: {
  'app-bg':     'rgb(var(--app-bg) / <alpha-value>)',
  'app-card':   'rgb(var(--app-card) / <alpha-value>)',
  'app-sidebar':'rgb(var(--app-sidebar) / <alpha-value>)',
  'app-border': 'rgb(var(--app-border) / <alpha-value>)',
}
```

3. **index.css** — Definir as variáveis corretamente:
```css
:root {
  --app-bg:      244 244 248;    /* slate-50 suave */
  --app-card:    255 255 255;    /* branco */
  --app-sidebar: 248 249 252;    /* quase branco */
  --app-border:  226 232 240;    /* slate-200 */
}
.dark {
  --app-bg:      10 10 15;
  --app-card:    17 17 24;
  --app-sidebar: 13 13 20;
  --app-border:  255 255 255 / 0.08;
}
```

4. **Componentes** — Substituir cores hardcoded por `bg-app-card`, `bg-app-sidebar`, etc.

---

## 2. Dashboard CEO — Novo Layout

### Estrutura de Seções (de cima para baixo):

```
┌───────────────────────────────────────────────────────┐
│  HERO: Score 78.5% + Badge Semana + Chips por Unidade │  (igual, refinado)
├─────────────────────┬─────────────────────────────────┤
│  KPIs (3 cards)     │  Impacto Financeiro (1 card)    │
├─────────────────────┴─────────────────────────────────┤
│  Comparativo por Unidade  │  Radar de Etapas          │
│  (Bar chart horizontal)   │  (RadarChart Recharts)    │
├─────────────────────┬─────────────────────────────────┤
│  Histórico Multiline       │  Ranking de Gerentes     │
│  (Linha por unidade, 7d)   │  (melhorado com etapa)  │
└───────────────────────────────────────────────────────┘
```

### Novos Gráficos:

**A) Bar Chart Horizontal — Score por Unidade**
- Dados: `[{unit: 'Jabaquara', score: 87.5}, {unit: 'Kennedy', score: 75}, {unit: 'Dom Pedro', score: 62.5}]`
- Cor condicional: verde se ≥75, amarelo se ≥60, vermelho se <60
- Texto da barra: nome + % ao lado direito

**B) Radar Chart — 4 Etapas por Unidade**
- Eixos: Cordialidade | Orçamento | Up-sell | Review
- 3 linhas: Dom Pedro (vermelho), Jabaquara (verde), Kennedy (indigo)
- O CEO vê de relance qual etapa está baixa em qual unidade

**C) Card de Impacto Financeiro**
- `3 leads × R$300 ticket médio = R$900 em risco`
- Badge em laranja com ícone de alerta
- Texto: "Cada minuto de delay reduz ~30% de conversão"

**D) MultiLine Chart — Tendência 7 dias por Unidade**
- Linha indigo = Jabaquara, Linha rose = Dom Pedro, Linha amber = Kennedy
- Legenda compacta no topo

---

## 3. CRM — Kanban View

### Toggle e State
- State local na página `Crm.tsx`: `const [view, setView] = useState<'list'|'kanban'>('list')`
- Dois botões de ícone no header: List e LayoutGrid (Lucide)
- AnimatePresence para transição suave entre views

### Colunas Kanban
```tsx
const kanbandColumns = [
  { id: 'new',        label: 'Novo Lead',      color: '#6366f1' },
  { id: 'quote',      label: 'Em Orçamento',   color: '#f59e0b' },
  { id: 'negotiation',label: 'Em Negociação',  color: '#f97316' },
  { id: 'closed',     label: 'Encerrado',       color: '#10b981' },
]
```

### Filtro por Unidade
- `const [unitFilter, setUnitFilter] = useState<string>('all')`
- Tabs: `Todos · Dom Pedro · Jabaquara · Kennedy`
- Filter aplicado nos dados antes de renderizar as colunas

### KanbanCard Component
Cada card no Kanban:
- Borda top colorida por coluna
- Nome cliente (bold) + veículo
- Avatar do gerente
- Badge de tempo / SLA
- Score se auditado

---

## 4. Mock Data Adicional
Ampliar `mockData.ts` para ter mais leads com diferentes funil stages:
- Campo `funnel_stage: 'new' | 'quote' | 'negotiation' | 'closed'`
- Mais leads por unidade para preencher o Kanban de forma convincente
- Dados de radar: score por etapa por unidade
