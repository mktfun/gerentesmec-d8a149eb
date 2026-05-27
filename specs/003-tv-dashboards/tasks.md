# Tasks de Implementação (Feature 003)

- [ ] Editar `src/components/Dashboard/UnitOperationalSlide.tsx`
  - [ ] Importar `avgScoreInt` e injetar um ponto `{ displayDate: "Hoje", score: todayScore }` no final do `chartData`.
  - [ ] Refatorar o `<div className="flex items-end justify-between mb-12">` injetando no meio o score dinâmico circular da unidade (mini-score) ou em formato de badge de impacto visual forte entre os textos e os stats.
- [ ] Editar `src/pages/tv/TvOperacional.tsx`
  - [ ] Mudar `totalSlides = activeUnits.length * 2`.
  - [ ] Ajustar lógica da renderização condicional do carrossel para `currentIndex % 2 === 0` chamar `UnitOperationalSlide(activeUnits[currentIndex / 2])` e ímpar chamar o Global.
- [ ] Editar `src/components/Dashboard/TvDashboard.tsx`
  - [ ] Corrigir SVG do score (Page 0) de `className="w-full h-full ..."` para incluir `overflow-visible`.
  - [ ] Fazer fetch diário idêntico ao `TvOperacional` do `daily_score_snapshots` limitando a 7/14 dias.
  - [ ] Incluir no `grid-cols-3` (que na verdade o lado esquerdo de placar ocupa col-span 1, o direito col-span-2) a lógica: Esquerda 1 (Score Macro), Centro (Gráfico AreaChart do Score Evolutivo Global com "Hoje"), Direita 1 (Ranking Global 3). O Grid precisa ser adaptado, talvez tirando `col-span-3` para que caibam 3 colunas independentes flex.
