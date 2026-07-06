# SDD Phase 2: Specification

## Goal
Corrigir o CSS overflow da lista "Agenda Hoje" que está "cortando" a tela e quebrando o grid layout.
Refinar a tipografia dos cards para ficar com a estética Premium adotada no painel.
Filtrar os tickets fantasmas (Protocolo Expirado fechado em massa) também do `tickerEventos` (scroll lateral inferior).

## Boundaries
- Modificação na UI do componente `Screens.tsx`.
- Modificação no pipeline de dados do `useDashboardData.ts` para aplicar o filtro fantasma no nível root da lista de `tickets` ou diretamente na geração do Ticker.
