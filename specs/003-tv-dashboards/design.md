# Design de Software & UX (Feature 003)

As modificações ocorrem exclusivamente na camada de visualização React (Stitch MCP-style concepts), focando em refinamento visual para 2026 e lógicas de estados no frontend.

## 1. UX/UI 2026 Conformity
- **Apple Liquid Glass & Overflow**: Em SVGs que contenham brilhos externos de Drop-shadow pesados, o default browser box impõe clip de renderização. Adicionando `.overflow-visible`, contornamos o canvas-clipping.
- **Hierarquia Visual no Card da Unidade**: O Score consolidado será reposicionado como "peça central" entre o Nome do Responsável/Unidade e as Estatísticas de Tempo, criando um eixo visual balanceado. Utilizaremos containers flexbox alinhados para criar essa tríade.

## 2. Lógica de Carrossel Intercalada (`TvOperacional.tsx`)
A regra matemática no `useEffect` de troca de slide passa de:
`activeUnits.length + 1`
Para:
`activeUnits.length * 2` (Garantindo um pareamento)

A renderização na `AnimatePresence` muda para:
`currentIndex % 2 === 0 ? <UnitSlide ... unit={activeUnits[currentIndex / 2]} /> : <GlobalSlide ... />`

## 3. Data Flow (Live Charts)
O `dailyScores` injetado pelo Supabase já preenche de `yesterday` (ontem) para trás.
Na injeção dos props ou cálculo interno:
```ts
const todayScore = avgScoreInt(unitLeads);
chartData.push({
  displayDate: "Hoje",
  score: todayScore || 0
});
```
Isso resolverá a visualização tanto na Operacional quanto na Executiva, unindo o snapshot do banco (ontem para trás) com o cache de leads vivos (hoje).
