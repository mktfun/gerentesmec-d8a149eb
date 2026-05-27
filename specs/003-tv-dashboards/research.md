# RPI-R: Pesquisa e Contexto

## 1. Mapeamento do Código Atual
- `src/pages/tv/TvOperacional.tsx`: Controlador principal do carrossel das TVs Operacionais. O array de exibição varre sequencialmente os slides das unidades (`UnitOperationalSlide`) e termina exibindo a tela global (`GlobalOperationalSlide`).
- `src/components/Dashboard/UnitOperationalSlide.tsx`: Componente de exibição de unidade. Atualmente, o gráfico `AreaChart` mapeia dados históricos dos `dailyScores`, puxados via DB (`daily_score_snapshots`). Como esses snapshots são rodados de madrugada (CRON), o dia de "hoje" fica faltando (ta "bateno de ontem pra trás"). 
- `src/components/Dashboard/TvDashboard.tsx`: Visão executiva. A página inicial (`page === 0`) renderiza 2 colunas grandes (Score Geral e Ranking Global). O círculo de Score possui um `viewBox="0 0 256 256"` e a classe SVG não possui `overflow-visible`, fazendo com que a borda de sombra de neon (drop-shadow) seja cortada nas extremidades do bounding box da tag `<svg>`, o que explica o efeito de "luz quadrada" mencionado pelo usuário.

## 2. Lacunas e Desvios Identificados
- **Lacuna 1 (Live Graph TvOperacional):** Para resolver o problema do gráfico não exibir o dado de hoje, basta calcular `avgScoreInt(unitLeads)` em tempo real no React, criar uma entrada com `{ displayDate: "Hoje", score: todayScore }` e concatená-la à cauda do `chartData` processado.
- **Lacuna 2 (Posição do Score no UnitSlide):** O Score atualizado deve ficar no header, centralizado, entre o texto da unidade e os cards de valores operacionais. Isso requer alterar a flexbox para injetar o círculo de nota central.
- **Lacuna 3 (Lógica de Slideshow Alternada):** Em vez de exibir `[U1, U2, U3, Global]`, o usuário quer a sequência `[U1, Global, U2, Global, U3, Global]`. Isso exige alterar a conta matemática do controlador em `TvOperacional.tsx`: Se existirem N unidades, o total de slides passa a ser N * 2. O `currentIndex` par será a Unidade (`currentIndex / 2`) e o ímpar será o Global.
- **Lacuna 4 (Gráfico Evolutivo no Executivo):** Em `TvDashboard.tsx` (`page === 0`), precisaremos buscar o histórico dos snapshots do DB (idêntico ao `TvOperacional`) para exibir a mesma curva de evolução no painel macro do executivo, montando um grid de 3 colunas `grid-cols-3` ali.
- **Lacuna 5 (Bug Visual Neon SVG):** O `drop-shadow` SVG sendo cortado é um clássico de web-design em viewBox restritos. Basta aplicar a classe tailwind `overflow-visible` no elemento `<svg>` para resolver.

## 3. Conclusão da Pesquisa
O escopo de código será estritamente restrito a refatorações lógicas nos três componentes de TV citados. O impacto funcional afetará APENAS a apresentação visual nas TVs, mantendo inalterados os processos de inteligência e auditoria já existentes e blindados.
